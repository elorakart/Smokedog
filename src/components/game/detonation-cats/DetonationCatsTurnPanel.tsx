"use client";

import { useMemo, useState } from "react";
import type { PublicDcCard, PublicGameState } from "@/lib/types";
import { GlassPanel, PrimaryButton } from "@/components/ui/primitives";
import { useEkPlayAnimation } from "@/components/mockups/ek/EkPlayAnimation";
import { DetonationCatsHand } from "./DetonationCatsHand";
import { DetonationCatsTable } from "./DetonationCatsTable";
import { DetonationCatsCardFace } from "./DetonationCatsCardFace";

function canSelectTogether(
  hand: PublicDcCard[],
  selectedIds: string[],
  card: PublicDcCard
): boolean {
  if (selectedIds.length === 0) return true;
  if (selectedIds.includes(card.id)) return true;
  const selected = hand.filter((c) => selectedIds.includes(c.id));
  const allCats = selected.every((c) => c.type.includes("_cat"));
  const cardIsCat = card.type.includes("_cat");
  if (allCats && cardIsCat) {
    return selected[0]!.type === card.type && selected.length < 3;
  }
  return false;
}

export function DetonationCatsTurnPanel({
  state,
  onPlayCards,
  onEndTurn,
  onPlaceDefuse,
  onPickDiscard,
  onStealTarget,
}: {
  state: PublicGameState;
  onPlayCards: (cardIds: string[]) => void;
  onEndTurn: () => void;
  onPlaceDefuse: (deckIndex: number) => void;
  onPickDiscard: (discardIndex: number) => void;
  onStealTarget: (targetId: string) => void;
}) {
  const dc = state.detonationCats;
  const you = state.you;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { throwingCardId, playCard, isPlaying } = useEkPlayAnimation();

  const yourTurn = !!dc && dc.turnPlayerId === you?.id;
  const hand = dc?.yourHand ?? [];

  const turnPlayer = useMemo(
    () => state.players.find((p) => p.id === dc?.turnPlayerId),
    [state.players, dc?.turnPlayerId]
  );

  if (!dc) return null;

  const toggleCard = (card: PublicDcCard) => {
    if (!yourTurn || !you?.alive) return;
    setSelectedIds((prev) => {
      if (prev.includes(card.id)) {
        return prev.filter((id) => id !== card.id);
      }
      if (!canSelectTogether(hand, prev, card)) return [card.id];
      if (prev.length >= 3) return prev;
      return [...prev, card.id];
    });
  };

  const playSelected = () => {
    if (!selectedIds.length || isPlaying) return;
    const ids = [...selectedIds];
    playCard(ids[0]!, () => {
      onPlayCards(ids);
      setSelectedIds([]);
    });
  };

  if (state.phase === "ek_defuse" && dc.awaitingDefuse) {
    return (
      <GlassPanel className="space-y-4 p-4">
        <h3 className="font-display text-xl font-bold">Defuse the Detonation Cat!</h3>
        <p className="text-sm text-ink-steel">
          Choose where to hide your Purr Defuse in the draw pile (0 = top).
        </p>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onPlaceDefuse(idx)}
              className="rounded-sm border border-crimson/25 px-3 py-2 font-mono text-xs uppercase tracking-wider hover:bg-crimson/5"
            >
              Slot {idx}
            </button>
          ))}
        </div>
      </GlassPanel>
    );
  }

  if (state.phase === "ek_pick_discard" && dc.awaitingPickDiscard) {
    return (
      <GlassPanel className="space-y-4 p-4">
        <h3 className="font-display text-xl font-bold">Pick from discard</h3>
        <p className="text-sm text-ink-steel">Triple cats — take any card from the discard pile.</p>
        {dc.discardTop ? (
          <button
            type="button"
            onClick={() => onPickDiscard(dc.discardCount - 1)}
            className="inline-block"
          >
            <DetonationCatsCardFace card={dc.discardTop} width={96} />
          </button>
        ) : null}
      </GlassPanel>
    );
  }

  if (state.phase === "ek_steal" && dc.awaitingStealTarget) {
    return (
      <GlassPanel className="space-y-4 p-4">
        <h3 className="font-display text-xl font-bold">Steal a card</h3>
        <p className="text-sm text-ink-steel">Pair of cats — pick a player to steal from.</p>
        <div className="flex flex-wrap gap-2">
          {state.players
            .filter((p) => p.alive && p.id !== you?.id)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onStealTarget(p.id)}
                className="rounded-sm border border-crimson/25 px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-crimson/5"
              >
                {p.name}
              </button>
            ))}
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-4">
      <GlassPanel className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              {yourTurn ? "Your turn" : "Waiting"}
            </p>
            <p className="mt-1 text-sm text-ink-steel">
              {yourTurn
                ? "Select cards to play, then end turn to draw."
                : `Waiting for ${turnPlayer?.name ?? "next player"}.`}
            </p>
            {dc.pendingTurns > 1 && (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-crimson/70">
                Attack active — {dc.pendingTurns} turns remaining
              </p>
            )}
          </div>
        </div>
      </GlassPanel>

      {dc.seeFutureCards && dc.seeFutureCards.length > 0 && yourTurn ? (
        <GlassPanel className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
            See the Future
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {dc.seeFutureCards.map((c) => (
              <DetonationCatsCardFace key={c.id} card={c} width={72} />
            ))}
          </div>
        </GlassPanel>
      ) : null}

      <GlassPanel className="p-4">
        <DetonationCatsTable dc={dc} />
      </GlassPanel>

      <GlassPanel className="p-4">
        <h3 className="font-display text-xl font-bold">Your hand</h3>
        <p className="mt-1 text-sm text-ink-steel">
          {hand.length} cards — all visible in the scroll rail.
        </p>
        <div className="mt-4">
          <DetonationCatsHand
            cards={hand}
            selectedIds={selectedIds}
            disabled={!yourTurn || !you?.alive}
            throwingCardId={throwingCardId}
            onToggle={toggleCard}
          />
        </div>
        {yourTurn && you?.alive ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton
              type="button"
              disabled={selectedIds.length === 0 || isPlaying}
              onClick={playSelected}
            >
              Play selected
            </PrimaryButton>
            <button
              type="button"
              disabled={isPlaying}
              onClick={onEndTurn}
              className="rounded-sm border border-crimson/30 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-crimson hover:bg-crimson/5"
            >
              End turn & draw
            </button>
          </div>
        ) : null}
      </GlassPanel>
    </div>
  );
}
