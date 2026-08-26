"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { fadeUp } from "@/components/ui/motion";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { FiveAliveDrawPile } from "./FiveAliveDrawPile";
import {
  FiveAliveCenterPile,
  FiveAliveMockHand,
  FiveAliveRunningTotal,
} from "./FiveAliveMockHand";
import { useFiveAliveTableAnimation } from "./FiveAliveTableAnimation";
import {
  cloneDrawPool,
  cloneStartHand,
  FIVE_ALIVE_INITIAL_DRAW_COUNT,
  mockRunningTotalAfterPlay,
  type FiveAliveCardVariant,
  type FiveAliveSampleCard,
} from "@/lib/mockups/five-alive-sample";

export function FiveAliveTableMockup({
  title,
  description,
  variant,
  variantLabel,
}: {
  title: string;
  description: string;
  variant: FiveAliveCardVariant;
  variantLabel: string;
}) {
  const [hand, setHand] = useState(() => cloneStartHand());
  const [drawPool, setDrawPool] = useState(() => cloneDrawPool());
  const [drawCount, setDrawCount] = useState(FIVE_ALIVE_INITIAL_DRAW_COUNT);
  const [center, setCenter] = useState<FiveAliveSampleCard[]>([]);
  const [runningTotal, setRunningTotal] = useState(12);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([
    "Running total starts at 12 from prior plays.",
  ]);

  const { drawingCardId, playingCardId, drawCard, playCard, isBusy } =
    useFiveAliveTableAnimation();

  const pushLog = (line: string) =>
    setLog((prev) => [line, ...prev].slice(0, 6));

  const handleDraw = useCallback(() => {
    if (isBusy || drawCount <= 0) return;
    const next = drawPool[drawPool.length - 1];
    if (!next) return;

    drawCard(next.id, () => {
      setDrawPool((prev) => prev.slice(0, -1));
      setDrawCount((c) => c - 1);
      setHand((prev) => [...prev, next]);
      pushLog(`Drew ${next.type === "number" ? next.value : next.type} — pile now ${drawCount - 1}.`);
    });
  }, [isBusy, drawCount, drawPool, drawCard]);

  const handlePlay = useCallback(
    (card: FiveAliveSampleCard) => {
      if (isBusy) return;
      setSelectedId(card.id);
      playCard(card.id, () => {
        setHand((prev) => prev.filter((c) => c.id !== card.id));
        setCenter((prev) => [...prev, card]);
        setRunningTotal((t) => mockRunningTotalAfterPlay(t, card));
        setSelectedId(null);
        pushLog(`Played to center — total now ${mockRunningTotalAfterPlay(runningTotal, card)}.`);
      });
    },
    [isBusy, playCard, runningTotal]
  );

  const reset = () => {
    setHand(cloneStartHand());
    setDrawPool(cloneDrawPool());
    setDrawCount(FIVE_ALIVE_INITIAL_DRAW_COUNT);
    setCenter([]);
    setRunningTotal(12);
    setSelectedId(null);
    setLog(["Reset — draw pile back to 38, hand restored."]);
  };

  const centerTop = center[center.length - 1] ?? null;

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
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson/45">
                5 Alive
              </p>
              <h1 className="font-display text-3xl font-bold">{title}</h1>
              <p className="max-w-xl font-sans text-sm text-crimson/70">{description}</p>
              <span className="inline-block rounded-full border border-crimson/30 bg-crimson/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
                {variantLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg border border-crimson/30 px-4 py-2 font-sans text-sm transition hover:bg-crimson/5"
            >
              <RotateCcw className="size-4" />
              Reset table
            </button>
          </div>

          <div className="rounded-2xl border border-crimson/15 bg-crimson/[0.03] px-4 py-8">
            <div className="flex flex-wrap items-end justify-center gap-10 pb-8">
              <FiveAliveDrawPile
                count={drawCount}
                onDraw={handleDraw}
                disabled={isBusy}
                drawing={!!drawingCardId}
              />
              <div className="flex flex-col items-center gap-4">
                <FiveAliveCenterPile
                  card={centerTop}
                  variant={variant}
                  pileCount={center.length}
                />
                <FiveAliveRunningTotal total={runningTotal} />
              </div>
              <div className="flex flex-col items-center gap-2 opacity-80">
                <div className="flex aspect-[5/7] w-[72px] items-center justify-center rounded-xl border border-dashed border-crimson/20 bg-crimson/[0.02] font-mono text-[9px] uppercase tracking-widest text-crimson/40">
                  Discard
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-crimson/50">
                  Side pile
                </p>
              </div>
            </div>

            <FiveAliveMockHand
              cards={hand}
              variant={variant}
              selectedId={selectedId}
              playingCardId={playingCardId}
              drawingCardId={drawingCardId}
              disabled={isBusy}
              onSelect={handlePlay}
            />

            <p className="mt-4 text-center font-sans text-xs text-crimson/50">
              Tap the draw pile to pull a card ({drawCount} left). Tap a hand card to play it.
              All {hand.length} hand cards stay visible.
            </p>

            <ul className="mx-auto mt-6 max-w-md space-y-1 border-t border-crimson/10 pt-4">
              {log.map((line, i) => (
                <li key={i} className="font-mono text-[11px] text-crimson/55">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
