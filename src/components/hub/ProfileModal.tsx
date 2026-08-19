"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton } from "@/components/ui/primitives";
import { AVATAR_COUNT } from "@/lib/profile";

export function ProfileModal({
  open,
  defaultName,
  defaultAvatar,
  onClose,
  onCreate,
  onJoin,
}: {
  open: boolean;
  defaultName: string;
  defaultAvatar: number;
  onClose: () => void;
  onCreate: (name: string, avatarId: number) => void;
  onJoin: (name: string, avatarId: number, code: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [avatarId, setAvatarId] = useState(defaultAvatar);
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  if (!open) return null;

  const ready = name.trim().length >= 2;
  const joinReady = ready && code.trim().length === 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-[20px]">
      <GlassPanel className="relative w-full max-w-lg p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-steel hover:text-ink"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-glow">
          Operator Dossier
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold">Enter the city</h2>
        <label className="mt-6 block font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Display name
        </label>
        <input
          value={name}
          maxLength={18}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your alias"
          className="mt-2 w-full rounded-sm border-b border-crimson/60 bg-void px-3 py-3 text-ink outline-none focus:border-crimson"
        />
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink-steel">
          Mugshot
        </p>
        <div className="mt-3 grid grid-cols-8 gap-2">
          {Array.from({ length: AVATAR_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAvatarId(i)}
              className={`overflow-hidden rounded-[4px] ring-2 transition ${
                avatarId === i ? "ring-crimson shadow-glow" : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <PlayerAvatar id={i} size={48} />
            </button>
          ))}
        </div>

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 rounded-sm py-2 font-mono text-xs uppercase tracking-wider ${
              mode === "create" ? "bg-crimson text-white" : "bg-surface-high text-ink-steel"
            }`}
          >
            Create Party
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 rounded-sm py-2 font-mono text-xs uppercase tracking-wider ${
              mode === "join" ? "bg-crimson text-white" : "bg-surface-high text-ink-steel"
            }`}
          >
            Join Party
          </button>
        </div>

        {mode === "join" && (
          <input
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            className="mt-4 w-full rounded-sm border-b border-crimson/60 bg-void px-3 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none"
          />
        )}

        <PrimaryButton
          className="mt-6 w-full"
          disabled={mode === "create" ? !ready : !joinReady}
          onClick={() => {
            if (mode === "create") onCreate(name.trim(), avatarId);
            else onJoin(name.trim(), avatarId, code.trim().toUpperCase());
          }}
        >
          {mode === "create" ? "Create Party" : "Join Party"}
        </PrimaryButton>
      </GlassPanel>
    </div>
  );
}
