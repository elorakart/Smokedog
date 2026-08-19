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
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [title, detail, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="fixed left-1/2 top-20 z-40 w-[min(92vw,28rem)] -translate-x-1/2 rounded-sm border border-amber-400/40 bg-amber-400/10 px-4 py-3 shadow-lg backdrop-blur-md"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-200" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-100">
              {title}
            </p>
            <p className="mt-1 text-sm text-ink">{detail}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
