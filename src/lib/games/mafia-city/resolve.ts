import type { Faction, NightAction, Player } from "@/lib/types";
import { factionOf, isMafiaRole } from "@/lib/games/mafia-city/roles";

export interface NightResolution {
  deaths: { playerId: string; reason: string }[];
  silencedId: string | null;
  detective: {
    investigatorId: string;
    targetId: string;
    faction: Faction;
  } | null;
}

function living(players: Player[]): Player[] {
  return players.filter((p) => p.alive);
}

function byId(players: Player[], id?: string | null): Player | undefined {
  return id ? players.find((p) => p.id === id) : undefined;
}

function mafiaKillTarget(
  players: Player[],
  actions: NightAction[]
): { targetId: string; attackerId: string } | null {
  const mafia = living(players).filter((p) => isMafiaRole(p.role));
  const kills = actions.filter((a) => a.type === "mafia_kill");
  if (mafia.length === 0) return null;

  const boss = mafia.find((p) => p.role === "mafia_boss");
  const bossAction = boss
    ? kills.find((a) => a.playerId === boss.id)
    : undefined;
  if (boss && bossAction) {
    return { targetId: bossAction.targetId, attackerId: boss.id };
  }

  const counts = new Map<string, { n: number; attackerId: string }>();
  for (const k of kills) {
    const cur = counts.get(k.targetId) ?? { n: 0, attackerId: k.playerId };
    cur.n += 1;
    counts.set(k.targetId, cur);
  }
  let best: { targetId: string; n: number; attackerId: string } | null = null;
  for (const [targetId, val] of counts) {
    if (!best || val.n > best.n) {
      best = { targetId, n: val.n, attackerId: val.attackerId };
    }
  }
  if (best) return { targetId: best.targetId, attackerId: best.attackerId };

  const town = living(players).filter((p) => !isMafiaRole(p.role));
  if (town.length === 0) return null;
  const pick = town[Math.floor(Math.random() * town.length)]!;
  return { targetId: pick.id, attackerId: mafia[0]!.id };
}

export function resolveNight(
  players: Player[],
  actions: NightAction[]
): NightResolution {
  for (const p of players) p.blackmailed = false;

  const blackmail = actions.find((a) => a.type === "blackmail");
  const silenced = byId(players, blackmail?.targetId);
  const silencedId =
    silenced && silenced.alive && !isMafiaRole(silenced.role)
      ? silenced.id
      : null;
  if (silencedId) {
    const target = byId(players, silencedId);
    if (target) target.blackmailed = true;
  }

  const doctorProtect = actions.find((a) => a.type === "doctor_protect")
    ?.targetId;
  const bgProtect = actions.find((a) => a.type === "bodyguard_protect")
    ?.targetId;
  const bodyguard = living(players).find((p) => p.role === "bodyguard");

  const attacks: { attackerId: string; targetId: string; source: string }[] =
    [];

  const mafiaHit = mafiaKillTarget(players, actions);
  if (mafiaHit) {
    attacks.push({ ...mafiaHit, source: "mafia" });
  }

  const vig = actions.find((a) => a.type === "vigilante_shoot");
  if (vig) {
    const shooter = byId(players, vig.playerId);
    if (shooter?.alive && (shooter.bulletsLeft ?? 0) > 0) {
      shooter.bulletsLeft = (shooter.bulletsLeft ?? 1) - 1;
      attacks.push({
        attackerId: vig.playerId,
        targetId: vig.targetId,
        source: "vigilante",
      });
    }
  }

  const deathReasons = new Map<string, string>();

  const markDead = (id: string, reason: string) => {
    const p = byId(players, id);
    if (!p || !p.alive) return;
    p.alive = false;
    deathReasons.set(id, reason);
  };

  for (const attack of attacks) {
    const target = byId(players, attack.targetId);
    const attacker = byId(players, attack.attackerId);
    if (!target?.alive || !attacker?.alive) continue;
    if (target.id === attacker.id) continue;

    if (doctorProtect === target.id) {
      continue;
    }

    if (bodyguard && bgProtect === target.id && bodyguard.alive) {
      if (bodyguard.id !== target.id) {
        if (doctorProtect === bodyguard.id) {
          continue;
        }
        markDead(bodyguard.id, "Died intercepting an attack");
        if (doctorProtect !== attacker.id) {
          markDead(
            attacker.id,
            "Killed by the Bodyguard while attacking their charge"
          );
        }
        continue;
      }
    }

    const reason =
      attack.source === "vigilante"
        ? "Gunned down by the Vigilante"
        : "Eliminated by the Mafia";
    markDead(target.id, reason);
  }

  const detectiveAction = actions.find((a) => a.type === "detective_inspect");
  const investigator = byId(players, detectiveAction?.playerId);
  const inspected = byId(players, detectiveAction?.targetId);
  const detective =
    investigator?.alive &&
    investigator.role === "detective" &&
    inspected?.role
      ? {
          investigatorId: investigator.id,
          targetId: inspected.id,
          faction: factionOf(inspected.role),
        }
      : null;

  return {
    deaths: [...deathReasons.entries()].map(([playerId, reason]) => ({
      playerId,
      reason,
    })),
    silencedId,
    detective,
  };
}

export function randomLivingTarget(
  players: Player[],
  actorId: string,
  predicate: (p: Player) => boolean
): Player | undefined {
  const options = living(players).filter(
    (p) => p.id !== actorId && predicate(p)
  );
  if (options.length === 0) return undefined;
  return options[Math.floor(Math.random() * options.length)];
}

export function validNightTargets(
  players: Player[],
  actor: Player
): Player[] {
  const others = living(players).filter((p) => p.id !== actor.id);
  switch (actor.role) {
    case "doctor":
    case "bodyguard":
      return living(players);
    case "detective":
    case "vigilante":
      return others;
    case "blackmailer":
    case "mafia_boss":
    case "mafia_goon":
      return others.filter((p) => !isMafiaRole(p.role));
    default:
      return [];
  }
}

export function winCheck(players: Player[]): "town" | "mafia" | null {
  const alive = living(players);
  const mafia = alive.filter((p) => isMafiaRole(p.role)).length;
  const town = alive.length - mafia;
  if (mafia === 0) return "town";
  if (mafia >= town) return "mafia";
  return null;
}

export function majorityThreshold(livingCount: number): number {
  return Math.floor(livingCount / 2) + 1;
}

export function tallyLynch(
  players: Player[],
  votes: Record<string, string>
): string | null {
  const alive = living(players);
  const needed = majorityThreshold(alive.length);
  const counts = new Map<string, number>();
  for (const p of alive) {
    if (p.blackmailed) continue;
    const target = votes[p.id];
    if (!target) continue;
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  let best: { id: string; n: number } | null = null;
  let tie = false;
  for (const [id, n] of counts) {
    if (!best || n > best.n) {
      best = { id, n };
      tie = false;
    } else if (n === best.n) {
      tie = true;
    }
  }
  if (!best || tie || best.n < needed) return null;
  return best.id;
}
