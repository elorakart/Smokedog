"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import type { RoomSettings } from "@/lib/types";

export function MidGameSettings({
  settings,
  onUpdate,
}: {
  settings: RoomSettings;
  onUpdate: (patch: Partial<RoomSettings>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-sm border border-crimson/20 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-steel sm:px-3 sm:py-2"
      >
        <Settings size={12} /> Timers
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-sm border border-crimson/20 bg-surface p-4 shadow-lg">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
            Mid-game timers
          </p>
          <label className="mt-3 block font-mono text-[10px] uppercase text-ink-steel">
            Night — {settings.nightSeconds}s
          </label>
          <input
            type="range"
            min={15}
            max={120}
            value={settings.nightSeconds}
            onChange={(e) =>
              onUpdate({ nightSeconds: Number(e.target.value) })
            }
            className="mt-1 w-full"
          />
          <label className="mt-3 block font-mono text-[10px] uppercase text-ink-steel">
            Day — {settings.daySeconds}s
          </label>
          <input
            type="range"
            min={20}
            max={200}
            value={settings.daySeconds}
            onChange={(e) => onUpdate({ daySeconds: Number(e.target.value) })}
            className="mt-1 w-full"
          />
          <p className="mt-2 text-xs text-ink-steel">
            Role distribution cannot change mid-game.
          </p>
        </div>
      )}
    </div>
  );
}
