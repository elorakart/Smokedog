"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Mockup = {
  id: string;
  direction: string;
  title: string;
  screen: string;
  vibe: string;
};

const MOCKUPS: Mockup[] = [
  {
    id: "01",
    direction: "Signal Desk",
    title: "Broadcast hub",
    screen: "Homepage",
    vibe: "Charcoal · signal red · phosphor",
  },
  {
    id: "02",
    direction: "Signal Desk",
    title: "Open frequency",
    screen: "Lobby browser",
    vibe: "Scanline · room codes · mono",
  },
  {
    id: "03",
    direction: "Signal Desk",
    title: "Night roster",
    screen: "In-game night",
    vibe: "Ticker strip · channel rack",
  },
  {
    id: "04",
    direction: "Ledger",
    title: "Dossier cover",
    screen: "Homepage",
    vibe: "Ink · manila · dried crimson",
  },
  {
    id: "05",
    direction: "Ledger",
    title: "Sealed envelopes",
    screen: "Role reveal",
    vibe: "Stamp · typewriter · paper",
  },
  {
    id: "06",
    direction: "Ledger",
    title: "City chronicle",
    screen: "Game over",
    vibe: "Case file · page turn",
  },
  {
    id: "07",
    direction: "Neon Alley",
    title: "Neon lockup",
    screen: "Homepage",
    vibe: "Teal night · magenta · amber",
  },
  {
    id: "08",
    direction: "Neon Alley",
    title: "Alley portraits",
    screen: "In-game day",
    vibe: "Sticky chat · rain shimmer",
  },
  {
    id: "09",
    direction: "Arena Grid",
    title: "Arena title",
    screen: "Homepage",
    vibe: "Void · ice · crimson accent",
  },
  {
    id: "10",
    direction: "Arena Grid",
    title: "Scorebug HUD",
    screen: "In-game vote",
    vibe: "Whistle · timer roll · comms",
  },
];

function Frame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-white/10 bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#0a0c10] px-3 py-2">
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
          {label}
        </span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">{children}</div>
    </div>
  );
}

