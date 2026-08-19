"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PhaseAnnouncement } from "@/lib/types";
import {
  playBadNews,
  playGoodNews,
  playVoteStart,
} from "@/lib/sounds";

const TONE_STYLES: Record<
  PhaseAnnouncement["tone"],
  { border: string; bg: string; text: string }
> = {
  info: {
    border: "border-sky-400/40",
    bg: "bg-sky-400/10",
    text: "text-sky-100",
  },
  good: {
    border: "border-emerald-400/40",
    bg: "bg-emerald-400/10",
    text: "text-emerald-100",
  },
  bad: {
    border: "border-crimson/40",
    bg: "bg-crimson/15",
    text: "text-crimson-glow",
  },
};

export function PhaseResultPopup({
  announcement,
  onDismiss,
}: {
  announcement: PhaseAnnouncement;
  onDismiss: () => void;
}) {
  const styles = TONE_STYLES[announcement.tone];

  useEffect(() => {
    if (announcement.title.toLowerCase().includes("voting")) {
      playVoteStart();
    } else if (announcement.tone === "good") {
      playGoodNews();
    } else if (announcement.tone === "bad") {
      playBadNews();
    }
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [announcement.id, announcement.title, announcement.tone, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className={`fixed inset-x-4 top-24 z-40 mx-auto max-w-md rounded-sm border px-5 py-4 shadow-lg backdrop-blur-md sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 ${styles.border} ${styles.bg}`}
      >
        <p className={`font-mono text-[10px] uppercase tracking-[0.2em] ${styles.text}`}>
          {announcement.title}
        </p>
        {announcement.detail && (
          <p className="mt-2 text-sm text-ink">{announcement.detail}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
