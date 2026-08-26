"use client";

import { AnimatePresence, motion } from "framer-motion";
import { popIn } from "@/components/ui/motion";
import type { EkCardStyle, EkSampleCard } from "@/lib/mockups/ek-sample-cards";
import { EkCardFace } from "./EkCardFace";

export function EkDiscardPile({
  cards,
  style,
  label = "Discard pile",
}: {
  cards: EkSampleCard[];
  style: EkCardStyle;
  label?: string;
}) {
  const top = cards[cards.length - 1];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson/60">
        {label}
      </p>
      <div className="relative flex h-[168px] w-[120px] items-center justify-center">
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-crimson/25 bg-crimson/[0.04]" />
        <AnimatePresence mode="popLayout">
          {top ? (
            <motion.div
              key={top.id}
              variants={popIn}
              initial="hidden"
              animate="show"
              exit="exit"
              className="relative z-10"
            >
              <EkCardFace card={top} style={style} width={96} />
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 px-2 text-center font-sans text-xs text-crimson/40"
            >
              Play a card
            </motion.p>
          )}
        </AnimatePresence>
        {cards.length > 1 ? (
          <span className="absolute -bottom-6 font-mono text-[10px] text-crimson/50">
            {cards.length} played
          </span>
        ) : null}
      </div>
    </div>
  );
}
