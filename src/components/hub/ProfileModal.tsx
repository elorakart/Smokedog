"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton } from "@/components/ui/primitives";
import { AVATAR_COUNT } from "@/lib/profile";
import { validateRoomCode } from "@/lib/room-code";

import { gameLabel } from "@/lib/games/labels";

export function ProfileModal({
  open,
  defaultName,
  defaultAvatar,
  createGameId,
  error,
  initialCode,
  initialMode,
  pending = null,
  onClose,
  onCreate,
  onJoin,
}: {
  open: boolean;
  defaultName: string;
  defaultAvatar: number;
  createGameId?: string;
  error?: string | null;
  initialCode?: string;
  initialMode?: "create" | "join";
  pending?: "create" | "join" | null;
  onClose: () => void;
  onCreate: (name: string, avatarId: number) => void;
  onJoin: (name: string, avatarId: number, code: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [avatarId, setAvatarId] = useState(defaultAvatar);
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">(initialMode ?? "create");
  const [localError, setLocalError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setAvatarId(defaultAvatar);
      setLocalError(null);
      if (initialCode) setCode(initialCode);
      if (initialMode) setMode(initialMode);
    }
  }, [open, defaultName, defaultAvatar, initialCode, initialMode]);

  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  const displayError = localError || error;
  const ready = name.trim().length >= 2;
  const isPending = pending !== null;
  const pendingLabel =
    pending === "create" ? "Creating party…" : pending === "join" ? "Joining party…" : null;

  const submitJoin = () => {
    if (isPending) return;
    const check = validateRoomCode(code);
    if (!check.ok) {
      setLocalError(check.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLocalError(null);
    onJoin(name.trim(), avatarId, check.code);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-[20px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: shake ? [0, -10, 10, -8, 8, -4, 4, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <GlassPanel variant="paper" className="relative p-8">
              <button
                onClick={onClose}
                disabled={isPending}
                className="absolute right-4 top-4 text-crimson/50 hover:text-crimson disabled:opacity-40"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-crimson">
                Intake form
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-crimson">
                {mode === "create" && createGameId
                  ? `Open ${gameLabel(createGameId)}`
                  : "Stamp your name"}
              </h2>
              {mode === "create" && createGameId && (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-crimson/50">
                  Game: {gameLabel(createGameId)}
                </p>
              )}
              <label className="mt-6 block font-mono text-[10px] uppercase tracking-widest text-crimson/50">
                Operator name
              </label>
              <input
                value={name}
                maxLength={18}
                disabled={isPending}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your alias"
                className="mt-2 w-full border-b border-dashed border-crimson/40 bg-transparent px-1 py-3 text-crimson outline-none focus:border-crimson"
              />
              <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-crimson/50">
                Mugshot
              </p>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: AVATAR_COUNT }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isPending}
                    onClick={() => setAvatarId(i)}
                    className={`overflow-hidden rounded-sm ring-2 transition hover:scale-105 ${
                      avatarId === i
                        ? "ring-crimson shadow-stamp"
                        : "ring-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <PlayerAvatar id={i} size={48} />
                  </button>
                ))}
              </div>

              <div className="mt-8 flex gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setMode("create");
                    setLocalError(null);
                  }}
                  className={`flex-1 rounded-sm py-2 font-mono text-xs uppercase tracking-wider transition ${
                    mode === "create"
                      ? "bg-crimson text-manila"
                      : "border border-crimson/20 text-crimson/60 hover:text-crimson"
                  }`}
                >
                  Open a room
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setMode("join");
                    setLocalError(null);
                  }}
                  className={`flex-1 rounded-sm py-2 font-mono text-xs uppercase tracking-wider transition ${
                    mode === "join"
                      ? "bg-crimson text-manila"
                      : "border border-crimson/20 text-crimson/60 hover:text-crimson"
                  }`}
                >
                  Join with code
                </button>
              </div>

              {mode === "join" && (
                <input
                  value={code}
                  maxLength={6}
                  disabled={isPending}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setLocalError(null);
                  }}
                  placeholder="ROOM CODE"
                  className={`mt-4 w-full border-b border-dashed bg-transparent px-1 py-3 text-center font-mono text-lg tracking-[0.4em] text-crimson outline-none ${
                    displayError ? "border-crimson" : "border-crimson/40"
                  }`}
                />
              )}

              <AnimatePresence>
                {isPending && pendingLabel && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest text-crimson/50"
                  >
                    <LoadingSpinner size={14} />
                    {pendingLabel}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {displayError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 flex items-start gap-2 font-mono text-xs text-crimson"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    {displayError}
                  </motion.p>
                )}
              </AnimatePresence>

              <PrimaryButton
                className="mt-6 w-full"
                loading={isPending}
                disabled={mode === "create" ? !ready : !name.trim()}
                onClick={() => {
                  if (isPending) return;
                  if (mode === "create") onCreate(name.trim(), avatarId);
                  else submitJoin();
                }}
              >
                {isPending
                  ? pendingLabel ?? "Processing…"
                  : mode === "create"
                    ? "Open a room"
                    : "Join with code"}
              </PrimaryButton>
            </GlassPanel>          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
