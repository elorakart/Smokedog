"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { playActionNeeded } from "@/lib/sounds";

const AUTO_DISMISS_MS = 3000;

export function ActionDialog({
  title,
  detail,
  onDismiss,
}: {
  title: string;
  detail: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    playActionNeeded();
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const lenis = (
        window as unknown as { lenis?: { scrollTo: (y: number) => void } }
      ).lenis;
      lenis?.scrollTo(0);
    } catch {
      /* optional */
    }
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [title, detail, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-crimson/35 p-4 backdrop-blur-[4px]"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[min(92vw,28rem)] rounded-sm border-2 border-crimson bg-manila px-5 py-5 text-crimson shadow-stamp"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-sm p-1 text-crimson/60 transition hover:bg-crimson/10 hover:text-crimson"
          >
            <X size={16} />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-crimson" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-crimson">
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-crimson">
                {detail}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
