"use client";

import { Eye } from "lucide-react";

export function SpectatorBanner({
  canVoteDead = false,
}: {
  canVoteDead?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-sm border border-crimson/20 bg-crimson/[0.05] px-4 py-3">
      <Eye size={16} className="shrink-0 text-crimson/70" />
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-crimson">
          Spectating
        </p>
        <p className="text-sm text-crimson/80">
          {canVoteDead
            ? "You are eliminated. You may still vote by day, but cannot act at night. Use graveyard chat."
            : "You have been eliminated. Watch the city and use graveyard chat — you cannot act or vote."}
        </p>
      </div>
    </div>
  );
}
