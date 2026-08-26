"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Mic, MicOff, PhoneOff, X } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatChannel, ChatMessage, PublicGameState } from "@/lib/types";
import { GlassPanel } from "@/components/ui/primitives";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ScrollToLatestPill } from "@/components/ui/ScrollToLatestPill";
import {
  availableChannels,
  canAccessChannel,
  canUseTownVoice,
  canViewTownChat,
  CHANNEL_LABELS,
} from "@/lib/chat-access";
import { useScrollToLatest } from "@/hooks/useScrollToLatest";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import type { GameSocket } from "@/lib/socket/client";

export function ChatPanel({
  state,
  socket,
  onSend,
  joinVoiceRequest,
  onVoiceJoined,
  enableVoice = true,
  mobileBubble = false,
}: {
  state: PublicGameState;
  socket: GameSocket | null;
  onSend: (channel: ChatChannel, text: string) => void;
  joinVoiceRequest?: { nonce: number; channel: ChatChannel } | null;
  onVoiceJoined?: (channel: ChatChannel) => void;
  enableVoice?: boolean;
  /** Fixed draggable chat bubble near the top (mobile). */
  mobileBubble?: boolean;
}) {
  const you = state.you;
  const channelOpts = useMemo(
    () =>
      you
        ? {
            alive: you.alive,
            role: you.role,
            blackmailed: you.blackmailed,
            phase: state.phase,
            daySubPhase: state.daySubPhase,
          }
        : null,
    [you, state.phase, state.daySubPhase]
  );

  const tabs = useMemo(() => {
    if (!channelOpts) {
      return [{ id: "town" as ChatChannel, label: CHANNEL_LABELS.town }];
    }
    return availableChannels(channelOpts).map((id) => ({
      id,
      label: CHANNEL_LABELS[id],
    }));
  }, [channelOpts]);

  const [tab, setTab] = useState<ChatChannel>(tabs[0]?.id ?? "town");
  const active = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id ?? "town";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bubblePos, setBubblePos] = useState({ x: 16, y: 72 });
  const dragRef = useRef<{
    ox: number;
    oy: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!tabs.some((t) => t.id === tab) && tabs[0]) setTab(tabs[0].id);
  }, [tabs, tab]);

  const canSendActive =
    !!channelOpts && canAccessChannel(active, channelOpts);
  const canViewActive =
    !!channelOpts &&
    (active === "town"
      ? canViewTownChat(channelOpts)
      : canAccessChannel(active, channelOpts));
  const canUseVoice =
    !!channelOpts &&
    (active === "town"
      ? canUseTownVoice(channelOpts)
      : canAccessChannel(active, channelOpts));
  const playerNames = useMemo(
    () => Object.fromEntries(state.players.map((p) => [p.id, p.name])),
    [state.players]
  );
  const messages = state.chat.filter((m) => m.channel === active);
  const [text, setText] = useState("");

  const getOwnerId = useCallback((m: ChatMessage) => m.playerId, []);
  const { listRef, unread, onListScroll, scrollToLatest, markPinned } =
    useScrollToLatest(messages, {
      resetKey: active,
      selfId: you?.id,
      getOwnerId,
    });

  const voice = useVoiceChat(
    socket,
    state.roomId,
    you?.id,
    canUseVoice ? active : null,
    enableVoice && canUseVoice,
    playerNames
  );

  useEffect(() => {
    if (!enableVoice || !joinVoiceRequest) return;
    if (tabs.some((t) => t.id === joinVoiceRequest.channel)) {
      setTab(joinVoiceRequest.channel);
    }
    if (mobileBubble) setSheetOpen(true);
  }, [enableVoice, joinVoiceRequest, tabs, mobileBubble]);

  useEffect(() => {
    if (!enableVoice || !joinVoiceRequest) return;
    if (active !== joinVoiceRequest.channel) return;
    void voice.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinVoiceRequest?.nonce, active]);

  useEffect(() => {
    if (!enableVoice || !voice.joined) return;
    onVoiceJoined?.(active);
  }, [enableVoice, voice.joined, active, onVoiceJoined]);

  const submit = () => {
    if (!text.trim() || !canSendActive) return;
    onSend(active, text);
    setText("");
    markPinned();
    requestAnimationFrame(() => scrollToLatest());
  };

  const speaking = new Set(voice.speakingIds);
  const voiceRoster = useMemo(() => {
    const ids = [...(state.voiceParticipants[active] ?? [])];
    if (you?.id && voice.joined && !ids.includes(you.id)) {
      ids.unshift(you.id);
    }
    return ids;
  }, [state.voiceParticipants, active, voice.joined, you?.id]);

  const onBubblePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      ox: e.clientX,
      oy: e.clientY,
      sx: bubblePos.x,
      sy: bubblePos.y,
      moved: false,
    };
  };
  const onBubblePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.ox;
    const dy = e.clientY - d.oy;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    const maxX = Math.max(8, window.innerWidth - 64);
    const maxY = Math.max(8, window.innerHeight - 64);
    setBubblePos({
      x: Math.min(maxX, Math.max(8, d.sx + dx)),
      y: Math.min(maxY, Math.max(56, d.sy + dy)),
    });
  };
  const onBubblePointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) setSheetOpen(true);
  };

  if (tabs.length === 0 && !mobileBubble) {
    return (
      <GlassPanel className="flex h-[420px] max-md:h-[50vh] flex-col items-center justify-center p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Comms offline
        </p>
        <p className="mt-2 text-sm text-ink-steel">
          {state.phase === "night"
            ? "Public channel opens at dawn. Mafia channel is for night only."
            : "Public channel opens during the day. Mafia channel is for night only."}
        </p>
      </GlassPanel>
    );
  }

  const panel = (
    <GlassPanel
      className={`relative flex flex-col ${
        mobileBubble
          ? "h-[min(70vh,520px)] w-full"
          : "h-[420px] max-md:h-[50vh]"
      }`}
    >
      <div className="flex divide-x divide-crimson/30 border-b border-crimson/30">
        {mobileBubble && (
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="px-3 text-crimson"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        )}
        {tabs.map((t) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={selected}
              className={`relative flex-1 px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest transition ${
                selected
                  ? "bg-crimson text-manila"
                  : "bg-manila text-crimson/55 hover:bg-crimson/10 hover:text-crimson"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {enableVoice && (
        <>
          <div className="flex items-center justify-between border-b border-crimson/20 px-3 py-2">
            <div className="flex items-center gap-2">
              {!voice.joined ? (
                <button
                  type="button"
                  disabled={!canUseVoice}
                  onClick={() => void voice.join()}
                  className="inline-flex items-center gap-1 rounded-sm border border-crimson/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-crimson disabled:opacity-40"
                >
                  <Mic size={12} /> Join voice
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => voice.setMuted((m) => !m)}
                    className="inline-flex items-center gap-1 rounded-sm border border-crimson/25 px-2 py-1 font-mono text-[10px] uppercase tracking-widest"
                  >
                    {voice.muted ? <MicOff size={12} /> : <Mic size={12} />}
                    {voice.muted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    type="button"
                    onClick={voice.leave}
                    className="inline-flex items-center gap-1 rounded-sm border border-crimson/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-crimson-glow"
                  >
                    <PhoneOff size={12} /> Leave
                  </button>
                </>
              )}
            </div>
            <span className="max-w-[55%] truncate text-right font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              {Math.max(voiceRoster.length, voice.joined ? 1 : 0)} in voice
            </span>
          </div>

          {voiceRoster.length > 0 && (
            <div className="grid grid-cols-3 gap-2 border-b border-crimson/20 px-3 py-2 sm:grid-cols-4">
              {voiceRoster.map((id) => {
                const player = state.players.find((p) => p.id === id);
                const name = player?.name ?? "Operator";
                const isSpeaking = speaking.has(id);
                const isYou = id === you?.id;
                return (
                  <div
                    key={id}
                    className={`flex flex-col items-center gap-1 rounded-sm border px-1.5 py-2 ${
                      isSpeaking
                        ? "border-crimson/60 bg-crimson/10"
                        : "border-crimson/20 bg-crimson/[0.03]"
                    }`}
                  >
                    <div
                      className={`relative size-10 rounded-full bg-transparent ring-2 transition ${
                        isSpeaking
                          ? "animate-pulse ring-crimson"
                          : "ring-transparent"
                      }`}
                    >
                      <PlayerAvatar
                        id={player?.avatarId ?? 0}
                        size={40}
                        className="h-full w-full"
                      />
                    </div>
                    <span className="w-full truncate text-center font-mono text-[9px] uppercase tracking-wider text-ink">
                      {isYou ? "You" : name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {voice.error && (
            <p className="border-b border-crimson/20 px-3 py-2 text-xs text-crimson/80">
              {voice.error}
            </p>
          )}
        </>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          data-lenis-prevent
          onScroll={onListScroll}
          className="absolute inset-0 space-y-2 overflow-y-auto p-3"
        >
          {messages.length === 0 && (
            <p className="text-sm text-ink-steel">
              {!canViewActive
                ? "Channel closed"
                : active === "town" && state.phase === "night"
                  ? "Public channel opens at dawn."
                  : active === "mafia" && state.phase === "day"
                    ? "Mafia channel opens after dark."
                    : "No messages yet."}
            </p>
          )}
          {messages.map((m: ChatMessage, i) => {
            const isOwn = m.playerId === you?.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-sm max-md:flex max-md:flex-col ${
                  isOwn ? "max-md:items-end" : "max-md:items-start"
                } ${i % 2 ? "md:bg-crimson/5" : ""} md:rounded-sm md:px-2 md:py-1 ${
                  isOwn
                    ? "max-md:ml-auto max-md:max-w-[85%] max-md:rounded-2xl max-md:rounded-br-sm max-md:bg-crimson/20 max-md:px-3 max-md:py-2"
                    : "max-md:mr-auto max-md:max-w-[85%] max-md:rounded-2xl max-md:rounded-bl-sm max-md:bg-crimson/10 max-md:px-3 max-md:py-2"
                }`}
              >
                <span className="font-mono text-[10px] text-ink-steel max-md:hidden">
                  {new Date(m.at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>{" "}
                <span
                  className={`font-semibold text-crimson-glow ${
                    isOwn ? "max-md:hidden" : ""
                  }`}
                >
                  {m.name}
                </span>
                <p>{m.text}</p>
              </motion.div>
            );
          })}
          <div aria-hidden className="h-px w-full" />
        </div>

        <ScrollToLatestPill unread={unread} onClick={scrollToLatest} />
      </div>

      <form
        className="flex border-t border-crimson/20"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={text}
          disabled={!canSendActive}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            !canViewActive
              ? "Channel closed"
              : !canSendActive
                ? you && !you.alive && active === "town"
                  ? "Spectators cannot transmit"
                  : "Channel closed"
                : you?.blackmailed && active === "town"
                  ? "Silenced"
                  : "Transmit..."
          }
          className="flex-1 bg-transparent px-3 py-3 text-sm outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSendActive}
          className="px-4 font-mono text-[10px] uppercase tracking-widest text-crimson-glow disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </GlassPanel>
  );

  if (!mobileBubble) return panel;

  return (
    <>
      <button
        type="button"
        aria-label="Open chat"
        onPointerDown={onBubblePointerDown}
        onPointerMove={onBubblePointerMove}
        onPointerUp={onBubblePointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        className="fixed z-40 flex size-14 touch-none items-center justify-center rounded-full border-2 border-crimson bg-manila text-crimson shadow-stamp"
        style={{ left: bubblePos.x, top: bubblePos.y }}
      >
        <MessageCircle size={22} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson px-1 font-mono text-[9px] text-manila">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {sheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div
            className="absolute inset-0 -z-10 bg-void/40"
            onClick={() => setSheetOpen(false)}
          />
          {panel}
        </div>
      )}
    </>
  );
}
