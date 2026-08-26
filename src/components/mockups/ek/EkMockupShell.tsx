"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { fadeUp } from "@/components/ui/motion";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { EkDiscardPile } from "@/components/mockups/ek/EkDiscardPile";
import { useEkPlayAnimation } from "@/components/mockups/ek/EkPlayAnimation";
import {
  cloneSampleHand,
  type EkCardStyle,
  type EkSampleCard,
} from "@/lib/mockups/ek-sample-cards";

type HandComponent = React.ComponentType<{
  cards: EkSampleCard[];
  style: EkCardStyle;
  throwingCardId?: string | null;
  selectedCardId?: string | null;
  disabled?: boolean;
  onSelect: (card: EkSampleCard) => void;
}>;

export function EkMockupShell({
  title,
  description,
  style,
  styleLabel,
  Hand,
  extraControls,
}: {
  title: string;
  description: string;
  style: EkCardStyle;
  styleLabel: string;
  Hand: HandComponent;
  extraControls?: React.ReactNode;
}) {
  const [hand, setHand] = useState(() => cloneSampleHand());
  const [discard, setDiscard] = useState<EkSampleCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { throwingCardId, playCard, isPlaying } = useEkPlayAnimation();

  const handleSelect = useCallback(
    (card: EkSampleCard) => {
      if (isPlaying) return;
      setSelectedId(card.id);
      playCard(card.id, () => {
        setHand((prev) => prev.filter((c) => c.id !== card.id));
        setDiscard((prev) => [...prev, card]);
        setSelectedId(null);
      });
    },
    [isPlaying, playCard]
  );

  const reset = () => {
    setHand(cloneSampleHand());
    setDiscard([]);
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-manila text-crimson">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Link
                href="/mockups"
                className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-crimson/60 hover:text-crimson"
              >
                <ArrowLeft className="size-3.5" />
                All mockups
              </Link>
              <h1 className="font-display text-3xl font-bold">{title}</h1>
              <p className="max-w-xl font-sans text-sm text-crimson/70">{description}</p>
              <span className="inline-block rounded-full border border-crimson/30 bg-crimson/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                {styleLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {extraControls}
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-lg border border-crimson/30 bg-manila px-4 py-2 font-sans text-sm text-crimson transition hover:bg-crimson/5"
              >
                <RotateCcw className="size-4" />
                Reset hand
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-10 rounded-2xl border border-crimson/15 bg-crimson/[0.03] px-4 py-10">
            <EkDiscardPile cards={discard} style={style} />
            <Hand
              cards={hand}
              style={style}
              throwingCardId={throwingCardId}
              selectedCardId={selectedId}
              disabled={isPlaying || hand.length === 0}
              onSelect={handleSelect}
            />
            <p className="text-center font-sans text-xs text-crimson/50">
              Tap any card to play it toward the discard pile. All {hand.length} cards stay fully visible.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
