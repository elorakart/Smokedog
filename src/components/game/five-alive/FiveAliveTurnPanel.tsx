"use client";

import { useMemo, useState } from "react";
import type { PublicGameState } from "@/lib/types";
import { GlassPanel } from "@/components/ui/primitives";
import { cardLabel } from "@/lib/games/5-alive/cards";

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

  const yourHand = five?.yourHand ?? [];

  const yourPlayer = you?.id ? state.players.find((p) => p.id === you.id) : undefined;

  const playersSummary = useMemo(() => {
    return state.players
      .map((p) => ({
        id: p.id,
        name: p.name,
        lives: p.lives ?? 0,
        isTurn: five?.turnPlayerId === p.id,
      }))
      .sort((a, b) => (b.lives ?? 0) - (a.lives ?? 0));
  }, [state.players, five?.turnPlayerId]);

  if (!five) return null;

  return (
    <div className="space-y-4">
      <GlassPanel className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              Running total
            </p>
            <div className="mt-1 text-4xl font-display font-extrabold">
              {five.runningTotal}
            </div>
            <p className="mt-2 text-sm text-ink-steel">
              {yourTurn ? "Your turn." : `Waiting for ${five.turnPlayerId ? state.players.find((p) => p.id === five.turnPlayerId)?.name : "next player"}.`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              Your lives
            </p>
            <div className="mt-1 text-3xl font-display font-extrabold">
              {yourPlayer?.lives ?? 0}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {playersSummary.map((p) => (
            <div
              key={p.id}
              className={`rounded-sm border px-3 py-2 ${
                p.isTurn ? "border-crimson bg-crimson/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
                {p.name}
              </p>
              <p className="mt-1 font-display text-xl font-extrabold">
                {p.lives}
              </p>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="p-4">
        <h3 className="font-display text-xl font-bold">Your hand</h3>
        {!yourTurn && (
          <p className="mt-1 text-sm text-ink-steel">Locked until it’s your turn.</p>
        )}
        {yourTurn && youAlive === false && (
          <p className="mt-1 text-sm text-ink-steel">
            You’re eliminated. Spectating the turn.
          </p>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {yourHand.map((card) => {
            const disabled = !yourTurn || !youAlive || !!wildCardId;
            return (
              <button
                key={card.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (!yourTurn || !youAlive) return;
                  if (card.type === "wild") {
                    setWildCardId(card.id);
                    setWildValue(five.runningTotal);
                    return;
                  }
                  onPlay({ cardId: card.id });
                }}
                className={`rounded-sm border px-2 py-2 text-center transition ${
                  wildCardId === card.id ? "border-crimson bg-crimson/20" : "border-white/10 bg-white/[0.03]"
                } ${disabled ? "opacity-40 cursor-default" : "hover:border-crimson/60 hover:text-crimson-glow"}`}
              >
                <div className="font-display text-lg font-extrabold">
                  {cardLabel(card as any)}
                </div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink-steel">
                  {card.type}
                </div>
              </button>
            );
          })}
        </div>

        {wildCardId && (
          <div className="mt-4 rounded-sm border border-crimson/40 bg-crimson/10 p-4">
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
                onClick={() => {
                  setWildCardId(null);
                }}
                className="rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!wildCardId) return;
                  onPlay({ cardId: wildCardId, wildValue });
                  setWildCardId(null);
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

