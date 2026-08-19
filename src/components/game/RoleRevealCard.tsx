"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ROLE_META } from "@/lib/games/mafia-city/roles";
import type { Role } from "@/lib/types";
import { GlassPanel, StatusChip } from "@/components/ui/primitives";

export function RoleRevealCard({
  role,
  phaseEndsAt,
}: {
  role: Role;
  phaseEndsAt?: number | null;
}) {
  const [flipped, setFlipped] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const meta = ROLE_META[role];

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 600);
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-crimson-glow">
        Identity sealed
        {remaining != null && remaining > 0 && (
          <span className="ml-2 text-ink-steel">— {remaining}s</span>
        )}
      </p>
      <button type="button" onClick={() => setFlipped(true)}>
        <motion.div
          className="relative h-80 w-56"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.7 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden" }}
          >
            <GlassPanel className="flex h-full items-center justify-center">
              <span className="font-display text-4xl font-extrabold tracking-[0.3em]">
                SD
              </span>
            </GlassPanel>
          </div>
          <div
            className="absolute inset-0"
            style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
          >
            <GlassPanel className="flex h-full flex-col items-center justify-center p-6">
              <StatusChip tone={meta.faction === "mafia" ? "mafia" : "town"}>
                {meta.faction}
              </StatusChip>
              <h2 className="mt-4 text-center font-display text-2xl font-bold">
                {meta.label}
              </h2>
              <p className="mt-4 text-center text-sm text-ink-steel">{meta.ability}</p>
            </GlassPanel>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
