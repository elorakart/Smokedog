"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { EkCardStyle, EkSampleCard } from "@/lib/mockups/ek-sample-cards";
import { EK_THROW_EASE } from "../EkPlayAnimation";
import { EkCardFace } from "../EkCardFace";

const CARD_WIDTH = 88;
const GAP = 12;
const MAX_ROTATION = 12;

export function LedgerFanHand({
  cards,
  style,
  throwingCardId,
  selectedCardId,
  disabled,
  onSelect,
}: {
  cards: EkSampleCard[];
  style: EkCardStyle;
  throwingCardId?: string | null;
  selectedCardId?: string | null;
  disabled?: boolean;
  onSelect: (card: EkSampleCard) => void;
}) {
  const count = cards.length;
  const totalWidth = count * CARD_WIDTH + (count - 1) * GAP;
  const spread = count <= 1 ? 0 : Math.min(MAX_ROTATION, 48 / count);

  return (
    <div
      className="relative mx-auto flex h-[220px] w-full max-w-4xl items-end justify-center px-4"
      style={{ minWidth: totalWidth }}
    >
      {cards.map((card, index) => {
        const angle =
          count <= 1 ? 0 : -((count - 1) * spread) / 2 + index * spread;
        const isThrowing = throwingCardId === card.id;
        const isSelected = selectedCardId === card.id;
        const offsetX = index * (CARD_WIDTH + GAP) - totalWidth / 2 + CARD_WIDTH / 2;

        return (
          <motion.button
            key={card.id}
            type="button"
            layout
            disabled={disabled || !!throwingCardId}
            initial={false}
            animate={
              isThrowing
                ? {
                    x: -offsetX,
                    y: -140,
                    rotate: angle * 0.3,
                    scale: 1.05,
                    opacity: 0,
                    transition: { duration: 0.52, ease: EK_THROW_EASE },
                  }
                : {
                    x: offsetX,
                    y: isSelected ? -16 : 0,
                    rotate: angle,
                    scale: isSelected ? 1.08 : 1,
                    opacity: disabled && !isSelected ? 0.55 : 1,
                  }
            }
            transition={{ layout: { duration: 0.3, ease: EK_THROW_EASE } }}
            whileHover={!disabled && !throwingCardId ? { y: -12, scale: 1.04 } : undefined}
            className={cn(
              "absolute bottom-0 origin-bottom focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson"
            )}
            style={{ zIndex: isSelected || isThrowing ? 30 : index }}
            onClick={() => {
              if (disabled || throwingCardId) return;
              onSelect(card);
            }}
          >
            <EkCardFace
              card={card}
              style={style}
              width={CARD_WIDTH}
              selected={isSelected}
              elevated={isSelected}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
