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
  if (targets.length === 0) return null;

  if (type === "doctor_protect" || type === "bodyguard_protect") {
    const self = targets.find((p) => p.id === actor.id);
    const others = targets.filter((p) => p.id !== actor.id);
    if (self && Math.random() < 0.35) return { type, targetId: self.id };
    const chosen = pick(others.length ? others : targets);
    return chosen ? { type, targetId: chosen.id } : null;
  }

  if (type === "detective_inspect") {
    const pool = targets.filter((p) => !isMafiaRole(p.role));
    const chosen = pick(pool.length ? pool : targets);
    return chosen ? { type, targetId: chosen.id } : null;
  }

  if (type === "mafia_kill" || type === "blackmail" || type === "vigilante_shoot") {
    const town = targets.filter((p) => !isMafiaRole(p.role));
    const pool = town.length ? town : targets;
    const chosen = pick(pool);
    return chosen ? { type, targetId: chosen.id } : null;
  }

  const chosen = pick(targets);
  return chosen ? { type, targetId: chosen.id } : null;
}

export function pickBotVoteTarget(
  players: Player[],
  voter: Player,
  votes: Record<string, string>
): string | null {
  const alive = players.filter((p) => p.alive && p.id !== voter.id);
  if (alive.length === 0) return null;

  if (isMafiaRole(voter.role)) {
    const town = alive.filter((p) => !isMafiaRole(p.role));
    const pool = town.length ? town : alive;
    const mafiaVotes = Object.entries(votes)
      .filter(([id]) => {
        const p = players.find((x) => x.id === id);
        return p && isMafiaRole(p.role);
      })
      .map(([, targetId]) => targetId);
    if (mafiaVotes.length) {
      const popular = mafiaVotes.find((id) => pool.some((p) => p.id === id));
      if (popular && Math.random() < 0.7) return popular;
    }
    return pick(pool)?.id ?? null;
  }

  const voteCounts = new Map<string, number>();
  for (const targetId of Object.values(votes)) {
    voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
  }
  if (voteCounts.size > 0 && Math.random() < 0.55) {
    const sorted = [...voteCounts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted[0][0];
    if (alive.some((p) => p.id === top)) return top;
  }

  return pick(alive)?.id ?? null;
}

export function botNightDelayMs(role?: Role): number {
  const base = 900 + Math.floor(Math.random() * 3200);
  if (role && isMafiaRole(role)) return base + 400;
  if (role === "detective" || role === "doctor") return base + 800;
  return base;
}

export function botDayDelayMs(): number {
  return 1500 + Math.floor(Math.random() * 5000);
}
