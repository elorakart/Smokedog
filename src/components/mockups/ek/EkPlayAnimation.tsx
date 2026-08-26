"use client";

import { useCallback, useState } from "react";

export const EK_THROW_DURATION_MS = 520;
export const EK_THROW_EASE = [0.22, 1, 0.36, 1] as const;

export function useEkPlayAnimation() {
  const [throwingCardId, setThrowingCardId] = useState<string | null>(null);

  const playCard = useCallback(
    (cardId: string, onComplete: () => void) => {
      if (throwingCardId) return;
      setThrowingCardId(cardId);
      window.setTimeout(() => {
        setThrowingCardId(null);
        onComplete();
      }, EK_THROW_DURATION_MS);
    },
    [throwingCardId]
  );

  return {
    throwingCardId,
    playCard,
    isPlaying: throwingCardId !== null,
  };
}

export const ekThrowAnimate = (isThrowing: boolean, angle = 0) =>
  isThrowing
    ? {
        x: 0,
        y: -140,
        rotate: angle * 0.3,
        scale: 1.05,
        opacity: 0,
        transition: { duration: EK_THROW_DURATION_MS / 1000, ease: EK_THROW_EASE },
      }
    : undefined;
