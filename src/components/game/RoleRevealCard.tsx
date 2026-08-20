"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ROLE_META } from "@/lib/games/mafia-city/roles";
import type { Role } from "@/lib/types";
import { Stamp } from "@/components/ui/primitives";

export function RoleRevealCard({
  role,
  phaseEndsAt,
}: {
  role: Role;
  phaseEndsAt?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const meta = ROLE_META[role];

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, [role]);

  useEffect(() => {
    if (!phaseEndsAt) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [phaseEndsAt]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-manila/5 px-4">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-crimson-glow">
        Envelope sealed
        {remaining != null && remaining > 0 && (
          <span className="ml-2 text-ink-steel">— {remaining}s</span>
        )}
      </p>
      <button type="button" onClick={() => setOpen(true)} className="w-full max-w-sm">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative border-2 border-ink-dark bg-paper p-8 text-left text-ink-dark shadow-stamp"
        >
          {!open ? (
            <div className="flex h-56 flex-col items-center justify-center">
              <span className="font-display text-4xl font-bold tracking-[0.2em]">
                SD
              </span>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-dark/40">
                Tap to unseal
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-crimson">
                Envelope sealed
              </p>
              <h2 className="mt-6 font-display text-4xl font-bold">{meta.label}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-dark/70">
                {meta.ability}
              </p>
              <div className="absolute -right-3 -top-3">
                <Stamp>{meta.faction}</Stamp>
              </div>
              <div className="mt-8 h-1 w-full bg-ink-dark/10" />
              {remaining != null && remaining > 0 && (
                <p className="mt-3 font-mono text-[9px] uppercase text-ink-dark/40">
                  Reveal ends in 0:{remaining.toString().padStart(2, "0")}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </button>
    </div>
  );
}
