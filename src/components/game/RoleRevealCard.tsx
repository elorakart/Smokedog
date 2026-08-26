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
    setOpen(false);
    const t = setTimeout(() => setOpen(true), 5000);
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-crimson/70">
        {open ? "Envelope opened" : "Envelope sealed"}
        {remaining != null && remaining > 0 && (
          <span className="ml-2 text-crimson/50">— {remaining}s</span>
        )}
      </p>
      {!open && (
        <p className="mb-4 text-center text-sm text-crimson/70">
          Click on the envelope to open it
          <span className="block font-mono text-[10px] uppercase tracking-widest text-crimson/40">
            or it opens automatically in 5 seconds
          </span>
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full max-w-sm"
        aria-label={open ? "Role revealed" : "Open envelope"}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative border-2 border-crimson bg-manila p-8 text-left text-crimson shadow-stamp"
        >
          {!open ? (
            <motion.div
              className="relative flex h-56 flex-col items-center justify-center overflow-hidden"
              animate={{ rotate: [0, -1.5, 1.5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="absolute inset-x-6 top-8 h-px bg-crimson/30" />
              <div className="absolute inset-x-10 top-8 h-16 origin-top border-x border-b border-crimson/25 bg-crimson/[0.06]"
                style={{ clipPath: "polygon(0 0, 50% 70%, 100% 0)" }}
              />
              <span className="relative z-10 font-display text-4xl font-bold tracking-[0.2em]">
                SD
              </span>
              <p className="relative z-10 mt-4 font-mono text-[10px] uppercase tracking-widest text-crimson/40">
                Click to open
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, rotateX: -40, y: 12 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-crimson/70">
                Your assignment
              </p>
              <h2 className="mt-6 font-display text-4xl font-bold">{meta.label}</h2>
              <p className="mt-3 text-sm leading-relaxed text-crimson/70">
                {meta.ability}
              </p>
              <div className="absolute -right-3 -top-3">
                <Stamp>{meta.faction}</Stamp>
              </div>
              <div className="mt-8 h-1 w-full bg-crimson/15" />
              {remaining != null && remaining > 0 && (
                <p className="mt-3 font-mono text-[9px] uppercase text-crimson/40">
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
