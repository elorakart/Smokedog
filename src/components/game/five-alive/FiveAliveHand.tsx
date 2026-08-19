"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import type { PublicFiveAliveCard } from "@/lib/types";
import { FiveAliveCardFace } from "./FiveAliveCardFace";

export function useCardThrow() {
  const [throwingCardId, setThrowingCardId] = useState<string | null>(null);

  const throwCard = useCallback(
    (cardId: string, onComplete: () => void) => {
      if (throwingCardId) return;
      setThrowingCardId(cardId);
      window.setTimeout(() => {
        setThrowingCardId(null);
        onComplete();
      }, 520);
    },
    [throwingCardId]
  );

  return { throwingCardId, throwCard, isThrowing: throwingCardId !== null };
}

export function FiveAliveHand({
  cards,
  disabled,
  throwingCardId,
  selectedCardId,
  playableFilter,
  onSelect,
}: {
  cards: PublicFiveAliveCard[];
  disabled?: boolean;
  throwingCardId?: string | null;
  selectedCardId?: string | null;
  playableFilter?: (card: PublicFiveAliveCard) => boolean;
  onSelect: (card: PublicFiveAliveCard) => void;
}) {
  const count = cards.length;
  const spread = Math.min(28, Math.max(8, 360 / Math.max(count, 1)));
  const startAngle = -((count - 1) * spread) / 2;

  return (
    <div className="relative mx-auto flex h-[200px] max-w-full items-end justify-center px-4">
      {cards.map((card, index) => {
        const angle = startAngle + index * spread;
        const isThrowing = throwingCardId === card.id;
        const isSelected = selectedCardId === card.id;
        const canPlay = !disabled && (!playableFilter || playableFilter(card));

        return (
          <motion.button
            key={card.id}
            type="button"
            disabled={disabled || !canPlay || !!throwingCardId}
            layoutId={isThrowing ? `throw-${card.id}` : undefined}
            initial={false}
            animate={
              isThrowing
                ? {
                    x: 0,
                    y: -140,
                    rotate: angle * 0.3,
                    scale: 1.05,
                    opacity: 0,
                    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
                  }
                : {
                    x: 0,
                    y: isSelected ? -16 : 0,
                    rotate: angle,
                    scale: isSelected ? 1.08 : 1,
                    opacity: disabled && !isSelected ? 0.55 : 1,
                  }
            }
            whileHover={canPlay && !throwingCardId ? { y: -12, scale: 1.04 } : undefined}
            className="absolute origin-bottom"
            style={{
              left: `calc(50% + ${index - (count - 1) / 2} * 18px - 44px)`,
              zIndex: isSelected || isThrowing ? 30 : index,
            }}
            onClick={() => {
              if (!canPlay || throwingCardId) return;
              onSelect(card);
            }}
          >
            <FiveAliveCardFace
              card={card}
              width={88}
              selected={isSelected}
              highlight={
                playableFilter?.(card) ? "defuse" : canPlay ? "playable" : null
              }
              elevated={isSelected}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
