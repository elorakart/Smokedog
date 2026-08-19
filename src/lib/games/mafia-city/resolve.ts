import type { Faction, NightAction, Player } from "@/lib/types";
import { SKIP_VOTE_ID } from "@/lib/types";
import { factionOf, isMafiaRole } from "@/lib/games/mafia-city/roles";

export interface NightResolution {
  deaths: { playerId: string; reason: string }[];
  silencedId: string | null;
  detective: {
    investigatorId: string;
    targetId: string;
    faction: Faction;
  } | null;
  doctorSavedTargetId: string | null;
}

function living(players: Player[]): Player[] {
  return players.filter((p) => p.alive);
}

function byId(players: Player[], id?: string | null): Player | undefined {
  return id ? players.find((p) => p.id === id) : undefined;
}

function mafiaKillActions(actions: NightAction[]): NightAction[] {
  return actions.filter((a) => a.type === "mafia_kill");
}

/** Final mafia hit: boss pick wins; else goon; else first submitted kill. */
function mafiaKillTarget(
  players: Player[],
  actions: NightAction[]
): { targetId: string; attackerId: string } | null {
  const kills = mafiaKillActions(actions);
  if (kills.length === 0) return null;

  const boss = living(players).find((p) => p.role === "mafia_boss");
  const bossAction = boss
    ? kills.find((a) => a.playerId === boss.id)
    : undefined;
  if (boss && bossAction) {
    return { targetId: bossAction.targetId, attackerId: boss.id };
  }

  const goon = living(players).find((p) => p.role === "mafia_goon");
  const goonAction = goon
    ? kills.find((a) => a.playerId === goon.id)
    : undefined;
  if (goon && goonAction) {
    return { targetId: goonAction.targetId, attackerId: goon.id };
  }

  const first = kills[0];
  return first
    ? { targetId: first.targetId, attackerId: first.playerId }
    : null;
}

/** When bodyguard protects A, the mafia member who targeted A dies (goon if both hit A). */
function mafiaAttackerOnTarget(
  players: Player[],
  actions: NightAction[],
  targetId: string
): string | null {
  const hits = mafiaKillActions(actions).filter((a) => a.targetId === targetId);
  if (hits.length === 0) return null;

  const bossHit = hits.find(
    (a) => byId(players, a.playerId)?.role === "mafia_boss"
  );
  const goonHit = hits.find(
    (a) => byId(players, a.playerId)?.role === "mafia_goon"
  );

  if (bossHit && goonHit) return goonHit.playerId;
  if (bossHit) return bossHit.playerId;
  if (goonHit) return goonHit.playerId;
  return hits[0]?.playerId ?? null;
}

export function resolveNight(
  players: Player[],
  actions: NightAction[]
): NightResolution {
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

  const deathReasons = new Map<string, string>();
  const markDead = (id: string, reason: string) => {
    const p = byId(players, id);
    if (!p || !p.alive) return;
    p.alive = false;
    deathReasons.set(id, reason);
  };

  let doctorSavedTargetId: string | null = null;

  const mafiaHit = mafiaKillTarget(players, actions);
  if (mafiaHit) {
    const target = byId(players, mafiaHit.targetId);
    const attacker = byId(players, mafiaHit.attackerId);
    if (target?.alive && attacker?.alive) {
      if (doctorProtect === target.id) {
        doctorSavedTargetId = target.id;
      } else if (bodyguard && bgProtect === target.id && bodyguard.alive) {
        if (bodyguard.id !== target.id) {
          markDead(bodyguard.id, "Died intercepting an attack");
          const mafiaAttacker = mafiaAttackerOnTarget(
            players,
            actions,
            target.id
          );
          if (mafiaAttacker && mafiaAttacker !== bodyguard.id) {
            if (doctorProtect !== mafiaAttacker) {
              markDead(
                mafiaAttacker,
                "Killed while attacking a protected target"
              );
            }
          }
        }
      } else {
        markDead(target.id, "Eliminated overnight");
      }
    }
  }

  const vig = actions.find((a) => a.type === "vigilante_shoot");
  if (vig) {
    const shooter = byId(players, vig.playerId);
    const vigTarget = byId(players, vig.targetId);
    if (
      shooter?.alive &&
      vigTarget?.alive &&
      (shooter.bulletsLeft ?? 0) > 0 &&
      vig.playerId !== vig.targetId
    ) {
      shooter.bulletsLeft = (shooter.bulletsLeft ?? 1) - 1;
      if (doctorProtect === vigTarget.id) {
        doctorSavedTargetId = vigTarget.id;
      } else if (
        bodyguard &&
        bgProtect === vigTarget.id &&
        bodyguard.alive &&
        bodyguard.id !== vigTarget.id
      ) {
        markDead(bodyguard.id, "Died intercepting an attack");
        if (doctorProtect !== shooter.id) {
          markDead(shooter.id, "Killed while attacking a protected target");
        }
      } else {
        markDead(vigTarget.id, "Gunned down overnight");
      }
    }
  }

  const detectiveAction = actions.find((a) => a.type === "detective_inspect");
  const investigator = byId(players, detectiveAction?.playerId);
  const inspected = byId(players, detectiveAction?.targetId);
  const detective =
    investigator?.alive &&
    investigator.role === "detective" &&
    inspected?.role &&
    investigator.id !== inspected.id
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
    doctorSavedTargetId,
  };
}

export function validNightTargets(
  players: Player[],
  actor: Player
): Player[] {
  const others = living(players).filter((p) => p.id !== actor.id);
  switch (actor.role) {
    case "doctor":
    case "bodyguard":
      return others;
    case "detective":
    case "vigilante":
      return others;
    case "blackmailer":
      return others.filter((p) => !isMafiaRole(p.role));
    case "mafia_boss":
    case "mafia_goon":
      return others;
    default:
      return [];
  }
}

export function winCheck(players: Player[]): "town" | "mafia" | null {
  const alive = living(players);
  const mafia = alive.filter((p) => isMafiaRole(p.role)).length;
  const town = alive.length - mafia;
  if (mafia === 0) return "town";
  if (mafia > town) return "mafia";
  return null;
}

export function majorityThreshold(livingCount: number): number {
  return Math.floor(livingCount / 2) + 1;
}

function eligibleVoters(players: Player[]): Player[] {
  const alive = living(players);
  const livingVoters = alive.filter((p) => !p.blackmailed);
  const deadVillagers = players.filter(
    (p) => !p.alive && p.role === "villager"
  );
  return [...livingVoters, ...deadVillagers];
}

export function tallyLynch(
  players: Player[],
  votes: Record<string, string>
): string | null {
  const alive = living(players);
  const needed = majorityThreshold(alive.length);
  const counts = new Map<string, number>();

  for (const voter of eligibleVoters(players)) {
    const target = votes[voter.id];
    if (!target) continue;
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }

  const skipVotes = counts.get(SKIP_VOTE_ID) ?? 0;
  if (skipVotes >= needed) return SKIP_VOTE_ID;

  let best: { id: string; n: number } | null = null;
  let tie = false;
  for (const [id, n] of counts) {
    if (id === SKIP_VOTE_ID) continue;
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
