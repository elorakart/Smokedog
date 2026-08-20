"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type {
  ChatChannel,
  ChatMessage,
  Faction,
  NightActionType,
  PublicGameState,
  Role,
  RoomSettings,
} from "@/lib/types";
import { loadProfile } from "@/lib/profile";
import { getSocket, type GameSocket } from "@/lib/socket/client";
import { AfkHostModal } from "@/components/game/AfkHostModal";
import { ActionPrompt } from "@/components/game/ActionPrompt";
import { ActionDialog } from "@/components/game/mafia/ActionDialog";
import { PhaseResultPopup } from "@/components/game/mafia/PhaseResultPopup";
import { DetectivePanel } from "@/components/game/mafia/DetectivePanel";
import { ChatPanel } from "@/components/game/ChatPanel";
import { GameHud } from "@/components/game/GameHud";
import { GameOverScreen } from "@/components/game/GameOverScreen";
import { LobbyView } from "@/components/game/LobbyView";
import { FiveAliveLobbyView } from "@/components/game/FiveAliveLobbyView";
import { NightActionPanel, VotePanel } from "@/components/game/PlayerGrid";
import { RoleRevealCard } from "@/components/game/RoleRevealCard";
import { GlassPanel, PrimaryButton } from "@/components/ui/primitives";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { phaseSwap } from "@/components/ui/motion";
import { availableChannels, canUseTownVoice, CHANNEL_LABELS } from "@/lib/chat-access";
import { pendingPlayerAction } from "@/lib/action-prompt";
import { isMafiaRole, ROLE_META } from "@/lib/games/mafia-city/roles";
import { Mic } from "lucide-react";
import { FiveAliveTurnPanel } from "@/components/game/five-alive/FiveAliveTurnPanel";
import { FiveAliveBombPanel } from "@/components/game/five-alive/FiveAliveBombPanel";

