"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import { GlassPanel } from "@/components/ui/primitives";
import type { DayIntel } from "@/lib/types";

/** Day-scoped intel — eye reopens today's result; cleared server-side next night. */
export function DayIntelPanel({
  intel,
}: {
  intel: DayIntel | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  if (!intel) return null;

  return (
    <GlassPanel className="p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-crimson-glow">
          Today&apos;s intel
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-sm border border-crimson/30 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-crimson"
          aria-label="View today's intel"
        >
          <Eye size={12} />
          {open ? "Hide" : "View"}
        </button>
      </div>
      {open && (
        <div className="mt-2 rounded-sm border border-crimson/15 bg-crimson/[0.04] px-3 py-2 text-sm">
          <p className="font-display font-semibold text-crimson">{intel.title}</p>
          <p className="mt-1 text-ink-steel">{intel.detail}</p>
          <p className="mt-2 font-mono text-[9px] uppercase text-ink-steel">
            Clears when the next night begins
          </p>
        </div>
      )}
    </GlassPanel>
  );
}
