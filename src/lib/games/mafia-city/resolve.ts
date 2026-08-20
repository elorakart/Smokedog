import type { Faction, NightAction, Player, Role } from "@/lib/types";
import { factionOf, isMafiaRole } from "@/lib/games/mafia-city/roles";

export interface NightDeath {
  playerId: string;
  reason: string;
  /** Who caused this death (attacker / protector), when known. */
  actorId: string | null;
  actorRole: Role | null;
}

export interface NightResolution {
  deaths: NightDeath[];
  silencedId: string | null;
  blackmailerId: string | null;
  detective: {
    investigatorId: string;
    targetId: string;
    faction: Faction;
  } | null;
  doctorSavedTargetId: string | null;
  doctorId: string | null;
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

/** Final mafia hit: exactly one victim. Boss pick wins over goon. */
function mafiaKillTarget(
  players: Player[],
  actions: NightAction[]
): { targetId: string; attackerId: string } | null {
  const kills = mafiaKillActions(actions);
  if (kills.length === 0) return null;

  const boss = living(players).find((p) => p.role === "mafia_boss");
  const goon = living(players).find((p) => p.role === "mafia_goon");

  const bossAction = boss
    ? kills.find((a) => a.playerId === boss.id)
    : undefined;
  const goonAction = goon
    ? kills.find((a) => a.playerId === goon.id)
    : undefined;

  // Boss submitted → boss target only (goon vote ignored for kill).
  if (boss && bossAction) {
    return { targetId: bossAction.targetId, attackerId: boss.id };
  }
  // Boss silent → goon target.
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
  const blackmailer = byId(players, blackmail?.playerId);
  const silenced = byId(players, blackmail?.targetId);
  const silencedId =
    silenced && silenced.alive && !isMafiaRole(silenced.role)
      ? silenced.id
      : null;
  const blackmailerId =
    silencedId && blackmailer?.alive && blackmailer.role === "blackmailer"
      ? blackmailer.id
      : null;
  if (silencedId) {
    const target = byId(players, silencedId);
    if (target) target.blackmailed = true;
  }

  const doctorAction = actions.find((a) => a.type === "doctor_protect");
  const doctorProtect = doctorAction?.targetId;
  const doctorActor = byId(players, doctorAction?.playerId);
  const bgProtect = actions.find((a) => a.type === "bodyguard_protect")
    ?.targetId;
  const bodyguard = living(players).find((p) => p.role === "bodyguard");

  const deathMeta = new Map<
    string,
    { reason: string; actorId: string | null; actorRole: Role | null }
  >();
  const markDead = (
    id: string,
    reason: string,
    actorId: string | null = null,
    actorRole: Role | null = null
  ) => {
    const p = byId(players, id);
    if (!p || !p.alive) return;
    p.alive = false;
    deathMeta.set(id, { reason, actorId, actorRole });
  };

  let doctorSavedTargetId: string | null = null;
  let doctorId: string | null = null;

  const mafiaHit = mafiaKillTarget(players, actions);
  // Guarantee a single mafia murder attempt this night (boss/goon share one kill).
  if (mafiaHit) {
    const target = byId(players, mafiaHit.targetId);
    const attacker = byId(players, mafiaHit.attackerId);
    if (target?.alive && attacker?.alive) {
      if (doctorProtect === target.id) {
        doctorSavedTargetId = target.id;
        doctorId =
          doctorActor?.alive && doctorActor.role === "doctor"
            ? doctorActor.id
            : living(players).find((p) => p.role === "doctor")?.id ?? null;
      } else if (bodyguard && bgProtect === target.id && bodyguard.alive) {
        if (bodyguard.id !== target.id) {
          markDead(
            bodyguard.id,
            "Died intercepting an attack",
            attacker.id,
            attacker.role ?? null
          );
          const mafiaAttackerId = mafiaAttackerOnTarget(
            players,
            actions,
            target.id
          );
          const mafiaAttacker = byId(players, mafiaAttackerId);
          if (mafiaAttacker && mafiaAttacker.id !== bodyguard.id) {
            if (doctorProtect !== mafiaAttacker.id) {
              markDead(
                mafiaAttacker.id,
                "Killed while attacking a protected target",
                bodyguard.id,
                "bodyguard"
              );
            }
          }
        }
      } else {
        markDead(
          target.id,
          "Eliminated overnight",
          attacker.id,
          attacker.role ?? null
        );
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
        doctorId =
          doctorActor?.alive && doctorActor.role === "doctor"
            ? doctorActor.id
            : living(players).find((p) => p.role === "doctor")?.id ?? null;
      } else if (
        bodyguard &&
        bgProtect === vigTarget.id &&
        bodyguard.alive &&
        bodyguard.id !== vigTarget.id
      ) {
        markDead(
          bodyguard.id,
          "Died intercepting an attack",
          shooter.id,
          shooter.role ?? null
        );
        if (doctorProtect !== shooter.id) {
          markDead(
            shooter.id,
            "Killed while attacking a protected target",
            bodyguard.id,
            "bodyguard"
          );
        }
      } else {
        markDead(
          vigTarget.id,
          "Gunned down overnight",
          shooter.id,
          shooter.role ?? null
        );
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
    deaths: [...deathMeta.entries()].map(([playerId, meta]) => ({
      playerId,
      reason: meta.reason,
      actorId: meta.actorId,
      actorRole: meta.actorRole,
    })),
    silencedId,
    blackmailerId,
    detective,
    doctorSavedTargetId,
    doctorId,
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

/** Living non-blackmailed players, plus dead villagers (who keep a vote). */
export function playerCanDayVote(p: Player): boolean {
  if (p.alive) return !p.blackmailed;
  return p.role === "villager";
}

/** Roster for the day vote tally — not the full seat count. */
export function eligibleVoters(players: Player[]): Player[] {
  return players.filter(playerCanDayVote);
}

/**
 * Plurality lynch: the unique top vote-getter is eliminated.
 * Skip is a normal option — unique top skip means no hang.
 * Any tie for first (including vs skip) means no lynch.
 */
export function tallyLynch(
  players: Player[],
  votes: Record<string, string>
): string | null {
  const counts = new Map<string, number>();

  for (const voter of eligibleVoters(players)) {
    const target = votes[voter.id];
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
  if (!best || tie || best.n < 1) return null;
  return best.id;
}
