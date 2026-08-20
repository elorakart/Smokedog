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
  const myColor = c4.colors[state.you.id];
  const myTurn =
    c4.turnPlayerId === state.you.id && state.phase === "connect4_play";
  const turnPlayer = state.players.find((p) => p.id === c4.turnPlayerId);
  const secondsLeft = state.phaseEndsAt
    ? Math.max(0, Math.ceil((state.phaseEndsAt - Date.now()) / 1000))
    : null;

  const winning = new Set(
    (c4.winningCells ?? []).map((c) => `${c.row}-${c.col}`)
  );
  const dimOthers = winning.size > 0;

  const discClass = (color: "R" | "Y" | null | undefined) =>
    color === "R"
      ? "bg-crimson shadow-[0_0_16px_rgba(230,25,25,0.45)]"
      : color === "Y"
        ? "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.4)]"
        : "bg-white/5";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <TurnIndicator
          name={turnPlayer?.name ?? "…"}
          detail={myColor ? `You are ${myColor === "R" ? "Red" : "Yellow"}` : undefined}
          secondsLeft={secondsLeft}
          yours={myTurn}
        />
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
          <div className="rounded-md border border-sky-400/30 bg-[#0a2744] p-2 shadow-inner">
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
                        className={`relative aspect-square overflow-hidden rounded-full bg-[#06182c] ${
                          dimOthers && cell && !isWin ? "opacity-35" : ""
                        }`}
                      >
                        {cell && (
                          <motion.div
                            className={`absolute inset-[8%] rounded-full ${discClass(cell)} ${
                              isWin ? "animate-pulse ring-2 ring-white/70" : ""
                            }`}
                            initial={
                              isLast
                                ? { y: -((C4_ROWS - row) * 48 + 80) }
                                : false
                            }
                            animate={{ y: 0 }}
                            transition={
                              isLast
                                ? {
                                    type: "spring",
                                    stiffness: 280,
                                    damping: 18,
                                    mass: 0.9,
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
