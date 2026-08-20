"use client";

import Link from "next/link";
import { motion } from "framer-motion";

/**
 * LEDGER — single direction pass
 * Tokens from mockups 04 (dossier cover) + 05 (sealed envelopes)
 * Ink black · manila · dried crimson · display serif + typewriter mono
 */

const INK = "#1a1510";
const MANILA = "#E8DCC8";
const PAPER = "#F4EBD8";
const CRIMSON = "#8B1E1E";
const CRIMSON_SOFT = "#C45C4A";
const DESK = "#12100E";

type Mockup = {
  id: string;
  title: string;
  screen: string;
  note: string;
};

const MOCKUPS: Mockup[] = [
  {
    id: "L01",
    title: "Dossier cover",
    screen: "Homepage",
    note: "Brand-first seal · single primary CTA",
  },
  {
    id: "L02",
    title: "Open case files",
    screen: "Lobby browser",
    note: "Index of live rooms below the fold",
  },
  {
    id: "L03",
    title: "Stamp your name",
    screen: "Create / join modal",
    note: "Secondary join as stamped form field",
  },
  {
    id: "L04",
    title: "Waiting room",
    screen: "Pre-game lobby",
    note: "Roster as signed dossier pages",
  },
  {
    id: "L05",
    title: "Sealed envelope",
    screen: "Role reveal",
    note: "Stamp impress · typewriter copy",
  },
  {
    id: "L06",
    title: "Night dossier",
    screen: "Night phase",
    note: "Tabs · action on paper · voice as channel strip",
  },
  {
    id: "L07",
    title: "Day hearing",
    screen: "Day discussion",
    note: "Portraits as file photos · sticky notes off",
  },
  {
    id: "L08",
    title: "Verdict ballot",
    screen: "Vote phase",
    note: "Lynch as stamped ballot · skip as spare stamp",
  },
  {
    id: "L09",
    title: "City chronicle",
    screen: "Game over",
    note: "Emotional center · typed log",
  },
  {
    id: "L10",
    title: "Field manuals",
    screen: "More info / rules",
    note: "Same paper system as reveal",
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

function PaperGrain({ dark }: { dark?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.12]"
      style={{
        backgroundImage: dark
          ? "url(https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=1200&q=60)"
          : "radial-gradient(circle at 20% 20%, rgba(26,21,16,0.08), transparent 40%), radial-gradient(circle at 80% 70%, rgba(139,30,30,0.06), transparent 35%)",
        backgroundSize: "cover",
        filter: dark ? "grayscale(0.7) contrast(1.15)" : undefined,
      }}
    />
  );
}

function Stamp({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rotate-[-8deg] border-2 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${className}`}
      style={{ borderColor: CRIMSON, color: CRIMSON }}
    >
      {children}
    </span>
  );
}

function LedgerHome() {
  return (
    <Frame label="L01 · ledger / homepage">
      <div className="absolute inset-0" style={{ background: INK }}>
        <PaperGrain dark />
        <div className="absolute inset-0" style={{ background: `${INK}cc` }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center md:p-10">
          <div
            className="relative w-full max-w-md border px-8 py-10 shadow-2xl md:px-12 md:py-12"
            style={{ background: MANILA, borderColor: CRIMSON, color: INK }}
          >
            <Stamp className="absolute -right-2 -top-3 bg-[#F4EBD8]/90">
              Sealed
            </Stamp>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em]">
              Case file // SMOKEDOG
            </p>
            <h3 className="mt-4 font-serif text-5xl font-bold tracking-tight md:text-6xl">
              SMOKEDOG
            </h3>
            <div
              className="mx-auto mt-4 h-px w-24"
              style={{ background: CRIMSON }}
            />
            <p className="mt-4 max-w-xs mx-auto text-sm leading-relaxed opacity-70">
              Open a room. Stamp your name. Trust no dossier.
            </p>
            <span
              className="mt-7 inline-block px-6 py-2.5 font-mono text-[10px] uppercase tracking-widest"
              style={{ background: CRIMSON, color: MANILA }}
            >
              Open a room
            </span>
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.28em] opacity-45">
              Join with code ↓
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LedgerLobbies() {
  return (
    <Frame label="L02 · ledger / lobbies">
      <div className="absolute inset-0 flex" style={{ background: DESK }}>
        <div className="flex w-full flex-col p-5 md:p-7">
          <div className="flex items-end justify-between border-b pb-3" style={{ borderColor: `${MANILA}33` }}>
            <div>
              <p
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: CRIMSON_SOFT }}
              >
                Index
              </p>
              <h3
                className="mt-1 font-serif text-2xl font-bold"
                style={{ color: MANILA }}
              >
                Open case files
              </h3>
            </div>
            <span
              className="border px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest"
              style={{ borderColor: CRIMSON, color: CRIMSON_SOFT }}
            >
              Quick stamp
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { code: "K7M2", host: "Viper", fill: "6/10" },
              { code: "X9QP", host: "Nova", fill: "4/12" },
              { code: "R4NL", host: "TheDon", fill: "8/10" },
            ].map((row) => (
              <div
                key={row.code}
                className="flex items-center justify-between border px-4 py-3"
                style={{
                  background: `${MANILA}0d`,
                  borderColor: `${MANILA}22`,
                  color: MANILA,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono text-sm tracking-[0.25em]"
                    style={{ color: CRIMSON_SOFT }}
                  >
                    {row.code}
                  </span>
                  <span className="text-xs opacity-55">
                    Mafia City · {row.host} · {row.fill}
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">
                  Enter
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LedgerModal() {
  return (
    <Frame label="L03 · ledger / create-join">
      <div className="absolute inset-0" style={{ background: `${INK}e6` }}>
        <PaperGrain dark />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            className="w-full max-w-sm border-2 p-6 shadow-2xl"
            style={{ background: PAPER, borderColor: INK, color: INK }}
          >
            <p
              className="font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{ color: CRIMSON }}
            >
              Intake form
            </p>
            <h3 className="mt-2 font-serif text-2xl font-bold">Stamp your name</h3>
            <div className="mt-5 space-y-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest opacity-50">
                  Operator name
                </p>
                <div
                  className="mt-1 border-b border-dashed py-2 font-mono text-sm"
                  style={{ borderColor: `${INK}55` }}
                >
                  Balmeek
                </div>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest opacity-50">
                  Room code (join)
                </p>
                <div
                  className="mt-1 border-b border-dashed py-2 font-mono text-sm tracking-[0.35em]"
                  style={{ borderColor: `${INK}55` }}
                >
                  ____
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <span
                className="flex-1 py-2.5 text-center font-mono text-[10px] uppercase tracking-widest"
                style={{ background: CRIMSON, color: MANILA }}
              >
                Open a room
              </span>
              <span
                className="flex-1 border py-2.5 text-center font-mono text-[10px] uppercase tracking-widest"
                style={{ borderColor: INK }}
              >
                Join with code
              </span>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LedgerWaiting() {
  const names = ["Viper", "You", "Nova", "Crimson", "Owl", "Rex"];
  return (
    <Frame label="L04 · ledger / lobby">
      <div className="absolute inset-0 flex flex-col" style={{ background: DESK }}>
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: `${MANILA}22` }}
        >
          <div>
            <p
              className="font-mono text-[9px] uppercase tracking-[0.3em]"
              style={{ color: CRIMSON_SOFT }}
            >
              Room K7M2 · Mafia City
            </p>
            <h3 className="font-serif text-xl font-bold" style={{ color: MANILA }}>
              Waiting room
            </h3>
          </div>
          <span
            className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest"
            style={{ background: CRIMSON, color: MANILA }}
          >
            Start case
          </span>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 p-4 md:grid-cols-6">
          {names.map((n, i) => (
            <div
              key={n}
              className="flex flex-col items-center border p-2"
              style={{
                background: PAPER,
                borderColor: INK,
                color: INK,
                transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
              }}
            >
              <div
                className="aspect-square w-full rounded-sm"
                style={{ background: `${INK}22` }}
              />
              <p className="mt-1 font-mono text-[9px] uppercase tracking-wide">
                {n}
              </p>
              {i === 0 && (
                <span
                  className="mt-0.5 font-mono text-[7px] uppercase"
                  style={{ color: CRIMSON }}
                >
                  Host
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

function LedgerReveal() {
  return (
    <Frame label="L05 · ledger / role-reveal">
      <div
        className="absolute inset-0 flex items-center justify-center p-6"
        style={{ background: MANILA }}
      >
        <div
          className="relative w-full max-w-sm border-2 p-8"
          style={{ background: PAPER, borderColor: INK, color: INK }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: CRIMSON }}
          >
            Envelope sealed
          </p>
          <h3 className="mt-6 font-serif text-4xl font-bold">Detective</h3>
          <p className="mt-3 text-sm leading-relaxed opacity-70">
            Investigate one operator each night. Learn town or mafia — never the
            role.
          </p>
          <div className="absolute -right-3 -top-3">
            <Stamp>Town</Stamp>
          </div>
          <div
            className="mt-8 h-1 w-full"
            style={{ background: `${INK}14` }}
          />
          <p className="mt-3 font-mono text-[9px] uppercase opacity-40">
            Reveal ends in 0:14
          </p>
        </div>
      </div>
    </Frame>
  );
}

function LedgerNight() {
  return (
    <Frame label="L06 · ledger / night">
      <div className="absolute inset-0 flex flex-col" style={{ background: DESK }}>
        <div
          className="flex items-center gap-4 border-b px-4 py-2"
          style={{ borderColor: `${MANILA}22` }}
        >
          {["Night", "Day"].map((tab, i) => (
            <span
              key={tab}
              className="font-mono text-[10px] uppercase tracking-[0.25em]"
              style={{
                color: i === 0 ? MANILA : `${MANILA}55`,
                borderBottom: i === 0 ? `2px solid ${CRIMSON}` : "none",
                paddingBottom: 4,
              }}
            >
              {tab}
            </span>
          ))}
          <span
            className="ml-auto font-mono text-xs tracking-widest"
            style={{ color: CRIMSON_SOFT }}
          >
            01:24
          </span>
        </div>
        <div className="grid flex-1 grid-cols-[1fr_130px]">
          <div className="p-4">
            <p
              className="font-mono text-[9px] uppercase tracking-widest"
              style={{ color: CRIMSON_SOFT }}
            >
              Select a target — Mafia kill
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border p-1.5 text-center"
                  style={{
                    background: i === 3 ? PAPER : `${MANILA}10`,
                    borderColor: i === 3 ? CRIMSON : `${MANILA}22`,
                    color: i === 3 ? INK : MANILA,
                  }}
                >
                  <div
                    className="mx-auto aspect-square w-10 rounded-sm"
                    style={{ background: `${INK}33` }}
                  />
                  <p className="mt-1 font-mono text-[8px]">OP_{i + 1}</p>
                </div>
              ))}
            </div>
          </div>
          <div
            className="border-l p-3"
            style={{ borderColor: `${MANILA}22`, background: `${INK}` }}
          >
            <p
              className="font-mono text-[8px] uppercase tracking-widest"
              style={{ color: CRIMSON_SOFT }}
            >
              Mafia channel
            </p>
            {["Viper", "You", "Don"].map((n) => (
              <div
                key={n}
                className="mt-2 flex items-center gap-2 border px-2 py-1"
                style={{ borderColor: `${MANILA}22`, color: MANILA }}
              >
                <span
                  className="size-4 rounded-sm"
                  style={{ background: `${MANILA}33` }}
                />
                <span className="font-mono text-[8px]">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LedgerDay() {
  return (
    <Frame label="L07 · ledger / day">
      <div className="absolute inset-0 flex flex-col" style={{ background: DESK }}>
        <div
          className="flex items-center justify-between border-b px-4 py-2"
          style={{ borderColor: `${MANILA}22` }}
        >
          <p className="font-serif text-lg font-bold" style={{ color: MANILA }}>
            Day 2 · Hearing
          </p>
          <p className="font-mono text-[10px]" style={{ color: CRIMSON_SOFT }}>
            Discuss · vote opens in 0:42
          </p>
        </div>
        <div className="grid flex-1 grid-cols-[1fr_150px]">
          <div className="grid grid-cols-3 gap-3 p-4 md:grid-cols-4">
            {["Viper", "You", "Nova", "Owl", "Rex", "Ash"].map((n, i) => (
              <div
                key={n}
                className="border p-2 text-center"
                style={{
                  background: PAPER,
                  borderColor: INK,
                  color: INK,
                  opacity: i === 5 ? 0.35 : 1,
                }}
              >
                <div
                  className="mx-auto aspect-square w-12 rounded-sm"
                  style={{ background: `${INK}18` }}
                />
                <p className="mt-1 font-mono text-[9px] uppercase">{n}</p>
                {i === 5 && (
                  <p className="font-mono text-[7px]" style={{ color: CRIMSON }}>
                    Dead
                  </p>
                )}
              </div>
            ))}
          </div>
          <div
            className="space-y-2 border-l p-3"
            style={{
              borderColor: `${MANILA}22`,
              background: `${MANILA}08`,
            }}
          >
            <p
              className="font-mono text-[8px] uppercase tracking-widest"
              style={{ color: CRIMSON_SOFT }}
            >
              Town wire
            </p>
            {[
              "Viper was quiet last night.",
              "Check Nova.",
              "I am Doctor — trust.",
            ].map((t) => (
              <div
                key={t}
                className="border px-2 py-1.5 font-mono text-[9px] leading-snug"
                style={{
                  background: PAPER,
                  borderColor: INK,
                  color: INK,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LedgerVote() {
  return (
    <Frame label="L08 · ledger / vote">
      <div className="absolute inset-0 flex flex-col" style={{ background: DESK }}>
        <div
          className="flex items-center justify-between border-b px-4 py-2"
          style={{ borderColor: CRIMSON, background: `${CRIMSON}22` }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: MANILA }}
          >
            Verdict · ballot open
          </p>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-sm font-bold tracking-widest"
              style={{ color: CRIMSON_SOFT }}
            >
              0:11
            </span>
            <span
              className="border px-2 py-1 font-mono text-[8px] uppercase tracking-widest"
              style={{ borderColor: MANILA, color: MANILA }}
            >
              Host · skip timer
            </span>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-4 gap-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="relative border p-2 text-center"
              style={{
                background: i === 2 ? PAPER : `${MANILA}0d`,
                borderColor: i === 2 ? CRIMSON : `${MANILA}22`,
                color: i === 2 ? INK : MANILA,
              }}
            >
              {i === 2 && (
                <div className="absolute -right-1 -top-1">
                  <Stamp>Lynched?</Stamp>
                </div>
              )}
              <div
                className="mx-auto aspect-square w-10 rounded-sm"
                style={{ background: `${INK}25` }}
              />
              <p className="mt-1 font-mono text-[8px]">P{i + 1}</p>
              <p className="font-mono text-[8px] opacity-50">{i === 2 ? "3 votes" : "—"}</p>
            </div>
          ))}
        </div>
        <div className="px-4 pb-3">
          <span
            className="inline-block border px-4 py-2 font-mono text-[9px] uppercase tracking-widest"
            style={{ borderColor: `${MANILA}44`, color: `${MANILA}99` }}
          >
            Stamp skip — spare all
          </span>
        </div>
      </div>
    </Frame>
  );
}

function LedgerChronicle() {
  return (
    <Frame label="L09 · ledger / game-over">
      <div className="absolute inset-0 p-5 md:p-8" style={{ background: DESK }}>
        <p
          className="font-mono text-[10px] uppercase tracking-[0.3em]"
          style={{ color: CRIMSON_SOFT }}
        >
          Debrief
        </p>
        <h3
          className="mt-2 font-serif text-3xl font-bold md:text-4xl"
          style={{ color: MANILA }}
        >
          The Town holds
        </h3>
        <div
          className="mt-5 border p-4"
          style={{ background: `${MANILA}0a`, borderColor: `${MANILA}28` }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: CRIMSON_SOFT }}
          >
            City chronicle
          </p>
          <ul
            className="mt-3 space-y-2 font-mono text-xs leading-relaxed"
            style={{ color: `${MANILA}cc` }}
          >
            <li>
              NIGHT 1 — Crimson was blackmailed by Nova with Blackmailer role.
            </li>
            <li>
              NIGHT 1 — Viper was eliminated overnight by TheDon with Mafia Boss
              role.
            </li>
            <li>DAY 1 — No majority — no lynch.</li>
            <li>DAY 2 — NightOwl was lynched.</li>
          </ul>
        </div>
        <div className="mt-4 flex gap-2">
          <span
            className="px-4 py-2 font-mono text-[9px] uppercase tracking-widest"
            style={{ background: CRIMSON, color: MANILA }}
          >
            Rematch
          </span>
          <span
            className="border px-4 py-2 font-mono text-[9px] uppercase tracking-widest"
            style={{ borderColor: `${MANILA}40`, color: MANILA }}
          >
            Leave room
          </span>
        </div>
      </div>
    </Frame>
  );
}

function LedgerRules() {
  return (
    <Frame label="L10 · ledger / more-info">
      <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: `${INK}e8` }}>
        <div
          className="w-full max-w-md border-2 p-6"
          style={{ background: PAPER, borderColor: INK, color: INK }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: CRIMSON }}
          >
            Field manual
          </p>
          <h3 className="mt-2 font-serif text-2xl font-bold">
            Mafia City — how it works
          </h3>
          <div className="mt-4 space-y-3 text-sm opacity-75">
            <div>
              <p className="font-serif font-semibold opacity-100">Night</p>
              <p className="mt-0.5">
                Roles act in secret. Mafia kill. Doctor protects. Detective
                investigates.
              </p>
            </div>
            <div>
              <p className="font-serif font-semibold opacity-100">Day</p>
              <p className="mt-0.5">
                Discuss, then vote. Majority lynches — or stamp skip to spare.
              </p>
            </div>
            <div>
              <p className="font-serif font-semibold opacity-100">Winning</p>
              <p className="mt-0.5">
                Town clears all Mafia. Mafia win by outnumbering Town.
              </p>
            </div>
          </div>
          <span
            className="mt-5 inline-block w-full border py-2.5 text-center font-mono text-[10px] uppercase tracking-widest"
            style={{ borderColor: INK }}
          >
            Close dossier
          </span>
        </div>
      </div>
    </Frame>
  );
}

const RENDERERS: Record<string, () => React.ReactElement> = {
  L01: LedgerHome,
  L02: LedgerLobbies,
  L03: LedgerModal,
  L04: LedgerWaiting,
  L05: LedgerReveal,
  L06: LedgerNight,
  L07: LedgerDay,
  L08: LedgerVote,
  L09: LedgerChronicle,
  L10: LedgerRules,
};

export default function MockupsPage() {
  return (
    <div className="min-h-screen bg-[#07080A] text-white">
      <header className="border-b border-white/10 px-6 py-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C45C4A]"
            >
              ← SMOKEDOG Arena
            </Link>
            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight md:text-4xl">
              Ledger — full site
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              One direction built from{" "}
              <span className="text-[#E8DCC8]">04 Dossier cover</span> and{" "}
              <span className="text-[#E8DCC8]">05 Sealed envelopes</span>. Ink ·
              manila · dried crimson. Confirm this set and we ship it to
              production, then delete{" "}
              <span className="font-mono text-white/40">/mockups</span>.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
            10 screens · Ledger only
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
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C45C4A]">
                    {m.id} · Ledger
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-bold">
                    {m.title}
                    <span className="ml-2 font-sans font-normal text-white/40">
                      / {m.screen}
                    </span>
                  </h2>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/35">
                  {m.note}
                </p>
              </div>
              <Comp />
            </motion.section>
          );
        })}

        <section className="border border-[#E8DCC8]/20 bg-[#E8DCC8]/5 p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C45C4A]">
            Next step
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[#E8DCC8]">
            Reply “ship Ledger” to confirm
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            On confirmation we apply these tokens and patterns to the live hub +
            Mafia City screens, then remove /mockups entirely.
          </p>
        </section>
      </main>
    </div>
  );
}
