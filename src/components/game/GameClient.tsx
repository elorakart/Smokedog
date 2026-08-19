"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
import { GlassPanel, PrimaryButton } from "@/components/ui/primitives";
import { phaseSwap } from "@/components/ui/motion";

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

    const onState = (next: PublicGameState) => {
      setError(null);
      setState(next);
    };
    const onErr = ({ message, code }: { message: string; code?: string }) => {
      setError(message);
      if (message.toLowerCase().includes("kicked")) router.replace("/");
      if (code === "NOT_FOUND" || code === "NOT_IN_ROOM") {
        setState(null);
      }
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassPanel className="p-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-crimson-glow">
              Channel closed
            </p>
            <p className="mt-3 text-ink">{error}</p>
            <PrimaryButton className="mt-6" onClick={() => router.replace("/")}>
              Back to hub
            </PrimaryButton>
          </GlassPanel>
        </motion.div>
      </div>
    );
  }

  if (!state || !socket) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-xs uppercase tracking-widest text-ink-steel">
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          Linking secure channel…
        </motion.span>
      </div>
    );
  }

  const emitSettings = (settings: Partial<RoomSettings>) =>
    socket.emit("lobby:settings", { roomId: state.roomId, settings });
  const emitStart = () => socket.emit("lobby:start", { roomId: state.roomId });
  const emitKick = (playerId: string) =>
    socket.emit("host:kick", { roomId: state.roomId, playerId });
  const emitAddBot = (fillTo?: number) =>
    socket.emit("lobby:addBot", { roomId: state.roomId, fillTo });
  const emitRemoveBot = () =>
    socket.emit("lobby:removeBot", { roomId: state.roomId });
  const emitNight = (type: NightActionType, targetId: string) =>
    socket.emit("night:action", { roomId: state.roomId, type, targetId });
  const emitVote = (targetId: string) =>
    socket.emit("day:vote", { roomId: state.roomId, targetId });
  const emitChat = (channel: ChatChannel, text: string) =>
    socket.emit("chat:send", { roomId: state.roomId, channel, text });

  const nightTheme = state.phase === "night";

  return (
    <motion.div
      data-phase={state.phase}
      animate={{ backgroundColor: nightTheme ? "#060910" : "#0b141e" }}
      className="min-h-screen"
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
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase}
            variants={phaseSwap}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {state.phase === "lobby" && (
              <LobbyView
                state={state}
                onStart={emitStart}
                onSettings={emitSettings}
                onKick={emitKick}
                onAddBot={emitAddBot}
                onRemoveBot={emitRemoveBot}
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
                  <ChatPanel state={state} socket={socket} onSend={emitChat} />
                </div>
              </div>
            )}

            {state.phase === "day" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <VotePanel
                  state={state}
                  onVote={emitVote}
                  onSkipDay={() =>
                    socket.emit("host:skipDay", { roomId: state.roomId })
                  }
                />
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
                        <strong className="uppercase">
                          {state.detectiveResult.faction}
                        </strong>
                        .
                      </p>
                    </GlassPanel>
                  )}
                  <ChatPanel state={state} socket={socket} onSend={emitChat} />
                </div>
              </div>
            )}

            {state.phase === "gameover" && (
              <GameOverScreen
                state={state}
                onReturn={() =>
                  socket.emit("lobby:return", { roomId: state.roomId })
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
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
    </motion.div>
  );
}
