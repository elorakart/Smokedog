"use client";

import { EkMockupShell } from "@/components/mockups/ek/EkMockupShell";
import { WeebGridHand } from "@/components/mockups/ek/hands/WeebGridHand";

export default function WeebGridMockupPage() {
  return (
    <EkMockupShell
      title="Weeb Two-Row Grid"
      description="Pastel anime palette in a 4×2 grid. Every card is 100% face-up with no overlap — maximum visibility at a glance."
      style="weeb"
      styleLabel="Weeb"
      Hand={WeebGridHand}
    />
  );
}