export function GameClient({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [state, setState] = useState<PublicGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [afk, setAfk] = useState<{ playerId: string; name: string } | null>(null);
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [voiceInvite, setVoiceInvite] = useState<{
    channel: ChatChannel;
    fromName: string;
  } | null>(null);
  const [joinVoiceRequest, setJoinVoiceRequest] = useState<{
    nonce: number;
    channel: ChatChannel;
  } | null>(null);
  const [startingGame, setStartingGame] = useState(false);
  const [returningToLobby, setReturningToLobby] = useState(false);
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<
    string | null
  >(null);
  const [dismissedActionKey, setDismissedActionKey] = useState<string | null>(
    null
  );
  const [mafiaVoiceWarning, setMafiaVoiceWarning] = useState(false);
  const [afkTick, setAfkTick] = useState(0);
  const [detectivePopup, setDetectivePopup] = useState<{
    targetName: string;
    faction: Faction;
  } | null>(null);
  const [localReveal, setLocalReveal] = useState<{
    role: Role;
    faction: Faction;
    ability: string;
  } | null>(null);
  const quittingRef = useRef(false);
  const quitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishLeaveRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!state?.afkGraceEndsAt || state.afkGracePlayerId !== state.you?.id) {
      return;
    }
    const t = setInterval(() => setAfkTick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, [state?.afkGraceEndsAt, state?.afkGracePlayerId, state?.you?.id]);

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
      if (next.you?.role) {
        const meta = ROLE_META[next.you.role];
        setLocalReveal({
          role: next.you.role,
          faction: meta.faction,
          ability: meta.ability,
        });
      }
      if (next.phase === "lobby") setLocalReveal(null);
    };

    const onChat = (message: ChatMessage) => {
      setState((prev) => {
        if (!prev) return prev;
        if (prev.chat.some((m) => m.id === message.id)) return prev;
        // Drop matching optimistic local message (same author/text/channel)
        const withoutOptimistic = prev.chat.filter(
          (m) =>
            !(
              m.id.startsWith("local-") &&
              m.playerId === message.playerId &&
              m.channel === message.channel &&
              m.text === message.text
            )
        );
        return {
          ...prev,
          chat: [...withoutOptimistic, message].slice(-50),
        };
      });
    };

    const onRoleReveal = (payload: {
      role: Role;
      faction: Faction;
      ability: string;
    }) => {
      setLocalReveal(payload);
    };

    const onDetectiveResult = (payload: {
      targetId: string;
      targetName: string;
      faction: Faction;
    }) => {
      setDetectivePopup({
        targetName: payload.targetName,
        faction: payload.faction,
      });
    };

    const onErr = ({ message, code }: { message: string; code?: string }) => {
      if (quittingRef.current) {
        finishLeaveRef.current();
        return;
      }
      setError(message);
      setStartingGame(false);
      setReturningToLobby(false);
      setQuitting(false);
      setQuitConfirmOpen(false);
      if (message.toLowerCase().includes("kicked")) router.replace("/");
      if (code === "NOT_FOUND" || code === "NOT_IN_ROOM") {
        setState(null);
      }
    };
    const onAfk = (payload: { playerId: string; name: string }) => {
      setAfk({ playerId: payload.playerId, name: payload.name });
    };

    const onInvite = (payload: {
      channel: ChatChannel;
      fromId: string;
      fromName: string;
    }) => {
      setVoiceInvite({ channel: payload.channel, fromName: payload.fromName });
    };

    finishLeaveRef.current = () => {
      if (quitTimeoutRef.current) {
        clearTimeout(quitTimeoutRef.current);
        quitTimeoutRef.current = null;
      }
      quittingRef.current = false;
      router.replace("/");
    };

    const onLeft = () => {
      finishLeaveRef.current();
    };

    s.on("room:state", onState);
    s.on("room:error", onErr);
    s.on("room:left", onLeft);
    s.on("host:afkWarning", onAfk);
    s.on("voice:invite", onInvite);
    s.on("chat:message", onChat);
    s.on("role:reveal", onRoleReveal);
    s.on("detective:result", onDetectiveResult);

    const join = () => {
      if (quittingRef.current) return;
      s.emit("room:rejoin", { roomId, playerId: profile.playerId });
    };
    if (s.connected) join();
    s.on("connect", join);

    return () => {
      if (quitTimeoutRef.current) {
        clearTimeout(quitTimeoutRef.current);
        quitTimeoutRef.current = null;
      }
      s.off("room:state", onState);
      s.off("room:error", onErr);
      s.off("room:left", onLeft);
      s.off("host:afkWarning", onAfk);
      s.off("voice:invite", onInvite);
      s.off("chat:message", onChat);
      s.off("role:reveal", onRoleReveal);
      s.off("detective:result", onDetectiveResult);
      s.off("connect", join);
    };
  }, [roomId, router]);

  useEffect(() => {
    if (!state) return;
    if (state.phase !== "lobby") setStartingGame(false);
    if (state.phase === "lobby") setReturningToLobby(false);
  }, [state?.phase, state]);

  useEffect(() => {
    if (!state || state.gameId !== "mafia-city" || state.phase !== "night") {
      setMafiaVoiceWarning(false);
      return;
    }
    if (!state.you?.role || !isMafiaRole(state.you.role)) return;
    if (!state.phaseEndsAt) return;
    const endsAt = state.phaseEndsAt;
    const check = () => {
      const remaining = endsAt - Date.now();
      setMafiaVoiceWarning(remaining > 0 && remaining <= 10000);
    };
    check();
    const t = setInterval(check, 500);
    return () => clearInterval(t);
  }, [
    state?.gameId,
    state?.phase,
    state?.phaseEndsAt,
    state?.you?.role,
  ]);

  if (error && !state) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader animate={false} />
        <div className="flex flex-1 items-center justify-center p-6">
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
      </div>
    );
  }

  if (!state || !socket) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader animate={false} />
        <LoadingScreen
          embedded
          message="Linking secure channel…"
          submessage="Connecting to the game server"
        />
      </div>
    );
  }

  const emitSettings = (settings: Partial<RoomSettings>) =>
    socket.emit("lobby:settings", { roomId: state.roomId, settings });
  const emitHostSettings = (settings: Partial<RoomSettings>) =>
    socket.emit("host:settings", { roomId: state.roomId, settings });
  const emitStart = () => {
    if (startingGame) return;
    setStartingGame(true);
    socket.emit("lobby:start", { roomId: state.roomId });
  };
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
  const emitVoteSkip = () =>
    socket.emit("day:voteSkip", { roomId: state.roomId });
  const emitFiveAlivePlay = (payload: {
    cardId?: string | null;
    wildValue?: number;
    pass?: boolean;
  }) =>
    socket.emit("fivealive:playCard", {
      roomId: state.roomId,
      cardId: payload.cardId ?? null,
      wildValue: payload.wildValue,
      pass: payload.pass,
    });
  const emitChat = (channel: ChatChannel, text: string) => {
    const trimmed = text.trim().slice(0, 240);
    if (!trimmed || !state.you) {
      socket.emit("chat:send", { roomId: state.roomId, channel, text });
      return;
    }
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channel,
      playerId: state.you.id,
      name: state.you.id
        ? state.players.find((p) => p.id === state.you!.id)?.name ?? "You"
        : "You",
      text: trimmed,
      at: Date.now(),
    };
    setState((prev) =>
      prev
        ? { ...prev, chat: [...prev.chat, optimistic].slice(-50) }
        : prev
    );
    socket.emit("chat:send", { roomId: state.roomId, channel, text: trimmed });
  };

  const voiceChannel =
    state.gameId !== "five-alive" &&
    state.you &&
    availableChannels({
      alive: state.you.alive,
      role: state.you.role,
      blackmailed: state.you.blackmailed,
      phase: state.phase,
      daySubPhase: state.daySubPhase,
    }).find((c) => c === "town" || c === "mafia");

  const townVoiceOpen =
    !!state.you &&
    canUseTownVoice({
      alive: state.you.alive,
      role: state.you.role,
      blackmailed: state.you.blackmailed,
      phase: state.phase,
      daySubPhase: state.daySubPhase,
    });

  const pendingAction =
    state.gameId === "mafia-city" ? pendingPlayerAction(state) : null;
  const actionKey = pendingAction
    ? `${state.phase}-${state.daySubPhase}-${pendingAction.title}`
    : null;
  const showAnnouncement =
    !!state.announcement &&
    state.announcement.id !== dismissedAnnouncementId;
  const showActionDialog =
    !!pendingAction &&
    actionKey !== dismissedActionKey &&
    !showAnnouncement;

  const emitVoiceInvite = (targetId: string) => {
    if (!voiceChannel) return;
    socket.emit("voice:invite", {
      roomId: state.roomId,
      channel: voiceChannel,
      targetId,
    });
  };

  const confirmQuit = () => {
    if (quitting || !socket) return;
    setQuitting(true);
    quittingRef.current = true;
    socket.emit("room:leave", { roomId: state.roomId });
    quitTimeoutRef.current = setTimeout(() => {
      finishLeaveRef.current();
    }, 2500);
  };

  const nightTheme = state.phase === "night";

  return (
    <motion.div
      data-phase={state.phase}
      animate={{ backgroundColor: nightTheme ? "#060910" : "#0b141e" }}
      className="min-h-screen"
    >
      <SiteHeader
        animate={false}
        right={
          <GameHud
            state={state}
            onPause={() => socket.emit("host:pause", { roomId: state.roomId })}
            onResume={() => socket.emit("host:resume", { roomId: state.roomId })}
            onSkipTimer={() =>
              socket.emit("host:skipTimer", { roomId: state.roomId })
            }
            onQuit={() => setQuitConfirmOpen(true)}
            onSettings={
              state.gameId === "mafia-city" && state.you?.isHost
                ? emitHostSettings
                : undefined
            }
            quitting={quitting}
          />
        }
      />

      {showAnnouncement && state.announcement && (
        <PhaseResultPopup
          announcement={state.announcement}
          onDismiss={() =>
            setDismissedAnnouncementId(state.announcement!.id)
          }
        />
      )}
      {showActionDialog && pendingAction && (
        <ActionDialog
          title={pendingAction.title}
          detail={pendingAction.detail}
          onDismiss={() => setDismissedActionKey(actionKey)}
        />
      )}
      {detectivePopup && (
        <PhaseResultPopup
          announcement={{
            id: `detective-${detectivePopup.targetName}-${detectivePopup.faction}`,
            tone: "info",
            title: "Investigation result",
            detail: `${detectivePopup.targetName} is aligned with the ${detectivePopup.faction}.`,
            at: Date.now(),
          }}
          onDismiss={() => setDetectivePopup(null)}
        />
      )}
      {mafiaVoiceWarning && (
        <div className="mx-auto mb-4 max-w-6xl px-4 md:px-8">
          <div className="rounded-sm border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Day breaks in under 10 seconds — mafia voice will close at dawn.
          </div>
        </div>
      )}
      {state.afkGracePlayerId === state.you?.id && state.afkGraceEndsAt && (
        <div className="mx-auto mb-4 max-w-6xl px-4 md:px-8">
          <div className="animate-pulse rounded-sm border border-crimson bg-crimson/15 px-4 py-3 text-sm text-crimson-glow">
            AFK warning — take action within{" "}
            {Math.max(
              0,
              Math.ceil((state.afkGraceEndsAt - Date.now()) / 1000)
            )}
            s or you will be eliminated.{afkTick ? "" : ""}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        {voiceInvite && state.gameId !== "five-alive" && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-emerald-400/40 bg-emerald-400/10 px-4 py-3">
            <p className="text-sm text-emerald-100">
              <span className="font-semibold">{voiceInvite.fromName}</span> wants
              you on {CHANNEL_LABELS[voiceInvite.channel]} voice.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setJoinVoiceRequest({
                    nonce: Date.now(),
                    channel: voiceInvite.channel,
                  });
                  setVoiceInvite(null);
                }}
                className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/20 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-emerald-200"
              >
                <Mic size={12} /> Join voice
              </button>
              <button
                type="button"
                onClick={() => setVoiceInvite(null)}
                className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel"
              >
                Later
              </button>
            </div>
          </div>
        )}
        <ActionPrompt state={state} />
        <AnimatePresence mode="wait">
          <motion.div
            key={state.phase}
            variants={phaseSwap}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {state.phase === "lobby" && (
              <>
                {state.gameId === "five-alive" ? (
                  <FiveAliveLobbyView
                    state={state}
                    onStart={emitStart}
                    starting={startingGame}
                    onSettings={emitSettings}
                    onKick={emitKick}
                    onAddBot={emitAddBot}
                    onRemoveBot={emitRemoveBot}
                  />
                ) : (
                  <LobbyView
                    state={state}
                    onStart={emitStart}
                    starting={startingGame}
                    onSettings={emitSettings}
                    onKick={emitKick}
                    onAddBot={emitAddBot}
                    onRemoveBot={emitRemoveBot}
                  />
                )}
              </>
            )}

            {state.phase === "reveal" && (
              <>
                {(state.you?.role ?? localReveal?.role) ? (
                  <RoleRevealCard
                    role={(state.you?.role ?? localReveal!.role) as Role}
                    phaseEndsAt={state.phaseEndsAt}
                  />
                ) : (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center">
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-crimson-glow">
                      Sealing identity…
                    </p>
                    <p className="mt-2 text-sm text-ink-steel">
                      Your role card is being delivered.
                    </p>
                  </div>
                )}
              </>
            )}

            {state.gameId === "five-alive" && state.phase === "fivealive_turn" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <FiveAliveTurnPanel
                  state={state}
                  onPlay={({ cardId, wildValue }) =>
                    emitFiveAlivePlay({ cardId, wildValue })
                  }
                />
                <div className="space-y-4">
                  <GlassPanel className="p-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
                      Turn log
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-ink-steel">
                      {state.logs.slice(-6).map((l) => (
                        <li key={l.id}>{l.text}</li>
                      ))}
                    </ul>
                  </GlassPanel>
                  <ChatPanel
                    state={state}
                    socket={socket}
                    onSend={emitChat}
                    enableVoice={false}
                  />
                </div>
              </div>
            )}

            {state.gameId === "five-alive" && state.phase === "fivealive_bomb" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <FiveAliveBombPanel
                  state={state}
                  onRespond={(payload) => emitFiveAlivePlay(payload)}
                />
                <div className="space-y-4">
                  <GlassPanel className="p-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
                      Bomb log
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-ink-steel">
                      {state.logs.slice(-6).map((l) => (
                        <li key={l.id}>{l.text}</li>
                      ))}
                    </ul>
                  </GlassPanel>
                  <ChatPanel
                    state={state}
                    socket={socket}
                    onSend={emitChat}
                    enableVoice={false}
                  />
                </div>
              </div>
            )}

            {state.gameId === "mafia-city" && state.phase === "night" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <NightActionPanel
                  state={state}
                  onAct={emitNight}
                  onInviteVoice={voiceChannel ? emitVoiceInvite : undefined}
                />
                <div className="space-y-4">
                  {state.detectiveLog && (
                    <DetectivePanel log={state.detectiveLog} />
                  )}
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
                  <ChatPanel
                    state={state}
                    socket={socket}
                    onSend={emitChat}
                    joinVoiceRequest={joinVoiceRequest}
                  />
                </div>
              </div>
            )}

            {state.gameId === "mafia-city" && state.phase === "day" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <VotePanel
                  state={state}
                  onVote={emitVote}
                  onSkipVote={emitVoteSkip}
                  onSkipDay={() =>
                    socket.emit("host:skipDay", { roomId: state.roomId })
                  }
                  onInviteVoice={
                    townVoiceOpen && voiceChannel
                      ? emitVoiceInvite
                      : undefined
                  }
                />
                <div className="space-y-4">
                  {state.detectiveLog && (
                    <DetectivePanel log={state.detectiveLog} />
                  )}
                  <div data-lenis-prevent className="max-h-48 overflow-y-auto">
                    <GlassPanel className="p-4">
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
                  </div>
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
                  <ChatPanel
                    state={state}
                    socket={socket}
                    onSend={emitChat}
                    joinVoiceRequest={joinVoiceRequest}
                  />
                </div>
              </div>
            )}

            {state.phase === "gameover" && (
              <GameOverScreen
                state={state}
                returning={returningToLobby}
                onReturn={() => {
                  if (returningToLobby) return;
                  setReturningToLobby(true);
                  socket.emit("lobby:return", { roomId: state.roomId });
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {quitConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-[20px]"
          data-lenis-prevent
        >
          <GlassPanel className="w-full max-w-md p-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">
              Leave session
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold">Quit this game?</h2>
            <p className="mt-3 text-sm text-ink-steel">
              {state.phase === "lobby"
                ? "You will leave the lobby and return to the hub."
                : "You will leave the match and return to the hub. Other players can keep playing."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <PrimaryButton disabled={quitting} onClick={confirmQuit}>
                {quitting ? "Leaving…" : "Yes, quit"}
              </PrimaryButton>
              <button
                type="button"
                disabled={quitting}
                onClick={() => setQuitConfirmOpen(false)}
                className="rounded-sm border border-white/10 py-3 font-mono text-xs uppercase tracking-widest disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </GlassPanel>
        </div>
      )}

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
