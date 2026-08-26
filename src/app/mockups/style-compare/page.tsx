"use client";

import { useState } from "react";
import { EkMockupShell } from "@/components/mockups/ek/EkMockupShell";
import { CompareHand } from "@/components/mockups/ek/hands/CompareHand";
import type { EkCardStyle } from "@/lib/mockups/ek-sample-cards";
import { cn } from "@/lib/cn";

const STYLES: { id: EkCardStyle; label: string }[] = [
  { id: "ledger", label: "Ledger" },
  { id: "playful", label: "Playful" },
  { id: "weeb", label: "Weeb" },
];

export default function StyleCompareMockupPage() {
  const [style, setStyle] = useState<EkCardStyle>("ledger");

  return (
    <EkMockupShell
      title="Style Compare Rail"
      description="Same scroll-rail layout with live style switching. Compare Ledger, Playful, and Weeb on identical card positions and play animation."
      style={style}
      styleLabel={`${STYLES.find((s) => s.id === style)?.label} (toggle)`}
      Hand={CompareHand}
      extraControls={
        <div className="flex rounded-lg border border-crimson/25 p-0.5">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={cn(
                "rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition",
                style === s.id
                  ? "bg-crimson text-manila"
                  : "text-crimson/60 hover:text-crimson"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      }
    />
  );
}
