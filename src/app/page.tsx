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
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { fadeUp, stagger } from "@/components/ui/motion";
import {
  ensurePlayerId,
  loadProfile,
  randomAvatarId,
  saveProfile,
} from "@/lib/profile";
import { getSocket } from "@/lib/socket/client";

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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 animate-pulse-slow bg-[radial-gradient(ellipse_at_top,rgba(230,25,25,0.12),transparent_55%)]" />
      <SiteHeader avatarId={profile?.avatarId ?? 0} />

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
          Active operation
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl"
        >
          Select Your Battlefield
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 max-w-xl text-ink-steel">
          A modular multiplayer platform. Mafia City and 5 Alive are live now.
        </motion.p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="relative">
          <motion.button
            variants={fadeUp}
            type="button"
            onClick={() => {
              setError(null);
              setPendingGameId("mafia-city");
              setPrefillCode("");
              setModalMode("create");
              setModal(true);
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.995 }}
            className="group relative w-full overflow-hidden rounded-lg text-left"
          >
            <img
              src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="h-[260px] w-full object-cover opacity-50 transition duration-700 group-hover:scale-105 md:h-[420px]"
            />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
          <div className="absolute inset-0 p-8 md:p-12">
            <span className="rounded-sm bg-crimson px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
              Featured
            </span>
            <h2 className="mt-6 font-display text-4xl font-extrabold md:text-6xl">
              Mafia City
            </h2>
            <p className="mt-3 max-w-lg text-ink">
              The city&apos;s last night. Trust no one. Vote wisely.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6 font-mono text-xs uppercase tracking-wider text-ink-steel">
              <span className="inline-flex items-center gap-2">
                <Users size={14} /> 4–12 Players
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={14} /> 15–30 Min
              </span>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-crimson-glow">
              Play now{" "}
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
              />
            </span>
          </div>
          </motion.button>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="absolute bottom-8 right-8 z-10 rounded-sm border border-white/20 bg-void/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink backdrop-blur-sm transition hover:border-crimson/40 hover:text-crimson-glow md:bottom-12 md:right-12"
          >
            More info
          </button>
          </div>

          <motion.button
            variants={fadeUp}
            type="button"
            onClick={() => {
              setError(null);
              setPendingGameId("five-alive");
              setPrefillCode("");
              setModalMode("create");
              setModal(true);
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.995 }}
            className="group relative w-full overflow-hidden rounded-lg text-left"
          >
            <img
              src="https://images.unsplash.com/photo-1516542076529-1ea3854896f2?auto=format&fit=crop&w=1600&q=80"
              alt=""
              className="h-[260px] w-full object-cover opacity-50 transition duration-700 group-hover:scale-105 md:h-[420px]"
            />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
          <div className="absolute inset-0 p-8 md:p-12">
            <span className="rounded-sm bg-crimson px-3 py-1 font-mono text-[10px] uppercase tracking-widest">
              Featured
            </span>
            <h2 className="mt-6 font-display text-4xl font-extrabold md:text-6xl">
              5 Alive
            </h2>
            <p className="mt-3 max-w-lg text-ink">
              Keep it under 21. Busts cost lives. Bombs demand instant 0s.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6 font-mono text-xs uppercase tracking-wider text-ink-steel">
              <span className="inline-flex items-center gap-2">
                <Users size={14} /> 2–6 Players
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={14} /> Turn-based
              </span>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-crimson-glow">
              Play now{" "}
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </div>
          </motion.button>
        </div>

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

        <motion.article
          variants={fadeUp}
          className="relative mt-8 overflow-hidden rounded-lg border border-white/10 opacity-80"
        >
          <img
            src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="h-40 w-full object-cover grayscale md:h-48"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
          <div className="absolute bottom-0 p-6 md:p-8">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
              Coming soon
            </span>
            <h3 className="mt-2 font-display text-2xl font-bold md:text-3xl">
              More games on the way
            </h3>
            <p className="mt-2 max-w-lg text-sm text-ink-steel">
              New operations are in development. Mafia City and 5 Alive are live
              now — check back for the next drop.
            </p>
          </div>
        </motion.article>
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
