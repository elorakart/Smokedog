"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ChatChannel, PublicGameState } from "@/lib/types";
import { TurnIndicator } from "@/components/game/board/TurnIndicator";
import { ChatPanel } from "@/components/game/ChatPanel";
import type { GameSocket } from "@/lib/socket/client";
import { C4_COLS, C4_ROWS } from "@/lib/games/connect-4/logic";

export function Connect4Board({
  state,
  socket,
  onDrop,
  onSendChat,
}: {
  state: PublicGameState;
  socket: GameSocket | null;
  onDrop: (column: number) => void;
  onSendChat: (channel: ChatChannel, text: string) => void;
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
      ? "bg-crimson shadow-[0_0_14px_rgba(139,30,30,0.45)]"
      : color === "Y"
        ? "bg-[#E8B84A] shadow-[0_0_14px_rgba(232,184,74,0.45)] ring-1 ring-[#C4921A]/50"
        : "bg-crimson/10";

  const winnerName =
    c4.winnerId &&
    state.players.find((p) => p.id === c4.winnerId)?.name;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        {finished ? (
          <div className="rounded-sm border border-crimson/40 bg-crimson/10 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">
              {c4.result === "draw" ? "Draw" : "Match over"}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-crimson">
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
        <div className="mx-auto mt-6 w-full max-w-xl">
          <div className="mb-2 grid grid-cols-7 gap-1.5 px-1">
            {Array.from({ length: C4_COLS }).map((_, col) => (
              <div key={col} className="flex h-8 items-center justify-center">
                {myTurn && hoverCol === col && myColor && (
                  <motion.div
                    layoutId="c4-ghost"
                    className={`size-7 rounded-full ${discClass(myColor)} opacity-70`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="rounded-md border border-crimson/30 bg-crimson/15 p-2 shadow-inner">
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: C4_COLS }).map((_, col) => (
                <button
                  key={col}
                  type="button"
                  disabled={!myTurn}
                  onMouseEnter={() => setHoverCol(col)}
                  onMouseLeave={() => setHoverCol(null)}
                  onClick={() => onDrop(col)}
                  className="grid grid-rows-6 gap-1.5"
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
                              isLast
                                ? { y: -((C4_ROWS - row) * 28 + 40) }
                                : false
                            }
                            animate={{ y: 0 }}
                            transition={
                              isLast
                                ? {
                                    type: "spring",
                                    stiffness: 520,
                                    damping: 28,
                                    mass: 0.55,
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
        </div>
      </div>
      <ChatPanel
        state={state}
        socket={socket}
        onSend={onSendChat}
        enableVoice={false}
      />
    </div>
  );
}
