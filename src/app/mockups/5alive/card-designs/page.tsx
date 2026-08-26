"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { fadeUp, stagger } from "@/components/ui/motion";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { FiveAliveMockCardFace } from "@/components/mockups/five-alive/FiveAliveMockCardFace";
import {
  FIVE_ALIVE_GALLERY_CARDS,
  cardTypeName,
  type FiveAliveCardVariant,
} from "@/lib/mockups/five-alive-sample";

const VARIANTS: { id: FiveAliveCardVariant; label: string }[] = [
  { id: "ledger", label: "Ledger ornate" },
  { id: "ticket", label: "Vintage ticket" },
  { id: "pulse", label: "Pulse badge" },
];

export default function FiveAliveCardDesignsPage() {
  return (
    <div className="min-h-screen bg-manila text-crimson">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-10">
          <motion.div variants={fadeUp} className="space-y-2">
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
            <h1 className="font-display text-3xl font-bold">Card Design Gallery</h1>
            <p className="max-w-2xl font-sans text-sm text-crimson/70">
              Every 5 Alive card type in three visual treatments. Compare ornate ledger,
              vintage ticket, and pulse badge styles side by side.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="overflow-x-auto rounded-2xl border border-crimson/15">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-crimson/15 bg-crimson/[0.04]">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-crimson/60">
                    Card
                  </th>
                  {VARIANTS.map((v) => (
                    <th
                      key={v.id}
                      className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-crimson/60"
                    >
                      {v.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIVE_ALIVE_GALLERY_CARDS.map((card) => (
                  <tr key={card.id} className="border-b border-crimson/10 last:border-0">
                    <td className="px-4 py-4 align-middle">
                      <p className="font-display font-bold">{cardTypeName(card)}</p>
                      <p className="font-mono text-[10px] uppercase text-crimson/45">
                        {card.type}
                      </p>
                    </td>
                    {VARIANTS.map((v) => (
                      <td key={v.id} className="px-4 py-4 text-center align-middle">
                        <div className="inline-block">
                          <FiveAliveMockCardFace card={card} variant={v.id} width={88} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
