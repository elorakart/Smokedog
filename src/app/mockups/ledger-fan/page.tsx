"use client";

import { EkMockupShell } from "@/components/mockups/ek/EkMockupShell";
import { LedgerFanHand } from "@/components/mockups/ek/hands/LedgerFanHand";

export default function LedgerFanMockupPage() {
  return (
    <EkMockupShell
      title="Ledger Wide Fan"
      description="Smokedog manila and crimson with a wide fan arc. Cards sit ~12px apart with gentle rotation so every card face stays readable — no stacked overlap."
      style="ledger"
      styleLabel="Ledger"
      Hand={LedgerFanHand}
    />
  );
}
