"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatChannel, ChatMessage, PublicGameState } from "@/lib/types";
import { GlassPanel } from "@/components/ui/primitives";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  availableChannels,
  canAccessChannel,
  canUseTownVoice,
  canViewTownChat,
  CHANNEL_LABELS,
} from "@/lib/chat-access";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import type { GameSocket } from "@/lib/socket/client";

export function ChatPanel({
  state,
  socket,
  onSend,
  joinVoiceRequest,
  enableVoice = true,
}: {
  state: PublicGameState;
  socket: GameSocket | null;
  onSend: (channel: ChatChannel, text: string) => void;
  joinVoiceRequest?: { nonce: number; channel: ChatChannel } | null;
  enableVoice?: boolean;
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
  const voiceInChannel = state.voiceParticipants[active] ?? [];
  const [text, setText] = useState("");

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
  }, [enableVoice, joinVoiceRequest, tabs]);

  useEffect(() => {
    if (!enableVoice || !joinVoiceRequest) return;
    if (active !== joinVoiceRequest.channel) return;
    void voice.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinVoiceRequest?.nonce, active]);

  const submit = () => {
    if (!text.trim() || !canSendActive) return;
    onSend(active, text);
    setText("");
  };

  if (tabs.length === 0) {
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

  const speaking = new Set(voice.speakingIds);

  return (
    <GlassPanel className="flex h-[420px] max-md:h-[50vh] flex-col">
      <div className="flex border-b border-crimson/20">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-widest ${
              active === t.id ? "bg-surface-high text-ink" : "text-ink-steel"
            }`}
          >
            {t.label}
          </button>
        ))}
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
              {Math.max(voiceInChannel.length, voice.joined ? 1 : 0)} in voice
              {voice.participantLabels.length > 0 && (
                <span className="block normal-case tracking-normal text-ink-steel/80">
                  {voice.participantLabels.slice(0, 3).join(", ")}
                  {voice.participantLabels.length > 3 ? "…" : ""}
                </span>
              )}
            </span>
          </div>

          {voiceInChannel.length > 0 && (
            <div className="grid grid-cols-3 gap-2 border-b border-crimson/20 px-3 py-2 sm:grid-cols-4">
              {voiceInChannel.map((id) => {
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
                      className={`relative size-10 overflow-hidden rounded-full ring-2 transition ${
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

      <div data-lenis-prevent className="flex-1 space-y-2 overflow-y-auto p-3">
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
}
