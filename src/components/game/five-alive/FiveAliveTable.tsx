"use client";

import { cn } from "@/lib/cn";
import type { PublicFiveAliveCard, PublicGameState } from "@/lib/types";
import { DeckStack } from "./PlayingCard";
import { FiveAliveCardFace } from "./FiveAliveCardFace";

function totalTone(total: number): string {
  if (total >= 20) return "text-[#8B1E1E]";
  if (total >= 17) return "text-[#e9c46a]";
  return "text-ink";
}

export function FiveAliveTable({
  five,
}: {
  five: NonNullable<PublicGameState["fiveAlive"]>;
}) {
  const centerTop = five.centerTopCard;

  return (
    <div className="flex flex-wrap items-end justify-center gap-8 py-4">
      <DeckStack count={five.drawPileCount} label="Draw" width={68} />

      <div className="flex flex-col items-center gap-3">
        <div className="relative flex min-h-[120px] min-w-[88px] items-center justify-center">
          {centerTop ? (
            <FiveAliveCardFace card={centerTop} width={96} elevated />
          ) : (
            <div className="flex aspect-[5/7] w-[96px] items-center justify-center rounded-xl border border-dashed border-crimson/25 bg-crimson/[0.03] font-mono text-[9px] uppercase tracking-widest text-ink-steel">
              Play here
            </div>
          )}
          {five.centerPileCount > 1 && (
            <span className="absolute -bottom-2 rounded-full bg-crimson/10 px-2 py-0.5 font-mono text-[9px] text-ink-steel">
              +{five.centerPileCount - 1} below
            </span>
          )}
        </div>
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
            Running total
          </p>
          <p className={cn("font-display text-5xl font-extrabold", totalTone(five.runningTotal))}>
            {five.runningTotal}
          </p>
        </div>
      </div>

      <DeckStack count={five.discardPileCount} label="Discard" width={68} />
    </div>
  );
}

export function FiveAliveLifeTracker({
  players,
  turnPlayerId,
}: {
  players: PublicGameState["players"];
  turnPlayerId: string | null;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {players.map((p) => {
        const lives = p.lives ?? 0;
        const maxLives = 5;
        return (
          <div
            key={p.id}
            className={cn(
              "rounded-sm border px-3 py-2",
              turnPlayerId === p.id
                ? "border-[#8B1E1E] bg-[#8B1E1E]/10"
                : "border-crimson/20 bg-crimson/[0.04]"
            )}
          >
            <p className="truncate font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              {p.name}
            </p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: maxLives }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-3 rounded-full border-2 transition-colors",
                    i < lives
                      ? "border-[#8B1E1E] bg-[#8B1E1E]"
                      : "border-dashed border-crimson/30 bg-transparent"
                  )}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
