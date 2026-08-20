"use client";

import { GlassPanel, PrimaryButton } from "@/components/ui/primitives";

export function AfkHostModal({
  name,
  onKick,
  onPause,
  onDismiss,
}: {
  name: string;
  onKick: () => void;
  onPause: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-[20px]">
      <GlassPanel className="w-full max-w-md p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">
          AFK warning
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">{name} is idle</h2>
        <p className="mt-3 text-sm text-ink-steel">
          Auto-actions fired twice. Kick them from the city or pause the game.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <PrimaryButton onClick={onKick}>Kick Player</PrimaryButton>
          <button
            type="button"
            onClick={onPause}
            className="rounded-sm border border-crimson/20 py-3 font-mono text-xs uppercase tracking-widest"
          >
            Pause Game
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="py-2 font-mono text-[10px] uppercase text-ink-steel"
          >
            Dismiss
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
