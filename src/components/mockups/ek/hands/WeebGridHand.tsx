"use client";

import { motion } from "framer-motion";
import type { EkCardStyle, EkSampleCard } from "@/lib/mockups/ek-sample-cards";
import { EK_THROW_EASE } from "../EkPlayAnimation";
import { EkCardFace } from "../EkCardFace";

const CARD_WIDTH = 92;

export function WeebGridHand({
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
  const row1 = cards.slice(0, 4);
  const row2 = cards.slice(4);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4">
      {[row1, row2].map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-4 justify-items-center gap-3"
        >
          {row.map((card) => {
            const isThrowing = throwingCardId === card.id;
            const isSelected = selectedCardId === card.id;

            return (
              <motion.button
                key={card.id}
                type="button"
                layout
                disabled={disabled || !!throwingCardId}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8FAB]"
                initial={false}
                animate={
                  isThrowing
                    ? {
                        y: -120,
                        scale: 1.1,
                        opacity: 0,
                        transition: { duration: 0.52, ease: EK_THROW_EASE },
                      }
                    : {
                        y: isSelected ? -10 : 0,
                        scale: isSelected ? 1.06 : 1,
                        opacity: disabled && !isSelected ? 0.55 : 1,
                      }
                }
                transition={{ layout: { duration: 0.3, ease: EK_THROW_EASE } }}
                whileHover={
                  !disabled && !throwingCardId ? { y: -8, scale: 1.03 } : undefined
                }
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
      ))}
    </div>
  );
}
