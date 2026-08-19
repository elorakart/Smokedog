"use client";

import { GlassPanel } from "@/components/ui/primitives";

export function GameRulesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-[20px]"
      data-lenis-prevent
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
      <GlassPanel className="max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-crimson-glow">
          Field manual
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">Mafia City — how it works</h2>

        <div className="mt-6 space-y-4 text-sm text-ink-steel">
          <section>
            <h3 className="font-display text-base font-semibold text-ink">The setup</h3>
            <p className="mt-1">
              4–12 players get secret roles. Most are Town — they want to find and
              lynch the Mafia. Mafia want to outnumber Town without getting caught.
            </p>
          </section>
          <section>
            <h3 className="font-display text-base font-semibold text-ink">Night</h3>
            <p className="mt-1">
              Special roles act in secret. Mafia pick a target. Doctor and Bodyguard
              protect people. Detective investigates alignments. Vigilante can shoot.
              Blackmailer silences someone for the next day.
            </p>
          </section>
          <section>
            <h3 className="font-display text-base font-semibold text-ink">Day</h3>
            <p className="mt-1">
              Discuss first, then vote in the final 15 seconds. Majority lynches a
              suspect — or vote skip to spare everyone. Miss your vote twice and you
              die from AFK.
            </p>
          </section>
          <section>
            <h3 className="font-display text-base font-semibold text-ink">Voice & chat</h3>
            <p className="mt-1">
              Town chat and voice open during day discussion. Mafia get a private
              channel at night only. Dead players use the graveyard.
            </p>
          </section>
          <section>
            <h3 className="font-display text-base font-semibold text-ink">Winning</h3>
            <p className="mt-1">
              Town wins when all Mafia are eliminated. Mafia win when they strictly
              outnumber the remaining Town.
            </p>
          </section>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-sm border border-white/10 py-3 font-mono text-xs uppercase tracking-widest"
        >
          Close
        </button>
      </GlassPanel>
      </div>
    </div>
  );
}
