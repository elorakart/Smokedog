"use client";

import { useMemo, useState } from "react";
import type { ChatChannel, ChatMessage, PublicGameState } from "@/lib/types";
import { GlassPanel } from "@/components/ui/primitives";
import { isMafiaRole } from "@/lib/games/mafia-city/roles";

export function ChatPanel({
  state,
  onSend,
}: {
  state: PublicGameState;
  onSend: (channel: ChatChannel, text: string) => void;
}) {
  const you = state.you;
  const [text, setText] = useState("");

  const tabs = useMemo(() => {
    const list: { id: ChatChannel; label: string }[] = [];
    if (you?.alive) list.push({ id: "town", label: "Town Square" });
    if (you?.alive && you.role && isMafiaRole(you.role) && state.phase === "night") {
      list.push({ id: "mafia", label: "Mafia Shadows" });
    }
    if (you && !you.alive) list.push({ id: "graveyard", label: "Graveyard" });
    if (list.length === 0) list.push({ id: "town", label: "Town Square" });
    return list;
  }, [you, state.phase]);

  const [tab, setTab] = useState<ChatChannel>(tabs[0].id);
  const active = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;
  const muted = you?.blackmailed && active === "town" && state.phase === "day";
  const messages = state.chat.filter((m) => m.channel === active);

  const submit = () => {
    if (!text.trim() || muted) return;
    onSend(active, text);
    setText("");
  };

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
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m: ChatMessage, i) => (
          <div
            key={m.id}
            className={`rounded-sm px-2 py-1 text-sm ${i % 2 ? "bg-white/5" : ""}`}
          >
            <span className="font-mono text-[10px] text-ink-steel">
              {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>{" "}
            <span className="font-semibold text-crimson-glow">{m.name}</span>
            <p>{m.text}</p>
          </div>
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
          disabled={!!muted || (active === "town" && !you?.alive)}
          onChange={(e) => setText(e.target.value)}
          placeholder={muted ? "Silenced" : "Transmit..."}
          className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          className="px-4 font-mono text-[10px] uppercase tracking-widest text-crimson-glow"
        >
          Send
        </button>
      </form>
    </GlassPanel>
  );
}
