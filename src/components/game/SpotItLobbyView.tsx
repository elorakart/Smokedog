"use client";

import { motion } from "framer-motion";
import { Shield, UserMinus, UserPlus } from "lucide-react";
import type { PublicGameState } from "@/lib/types";
import { PrimaryButton, GlassPanel, StatusChip } from "@/components/ui/primitives";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { fadeUp, stagger } from "@/components/ui/motion";

export function SpotItLobbyView({
  state,
  onStart,
  starting = false,
  onKick,
  onAddBot,
  onRemoveBot,
}: {
  state: PublicGameState;
  onStart: () => void;
  starting?: boolean;
  onKick: (id: string) => void;
  onAddBot: (fillTo?: number) => void;
  onRemoveBot: () => void;
}) {
  const host = !!state.you?.isHost;
  const full = state.players.length >= 8;
  const canStart = state.players.length >= 2;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="mx-auto max-w-4xl">
      <motion.div variants={fadeUp}>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow">
          Lobby
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">Spot It</h1>
        <p className="mt-2 text-ink-steel">
          Race to spot the one matching symbol. First valid click claims the
          center card.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
      >
        {state.players.map((p) => (
          <GlassPanel key={p.id} className="flex min-w-0 flex-col p-3">
            <div className="relative mx-auto aspect-square w-full max-w-[5.5rem] overflow-hidden rounded-full ring-1 ring-white/10">
              <PlayerAvatar id={p.avatarId} size={96} className="h-full w-full" />
            </div>
            <p className="mt-2 truncate text-center font-display text-sm font-semibold">
              {p.name}
            </p>
            <div className="mt-1 flex justify-center gap-1">
              {p.isHost && <StatusChip>Host</StatusChip>}
              {p.isBot ? (
                <StatusChip tone="bot">Auto</StatusChip>
              ) : (
                <StatusChip tone="live">Online</StatusChip>
              )}
            </div>
            {host && !p.isHost && (
              <button
                type="button"
                onClick={() => onKick(p.id)}
                className="mt-2 font-mono text-[10px] uppercase text-crimson-glow"
              >
                {p.isBot ? "Remove" : "Kick"}
              </button>
            )}
          </GlassPanel>
        ))}
      </motion.div>

      {host && (
        <motion.div variants={fadeUp} className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={full}
              onClick={() => onAddBot()}
              className="inline-flex items-center justify-center gap-1 rounded-sm border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
            >
              <UserPlus size={12} /> Add bot
            </button>
            <button
              type="button"
              disabled={state.autoPlayerCount === 0}
              onClick={onRemoveBot}
              className="inline-flex items-center justify-center gap-1 rounded-sm border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
            >
              <UserMinus size={12} /> Remove bot
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([2, 4, 6] as const).map((n) => (
              <button
                key={n}
                type="button"
                disabled={state.players.length >= n}
                onClick={() => onAddBot(n)}
                className="rounded-sm border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest disabled:opacity-40"
              >
                Fill {n}
              </button>
            ))}
          </div>
          <PrimaryButton
            className="w-full"
            disabled={!canStart || starting}
            loading={starting}
            onClick={onStart}
          >
            <Shield size={14} /> Start Spot It
          </PrimaryButton>
        </motion.div>
      )}
    </motion.div>
  );
}
