"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ChatChannel,
  NightActionType,
  PublicGameState,
  RoomSettings,
} from "@/lib/types";
import { loadProfile } from "@/lib/profile";
import { getSocket, type GameSocket } from "@/lib/socket/client";
import { AfkHostModal } from "@/components/game/AfkHostModal";
import { ChatPanel } from "@/components/game/ChatPanel";
import { GameHud } from "@/components/game/GameHud";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { LobbyView } from "@/components/game/LobbyView";
import { NightActionPanel, VotePanel } from "@/components/game/PlayerGrid";
import { RoleRevealCard } from "@/components/game/RoleRevealCard";
import { GlassPanel } from "@/components/ui/primitives";

export function GameClient({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [state, setState] = useState<PublicGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [afk, setAfk] = useState<{ playerId: string; name: string } | null>(null);
  const [socket, setSocket] = useState<GameSocket | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.replace("/");
      return;
    }
    const s = getSocket(profile.playerId);
    setSocket(s);

    const onState = (next: PublicGameState) => setState(next);
    const onErr = ({ message }: { message: string }) => {
      setError(message);
      if (message.toLowerCase().includes("kicked")) router.replace("/");
    };
    const onAfk = (payload: { playerId: string; name: string }) => {
      setAfk({ playerId: payload.playerId, name: payload.name });
    };

    s.on("room:state", onState);
    s.on("room:error", onErr);
    s.on("host:afkWarning", onAfk);

    const join = () => {
      s.emit("room:rejoin", { roomId, playerId: profile.playerId });
    };
    if (s.connected) join();
    s.on("connect", join);

    return () => {
      s.off("room:state", onState);
      s.off("room:error", onErr);
      s.off("host:afkWarning", onAfk);
      s.off("connect", join);
    };
  }, [roomId, router]);

  if (error && !state) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <GlassPanel className="p-8">
          <p className="font-mono text-sm text-crimson-glow">{error}</p>
        </GlassPanel>
      </div>
    );
  }

  if (!state || !socket) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-xs uppercase tracking-widest text-ink-steel">
        Linking secure channel…
      </div>
    );
  }

  const emitReady = (ready: boolean) =>
    socket.emit("lobby:ready", { roomId: state.roomId, ready });
  const emitSettings = (settings: Partial<RoomSettings>) =>
    socket.emit("lobby:settings", { roomId: state.roomId, settings });
  const emitStart = () => socket.emit("lobby:start", { roomId: state.roomId });
  const emitKick = (playerId: string) =>
    socket.emit("host:kick", { roomId: state.roomId, playerId });
  const emitNight = (type: NightActionType, targetId: string) =>
    socket.emit("night:action", { roomId: state.roomId, type, targetId });
  const emitVote = (targetId: string) =>
    socket.emit("day:vote", { roomId: state.roomId, targetId });
  const emitChat = (channel: ChatChannel, text: string) =>
    socket.emit("chat:send", { roomId: state.roomId, channel, text });

  const nightTheme = state.phase === "night";

  return (
    <div
      data-phase={state.phase}
      className={`min-h-screen ${nightTheme ? "bg-[#060910]" : ""}`}
    >
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <span className="font-display text-sm font-extrabold tracking-[0.2em]">
          SMOKEDOG
        </span>
        <GameHud
          state={state}
          onPause={() => socket.emit("host:pause", { roomId: state.roomId })}
          onResume={() => socket.emit("host:resume", { roomId: state.roomId })}
        />
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        {state.phase === "lobby" && (
          <LobbyView
            state={state}
            onReady={emitReady}
            onStart={emitStart}
            onSettings={emitSettings}
            onKick={emitKick}
          />
        )}

        {state.phase === "reveal" && state.you?.role && (
          <RoleRevealCard role={state.you.role} />
        )}

        {state.phase === "night" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <NightActionPanel state={state} onAct={emitNight} />
            <div className="space-y-4">
              <GlassPanel className="p-4">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
                  Night log
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-ink-steel">
                  {state.logs.slice(-6).map((l) => (
                    <li key={l.id}>{l.text}</li>
                  ))}
                </ul>
              </GlassPanel>
              <ChatPanel state={state} onSend={emitChat} />
            </div>
          </div>
        )}

        {state.phase === "day" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <VotePanel state={state} onVote={emitVote} />
            <div className="space-y-4">
              <GlassPanel className="max-h-48 overflow-y-auto p-4">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
                  Announcements
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {state.logs.map((l) => (
                    <li key={l.id} className="text-ink-steel">
                      {l.text}
                    </li>
                  ))}
                </ul>
              </GlassPanel>
              {state.detectiveResult && (
                <GlassPanel className="p-4">
                  <p className="font-mono text-[10px] uppercase text-crimson-glow">
                    Case file
                  </p>
                  <p className="mt-1">
                    Subject is aligned with the{" "}
                    <strong className="uppercase">{state.detectiveResult.faction}</strong>.
                  </p>
                </GlassPanel>
              )}
              <ChatPanel state={state} onSend={emitChat} />
            </div>
          </div>
        )}

        {state.phase === "gameover" && (
          <GameOverScreen
            state={state}
            onReturn={() => socket.emit("lobby:return", { roomId: state.roomId })}
          />
        )}
      </main>

      {afk && state.you?.isHost && (
        <AfkHostModal
          name={afk.name}
          onKick={() => {
            emitKick(afk.playerId);
            setAfk(null);
          }}
          onPause={() => {
            socket.emit("host:pause", { roomId: state.roomId });
            setAfk(null);
          }}
          onDismiss={() => setAfk(null)}
        />
      )}
    </div>
  );
}
