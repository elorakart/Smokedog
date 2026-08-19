"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { popIn } from "@/components/ui/motion";

export function CopyToast({
  show,
  message = "Copied to clipboard",
}: {
  show: boolean;
  message?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          variants={popIn}
          initial="hidden"
          animate="show"
          exit="exit"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
        >
          <div className="inline-flex items-center gap-2 rounded-sm border border-crimson/40 bg-surface/95 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-crimson-glow shadow-lg backdrop-blur-md">
            <Check size={14} />
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
