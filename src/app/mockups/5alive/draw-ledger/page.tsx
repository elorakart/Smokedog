"use client";

import { FiveAliveTableMockup } from "@/components/mockups/five-alive/FiveAliveTableMockup";

export default function FiveAliveDrawLedgerPage() {
  return (
    <FiveAliveTableMockup
      title="Draw & Play — Ledger Ornate"
      description="Full 5 Alive table: tap the draw pile to pull cards (count badge updates), play to center pile, running total tracks the pile. Ornate ledger card art with corner filigree and category stripes."
      variant="ledger"
      variantLabel="Ledger ornate"
    />
  );
}
