"use client";

import { EkMockupShell } from "@/components/mockups/ek/EkMockupShell";
import { PlayfulRailHand } from "@/components/mockups/ek/hands/PlayfulRailHand";

export default function PlayfulRailMockupPage() {
  return (
    <EkMockupShell
      title="Playful Scroll Rail"
      description="Bold warm colors on a horizontal snap-scroll rail. Zero overlap — every card is full width and fully legible. Best for large hands on mobile."
      style="playful"
      styleLabel="Playful"
      Hand={PlayfulRailHand}
    />
  );
}
