"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { PublicGameState } from "@/lib/types";
import { TurnIndicator } from "@/components/game/board/TurnIndicator";
import { C4_COLS, C4_ROWS } from "@/lib/games/connect-4/logic";

export function Connect4Board({
  state,
  onDrop,
}: {
  state: PublicGameState;
  onDrop: (column: number) => void;
}) {
  const c4 = state.connect4;
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, []);

  if (!c4 || !state.you) return null;
  const finished = c4.result === "win" || c4.result === "draw";
  const myColor = c4.colors[state.you.id];
  const myTurn =
    !finished &&
    c4.turnPlayerId === state.you.id &&
    state.phase === "connect4_play";
  const turnPlayer = state.players.find((p) => p.id === c4.turnPlayerId);
  const secondsLeft =
    !finished && state.phaseEndsAt
      ? Math.max(0, Math.ceil((state.phaseEndsAt - Date.now()) / 1000))
      : null;

  const winning = new Set(
    (c4.winningCells ?? []).map((c) => `${c.row}-${c.col}`)
  );
  const dimOthers = winning.size > 0;

  const discClass = (color: "R" | "Y" | null | undefined) =>
    color === "R"
      ? "bg-crimson shadow-[0_0_10px_rgba(139,30,30,0.4)]"
      : color === "Y"
        ? "bg-[#E8B84A] shadow-[0_0_10px_rgba(232,184,74,0.4)] ring-1 ring-[#C4921A]/40"
        : "bg-crimson/10";

  const winnerName =
    c4.winnerId && state.players.find((p) => p.id === c4.winnerId)?.name;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2 sm:gap-3">
      {finished ? (
        <div className="rounded-sm border border-crimson/40 bg-crimson/10 px-3 py-2 sm:px-4 sm:py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">
            {c4.result === "draw" ? "Draw" : "Match over"}
          </p>
          <p className="mt-0.5 font-display text-lg font-bold text-crimson sm:text-xl">
            {c4.result === "draw"
              ? "Board is full — no winner."
              : `${winnerName ?? "Someone"} connects four!`}
          </p>
        </div>
      ) : (
        <TurnIndicator
          name={turnPlayer?.name ?? "…"}
          detail={
            myColor ? `You are ${myColor === "R" ? "Red" : "Yellow"}` : undefined
          }
          secondsLeft={secondsLeft}
          yours={myTurn}
        />
      )}

      {/* Fit board in remaining viewport: max height leaves room for header + turn bar */}
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "min(100%, 28rem, calc((100dvh - 11rem) * 7 / 6))",
        }}
      >
        {myTurn && (
          <div className="mb-1 grid grid-cols-7 gap-1 px-0.5 sm:mb-1.5 sm:gap-1.5">
            {Array.from({ length: C4_COLS }).map((_, col) => (
              <div key={col} className="flex h-5 items-center justify-center sm:h-7">
                {hoverCol === col && myColor && (
                  <motion.div
                    layoutId="c4-ghost"
                    className={`size-4 rounded-full sm:size-6 ${discClass(myColor)} opacity-70`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md border border-crimson/30 bg-crimson/15 p-1.5 shadow-inner sm:p-2">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: C4_COLS }).map((_, col) => (
              <button
                key={col}
                type="button"
                disabled={!myTurn}
                aria-label={`Drop in column ${col + 1}`}
                onMouseEnter={() => setHoverCol(col)}
                onMouseLeave={() => setHoverCol(null)}
                onClick={() => onDrop(col)}
                className="grid grid-rows-6 gap-1 sm:gap-1.5"
              >
                {Array.from({ length: C4_ROWS }).map((_, visualRow) => {
                  const row = C4_ROWS - 1 - visualRow;
                  const cell = c4.board[row]?.[col] ?? null;
                  const key = `${row}-${col}`;
                  const isWin = winning.has(key);
                  const isLast =
                    c4.lastDrop?.col === col && c4.lastDrop?.row === row;
                  return (
                    <div
                      key={key}
                      className={`relative aspect-square overflow-hidden rounded-full bg-manila ${
                        dimOthers && cell && !isWin ? "opacity-35" : ""
                      }`}
                    >
                      {cell && (
                        <motion.div
                          className={`absolute inset-[8%] rounded-full ${discClass(cell)} ${
                            isWin ? "animate-pulse ring-2 ring-manila" : ""
                          }`}
                          initial={
                            isLast ? { y: -((C4_ROWS - row) * 22 + 28) } : false
                          }
                          animate={{ y: 0 }}
                          transition={
                            isLast
                              ? {
                                  type: "spring",
                                  stiffness: 560,
                                  damping: 30,
                                  mass: 0.5,
                                }
                              : { duration: 0 }
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-wider text-crimson/70 sm:mt-3">
          {state.players.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5">
              <span
                className={`size-2.5 rounded-full ${
                  c4.colors[p.id] === "R" ? "bg-crimson" : "bg-[#E8B84A]"
                }`}
              />
              {p.name}
              {p.id === state.you?.id ? " (you)" : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
