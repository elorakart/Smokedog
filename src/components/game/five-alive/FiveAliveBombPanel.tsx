"use client";

import { GlassPanel } from "@/components/ui/primitives";
import type { PublicGameState } from "@/lib/types";
import { cardLabel, isNumber0 } from "@/lib/games/5-alive/cards";

export function FiveAliveBombPanel({
  state,
  onRespond,
}: {
  state: PublicGameState;
  onRespond: (payload: { cardId?: string | null; pass?: boolean }) => void;
}) {
  const five = state.fiveAlive;
  const you = state.you;
  if (!five) return null;

  const awaitingId = five.bombAwaitingPlayerId;
  const awaiting = state.players.find((p) => p.id === awaitingId);
  const isAwaiting = !!you && you.id === awaitingId;

  const yourHand = five.yourHand ?? [];
  const hasDefuse = yourHand.some((c) => c.type === "number" && c.value === 0);

  return (
    <div className="space-y-4">
      <GlassPanel className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Bomb response
        </p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-ink-steel">
              Running total stays at <span className="font-display font-extrabold">{five.runningTotal}</span>
            </div>
            <div className="mt-2 text-sm text-ink-steel">
              {isAwaiting
                ? "You must play 0 to defuse."
                : awaiting
                  ? `${awaiting.name} must respond now.`
                  : "Waiting for responders…"}
            </div>
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
      </GlassPanel>

      <GlassPanel className="p-4">
        <h3 className="font-display text-xl font-bold">Your hand</h3>
        {!isAwaiting ? (
          <p className="mt-1 text-sm text-ink-steel">Locked until you’re the bomb responder.</p>
        ) : (
          <p className="mt-1 text-sm text-ink-steel">
            Play a <span className="font-mono">0</span> (number card). If you can’t, pass to lose 1 life.
          </p>
        )}

        {isAwaiting && (
          <div className="mt-3">
            <button
              type="button"
              disabled={hasDefuse}
              onClick={() => onRespond({ pass: true })}
              className={`w-full rounded-sm border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                hasDefuse
                  ? "cursor-not-allowed border-white/10 bg-white/[0.03] opacity-40"
                  : "border-crimson/40 bg-crimson/10 text-crimson-glow hover:border-crimson/60"
              }`}
            >
              Pass (lose 1 life)
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2">
          {yourHand.map((card) => {
            const canPlay = isAwaiting && card.type === "number" && card.value === 0;
            const disabled = !canPlay;
            return (
              <button
                key={card.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (!canPlay) return;
                  onRespond({ cardId: card.id });
                }}
                className={`rounded-sm border px-2 py-2 text-center transition ${
                  canPlay
                    ? "border-emerald-400/40 bg-emerald-400/10 hover:border-emerald-400/70 hover:text-emerald-200"
                    : "border-white/10 bg-white/[0.03] opacity-60 cursor-default"
                }`}
              >
                <div className="font-display text-lg font-extrabold">{cardLabel(card as any)}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink-steel">
                  {card.type}
                </div>
              </button>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
}

