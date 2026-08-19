"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, Users } from "lucide-react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { fadeUp } from "@/components/ui/motion";
import { getSocket } from "@/lib/socket/client";
import { ensurePlayerId, loadProfile } from "@/lib/profile";
import type { OpenLobby } from "@/lib/types";

export function OpenLobbies({
  onJoin,
  onNeedProfile,
}: {
  onJoin: (code: string) => void;
  onNeedProfile: (code?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [lobbies, setLobbies] = useState<OpenLobby[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playerId = ensurePlayerId();
    const socket = getSocket(playerId);
    const onList = ({ lobbies: next }: { lobbies: OpenLobby[] }) => {
      setLobbies(next);
      setLoading(false);
    };
    socket.on("lobbies:list", onList);
    socket.emit("lobbies:list");
    const poll = setInterval(() => socket.emit("lobbies:list"), 4000);
    return () => {
      socket.off("lobbies:list", onList);
      clearInterval(poll);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return lobbies;
    return lobbies.filter(
      (l) =>
        l.roomId.includes(q) || l.hostName.toUpperCase().includes(q)
    );
  }, [lobbies, query]);

  const join = (code: string) => {
    const profile = loadProfile();
    if (!profile?.name || profile.name.trim().length < 2) {
      onNeedProfile(code);
      return;
    }
    onJoin(code);
  };

  const firstOpen = filtered[0];

  return (
    <motion.section variants={fadeUp} className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow">
            Global frequency
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">Open parties</h2>
          <p className="mt-1 text-sm text-ink-steel">
            Search live lobbies with empty seats and drop in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            getSocket(ensurePlayerId()).emit("lobbies:list");
          }}
          className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel transition hover:text-ink"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-steel"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Search by code or host name"
            className="w-full rounded-sm border border-white/10 bg-void py-3 pl-9 pr-3 font-mono text-sm tracking-wider outline-none focus:border-crimson"
          />
        </label>
        <PrimaryButton
          className="sm:w-auto"
          disabled={!firstOpen}
          onClick={() => firstOpen && join(firstOpen.roomId)}
        >
          Quick join
        </PrimaryButton>
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 && !loading && (
          <GlassPanel className="p-6 text-center font-mono text-xs uppercase tracking-widest text-ink-steel">
            {query
              ? `No open lobbies match “${query}”`
              : "No open parties right now. Create one and wait for operators."}
          </GlassPanel>
        )}
        {filtered.map((lobby) => (
          <motion.div
            key={lobby.roomId}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassPanel className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="overflow-hidden rounded-full">
                  <PlayerAvatar id={lobby.hostAvatarId} size={44} />
                </div>
                <div>
                  <p className="font-mono text-sm tracking-[0.28em] text-crimson-glow">
                    {lobby.roomId}
                  </p>
                  <p className="text-sm text-ink">
                    Host <span className="font-semibold">{lobby.hostName}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-steel">
                    Game:{" "}
                    <span className="font-mono text-ink-steel/90">
                      {lobby.gameId === "five-alive"
                        ? "5 Alive"
                        : lobby.gameId === "mafia-city"
                          ? "Mafia City"
                          : lobby.gameId}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip tone="live">
                  <Users size={10} className="mr-1" />
                  {lobby.playerCount}/{lobby.maxPlayers}
                </StatusChip>
                <StatusChip>{lobby.openSlots} open</StatusChip>
                <button
                  type="button"
                  onClick={() => join(lobby.roomId)}
                  className="rounded-sm bg-crimson px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white shadow-glow transition hover:brightness-110"
                >
                  Join
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
