"use client";

import confetti from "canvas-confetti";
import { useEffect } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { ROLE_META } from "@/lib/games/mafia-city/roles";
import type { PublicGameState } from "@/lib/types";

export function GameOverScreen({
  state,
  onReturn,
}: {
  state: PublicGameState;
  onReturn: () => void;
}) {
  const won =
    (state.winner === "town" && state.you?.faction === "town") ||
    (state.winner === "mafia" && state.you?.faction === "mafia");

  useEffect(() => {
    if (!won) return;
    const t = setTimeout(() => {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#e61919", "#ffb4aa", "#dae3f1"],
      });
    }, 200);
    return () => clearTimeout(t);
  }, [won]);

  return (
    <div className="mx-auto max-w-3xl py-10">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-crimson-glow">
        {won ? "Victory" : "Defeat"}
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold">
        {state.winner === "town" ? "The Town holds" : "The Mafia owns the night"}
      </h1>
      <p className="mt-3 text-ink-steel">Match recap — every dossier unsealed.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {(state.recap ?? state.players).map((p) => (
          <GlassPanel key={p.id} className="flex items-center gap-3 p-3">
            <div className="overflow-hidden rounded-[4px]">
              <PlayerAvatar id={p.avatarId} size={56} />
            </div>
            <div>
              <p className="font-display font-semibold">{p.name}</p>
              <StatusChip tone={p.role && ROLE_META[p.role].faction === "mafia" ? "mafia" : "town"}>
                {p.role ? ROLE_META[p.role].label : "—"}
              </StatusChip>
            </div>
          </GlassPanel>
        ))}
      </div>
      {state.you?.isHost && (
        <PrimaryButton className="mt-8" onClick={onReturn}>
          Return to Lobby
        </PrimaryButton>
      )}
    </div>
  );
}
