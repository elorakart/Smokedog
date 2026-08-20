"use client";

import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { ROLE_META } from "@/lib/games/mafia-city/roles";
import type { PublicGameState } from "@/lib/types";

export function GameOverScreen({
  state,
  onReturn,
  returning = false,
}: {
  state: PublicGameState;
  onReturn: () => void;
  returning?: boolean;
}) {
  const isFiveAlive = state.gameId === "five-alive";
  const isBoard =
    state.gameId === "spot-it" ||
    state.gameId === "tic-tac-toe" ||
    state.gameId === "connect-4";
  const fiveAliveWinner =
    state.players.find((p) => (p.lives ?? 0) > 0) ?? state.players[0];
  const youWonFiveAlive =
    !!fiveAliveWinner && !!state.you && state.you.id === fiveAliveWinner.id;

  const boardWinner = state.players.find((p) => p.id === state.boardWinnerId);
  const youWonBoard =
    !!state.you &&
    (state.boardDraw
      ? false
      : state.boardWinnerId === state.you.id);

  const wonMafia =
    (state.winner === "town" && state.you?.faction === "town") ||
    (state.winner === "mafia" && state.you?.faction === "mafia");

  const won = isFiveAlive
    ? youWonFiveAlive
    : isBoard
      ? youWonBoard || !!state.boardDraw
      : wonMafia;
  const [chronicleOpen, setChronicleOpen] = useState(true);
  const chronicle = state.chronicle ?? [];

  useEffect(() => {
    if (!won) return;
    const t = setTimeout(() => {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#8B1E1E", "#E8DCC8"],
      });
    }, 200);
    return () => clearTimeout(t);
  }, [won]);

  if (isFiveAlive) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-crimson-glow">
          {youWonFiveAlive ? "Victory" : "Defeat"}
        </p>
        <h1 className="mt-2 font-display text-5xl font-extrabold">
          {youWonFiveAlive ? "You survived!" : `${fiveAliveWinner?.name ?? "Someone"} wins`}
        </h1>
        <p className="mt-3 text-ink-steel">Match recap — remaining lives.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(state.recap ?? state.players).map((p) => (
            <GlassPanel key={p.id} className="flex items-center gap-3 p-3">
              <div className="overflow-hidden rounded-full ring-1 ring-crimson/25">
                <PlayerAvatar id={p.avatarId} size={56} />
              </div>
              <div>
                <p className="font-display font-semibold">{p.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <StatusChip tone={(p.lives ?? 0) > 0 ? "live" : "neutral"}>
                    {(p.lives ?? 0) > 0 ? `${p.lives} lives` : "Eliminated"}
                  </StatusChip>
                  {p.isBot && <StatusChip tone="bot">Auto</StatusChip>}
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>

        {state.you?.isHost && (
          <PrimaryButton
            className="mt-8"
            loading={returning}
            disabled={returning}
            onClick={onReturn}
          >
            {returning ? "Returning…" : "Return to Lobby"}
          </PrimaryButton>
        )}
      </div>
    );
  }

  if (isBoard) {
    const title = state.boardDraw
      ? "Draw"
      : `${boardWinner?.name ?? "Someone"} wins`;
    const subtitle =
      state.gameId === "spot-it"
        ? "Most cards claimed."
        : "Match complete.";
    return (
      <div className="mx-auto max-w-3xl py-10">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-crimson-glow">
          {state.boardDraw ? "Draw" : youWonBoard ? "Victory" : "Defeat"}
        </p>
        <h1 className="mt-2 font-display text-5xl font-extrabold">{title}</h1>
        <p className="mt-3 text-ink-steel">{subtitle}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(state.recap ?? state.players).map((p) => (
            <GlassPanel key={p.id} className="flex items-center gap-3 p-3">
              <div className="overflow-hidden rounded-full ring-1 ring-crimson/25">
                <PlayerAvatar id={p.avatarId} size={56} />
              </div>
              <div>
                <p className="font-display font-semibold">{p.name}</p>
                {state.spotIt && (
                  <p className="mt-1 font-mono text-xs text-crimson-glow">
                    {state.spotIt.scores.find((s) => s.playerId === p.id)?.score ??
                      0}{" "}
                    cards
                  </p>
                )}
                {p.isBot && <StatusChip tone="bot">Auto</StatusChip>}
              </div>
            </GlassPanel>
          ))}
        </div>
        {state.you?.isHost && (
          <PrimaryButton
            className="mt-8"
            loading={returning}
            disabled={returning}
            onClick={onReturn}
          >
            {returning ? "Returning…" : "Return to Lobby"}
          </PrimaryButton>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-crimson-glow">
        Debrief
      </p>
      <h1 className="mt-2 font-display text-5xl font-bold">
        {state.winner === "town"
          ? "The Town holds"
          : "The Mafia owns the night"}
      </h1>
      <p className="mt-3 text-ink-steel">
        {won ? "Victory stamped." : "Defeat filed."} Every dossier unsealed.
      </p>

      {chronicle.length > 0 && (
        <GlassPanel className="mt-6 overflow-hidden border-manila/25 bg-manila/5">
          <button
            type="button"
            onClick={() => setChronicleOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-crimson-glow">
              City chronicle ({chronicle.length} entries)
            </span>
            {chronicleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {chronicleOpen && (
            <ul className="border-t border-manila/15 px-4 py-3 font-mono text-xs leading-relaxed text-ink">
              {chronicle.map((entry) => (
                <li
                  key={entry.id}
                  className="border-b border-manila/10 py-2.5 last:border-0"
                >
                  <span className="uppercase tracking-wider text-crimson-glow">
                    {entry.phase === "night" ? "Night" : "Day"} {entry.cycle}
                  </span>
                  <p className="mt-0.5 text-ink/80">{entry.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {(state.recap ?? state.players).map((p) => (
          <GlassPanel key={p.id} className="flex items-center gap-3 p-3">
            <div className="overflow-hidden rounded-sm ring-1 ring-manila/20">
              <PlayerAvatar id={p.avatarId} size={56} />
            </div>
            <div>
              <p className="font-display font-semibold">{p.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatusChip
                  tone={p.role && ROLE_META[p.role].faction === "mafia" ? "mafia" : "town"}
                >
                  {p.role ? ROLE_META[p.role].label : "—"}
                </StatusChip>
                {p.isBot && <StatusChip tone="bot">Auto</StatusChip>}
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
      {state.you?.isHost && (
        <PrimaryButton
          className="mt-8"
          loading={returning}
          disabled={returning}
          onClick={onReturn}
        >
          {returning ? "Returning…" : "Return to Lobby"}
        </PrimaryButton>
      )}
    </div>
  );
}
