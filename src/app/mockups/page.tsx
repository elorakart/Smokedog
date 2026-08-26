"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeUp, stagger } from "@/components/ui/motion";
import { SiteHeader } from "@/components/ui/SiteHeader";

const MOCKUPS = [
  {
    href: "/mockups/ledger-fan",
    title: "Ledger Wide Fan",
    style: "Ledger",
    layout: "Wide fan arc",
    description: "Manila + crimson. Gentle rotation, 12px gaps — all cards readable.",
  },
  {
    href: "/mockups/playful-rail",
    title: "Playful Scroll Rail",
    style: "Playful",
    layout: "Horizontal rail",
    description: "Warm bold colors. Snap-scroll, zero overlap.",
  },
  {
    href: "/mockups/weeb-grid",
    title: "Weeb Two-Row Grid",
    style: "Weeb",
    layout: "4×2 grid",
    description: "Pastel anime palette. Every card fully face-up.",
  },
  {
    href: "/mockups/style-compare",
    title: "Style Compare",
    style: "All three",
    layout: "Scroll rail + toggle",
    description: "Switch Ledger / Playful / Weeb on the same layout live.",
  },
];

export default function MockupsIndexPage() {
  return (
    <div className="min-h-screen bg-manila text-crimson">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          <motion.div variants={fadeUp} className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-crimson/50">
              Detonation Cats
            </p>
            <h1 className="font-display text-4xl font-bold">Card UI Mockups</h1>
            <p className="max-w-2xl font-sans text-crimson/70">
              Four interactive hand layouts for Exploding Kittens–style gameplay.
              Tap cards to play them with smooth throw animation. Pick a style
              before we build the full game.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="grid gap-4 sm:grid-cols-2"
          >
            {MOCKUPS.map((mockup) => (
              <Link
                key={mockup.href}
                href={mockup.href}
                className="group rounded-2xl border border-crimson/20 bg-crimson/[0.03] p-6 transition hover:border-crimson/40 hover:bg-crimson/[0.06]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-crimson/25 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-crimson/70">
                    {mockup.style}
                  </span>
                  <ArrowRight className="size-4 text-crimson/40 transition group-hover:translate-x-0.5 group-hover:text-crimson" />
                </div>
                <h2 className="font-display text-xl font-bold">{mockup.title}</h2>
                <p className="mt-1 font-mono text-xs text-crimson/50">{mockup.layout}</p>
                <p className="mt-3 font-sans text-sm text-crimson/65">
                  {mockup.description}
                </p>
              </Link>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
