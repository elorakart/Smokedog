"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Users } from "lucide-react";
import { OpenLobbies } from "@/components/hub/OpenLobbies";
import { ProfileModal } from "@/components/hub/ProfileModal";
import { GameRulesModal } from "@/components/game/mafia/GameRulesModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { fadeUp, stagger } from "@/components/ui/motion";
import {
  ensurePlayerId,
  loadProfile,
  randomAvatarId,
  saveProfile,
} from "@/lib/profile";
import { getSocket } from "@/lib/socket/client";
import { getGameModule } from "@/lib/games/registry";

type GameCard = {
  id: string;
  title: string;
  pitch: string;
  players: string;
  duration: string;
  image: string;
  badge: string;
  badgeTone?: "crimson" | "amber" | "steel";
  disabled?: boolean;
  moreInfo?: boolean;
};

const GAME_CARDS: GameCard[] = [
  {
    id: "mafia-city",
    title: "Mafia City",
    pitch: "The city's last night. Trust no one. Vote wisely.",
    players: "4–12 Players",
    duration: "15–30 Min",
    image:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80",
    badge: "Featured",
    moreInfo: true,
  },
  {
    id: "spot-it",
    title: "Spot It",
    pitch: "Race to match the one shared symbol. First click claims the card.",
    players: "2–8 Players",
    duration: "Real-time",
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80",
    badge: "Live",
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    pitch: "Classic 3×3 duel. Hover to preview. First to three wins.",
    players: "2 Players",
    duration: "Turn-based",
    image:
      "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?auto=format&fit=crop&w=1600&q=80",
    badge: "Live",
  },
  {
    id: "connect-4",
    title: "Connect 4",
    pitch: "Drop discs with gravity. Connect four in a row to win.",
    players: "2 Players",
    duration: "Turn-based",
    image:
      "https://images.unsplash.com/photo-1553481187-be93c21490a9?auto=format&fit=crop&w=1600&q=80",
    badge: "Live",
  },
  {
    id: "five-alive",
    title: "5 Alive",
    pitch: "Keep it under 21. Busts cost lives. Bombs demand instant 0s.",
    players: "2–6 Players",
    duration: "Turn-based",
    image:
      "https://images.unsplash.com/photo-1516542076529-1ea3854896f2?auto=format&fit=crop&w=1600&q=80",
    badge: "Under maintenance",
    badgeTone: "amber",
    disabled: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "join">("create");
  const [prefillCode, setPrefillCode] = useState("");
  const [createGameId, setCreateGameId] = useState<string>("mafia-city");
  const createGameIdRef = useRef<string>("mafia-city");
  const [profile, setProfile] = useState(() => loadProfile());
  const [guestAvatarId] = useState(() => randomAvatarId());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"create" | "join" | null>(null);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const setPendingGameId = (gameId: string) => {
    createGameIdRef.current = gameId;
    setCreateGameId(gameId);
  };

  useEffect(() => {
    setProfile(loadProfile());
    return () => {
      const p = loadProfile();
      if (!p) return;
      const s = getSocket(p.playerId);
      s.off("room:error");
      s.off("room:state");
    };
  }, []);

  const persist = (name: string, avatarId: number) => {
    const playerId = ensurePlayerId();
    const next = { playerId, name, avatarId };
    saveProfile(next);
    setProfile(next);
    return next;
  };

  const bindErrors = (playerId: string) => {
    const socket = getSocket(playerId);
    socket.off("room:error");
    socket.off("room:state");
    socket.on("room:error", ({ message }) => {
      setPending(null);
      setJoiningCode(null);
      setError(message);
    });
    socket.on("room:state", (state) => {
      const requested = createGameIdRef.current;
      if (requested && state.gameId !== requested) {
        setPending(null);
        setJoiningCode(null);
        setError(
          `Server started ${state.gameId} instead of ${requested}. The game server may need a redeploy — try again in a minute.`
        );
        return;
      }
      setError(null);
      router.push(`/room/${state.roomId}`);
    });
    return socket;
  };

  const onCreate = (name: string, avatarId: number) => {
    if (pending) return;
    try {
      const mod = getGameModule(createGameIdRef.current);
      if (mod.status === "maintenance") {
        setError(`${mod.displayName} is under maintenance.`);
        return;
      }
    } catch {
      /* server will validate */
    }
    setError(null);
    setPending("create");
    setJoiningCode(null);
    const p = persist(name, avatarId);
    const socket = bindErrors(p.playerId);
    socket.emit("room:create", {
      playerId: p.playerId,
      name: p.name,
      avatarId: p.avatarId,
      gameId: createGameIdRef.current,
    });
  };

  const onJoin = (name: string, avatarId: number, code: string) => {
    if (pending) return;
    setError(null);
    setPending("join");
    setJoiningCode(code);
    const p = persist(name, avatarId);
    const socket = bindErrors(p.playerId);
    socket.emit("room:join", {
      roomId: code,
      playerId: p.playerId,
      name: p.name,
      avatarId: p.avatarId,
    });
  };

  const joinWithProfile = (code: string) => {
    if (pending) return;
    const p = loadProfile();
    if (!p?.name) {
      setPrefillCode(code);
      setModalMode("join");
      setModal(true);
      return;
    }
    onJoin(p.name, p.avatarId, code);
  };

  const openCreate = (gameId: string) => {
    if (pending) return;
    try {
      const mod = getGameModule(gameId);
      if (mod.status === "maintenance") {
        setError(`${mod.displayName} is under maintenance.`);
        return;
      }
    } catch {
      /* ignore */
    }
    setError(null);
    setPendingGameId(gameId);
    setPrefillCode("");
    setModalMode("create");
    setModal(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 animate-pulse-slow bg-[radial-gradient(ellipse_at_top,rgba(230,25,25,0.12),transparent_55%)]" />
      <SiteHeader avatarId={profile?.avatarId ?? guestAvatarId} />

      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10"
      >
        <motion.p
          variants={fadeUp}
          className="font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow"
        >
          SMOKEDOG Arena
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl"
        >
          Drop in or pick a game
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 max-w-xl text-ink-steel">
          Join an open party below, or create a new battlefield.
        </motion.p>

        <OpenLobbies
          onJoin={joinWithProfile}
          joiningCode={joiningCode}
          joinPending={pending === "join"}
          onNeedProfile={(code) => {
            if (pending) return;
            setError(null);
            setPrefillCode(code ?? "");
            setModalMode("join");
            setModal(true);
          }}
        />

        <motion.div variants={fadeUp} className="mt-14">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow">
            Operations
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">
            Select Your Battlefield
          </h2>
        </motion.div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {GAME_CARDS.map((card) => (
            <div key={card.id} className="relative">
              <motion.button
                variants={fadeUp}
                type="button"
                disabled={card.disabled || !!pending}
                onClick={() => {
                  if (card.disabled) return;
                  openCreate(card.id);
                }}
                whileHover={card.disabled ? undefined : { scale: 1.01 }}
                whileTap={card.disabled ? undefined : { scale: 0.995 }}
                className={`group relative w-full overflow-hidden rounded-lg text-left ${
                  card.disabled ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                <img
                  src={card.image}
                  alt=""
                  className="h-[240px] w-full object-cover opacity-50 transition duration-700 group-hover:scale-105 md:h-[320px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/45 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-8">
                  <span
                    className={`rounded-sm px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                      card.badgeTone === "amber"
                        ? "bg-amber-500/90 text-void"
                        : "bg-crimson text-white"
                    }`}
                  >
                    {card.badge}
                  </span>
                  <h3 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">
                    {card.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm text-ink md:text-base">
                    {card.pitch}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-xs uppercase tracking-wider text-ink-steel">
                    <span className="inline-flex items-center gap-2">
                      <Users size={14} /> {card.players}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock size={14} /> {card.duration}
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-crimson-glow">
                    {card.disabled ? "Unavailable" : "Play now"}{" "}
                    {!card.disabled && (
                      <ArrowRight
                        size={16}
                        className="transition group-hover:translate-x-1"
                      />
                    )}
                  </span>
                </div>
              </motion.button>
              {card.moreInfo && (
                <button
                  type="button"
                  onClick={() => setRulesOpen(true)}
                  className="absolute bottom-6 right-6 z-10 rounded-sm border border-white/20 bg-void/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink backdrop-blur-sm transition hover:border-crimson/40 hover:text-crimson-glow md:bottom-8 md:right-8"
                >
                  More info
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.main>

      <GameRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      <ProfileModal
        open={modal}
        defaultName={profile?.name ?? ""}
        defaultAvatar={profile?.avatarId ?? guestAvatarId}
        createGameId={createGameId}
        error={error}
        initialCode={prefillCode}
        initialMode={modalMode}
        pending={pending}
        onClose={() => {
          setModal(false);
          setError(null);
          setPending(null);
          setJoiningCode(null);
        }}
        onCreate={onCreate}
        onJoin={onJoin}
      />

      {pending && !modal && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-surface/95 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink shadow-lg backdrop-blur-md">
            <LoadingSpinner size={14} />
            {pending === "create" ? "Creating party…" : "Joining party…"}
          </div>
        </div>
      )}
    </div>
  );
}
