"use client";

import { GlassPanel } from "@/components/ui/primitives";
import type { PublicFiveAliveCard, PublicGameState } from "@/lib/types";
import { FiveAliveHand, useCardThrow } from "./FiveAliveHand";
import { FiveAliveLifeTracker, FiveAliveTable } from "./FiveAliveTable";

export function FiveAliveBombPanel({
  state,
  onRespond,
}: {
  state: PublicGameState;
  onRespond: (payload: { cardId?: string | null; pass?: boolean }) => void;
}) {
  const five = state.fiveAlive;
  const you = state.you;
  const { throwingCardId, throwCard, isThrowing } = useCardThrow();

  if (!five) return null;

  const awaitingId = five.bombAwaitingPlayerId;
  const awaiting = state.players.find((p) => p.id === awaitingId);
  const isAwaiting = !!you && you.id === awaitingId;

  const yourHand = five.yourHand ?? [];
  const hasDefuse = yourHand.some((c) => c.type === "number" && c.value === 0);

  const defuseFilter = (card: PublicFiveAliveCard) =>
    card.type === "number" && card.value === 0;

  return (
    <div className="space-y-4">
      <GlassPanel className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Bomb response
        </p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-ink-steel">
              Running total stays at{" "}
              <span className="font-display font-extrabold">{five.runningTotal}</span>
            </div>
            <div className="mt-2 text-sm text-ink-steel">
              {isAwaiting
                ? "Play a 0 to defuse the bomb."
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

        <div className="mt-4">
          <FiveAliveLifeTracker
            players={state.players}
            turnPlayerId={awaitingId}
          />
        </div>
      </GlassPanel>

      <GlassPanel className="p-4">
        <FiveAliveTable five={five} />
      </GlassPanel>

      <GlassPanel className="p-4">
        <h3 className="font-display text-xl font-bold">Your hand</h3>
        {!isAwaiting ? (
          <p className="mt-1 text-sm text-ink-steel">
            Locked until you&apos;re the bomb responder.
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-steel">
            Play a <span className="font-mono">0</span> or pass to lose 1 life.
          </p>
        )}

        {isAwaiting && (
          <div className="mt-3">
            <button
              type="button"
              disabled={hasDefuse || isThrowing}
              onClick={() => onRespond({ pass: true })}
              className={`w-full rounded-sm border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
                hasDefuse
                  ? "cursor-not-allowed border-white/10 bg-white/[0.03] opacity-40"
                  : "border-[#e63946]/40 bg-[#e63946]/10 text-crimson-glow hover:border-[#e63946]/60"
              }`}
            >
              Pass (lose 1 life)
            </button>
          </div>
        )}

        <div className="mt-4">
          <FiveAliveHand
            cards={yourHand}
            disabled={!isAwaiting}
            throwingCardId={throwingCardId}
            playableFilter={isAwaiting ? defuseFilter : undefined}
            onSelect={(card) => {
              if (!isAwaiting || !defuseFilter(card) || isThrowing) return;
              throwCard(card.id, () => onRespond({ cardId: card.id }));
            }}
          />
        </div>
      </GlassPanel>
    </div>
  );
}
