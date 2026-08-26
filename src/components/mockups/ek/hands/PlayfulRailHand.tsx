"use client";

import { motion } from "framer-motion";
import type { EkCardStyle, EkSampleCard } from "@/lib/mockups/ek-sample-cards";
import { EK_THROW_EASE } from "../EkPlayAnimation";
import { EkCardFace } from "../EkCardFace";

const CARD_WIDTH = 96;

export function PlayfulRailHand({
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
  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pt-2 scrollbar-thin">
        {cards.map((card) => {
          const isThrowing = throwingCardId === card.id;
          const isSelected = selectedCardId === card.id;

          return (
            <motion.button
              key={card.id}
              type="button"
              layout
              disabled={disabled || !!throwingCardId}
              className="shrink-0 snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F57C00]"
              initial={false}
              animate={
                isThrowing
                  ? {
                      y: -160,
                      scale: 1.08,
                      opacity: 0,
                      transition: { duration: 0.52, ease: EK_THROW_EASE },
                    }
                  : {
                      y: isSelected ? -14 : 0,
                      scale: isSelected ? 1.06 : 1,
                      opacity: disabled && !isSelected ? 0.55 : 1,
                    }
              }
              transition={{ layout: { duration: 0.3, ease: EK_THROW_EASE } }}
              whileHover={!disabled && !throwingCardId ? { y: -10, scale: 1.03 } : undefined}
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
    </div>
  );
}