function SignalDeskHome() {
  return (
    <Frame label="01 · signal-desk / home">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,120,0.03)_1px,transparent_1px)] bg-[size:100%_4px]" />
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#7CFFB2]">
            SIGNAL DESK // LIVE
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-montserrat)] text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            SMOKEDOG
          </h3>
          <p className="mt-3 max-w-md text-sm text-white/70">
            Private rooms. Public blood.
          </p>
          <div className="mt-6 flex gap-3">
            <span className="bg-[#E61919] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white">
              Create
            </span>
            <span className="border border-white/30 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/80">
              Join
            </span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function SignalDeskLobby() {
  return (
    <Frame label="02 · signal-desk / lobbies">
      <div className="absolute inset-0 bg-[#0B0E12] p-6 md:p-8">
        <div className="flex items-end justify-between border-b border-[#7CFFB2]/20 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#7CFFB2]">
              Global frequency
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white">Open parties</h3>
          </div>
          <span className="border border-[#E61919]/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#E61919]">
            Quick join
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {["K7M2", "X9QP", "R4NL"].map((code, i) => (
            <div
              key={code}
              className="flex items-center justify-between border border-white/10 bg-white/[0.03] px-4 py-3"
              style={{ transform: `translateX(${i * 4}px)` }}
            >
              <div className="flex items-center gap-3">
                <span className="size-8 rounded-full bg-white/10" />
                <div>
                  <p className="font-mono text-sm tracking-[0.2em] text-[#E61919]">
                    {code}
                  </p>
                  <p className="text-xs text-white/50">Mafia City · 6/10</p>
                </div>
              </div>
              <span className="font-mono text-[9px] uppercase text-[#7CFFB2]">
                Live
              </span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function SignalDeskNight() {
  return (
    <Frame label="03 · signal-desk / night">
      <div className="absolute inset-0 flex flex-col bg-[#060910]">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em]">
          <span className="text-[#7CFFB2]">NIGHT 2</span>
          <span className="animate-pulse text-[#E61919]">01:24</span>
          <span className="text-white/40">MAFIA CHANNEL OPEN</span>
        </div>
        <div className="grid flex-1 grid-cols-[1fr_140px]">
          <div className="grid grid-cols-4 gap-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-sm border border-white/10 bg-white/[0.03] p-2"
              >
                <span className="aspect-square w-full rounded-full bg-gradient-to-b from-white/20 to-white/5" />
                <span className="mt-1 font-mono text-[8px] text-white/50">
                  OP_{i + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="border-l border-white/10 bg-black/40 p-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#7CFFB2]">
              Channel rack
            </p>
            {["Viper", "You", "Crimson"].map((n) => (
              <div
                key={n}
                className="mt-2 flex items-center gap-2 rounded-sm border border-[#7CFFB2]/30 bg-[#7CFFB2]/10 px-2 py-1.5"
              >
                <span className="size-5 rounded-full bg-white/20" />
                <span className="font-mono text-[9px] text-white">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LedgerHome() {
  return (
    <Frame label="04 · ledger / home">
      <div className="absolute inset-0 bg-[#1a1510]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=1600&q=80)",
            backgroundSize: "cover",
            filter: "grayscale(0.6) contrast(1.1)",
          }}
        />
        <div className="absolute inset-0 bg-[#1a1510]/75" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="border border-[#8B1E1E] bg-[#E8DCC8]/95 px-10 py-12 text-[#1a1510] shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em]">
              Case file // sealed
            </p>
            <h3 className="mt-4 font-serif text-5xl font-bold tracking-tight">
              SMOKEDOG
            </h3>
            <div className="mx-auto mt-4 h-px w-24 bg-[#8B1E1E]" />
            <p className="mt-4 max-w-xs text-sm text-[#1a1510]/70">
              Open a room. Stamp your name. Trust no dossier.
            </p>
            <span className="mt-6 inline-block bg-[#8B1E1E] px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-[#E8DCC8]">
              Open a room
            </span>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-[#1a1510]/50">
              Join with code
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LedgerReveal() {
  return (
    <Frame label="05 · ledger / reveal">
      <div className="absolute inset-0 flex items-center justify-center bg-[#E8DCC8] p-8">
        <div className="relative w-full max-w-sm border-2 border-[#1a1510] bg-[#F4EBD8] p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8B1E1E]">
            Envelope sealed
          </p>
          <h3 className="mt-6 font-serif text-4xl font-bold text-[#1a1510]">
            Detective
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#1a1510]/70">
            Investigate one operator each night. Learn town or mafia — never the
            role.
          </p>
          <div className="absolute -right-3 -top-3 rotate-12 border-2 border-[#8B1E1E] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#8B1E1E]">
            Town
          </div>
          <div className="mt-8 h-1 w-full bg-[#1a1510]/10" />
          <p className="mt-3 font-mono text-[9px] uppercase text-[#1a1510]/40">
            Reveal ends in 0:14
          </p>
        </div>
      </div>
    </Frame>
  );
}

function LedgerChronicle() {
  return (
    <Frame label="06 · ledger / gameover">
      <div className="absolute inset-0 bg-[#12100E] p-6 md:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C45C4A]">
          Debrief
        </p>
        <h3 className="mt-2 font-serif text-3xl font-bold text-[#E8DCC8]">
          The Town holds
        </h3>
        <div className="mt-6 border border-[#E8DCC8]/20 bg-[#E8DCC8]/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#C45C4A]">
            City chronicle
          </p>
          <ul className="mt-3 space-y-2 font-mono text-xs text-[#E8DCC8]/80">
            <li>NIGHT 1 — Crimson was blackmailed by Nova with Blackmailer role.</li>
            <li>NIGHT 1 — Viper was eliminated overnight by TheDon with Mafia Boss role.</li>
            <li>DAY 1 — No majority — no lynch.</li>
            <li>DAY 2 — NightOwl was lynched.</li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}

function NeonHome() {
  return (
    <Frame label="07 · neon-alley / home">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#041A22]/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <h3
            className="font-[family-name:var(--font-montserrat)] text-5xl font-extrabold tracking-[0.08em] text-[#FF2D95] md:text-7xl"
            style={{ textShadow: "0 0 24px rgba(255,45,149,0.55)" }}
          >
            SMOKEDOG
          </h3>
          <p className="mt-4 text-sm text-[#F5C542]/90">
            Wet asphalt. Hot signage. Cold blood.
          </p>
          <div className="mt-8 flex gap-3">
            <span className="bg-[#FF2D95] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white">
              Create party
            </span>
            <span className="border border-[#F5C542]/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#F5C542]">
              Join
            </span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function NeonInGame() {
  return (
    <Frame label="08 · neon-alley / day">
      <div className="absolute inset-0 grid grid-cols-[1fr_160px] bg-[#061820]">
        <div className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F5C542]">
            Day 2 · discussion
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center">
                <div
                  className="mx-auto aspect-square w-16 rounded-full border-2 border-[#FF2D95]/50 bg-white/10"
                  style={{ boxShadow: "0 0 12px rgba(255,45,149,0.25)" }}
                />
                <p className="mt-1 font-mono text-[9px] text-white/70">Face {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-l border-[#F5C542]/20 bg-black/30 p-3">
          <p className="font-mono text-[9px] uppercase text-[#F5C542]">Sticky chat</p>
          {["Who voted Viper?", "Doctor quiet…", "Check NightOwl"].map((t) => (
            <div
              key={t}
              className="rotate-[-1deg] bg-[#F5C542] px-2 py-1.5 text-[10px] text-[#061820]"
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function ArenaHome() {
  return (
    <Frame label="09 · arena-grid / home">
      <div className="absolute inset-0 bg-black">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 80%, #333 0%, transparent 55%), repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 40px), repeating-linear-gradient(0deg, #111 0 2px, transparent 2px 40px)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/40">
            Arena
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-montserrat)] text-5xl font-extrabold uppercase tracking-tight text-white md:text-6xl">
            SMOKEDOG
          </h3>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-black">
              Create match
            </span>
            <span className="border border-white/40 px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white">
              Spectate lobbies
            </span>
          </div>
          <p className="mt-10 font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
            Lobbies below the fold ↓
          </p>
        </div>
      </div>
    </Frame>
  );
}

function ArenaHud() {
  return (
    <Frame label="10 · arena-grid / vote">
      <div className="absolute inset-0 bg-[#050505]">
        <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-2">
          <span className="font-[family-name:var(--font-montserrat)] text-sm font-bold uppercase tracking-wider text-white">
            SMOKEDOG
          </span>
          <div className="flex items-center gap-4 font-mono text-xs">
            <span className="text-white/50">VOTE 3</span>
            <span className="rounded-sm bg-[#E61919] px-2 py-0.5 font-bold text-white">
              0:11
            </span>
            <span className="border border-white/30 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/70">
              Skip timer
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_150px] gap-3 p-4">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm border p-2 ${
                  i === 2
                    ? "scale-105 border-[#E61919] bg-[#E61919]/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="aspect-square rounded-full bg-white/15" />
                <p className="mt-1 text-center font-mono text-[8px] text-white/60">
                  P{i + 1}
                </p>
              </div>
            ))}
          </div>
          <div className="border border-white/10 bg-black/50 p-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">
              Comms
            </p>
            {["Host", "Balmeek", "Viper"].map((n, i) => (
              <div
                key={n}
                className={`mt-2 flex items-center gap-2 rounded-sm px-2 py-1 ${
                  i === 1 ? "ring-1 ring-emerald-400/60" : ""
                }`}
              >
                <span className="size-5 rounded-full bg-white/20" />
                <span className="font-mono text-[9px] text-white">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

const RENDERERS: Record<string, () => React.ReactElement> = {
  "01": SignalDeskHome,
  "02": SignalDeskLobby,
  "03": SignalDeskNight,
  "04": LedgerHome,
  "05": LedgerReveal,
  "06": LedgerChronicle,
  "07": NeonHome,
  "08": NeonInGame,
  "09": ArenaHome,
  "10": ArenaHud,
};

export default function MockupsPage() {
  return (
    <div className="min-h-screen bg-[#07080A] text-white">
      <header className="border-b border-white/10 px-6 py-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#E61919]"
            >
              ← SMOKEDOG Arena
            </Link>
            <h1 className="mt-3 font-[family-name:var(--font-montserrat)] text-3xl font-extrabold tracking-tight md:text-4xl">
              Redesign mockups
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Ten comps across Signal Desk, Ledger, Neon Alley, and Arena Grid.
              Brand-first heroes. No purple defaults.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
            10 screens · 4 directions
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:px-10">
        {MOCKUPS.map((m, i) => {
          const Comp = RENDERERS[m.id]!;
          return (
            <motion.section
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.2) }}
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#E61919]">
                    {m.id} · {m.direction}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-montserrat)] text-xl font-bold">
                    {m.title}
                    <span className="ml-2 font-normal text-white/40">
                      / {m.screen}
                    </span>
                  </h2>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">
                  {m.vibe}
                </p>
              </div>
              <Comp />
            </motion.section>
          );
        })}
      </main>
    </div>
  );
}
