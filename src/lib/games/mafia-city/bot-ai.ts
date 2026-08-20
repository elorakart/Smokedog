import type { NightActionType, Player, Role } from "@/lib/types";
import { isMafiaRole, nightActionFor } from "./roles";
import { validNightTargets } from "./resolve";

/** Noir-style aliases — indistinguishable from human display names. */
export const BOT_ALIASES = [
  "Viper",
  "SilverTongue",
  "Ghost_99",
  "TheDon",
  "NightOwl",
  "Crimson",
  "ShadowRun",
  "ColdCase",
  "BlackRose",
  "IronVeil",
  "LowKey",
  "WireTap",
  "RedLedger",
  "SmokeRoom",
  "BackAlley",
  "NullSet",
  "DeepCover",
  "StreetKing",
  "QuietStorm",
  "LastCall",
  "NeonVeil",
  "HardBoiled",
  "GravelVoice",
  "MidnightAce",
];

function pick<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function nextBotName(existing: string[]): string {
  const used = new Set(existing.map((n) => n.toLowerCase()));
  const alias = BOT_ALIASES.find((n) => !used.has(n.toLowerCase()));
  if (alias) return alias;
  let i = 1;
  while (used.has(`operative_${i}`)) i += 1;
  return `Operative_${i}`;
}

export function nextBotAvatarId(existing: number[]): number {
  const used = new Set(existing);
  const pool = shuffle(
    Array.from({ length: 20 }, (_, i) => i).filter((id) => !used.has(id))
  );
  return pool[0] ?? Math.floor(Math.random() * 20);
}

export function pickBotNightAction(
  players: Player[],
  actor: Player
): { type: NightActionType; targetId: string } | null {
  const type = nightActionFor(actor.role) as NightActionType | null;
  if (!type) return null;
  if (type === "vigilante_shoot" && (actor.bulletsLeft ?? 0) <= 0) return null;
  const targets = validNightTargets(players, actor);
  const chosen = pick(targets);
  return chosen ? { type, targetId: chosen.id } : null;
}

export function pickBotVoteTarget(
  players: Player[],
  voter: Player,
  _votes: Record<string, string>
): string | null {
  const alive = players.filter((p) => p.alive && p.id !== voter.id);
  if (alive.length === 0) return null;
  return pick(alive)?.id ?? null;
}

export function botNightDelayMs(role?: Role): number {
  const base = 900 + Math.floor(Math.random() * 3200);
  if (role && isMafiaRole(role)) return base + 400;
  if (role === "detective" || role === "doctor") return base + 800;
  return base;
}

/** Spread bot votes across most of the vote window (not at t=0). */
export function botDayDelayMs(): number {
  return 3000 + Math.floor(Math.random() * 10000);
}
