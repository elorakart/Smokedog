"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Users } from "lucide-react";
import { ProfileModal } from "@/components/hub/ProfileModal";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { COMING_SOON, ensurePlayerId, loadProfile, saveProfile } from "@/lib/profile";
import { getSocket } from "@/lib/socket/client";

export default function HomePage() {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [profile, setProfile] = useState(() => loadProfile());
  const [error, setError] = useState<string | null>(null);

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
    socket.on("room:error", ({ message }) => setError(message));
    socket.on("room:state", (state) => {
      router.push(`/room/${state.roomId}`);
    });
    return socket;
  };

  const onCreate = (name: string, avatarId: number) => {
    const p = persist(name, avatarId);
    const socket = bindErrors(p.playerId);
    socket.emit("room:create", {
      playerId: p.playerId,
      name: p.name,
      avatarId: p.avatarId,
      gameId: "mafia-city",
    });
  };

  const onJoin = (name: string, avatarId: number, code: string) => {
    const p = persist(name, avatarId);
    const socket = bindErrors(p.playerId);
    socket.emit("room:join", {
      roomId: code,
      playerId: p.playerId,
      name: p.name,
      avatarId: p.avatarId,
    });
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-[4px] bg-crimson shadow-glow" />
          <span className="font-display text-xl font-extrabold tracking-[0.18em]">
            SMOKEDOG
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-steel sm:block">
            Operator Access
          </span>
          <div className="overflow-hidden rounded-[4px] ring-1 ring-white/10">
            <PlayerAvatar id={profile?.avatarId ?? 0} size={36} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-crimson-glow">
          Active operation
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Select Your Battlefield
        </h1>
        <p className="mt-3 max-w-xl text-ink-steel">
          A modular multiplayer platform. Mafia City is live. More operations
          incoming.
        </p>

        {error && (
          <p className="mt-4 font-mono text-sm text-crimson-glow">{error}</p>
        )}

        <button
          type="button"
          onClick={() => setModal(true)}
          className="group relative mt-10 w-full overflow-hidden rounded-lg text-left"
        >
          <img
            src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="h-[340px] w-full object-cover opacity-50 transition duration-500 group-hover:scale-105 md:h-[420px]"
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
              Play now <ArrowRight size={16} />
            </span>
          </div>
        </button>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {COMING_SOON.map((game) => (
            <article
              key={game.id}
              className="relative overflow-hidden rounded-lg border border-white/10 opacity-70"
            >
              <img
                src={game.image}
                alt=""
                className="h-48 w-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
              <div className="absolute bottom-0 p-5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
                  Coming soon
                </span>
                <h3 className="mt-1 font-display text-xl font-bold">{game.title}</h3>
                <p className="mt-1 text-sm text-ink-steel">{game.blurb}</p>
              </div>
            </article>
          ))}
        </div>
      </main>

      <ProfileModal
        open={modal}
        defaultName={profile?.name ?? ""}
        defaultAvatar={profile?.avatarId ?? 0}
        onClose={() => setModal(false)}
        onCreate={onCreate}
        onJoin={onJoin}
      />
    </div>
  );
}
