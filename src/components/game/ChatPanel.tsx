"use client";

import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatChannel, ChatMessage, PublicGameState } from "@/lib/types";
import { GlassPanel } from "@/components/ui/primitives";
import {
  availableChannels,
  canAccessChannel,
  CHANNEL_LABELS,
} from "@/lib/chat-access";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import type { GameSocket } from "@/lib/socket/client";

export function ChatPanel({
  state,
  socket,
  onSend,
  joinVoiceRequest,
}: {
  state: PublicGameState;
  socket: GameSocket | null;
  onSend: (channel: ChatChannel, text: string) => void;
  joinVoiceRequest?: { nonce: number; channel: ChatChannel } | null;
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
          }
        : null,
    [you, state.phase]
  );

  const tabs = useMemo(() => {
    if (!channelOpts) return [{ id: "town" as ChatChannel, label: CHANNEL_LABELS.town }];
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

  const canUseActive =
    !!channelOpts && canAccessChannel(active, channelOpts);
  const messages = state.chat.filter((m) => m.channel === active);
  const voiceInChannel = state.voiceParticipants[active] ?? [];
  const [text, setText] = useState("");

  const voice = useVoiceChat(
    socket,
    state.roomId,
    you?.id,
    canUseActive ? active : null,
    canUseActive
  );

  useEffect(() => {
    if (!joinVoiceRequest) return;
    if (tabs.some((t) => t.id === joinVoiceRequest.channel)) {
      setTab(joinVoiceRequest.channel);
    }
  }, [joinVoiceRequest, tabs]);

  useEffect(() => {
    if (!joinVoiceRequest) return;
    if (active !== joinVoiceRequest.channel) return;
    void voice.join();
    // Only fire when a new invite-accept arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinVoiceRequest?.nonce, active]);

  const submit = () => {
    if (!text.trim() || !canUseActive) return;
    onSend(active, text);
    setText("");
  };

  if (tabs.length === 0) {
    return (
      <GlassPanel className="flex h-[420px] flex-col items-center justify-center p-6 text-center">
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

  return (
    <GlassPanel className="flex h-[420px] flex-col">
      <div className="flex border-b border-white/10">
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

      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          {!voice.joined ? (
            <button
              type="button"
              disabled={!canUseActive}
              onClick={() => void voice.join()}
              className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300 disabled:opacity-40"
            >
              <Mic size={12} /> Join voice
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => voice.setMuted((m) => !m)}
                className="inline-flex items-center gap-1 rounded-sm border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-widest"
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
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          {voiceInChannel.length} in voice
        </span>
      </div>

      {voice.error && (
        <p className="border-b border-white/10 px-3 py-2 text-xs text-amber-200">
          {voice.error}
        </p>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-sm text-ink-steel">
            {active === "town" && state.phase === "night"
              ? "Public channel opens at dawn."
              : active === "mafia" && state.phase === "day"
                ? "Mafia channel opens after dark."
                : "No messages yet."}
          </p>
        )}
        {messages.map((m: ChatMessage, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-sm px-2 py-1 text-sm ${i % 2 ? "bg-white/5" : ""}`}
          >
            <span className="font-mono text-[10px] text-ink-steel">
              {new Date(m.at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>{" "}
            <span className="font-semibold text-crimson-glow">{m.name}</span>
            <p>{m.text}</p>
          </motion.div>
        ))}
      </div>

      <form
        className="flex border-t border-white/10"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          value={text}
          disabled={!canUseActive}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            !canUseActive
              ? "Channel closed"
              : you?.blackmailed && active === "town"
                ? "Silenced"
                : "Transmit..."
          }
          className="flex-1 bg-transparent px-3 py-3 text-sm outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canUseActive}
          className="px-4 font-mono text-[10px] uppercase tracking-widest text-crimson-glow disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </GlassPanel>
  );
}
