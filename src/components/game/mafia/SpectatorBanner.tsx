"use client";

import { Eye } from "lucide-react";

export function SpectatorBanner() {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-sm border border-white/10 bg-white/[0.04] px-4 py-3">
      <Eye size={16} className="shrink-0 text-ink-steel" />
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Spectating
        </p>
        <p className="text-sm text-ink-steel">
          You have been eliminated. Use graveyard chat and watch the city unfold.
          {` Dead villagers may still vote during the day.`}
        </p>
      </div>
    </div>
  );
}
