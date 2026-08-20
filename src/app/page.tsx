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
    moreInfo: true,
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    pitch: "Classic 3×3 duel. Hover to preview. First to three wins.",
    players: "2 Players",
    duration: "Turn-based",
    image:
      "https://images.unsplash.com/photo-1616587894289-86480e533129?auto=format&fit=crop&w=1600&q=80",
    badge: "Live",
    moreInfo: true,
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
    moreInfo: true,
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
    moreInfo: true,
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
  const [rulesGameId, setRulesGameId] = useState<string | null>(null);

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
    <div className="relative min-h-screen overflow-hidden bg-manila">
      <div className="pointer-events-none absolute inset-0 animate-pulse-slow bg-[radial-gradient(ellipse_at_top,rgba(139,30,30,0.12),transparent_55%)]" />
      <SiteHeader avatarId={profile?.avatarId ?? guestAvatarId} />

      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10"
      >
        <motion.section
          variants={fadeUp}
          className="relative mt-6 flex flex-col items-center justify-center py-10 text-center md:py-14"
        >
          <div className="relative w-full max-w-lg border-2 border-crimson bg-manila px-8 py-10 text-crimson shadow-stamp md:px-12 md:py-12">
            <span className="animate-stamp absolute -right-2 -top-3 border-2 border-crimson bg-manila px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-crimson -rotate-[8deg]">
              Sealed
            </span>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-crimson/70">
              Case file // SMOKEDOG
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
              SMOKEDOG
            </h1>
            <div className="mx-auto mt-4 h-px w-24 bg-crimson" />
            <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-crimson/70">
              Open a room. Stamp your name. Trust no dossier.
            </p>
            <button
              type="button"
              disabled={!!pending}
              onClick={() => openCreate("mafia-city")}
              className="mt-7 inline-block bg-crimson px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest text-manila transition hover:opacity-90 disabled:opacity-40"
            >
              Open a room
            </button>
            <button
              type="button"
              disabled={!!pending}
              onClick={() => {
                setPrefillCode("");
                setModalMode("join");
                setModal(true);
              }}
              className="mt-4 block w-full font-mono text-[9px] uppercase tracking-[0.28em] text-crimson/50 transition hover:text-crimson"
            >
              Join with code
            </button>
          </div>
        </motion.section>
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
          <h2 className="mt-2 font-display text-3xl font-bold">
            Select your battlefield
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
                className={`group relative w-full overflow-hidden rounded-sm text-left ${
                  card.disabled ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                <img
                  src={card.image}
                  alt=""
                  className="h-[240px] w-full object-cover opacity-45 transition duration-700 group-hover:scale-105 md:h-[320px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-manila via-manila/70 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-8">
                  <span
                    className={`rounded-sm px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                      card.badgeTone === "amber"
                        ? "border border-crimson bg-manila text-crimson"
                        : "bg-crimson text-manila"
                    }`}
                  >
                    {card.badge}
                  </span>
                  <h3 className="mt-5 font-display text-3xl font-bold text-crimson md:text-4xl">
                    {card.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm text-crimson/75 md:text-base">
                    {card.pitch}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-xs uppercase tracking-wider text-crimson/60">
                    <span className="inline-flex items-center gap-2">
                      <Users size={14} /> {card.players}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock size={14} /> {card.duration}
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-crimson">
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
                  onClick={() => setRulesGameId(card.id)}
                  className="absolute bottom-6 right-6 z-10 rounded-sm border border-crimson/40 bg-manila/90 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-crimson transition hover:border-crimson hover:bg-manila md:bottom-8 md:right-8"
                >
                  More info
                </button>
              )}            </div>
          ))}
        </div>
      </motion.main>
      <GameRulesModal
        open={!!rulesGameId}
        gameId={rulesGameId}
        onClose={() => setRulesGameId(null)}
      />

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
          <div className="inline-flex items-center gap-2 rounded-sm border border-crimson/20 bg-surface/95 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink shadow-lg backdrop-blur-md">
            <LoadingSpinner size={14} />
            {pending === "create" ? "Creating party…" : "Joining party…"}
          </div>
        </div>
      )}
    </div>
  );
}
