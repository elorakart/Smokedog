"use client";

import { UserPlus } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import type { PublicGameState, RoomSettings } from "@/lib/types";

export function LobbyView({
  state,
  onReady,
  onStart,
  onSettings,
  onKick,
}: {
  state: PublicGameState;
  onReady: (ready: boolean) => void;
  onStart: () => void;
  onSettings: (settings: Partial<RoomSettings>) => void;
  onKick: (playerId: string) => void;
}) {
  const you = state.you;
  const host = you?.isHost;
  const slots = Math.max(8, state.players.length);
  const canStart = host && state.players.length >= 4;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">
          Secure Channel
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">Mafia City</h1>
        <p className="mt-2 text-ink-steel">
          Assemble your crew. Four operators minimum. Trust is optional.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: slots }, (_, i) => {
            const p = state.players[i];
            if (!p) {
              return (
                <GlassPanel
                  key={`empty-${i}`}
                  className="flex aspect-square flex-col items-center justify-center text-ink-steel"
                >
                  <UserPlus size={22} />
                  <span className="mt-2 font-mono text-[10px] uppercase">Awaiting</span>
                </GlassPanel>
              );
            }
            return (
              <GlassPanel key={p.id} className="p-3">
                <div className="overflow-hidden rounded-[4px]">
                  <PlayerAvatar id={p.avatarId} size={200} className="h-auto w-full" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <p className="truncate font-display text-sm font-semibold">{p.name}</p>
                  {p.isHost && <StatusChip>Host</StatusChip>}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <StatusChip tone={p.ready ? "live" : "neutral"}>
                    {p.ready ? "Ready" : "Idle"}
                  </StatusChip>
                  {host && !p.isHost && (
                    <button
                      type="button"
                      onClick={() => onKick(p.id)}
                      className="font-mono text-[10px] uppercase text-crimson-glow"
                    >
                      Kick
                    </button>
                  )}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </div>

      <GlassPanel className="h-fit p-6">
        <h2 className="font-display text-lg font-bold">Game Settings</h2>
        <label className="mt-6 block font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Night timer — {state.settings.nightSeconds}s
        </label>
        <input
          type="range"
          min={15}
          max={90}
          disabled={!host}
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
          disabled={!host}
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
              disabled={!host}
              onClick={() => onSettings({ vigilanteBullets: n })}
              className={`flex-1 rounded-sm py-2 font-mono text-xs ${
                state.settings.vigilanteBullets === n
                  ? "bg-crimson text-white"
                  : "bg-surface-high text-ink-steel"
              }`}
            >
              {n == null ? "Auto" : n}
            </button>
          ))}
        </div>
        <p className="mt-4 font-mono text-[10px] leading-relaxed tracking-wide text-ink-steel">
          {state.players.length}/12 seated · Auto roles scale with lobby size
        </p>
        {you && (
          <button
            type="button"
            onClick={() => onReady(!state.players.find((p) => p.id === you.id)?.ready)}
            className="mt-4 w-full rounded-sm border border-white/10 py-2 font-mono text-xs uppercase tracking-widest"
          >
            {state.players.find((p) => p.id === you.id)?.ready ? "Unready" : "Ready up"}
          </button>
        )}
        <PrimaryButton className="mt-3 w-full" disabled={!canStart} onClick={onStart}>
          Start Game
        </PrimaryButton>
        {!canStart && host && (
          <p className="mt-2 text-center font-mono text-[10px] text-ink-steel">
            Need at least 4 players
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
