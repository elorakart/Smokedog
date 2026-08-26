"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { FiveAliveCardVariant, FiveAliveSampleCard } from "@/lib/mockups/five-alive-sample";
import { FA_EASE, FA_DRAW_MS, FA_PLAY_MS } from "./FiveAliveTableAnimation";
import { FiveAliveMockCardFace } from "./FiveAliveMockCardFace";

const CARD_W = 92;

export function FiveAliveMockHand({
  cards,
  variant,
  selectedId,
  playingCardId,
  drawingCardId,
  disabled,
  onSelect,
}: {
  cards: FiveAliveSampleCard[];
  variant: FiveAliveCardVariant;
  selectedId?: string | null;
  playingCardId?: string | null;
  drawingCardId?: string | null;
  disabled?: boolean;
  onSelect: (card: FiveAliveSampleCard) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-2">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pt-2">
        {cards.map((card) => {
          const isSelected = selectedId === card.id;
          const isPlaying = playingCardId === card.id;
          const isDrawing = drawingCardId === card.id;

          return (
            <motion.button
              key={card.id}
              type="button"
              layout
              disabled={disabled || !!playingCardId || !!drawingCardId}
              className="shrink-0 snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
              initial={isDrawing ? { y: -120, opacity: 0, scale: 0.85 } : false}
              animate={
                isPlaying
                  ? {
                      y: -150,
                      scale: 1.06,
                      opacity: 0,
                      transition: { duration: FA_PLAY_MS / 1000, ease: FA_EASE },
                    }
                  : isDrawing
                    ? {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        transition: { duration: FA_DRAW_MS / 1000, ease: FA_EASE },
                      }
                    : {
                        y: isSelected ? -12 : 0,
                        scale: isSelected ? 1.05 : 1,
                        opacity: disabled && !isSelected ? 0.55 : 1,
                      }
              }
              transition={{ layout: { duration: 0.28, ease: FA_EASE } }}
              whileHover={
                !disabled && !playingCardId && !drawingCardId
                  ? { y: -8, scale: 1.02 }
                  : undefined
              }
              onClick={() => {
                if (disabled || playingCardId || drawingCardId) return;
                onSelect(card);
              }}
            >
              <FiveAliveMockCardFace
                card={card}
                variant={variant}
                width={CARD_W}
                selected={isSelected}
                elevated={isSelected}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function FiveAliveRunningTotal({
  total,
  className,
}: {
  total: number;
  className?: string;
}) {
  const tone =
    total >= 21 ? "text-crimson" : total >= 18 ? "text-amber-800" : "text-crimson";

  return (
    <div className={cn("text-center", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson/50">
        Running total
      </p>
      <motion.p
        key={total}
        initial={{ scale: 1.15, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn("font-display text-6xl font-extrabold tabular-nums", tone)}
      >
        {total}
      </motion.p>
      {total > 21 ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-crimson">
          Bust zone
        </p>
      ) : null}
    </div>
  );
}

export function FiveAliveCenterPile({
  card,
  variant,
  pileCount,
}: {
  card: FiveAliveSampleCard | null;
  variant: FiveAliveCardVariant;
  pileCount: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-crimson/50">
        Center pile
      </p>
      <div className="relative min-h-[140px] min-w-[100px]">
        {card ? (
          <motion.div
            key={card.id}
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: FA_EASE }}
          >
            <FiveAliveMockCardFace card={card} variant={variant} width={96} elevated />
          </motion.div>
        ) : (
          <div className="flex aspect-[5/7] w-[96px] items-center justify-center rounded-xl border-2 border-dashed border-crimson/25 bg-crimson/[0.03] font-mono text-[9px] uppercase tracking-widest text-crimson/40">
            Play here
          </div>
        )}
        {pileCount > 1 ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-crimson/10 px-2 py-0.5 font-mono text-[9px] text-crimson/60">
            {pileCount} cards
          </span>
        ) : null}
      </div>
    </div>
  );
}
