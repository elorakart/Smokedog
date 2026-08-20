"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { PhaseAnnouncement } from "@/lib/types";
import {
  playBadNews,
  playGoodNews,
  playVoteStart,
} from "@/lib/sounds";

const AUTO_DISMISS_MS = 3000;

const TONE_STYLES: Record<
  PhaseAnnouncement["tone"],
  { border: string; bg: string; text: string }
> = {
  info: {
    border: "border-crimson/40",
    bg: "bg-crimson/10",
    text: "text-crimson",
  },
  good: {
    border: "border-crimson/40",
    bg: "bg-crimson/10",
    text: "text-crimson",
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [announcement.id, announcement.title, announcement.tone, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[45] flex items-center justify-center bg-void/50 p-4 backdrop-blur-[6px]"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-[min(92vw,28rem)] rounded-sm border px-5 py-4 shadow-lg backdrop-blur-md ${styles.border} ${styles.bg}`}
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-sm p-1 text-crimson/60 transition hover:bg-crimson/10 hover:text-crimson"
          >
            <X size={16} />
          </button>
          <p
            className={`pr-6 font-mono text-[10px] uppercase tracking-[0.2em] ${styles.text}`}
          >
            {announcement.title}
          </p>
          {announcement.detail && (
            <p className="mt-2 pr-2 text-sm text-ink">{announcement.detail}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
