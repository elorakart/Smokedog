"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { playActionNeeded } from "@/lib/sounds";

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
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [title, detail, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-void/60 p-4 backdrop-blur-[8px]"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="w-[min(92vw,28rem)] rounded-sm border border-amber-400/40 bg-surface/95 px-5 py-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-200" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-100">
                {title}
              </p>
              <p className="mt-2 text-sm text-ink">{detail}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
