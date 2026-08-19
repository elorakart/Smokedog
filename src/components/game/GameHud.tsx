"use client";

import { Copy, LogOut, Pause, Play, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyToast } from "@/components/ui/CopyToast";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { Phase, PublicGameState } from "@/lib/types";

function format(seconds: number) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function GameHud({
  state,
  onPause,
  onResume,
  onQuit,
  quitting = false,
}: {
  state: PublicGameState;
  onPause: () => void;
  onResume: () => void;
  onQuit: () => void;
  quitting?: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const remaining = state.phaseEndsAt
    ? Math.ceil((state.phaseEndsAt - now) / 1000)
    : 0;

  const phaseLabel: Record<Phase, string> = {
    lobby: "LOBBY",
    reveal: "REVEAL",
    night: `NIGHT ${state.cycle}`,
    day: `DAY ${state.cycle}`,
    fivealive_turn: `TURN ${state.cycle}`,
    fivealive_bomb: "BOMB RESOLUTION",
    gameover: "DEBRIEF",
  };

  const { copy, copied } = useCopyToClipboard();

  return (
    <>
      <CopyToast show={copied} message="Room code copied" />
      <div className="flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={() => copy(state.roomId)}
        className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-surface/80 px-3 py-2 font-mono text-xs tracking-[0.2em]"
      >
        {state.roomId} <Copy size={12} />
      </button>
      {state.phase !== "lobby" && state.phase !== "gameover" && (
        <div
          className={`rounded-sm border bg-surface/80 px-3 py-2 font-mono text-sm tracking-widest ${
            remaining <= 10 && !state.paused
              ? "animate-pulse border-crimson text-crimson-glow"
              : "border-white/10 text-crimson-glow"
          }`}
        >
          {state.paused ? "PAUSED" : format(remaining)}
        </div>
      )}
      <div className="rounded-sm border border-white/10 bg-surface/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">
        {phaseLabel[state.phase]}
      </div>
      {state.you?.isHost && state.phase !== "lobby" && state.phase !== "gameover" && (
        <button
          type="button"
          onClick={state.paused ? onResume : onPause}
          className="inline-flex items-center gap-1 rounded-sm border border-crimson/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-crimson-glow"
        >
          {state.paused ? <Play size={12} /> : <Pause size={12} />}
          {state.paused ? "Resume" : "Pause"}
        </button>
      )}
      {state.you?.isHost && (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          <Shield size={12} /> Host
        </span>
      )}
      <button
        type="button"
        disabled={quitting}
        onClick={onQuit}
        className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel transition hover:border-crimson/40 hover:text-crimson-glow disabled:opacity-50"
      >
        <LogOut size={12} />
        {quitting ? "Leaving…" : "Quit"}
      </button>
    </div>
    </>
  );
}
