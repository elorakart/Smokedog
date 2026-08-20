"use client";

import { Copy, LogOut, Pause, Play, Shield, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyToast } from "@/components/ui/CopyToast";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { Phase, PublicGameState } from "@/lib/types";
import { MidGameSettings } from "@/components/game/mafia/MidGameSettings";

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
  onSkipTimer,
  onQuit,
  onSettings,
  quitting = false,
}: {
  state: PublicGameState;
  onPause: () => void;
  onResume: () => void;
  onSkipTimer?: () => void;
  onQuit: () => void;
  onSettings?: (settings: Partial<import("@/lib/types").RoomSettings>) => void;
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
    day:
      state.daySubPhase === "vote"
        ? `VOTE ${state.cycle}`
        : `DAY ${state.cycle}`,
    fivealive_turn: `TURN ${state.cycle}`,
    fivealive_bomb: "BOMB RESOLUTION",
    spotit_play: "SPOT IT",
    ttt_play: "TIC-TAC-TOE",
    connect4_play: "CONNECT 4",
    gameover: "DEBRIEF",
  };

  const { copy, copied } = useCopyToClipboard();
  const showMidGameSettings =
    state.gameId === "mafia-city" &&
    state.you?.isHost &&
    onSettings &&
    state.phase !== "lobby" &&
    state.phase !== "gameover";
  const canSkipTimer =
    !!state.you?.isHost &&
    !!onSkipTimer &&
    !state.paused &&
    !!state.phaseEndsAt &&
    state.phase !== "lobby" &&
    state.phase !== "gameover";

  return (
    <>
      <CopyToast show={copied} message="Room code copied" />
      <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
        <button
          type="button"
          onClick={() => copy(state.roomId)}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-manila/20 bg-surface/80 px-2 py-1.5 font-mono text-[10px] tracking-[0.15em] sm:gap-2 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.2em]"
        >
          {state.roomId} <Copy size={11} className="sm:h-3 sm:w-3" />
        </button>
        {state.phase !== "lobby" && state.phase !== "gameover" && (
          <div
            className={`shrink-0 rounded-sm border bg-surface/80 px-2 py-1.5 font-mono text-xs tracking-widest sm:px-3 sm:py-2 sm:text-sm ${
              remaining <= 10 && !state.paused
                ? "animate-pulse border-crimson text-crimson-glow"
                : "border-manila/20 text-crimson-glow"
            }`}
          >
            {state.paused ? "PAUSED" : format(remaining)}
          </div>
        )}
        <div className="shrink-0 rounded-sm border border-manila/20 bg-surface/80 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.18em]">
          {phaseLabel[state.phase]}
        </div>
        {showMidGameSettings && (
          <MidGameSettings settings={state.settings} onUpdate={onSettings} />
        )}
        {canSkipTimer && (
          <button
            type="button"
            onClick={onSkipTimer}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-sky-400/40 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-sky-200 sm:px-3 sm:py-2 sm:text-[10px]"
            title="Skip remaining timer"
          >
            <SkipForward size={11} />
            <span className="hidden sm:inline">Skip timer</span>
          </button>
        )}
        {state.you?.isHost &&
          state.phase !== "lobby" &&
          state.phase !== "gameover" && (
            <button
              type="button"
              onClick={state.paused ? onResume : onPause}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-crimson/40 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-crimson-glow sm:px-3 sm:py-2 sm:text-[10px]"
            >
              {state.paused ? <Play size={11} /> : <Pause size={11} />}
              <span className="hidden xs:inline sm:inline">
                {state.paused ? "Resume" : "Pause"}
              </span>
            </button>
          )}
        {state.you?.isHost && (
          <span className="hidden shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-ink-steel sm:inline-flex sm:text-[10px]">
            <Shield size={11} /> Host
          </span>
        )}
        <button
          type="button"
          disabled={quitting}
          onClick={onQuit}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-white/10 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-ink-steel transition hover:border-crimson/40 hover:text-crimson-glow disabled:opacity-50 sm:px-3 sm:py-2 sm:text-[10px]"
        >
          <LogOut size={11} />
          {quitting ? "Leaving…" : "Quit"}
        </button>
      </div>
    </>
  );
}
