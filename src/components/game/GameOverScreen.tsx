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
    const winnerId = state.boardWinnerId ?? state.connect4?.winnerId ?? null;
    const boardWinner =
      state.players.find((p) => p.id === winnerId) ??
      state.players.find((p) => p.id === state.boardWinnerId);
    const title = state.boardDraw
      ? "Draw"
      : `${boardWinner?.name ?? "Someone"} wins`;
    const subtitle =
      state.gameId === "spot-it"
        ? "Most cards claimed."
        : state.gameId === "connect-4"
          ? "Four in a row."
          : "Match complete.";
    const youWon =
      !!state.you &&
      (state.boardDraw ? false : winnerId === state.you.id);

    return (
      <div className="mx-auto w-full max-w-3xl px-1 py-6 sm:py-10">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-crimson">
          {state.boardDraw ? "Draw" : youWon ? "Victory" : "Defeat"}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-crimson sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-crimson/70">{subtitle}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(state.recap ?? state.players).map((p) => (
            <GlassPanel key={p.id} className="flex items-center gap-3 p-3">
              <div className="overflow-hidden rounded-sm ring-1 ring-crimson/25">
                <PlayerAvatar id={p.avatarId} size={56} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-crimson">
                  {p.name}
                </p>
                {state.spotIt && (
                  <p className="mt-1 font-mono text-xs text-crimson">
                    {state.spotIt.scores.find((s) => s.playerId === p.id)?.score ??
                      0}{" "}
                    cards
                  </p>
                )}
                {state.connect4?.colors?.[p.id] && (
                  <p className="mt-1 font-mono text-xs text-crimson">
                    {state.connect4.colors[p.id] === "R" ? "Red" : "Yellow"}
                    {winnerId === p.id ? " · Winner" : ""}
                  </p>
                )}
                {state.ttt?.marks?.[p.id] && (
                  <p className="mt-1 font-mono text-xs text-crimson">
                    Mark {state.ttt.marks[p.id]}
                    {winnerId === p.id ? " · Winner" : ""}
                  </p>
                )}
                {p.isBot && <StatusChip tone="bot">Auto</StatusChip>}
              </div>
            </GlassPanel>
          ))}
        </div>
        {state.you?.isHost ? (
          <PrimaryButton
            className="mt-8 w-full sm:w-auto"
            loading={returning}
            disabled={returning}
            onClick={onReturn}
          >
            {returning ? "Returning…" : "Return to Lobby"}
          </PrimaryButton>
        ) : (
          <p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-crimson/50">
            Waiting for host to return to lobby…
          </p>
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
        <div className="mt-6 overflow-hidden rounded-sm border-2 border-crimson bg-manila text-crimson shadow-stamp">
          <button
            type="button"
            onClick={() => setChronicleOpen((v) => !v)}
            className="flex w-full items-center justify-between border-b-2 border-crimson bg-crimson px-4 py-3 text-left text-manila"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
              City chronicle · {chronicle.length} entries
            </span>
            {chronicleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {chronicleOpen && (
            <ul className="divide-y divide-crimson/25">
              {chronicle.map((entry, i) => {
                const prev = chronicle[i - 1];
                const phaseBreak =
                  !!prev &&
                  (prev.cycle !== entry.cycle || prev.phase !== entry.phase);
                return (
                  <li
                    key={entry.id}
                    className={`relative px-4 py-3 ${
                      i % 2 === 0 ? "bg-manila" : "bg-crimson/[0.07]"
                    } ${phaseBreak ? "border-t-2 border-t-crimson/40" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 border border-crimson/40 bg-manila px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-crimson">
                        {entry.phase === "night" ? "Night" : "Day"} {entry.cycle}
                      </span>
                      <p className="min-w-0 flex-1 font-mono text-xs leading-relaxed text-crimson/85">
                        {entry.summary}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
