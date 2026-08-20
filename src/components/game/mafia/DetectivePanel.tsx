"use client";

import { GlassPanel } from "@/components/ui/primitives";
import type { DetectiveLogEntry } from "@/lib/types";

export function DetectivePanel({ log }: { log: DetectiveLogEntry[] }) {
  if (log.length === 0) return null;

  return (
    <GlassPanel className="p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-crimson-glow">
        Investigation log
      </p>
      <ul className="mt-3 space-y-2">
        {[...log].reverse().map((entry) => (
          <li
            key={entry.id}
            className="rounded-sm border border-crimson/20 bg-crimson/[0.04] px-3 py-2 text-sm"
          >
            <span className="font-mono text-[10px] uppercase text-ink-steel">
              Night {entry.cycle}
            </span>
            <p className="mt-0.5">
              <strong>{entry.targetName}</strong> — aligned with{" "}
              <span className="uppercase">{entry.faction}</span>
            </p>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
