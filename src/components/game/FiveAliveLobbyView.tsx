"use client";

import { motion } from "framer-motion";
import { Clock, Shield, UserPlus } from "lucide-react";
import type { PublicGameState, RoomSettings } from "@/lib/types";
import { PrimaryButton, GlassPanel, StatusChip } from "@/components/ui/primitives";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { fadeUp, stagger } from "@/components/ui/motion";

export function FiveAliveLobbyView({
  state,
  onStart,
  onSettings,
  onKick,
}: {
  state: PublicGameState;
  onStart: () => void;
  onSettings: (settings: Partial<RoomSettings>) => void;
  onKick: (playerId: string) => void;
  onAddBot: (fillTo?: number) => void;
  onRemoveBot: () => void;
}) {
  const you = state.you;
  const host = !!you?.isHost;
  const canStart = host && state.players.length >= 2;

  const slots = Math.max(6, state.players.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">
          Secure Channel
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">5 Alive</h1>
        <p className="mt-2 text-ink-steel">
          Keep the running total at or below 21. If you bust, you lose a life.
        </p>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {Array.from({ length: slots }, (_, i) => {
            const p = state.players[i];
            if (!p) {
              return (
                <motion.div key={`empty-${i}`} variants={fadeUp}>
                  <GlassPanel className="flex aspect-square flex-col items-center justify-center text-ink-steel">
                    <UserPlus size={22} />
                    <span className="mt-2 font-mono text-[10px] uppercase">
                      Awaiting
                    </span>
                  </GlassPanel>
                </motion.div>
              );
            }
            return (
              <motion.div key={p.id} variants={fadeUp} layout>
                <GlassPanel className="p-3 transition hover:-translate-y-1 hover:shadow-spotlight">
                  <div className="mx-auto w-fit overflow-hidden rounded-full ring-1 ring-white/10">
                    <PlayerAvatar id={p.avatarId} size={200} className="h-auto w-full" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                    {p.isHost && <StatusChip>Host</StatusChip>}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusChip tone={p.connected ? "live" : "neutral"}>
                      {p.connected ? "Online" : "Away"}
                    </StatusChip>
                    {p.isBot && <StatusChip tone="bot">Auto</StatusChip>}
                  </div>
                  {host && !p.isHost && (
                    <button
                      type="button"
                      onClick={() => onKick(p.id)}
                      className="mt-2 font-mono text-[10px] uppercase text-crimson-glow"
                    >
                      Kick
                    </button>
                  )}
                </GlassPanel>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <GlassPanel className="h-fit p-6">
        <h2 className="font-display text-lg font-bold">Game Settings</h2>

        <div className="mt-4">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-steel">
            Turn timer — {state.settings.daySeconds}s
          </label>
          <div className="mt-2 flex items-center gap-2">
            <Clock size={14} className="text-ink-steel" />
            <input
              type="range"
              min={10}
              max={120}
              value={state.settings.daySeconds}
              onChange={(e) =>
                onSettings({ daySeconds: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-4 rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
            <Shield size={14} />
            Lives are tracked per player (5 each).
          </div>
          <p className="mt-2 text-sm text-ink-steel">
            You can start with 2–6 players. Auto players are not yet implemented for 5 Alive.
          </p>
        </div>

        <PrimaryButton className="mt-6 w-full" disabled={!canStart} onClick={onStart}>
          Start Game
        </PrimaryButton>
        {!canStart && (
          <p className="mt-2 text-center font-mono text-[10px] text-ink-steel">
            Need at least 2 operators to begin.
          </p>
        )}
      </GlassPanel>
    </div>
  );
}

