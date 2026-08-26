"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, RefreshCw, Search, Users } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { GlassPanel, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { fadeUp } from "@/components/ui/motion";
import { getSocket } from "@/lib/socket/client";
import { ensurePlayerId, loadProfile } from "@/lib/profile";
import { gameLabel } from "@/lib/games/labels";
import type { LiveGameListing, OpenLobby } from "@/lib/types";

export function OpenLobbies({
  onJoin,
  onSpectate,
  onNeedProfile,
  joiningCode = null,
  joinPending = false,
  spectatingCode = null,
  spectatePending = false,
}: {
  onJoin: (code: string) => void;
  onSpectate: (code: string) => void;
  onNeedProfile: (code?: string, mode?: "join" | "spectate") => void;
  joiningCode?: string | null;
  joinPending?: boolean;
  spectatingCode?: string | null;
  spectatePending?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [lobbies, setLobbies] = useState<OpenLobby[]>([]);
  const [liveGames, setLiveGames] = useState<LiveGameListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playerId = ensurePlayerId();
    const socket = getSocket(playerId);
    const onList = ({ lobbies: next }: { lobbies: OpenLobby[] }) => {
      setLobbies(next);
      setLoading(false);
    };
    const onLive = ({ games: next }: { games: LiveGameListing[] }) => {
      setLiveGames(next);
      setLoading(false);
    };
    socket.on("lobbies:list", onList);
    socket.on("games:live", onLive);
    socket.emit("lobbies:list");
    socket.emit("games:listLive");
    const poll = setInterval(() => {
      socket.emit("lobbies:list");
      socket.emit("games:listLive");
    }, 4000);
    return () => {
      socket.off("lobbies:list", onList);
      socket.off("games:live", onLive);
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

  const filteredLive = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return liveGames;
    return liveGames.filter(
      (g) =>
        g.roomId.includes(q) || g.hostName.toUpperCase().includes(q)
    );
  }, [liveGames, query]);

  const join = (code: string) => {
    if (joinPending || spectatePending) return;
    const profile = loadProfile();
    if (!profile?.name || profile.name.trim().length < 2) {
      onNeedProfile(code, "join");
      return;
    }
    onJoin(code);
  };

  const spectate = (code: string) => {
    if (joinPending || spectatePending) return;
    const profile = loadProfile();
    if (!profile?.name || profile.name.trim().length < 2) {
      onNeedProfile(code, "spectate");
      return;
    }
    onSpectate(code);
  };

  const firstOpen = filtered[0];
  const busy = joinPending || spectatePending;

  return (
    <motion.section variants={fadeUp} className="mt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow">
            Index
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">Open case files</h2>
          <p className="mt-1 text-sm text-ink-steel">
            Live rooms with empty seats — stamp in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            const s = getSocket(ensurePlayerId());
            s.emit("lobbies:list");
            s.emit("games:listLive");
          }}
          className="inline-flex items-center gap-2 rounded-sm border border-crimson/20 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-steel transition hover:text-ink"
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
            className="w-full rounded-sm border border-crimson/30 bg-manila py-3 pl-9 pr-3 font-mono text-sm tracking-wider text-crimson outline-none focus:border-crimson"
          />
        </label>
        <PrimaryButton
          className="sm:w-auto"
          loading={joinPending && !!firstOpen && joiningCode === firstOpen.roomId}
          disabled={!firstOpen || busy}
          onClick={() => firstOpen && join(firstOpen.roomId)}
        >
          {joinPending && firstOpen && joiningCode === firstOpen.roomId
            ? "Joining…"
            : "Quick stamp"}
        </PrimaryButton>
      </div>

      <div className="mt-4 space-y-2">
        {loading &&
          Array.from({ length: 3 }, (_, i) => (
            <GlassPanel key={`skeleton-${i}`} className="flex animate-pulse items-center gap-4 p-4">
              <div className="size-11 rounded-full bg-crimson/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-crimson/10" />
                <div className="h-3 w-40 rounded bg-crimson/10" />
              </div>
            </GlassPanel>
          ))}
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
                <div>
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
                      {gameLabel(lobby.gameId)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip tone="live">
                  <Users size={10} className="mr-1" />
                  {lobby.gameId === "mafia-city" || lobby.maxPlayers >= 99
                    ? `${lobby.playerCount} seated`
                    : `${lobby.playerCount}/${lobby.maxPlayers}`}
                </StatusChip>
                <StatusChip>{lobby.openSlots} open</StatusChip>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => join(lobby.roomId)}
                  className="inline-flex min-w-[72px] items-center justify-center gap-2 rounded-sm bg-crimson px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-manila shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joinPending && joiningCode === lobby.roomId ? (
                    <>
                      <LoadingSpinner size={12} className="text-manila" />
                      Joining
                    </>
                  ) : (
                    "Join"
                  )}
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="font-display text-xl font-bold">Live matches</h3>
        <p className="mt-1 text-sm text-ink-steel">
          Games in progress — watch without taking a seat.
        </p>
        <div className="mt-4 space-y-2">
          {filteredLive.length === 0 && !loading && (
            <GlassPanel className="p-6 text-center font-mono text-xs uppercase tracking-widest text-ink-steel">
              {query
                ? `No live matches match “${query}”`
                : "No live matches right now."}
            </GlassPanel>
          )}
          {filteredLive.map((game) => (
            <motion.div
              key={game.roomId}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassPanel className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <PlayerAvatar id={game.hostAvatarId} size={44} />
                  <div>
                    <p className="font-mono text-sm tracking-[0.28em] text-crimson-glow">
                      {game.roomId}
                    </p>
                    <p className="text-sm text-ink">
                      Host <span className="font-semibold">{game.hostName}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-steel">
                      {gameLabel(game.gameId)} · {game.phase.replace(/_/g, " ")}
                      {game.cycle > 0 ? ` · round ${game.cycle}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusChip tone="live">
                    <Users size={10} className="mr-1" />
                    {game.playerCount} playing
                  </StatusChip>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => spectate(game.roomId)}
                    className="inline-flex min-w-[88px] items-center justify-center gap-2 rounded-sm border border-crimson/40 bg-manila px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-crimson transition hover:bg-crimson/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {spectatePending && spectatingCode === game.roomId ? (
                      <>
                        <LoadingSpinner size={12} className="text-crimson" />
                        Opening
                      </>
                    ) : (
                      <>
                        <Eye size={12} />
                        Spectate
                      </>
                    )}
                  </button>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
