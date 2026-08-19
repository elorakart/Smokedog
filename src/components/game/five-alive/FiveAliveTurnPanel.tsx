"use client";

import { useState } from "react";
import type { PublicFiveAliveCard, PublicGameState } from "@/lib/types";
import { GlassPanel } from "@/components/ui/primitives";
import { FiveAliveHand, useCardThrow } from "./FiveAliveHand";
import { FiveAliveLifeTracker, FiveAliveTable } from "./FiveAliveTable";

function clampTurnValue(v: number) {
  const n = Math.floor(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(21, n));
}

export function FiveAliveTurnPanel({
  state,
  onPlay,
}: {
  state: PublicGameState;
  onPlay: (payload: { cardId: string; wildValue?: number }) => void;
}) {
  const five = state.fiveAlive;
  const you = state.you;

  const yourTurn = !!five && five.turnPlayerId === you?.id;
  const youAlive = !!you?.alive;

  const [wildCardId, setWildCardId] = useState<string | null>(null);
  const [wildValue, setWildValue] = useState<number>(five?.runningTotal ?? 0);
  const { throwingCardId, throwCard, isThrowing } = useCardThrow();

  const yourHand = five?.yourHand ?? [];
  const turnPlayer = five?.turnPlayerId
    ? state.players.find((p) => p.id === five.turnPlayerId)
    : undefined;

  if (!five) return null;

  const handleSelect = (card: PublicFiveAliveCard) => {
    if (!yourTurn || !youAlive || isThrowing) return;
    if (card.type === "wild") {
      setWildCardId(card.id);
      setWildValue(five.runningTotal);
      return;
    }
    throwCard(card.id, () => onPlay({ cardId: card.id }));
  };

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
                ? "Tap a card to play it to the center pile."
                : `Waiting for ${turnPlayer?.name ?? "next player"}.`}
            </p>
            {five.pendingDrawCount > 0 && (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[#457b9d]">
                Next player draws {five.pendingDrawCount}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              Your lives
            </p>
            <div className="mt-1 text-3xl font-display font-extrabold">
              {state.players.find((p) => p.id === you?.id)?.lives ?? 0}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <FiveAliveLifeTracker
            players={state.players}
            turnPlayerId={five.turnPlayerId}
          />
        </div>
      </GlassPanel>

      <GlassPanel className="p-4">
        <FiveAliveTable five={five} />
      </GlassPanel>

      <GlassPanel className="p-4">
        <h3 className="font-display text-xl font-bold">Your hand</h3>
        {!yourTurn && (
          <p className="mt-1 text-sm text-ink-steel">Locked until it&apos;s your turn.</p>
        )}
        {yourTurn && !youAlive && (
          <p className="mt-1 text-sm text-ink-steel">
            You&apos;re eliminated. Spectating the turn.
          </p>
        )}

        <div className="mt-4">
          <FiveAliveHand
            cards={yourHand}
            disabled={!yourTurn || !youAlive}
            throwingCardId={throwingCardId}
            selectedCardId={wildCardId}
            onSelect={handleSelect}
          />
        </div>

        {wildCardId && (
          <div className="mt-4 rounded-sm border border-[#e63946]/40 bg-[#e63946]/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-crimson-glow">
              Wild: choose new running total
            </p>
            <input
              type="number"
              min={0}
              max={21}
              value={wildValue}
              onChange={(e) => setWildValue(clampTurnValue(Number(e.target.value)))}
              className="mt-2 w-24 rounded-sm border border-white/10 bg-surface-high px-2 py-2 font-mono text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setWildCardId(null)}
                className="rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isThrowing}
                onClick={() => {
                  if (!wildCardId) return;
                  throwCard(wildCardId, () => {
                    onPlay({ cardId: wildCardId, wildValue });
                    setWildCardId(null);
                  });
                }}
                className="flex-1 rounded-sm bg-crimson px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white shadow-glow"
              >
                Play Wild
              </button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
