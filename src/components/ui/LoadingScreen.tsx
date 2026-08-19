"use client";

import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function LoadingScreen({
  message = "Linking secure channel…",
  submessage,
}: {
  message?: string;
  submessage?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <LoadingSpinner size={32} />
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink">
            {message}
          </p>
          {submessage && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              {submessage}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
