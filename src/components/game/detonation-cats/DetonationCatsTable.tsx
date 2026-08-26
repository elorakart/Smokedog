"use client";

import type { DetonationCatsPublicState } from "@/lib/types";
import { DetonationCatsCardFace } from "./DetonationCatsCardFace";
import { DeckCard, DeckStack } from "@/components/game/five-alive/PlayingCard";

export function DetonationCatsTable({
  dc,
}: {
  dc: DetonationCatsPublicState;
}) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <DeckStack count={dc.drawPileCount} label="Draw pile" />
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Discard ({dc.discardCount})
        </p>
        {dc.discardTop ? (
          <DetonationCatsCardFace card={dc.discardTop} width={88} />
        ) : (
          <DeckCard width={88} />
        )}
      </div>
    </div>
  );
}
