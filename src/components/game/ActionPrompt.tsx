"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";
import { pendingPlayerAction } from "@/lib/action-prompt";
import type { PublicGameState } from "@/lib/types";

export function ActionPrompt({ state }: { state: PublicGameState }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const remaining = state.phaseEndsAt
    ? Math.ceil((state.phaseEndsAt - now) / 1000)
    : null;
  const pending = pendingPlayerAction(state);
  if (!pending) return null;
  if (state.phase !== "night" && state.phase !== "day") return null;

  const closing = remaining != null && remaining > 0 && remaining <= 10;
  const urgent = closing;

  return (
    <AnimatePresence>
      <motion.div
        key={`${pending.title}-${urgent ? "urgent" : "idle"}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 flex items-start gap-3 rounded-sm border px-4 py-3 ${
          urgent
            ? "animate-pulse border-crimson bg-crimson/15 text-crimson-glow shadow-glow"
            : "border-amber-400/40 bg-amber-400/10 text-amber-100"
        }`}
      >
        {urgent ? <Clock size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]">
            {urgent && remaining != null
              ? `${pending.title} — ${remaining}s left`
              : pending.title}
          </p>
          <p className="mt-1 text-sm">{pending.detail}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
