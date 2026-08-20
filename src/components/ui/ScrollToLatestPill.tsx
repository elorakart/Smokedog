"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ScrollToLatestPill({
  unread,
  onClick,
  singular = "unread message",
  plural = "unread messages",
}: {
  unread: number;
  onClick: () => void;
  singular?: string;
  plural?: string;
}) {
  return (
    <AnimatePresence>
      {unread > 0 && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          onClick={onClick}
          className="absolute bottom-2 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-sm border-2 border-crimson bg-crimson px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-manila shadow-stamp transition hover:opacity-90"
        >
          <ChevronDown size={12} />
          {unread === 1 ? `1 ${singular}` : `${unread} ${plural}`}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
