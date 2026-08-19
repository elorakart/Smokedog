"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { popIn, stagger } from "@/components/ui/motion";
import type { PublicGameState, RoomSettings } from "@/lib/types";

function AutoPlayerControls({
  state,
  onAddBot,
  onRemoveBot,
}: {
  state: PublicGameState;
  onAddBot: (fillTo?: number) => void;
  onRemoveBot: () => void;
}) {
  const full = state.players.length >= 12;
  const autoCount = state.autoPlayerCount;

  return (
    <div className="mt-4 rounded-sm border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Auto operatives
        </p>
        {autoCount > 0 && (
          <StatusChip tone="bot">{autoCount} active</StatusChip>
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-steel">
        Fill empty seats with AI players that vote and act on timers. Only you can
        tell them apart from real operators.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onAddBot()}
          disabled={full}
          className="inline-flex items-center justify-center gap-1 rounded-sm border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest transition hover:border-crimson/50 hover:text-crimson-glow disabled:opacity-40"
        >
          <UserPlus size={12} /> Add one
        </button>
        <button
          type="button"
          onClick={onRemoveBot}
          disabled={autoCount === 0}
          className="inline-flex items-center justify-center gap-1 rounded-sm border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest transition hover:border-crimson/50 hover:text-crimson-glow disabled:opacity-40"
        >
          <UserMinus size={12} /> Remove one
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([4, 6, 8, 12] as const).map((target) => (
          <button
            key={target}
            type="button"
            onClick={() => onAddBot(target)}
            disabled={state.players.length >= target}
            className="rounded-sm border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest transition hover:border-crimson/50 hover:text-crimson-glow disabled:opacity-40"
          >
            Fill {target}
          </button>
        ))}
      </div>
    </div>
  );
}

function LobbySidebar({
  state,
  host,
  onStart,
  onSettings,
  onAddBot,
  onRemoveBot,
}: {
  state: PublicGameState;
  host: boolean;
  onStart: () => void;
  onSettings: (settings: Partial<RoomSettings>) => void;
  onAddBot: (fillTo?: number) => void;
  onRemoveBot: () => void;
}) {
  const canStart = host && state.players.length >= 4;

  if (!host) {
    return (
      <GlassPanel className="h-fit p-6">
        <h2 className="font-display text-lg font-bold">Waiting room</h2>
        <p className="mt-2 text-sm text-ink-steel">
          You&apos;re in. The host will start when everyone is seated.
        </p>
        <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-wide text-ink-steel">
          {state.players.length}/12 operators seated
        </p>
        <div className="mt-6 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
            Awaiting host
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="h-fit p-6">
      <h2 className="font-display text-lg font-bold">Game Settings</h2>
      <AutoPlayerControls
        state={state}
        onAddBot={onAddBot}
        onRemoveBot={onRemoveBot}
      />
      <label className="mt-6 block font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        Night timer — {state.settings.nightSeconds}s
      </label>
      <input
        type="range"
        min={15}
        max={90}
        value={state.settings.nightSeconds}
        onChange={(e) => onSettings({ nightSeconds: Number(e.target.value) })}
        className="mt-2 w-full"
      />
      <label className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        Day timer — {state.settings.daySeconds}s
      </label>
      <input
        type="range"
        min={20}
        max={180}
        value={state.settings.daySeconds}
        onChange={(e) => onSettings({ daySeconds: Number(e.target.value) })}
        className="mt-2 w-full"
      />
      <label className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        Vigilante bullets
      </label>
      <div className="mt-2 flex gap-2">
        {[null, 1, 2, 3].map((n) => (
          <button
            key={String(n)}
            type="button"
            onClick={() => onSettings({ vigilanteBullets: n })}
            className={`flex-1 rounded-sm py-2 font-mono text-xs transition ${
              state.settings.vigilanteBullets === n
                ? "bg-crimson text-white"
                : "bg-surface-high text-ink-steel hover:text-ink"
            }`}
          >
            {n == null ? "Auto" : n}
          </button>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-wide text-ink-steel">
        {state.players.length}/12 seated · Roles scale with lobby size
      </p>
      <PrimaryButton className="mt-6 w-full" disabled={!canStart} onClick={onStart}>
        Start Game
      </PrimaryButton>
      {!canStart && (
        <p className="mt-2 text-center font-mono text-[10px] text-ink-steel">
          Need at least 4 operators — add auto players to fill the table
        </p>
      )}
    </GlassPanel>
  );
}

export function LobbyView({
  state,
  onStart,
  onSettings,
  onKick,
  onAddBot,
  onRemoveBot,
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
  const slots = Math.max(8, state.players.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">
          Secure Channel
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">Mafia City</h1>
        <p className="mt-2 text-ink-steel">
          Assemble your crew. Four operators minimum — the host can seat auto
          players if you&apos;re flying solo.
        </p>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {Array.from({ length: slots }, (_, i) => {
            const p = state.players[i];
            if (!p) {
              return (
                <motion.div key={`empty-${i}`} variants={popIn}>
                  <GlassPanel className="flex aspect-square flex-col items-center justify-center text-ink-steel">
                    <UserPlus size={22} />
                    <span className="mt-2 font-mono text-[10px] uppercase">Awaiting</span>
                  </GlassPanel>
                </motion.div>
              );
            }
            return (
              <motion.div key={p.id} variants={popIn} layout>
                <GlassPanel className="p-3 transition hover:-translate-y-1 hover:shadow-spotlight">
                  <div className="mx-auto w-fit overflow-hidden rounded-full ring-1 ring-white/10">
                    <PlayerAvatar id={p.avatarId} size={200} className="h-auto w-full" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                    {p.isHost && <StatusChip>Host</StatusChip>}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    {p.isBot ? (
                      <StatusChip tone="bot">Auto</StatusChip>
                    ) : (
                      <StatusChip tone={p.connected ? "live" : "neutral"}>
                        {p.connected ? "Online" : "Away"}
                      </StatusChip>
                    )}
                    {host && !p.isHost && (
                      <button
                        type="button"
                        onClick={() => onKick(p.id)}
                        className="font-mono text-[10px] uppercase text-crimson-glow"
                      >
                        {p.isBot ? "Remove" : "Kick"}
                      </button>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <LobbySidebar
        state={state}
        host={host}
        onStart={onStart}
        onSettings={onSettings}
        onAddBot={onAddBot}
        onRemoveBot={onRemoveBot}
      />
    </div>
  );
}
