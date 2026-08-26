"use client";

import { PlayfulRailHand } from "./PlayfulRailHand";
import type { EkCardStyle, EkSampleCard } from "@/lib/mockups/ek-sample-cards";

export function CompareHand({
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
    <PlayfulRailHand
      cards={cards}
      style={style}
      throwingCardId={throwingCardId}
      selectedCardId={selectedCardId}
      disabled={disabled}
      onSelect={onSelect}
    />
  );
}
