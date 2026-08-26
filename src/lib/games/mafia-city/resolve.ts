import type { Faction, NightAction, Player, Role } from "@/lib/types";
import { SKIP_VOTE_ID } from "@/lib/types";
import {
  effectiveRole,
  factionOf,
  isEvilRole,
  isMafiaRole,
  nightActionForPlayer,
} from "@/lib/games/mafia-city/roles";

export interface NightDeath {
  playerId: string;
  reason: string;
  /** Who caused this death (attacker / protector), when known. */
  actorId: string | null;
  actorRole: Role | null;
}

export type NightPowerLog = {
  actorId: string;
  actorRole: Role;
  type: string;
  targetId: string | null;
  outcome: string;
};

export interface NightResolution {
  deaths: NightDeath[];
  silencedId: string | null;
  blackmailerId: string | null;
  detective: {
    investigatorId: string;
    targetId: string;
    faction: Faction;
    interrupted: boolean;
  } | null;
  doctorSavedTargetId: string | null;
  doctorId: string | null;
  powerLogs: NightPowerLog[];
  poisonClearedTargetId: string | null;
  soldierBlockedTargetId: string | null;
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

/** ~90% chance the Drunk's action is false / inert. */
function drunkLies(): boolean {
  return Math.random() < 0.9;
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

  if (boss && bossAction) {
    return { targetId: bossAction.targetId, attackerId: boss.id };
  }
  if (goon && goonAction) {
    return { targetId: goonAction.targetId, attackerId: goon.id };
  }

  const first = kills[0];
  return first
    ? { targetId: first.targetId, attackerId: first.playerId }
    : null;
}

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
  const powerLogs: NightPowerLog[] = [];
  const logPower = (
    actor: Player,
    type: string,
    targetId: string | null,
    outcome: string
  ) => {
    powerLogs.push({
      actorId: actor.id,
      actorRole: actor.role ?? effectiveRole(actor) ?? "villager",
      type,
      targetId,
      outcome,
    });
  };

  // Reset poison flags from prior night, then apply tonight's poison.
  for (const p of players) p.poisoned = false;

  const poisonAction = actions.find((a) => a.type === "poison");
  const poisoner = byId(players, poisonAction?.playerId);
  if (
    poisonAction &&
    poisoner?.alive &&
    poisoner.role === "poisoner" &&
    poisonAction.targetId !== poisoner.id
  ) {
    const target = byId(players, poisonAction.targetId);
    if (target?.alive) {
      target.poisoned = true;
      logPower(
        poisoner,
        "poison",
        target.id,
        `Poisoned ${target.name} for the night.`
      );
    }
  } else if (poisonAction && poisoner) {
    logPower(poisoner, "poison", poisonAction.targetId, "Poison failed.");
  }

  let poisonClearedTargetId: string | null = null;
  let doctorProtect: string | undefined;
  let doctorActor: Player | undefined;
  let doctorSavedTargetId: string | null = null;
  let doctorId: string | null = null;

  const doctorAction = actions.find((a) => a.type === "doctor_protect");
  if (doctorAction) {
    doctorActor = byId(players, doctorAction.playerId);
    const isDrunkDoc = doctorActor?.role === "drunk";
    const realDoc =
      doctorActor?.alive &&
      (doctorActor.role === "doctor" ||
        (isDrunkDoc && doctorActor.fakeRole === "doctor"));

    if (doctorActor && realDoc) {
      if (doctorActor.poisoned) {
        logPower(
          doctorActor,
          "doctor_protect",
          doctorAction.targetId,
          "Investigation interrupted — Doctor was poisoned; protect failed."
        );
      } else if (isDrunkDoc && drunkLies()) {
        logPower(
          doctorActor,
          "doctor_protect",
          doctorAction.targetId,
          "Drunk Doctor believed they protected someone — no effect."
        );
      } else {
        const target = byId(players, doctorAction.targetId);
        if (target?.alive) {
          if (target.poisoned) {
            target.poisoned = false;
            poisonClearedTargetId = target.id;
            logPower(
              doctorActor,
              "doctor_protect",
              target.id,
              `Protected ${target.name} and cleared poison.`
            );
          } else {
            logPower(
              doctorActor,
              "doctor_protect",
              target.id,
              `Protected ${target.name}.`
            );
          }
          doctorProtect = target.id;
        }
      }
    }
  }

  // Blackmail
  let silencedId: string | null = null;
  let blackmailerId: string | null = null;
  const blackmail = actions.find((a) => a.type === "blackmail");
  const blackmailer = byId(players, blackmail?.playerId);
  if (
    blackmail &&
    blackmailer?.alive &&
    blackmailer.role === "blackmailer"
  ) {
    if (blackmailer.poisoned) {
      logPower(
        blackmailer,
        "blackmail",
        blackmail.targetId,
        "Blackmail interrupted — Poisoner blocked their power."
      );
    } else {
      const silenced = byId(players, blackmail.targetId);
      if (silenced?.alive && !isMafiaRole(silenced.role)) {
        silenced.blackmailed = true;
        silencedId = silenced.id;
        blackmailerId = blackmailer.id;
        logPower(
          blackmailer,
          "blackmail",
          silenced.id,
          `Blackmailed ${silenced.name}.`
        );
      } else {
        logPower(blackmailer, "blackmail", blackmail.targetId, "Blackmail failed.");
      }
    }
  }

  // Bodyguard protect registration
  let bgProtect: string | undefined;
  const bgAction = actions.find((a) => a.type === "bodyguard_protect");
  const bodyguard = byId(players, bgAction?.playerId);
  if (bgAction && bodyguard?.alive) {
    const isDrunkBg =
      bodyguard.role === "drunk" && bodyguard.fakeRole === "bodyguard";
    const realBg = bodyguard.role === "bodyguard" || isDrunkBg;
    if (realBg) {
      if (bodyguard.poisoned) {
        logPower(
          bodyguard,
          "bodyguard_protect",
          bgAction.targetId,
          "Bodyguard was poisoned — guard failed."
        );
      } else if (isDrunkBg && drunkLies()) {
        logPower(
          bodyguard,
          "bodyguard_protect",
          bgAction.targetId,
          "Drunk Bodyguard believed they guarded — no effect."
        );
      } else {
        bgProtect = bgAction.targetId;
        logPower(
          bodyguard,
          "bodyguard_protect",
          bgAction.targetId,
          `Guarding target.`
        );
      }
    }
  }
  const activeBodyguard =
    bodyguard?.alive && bgProtect ? bodyguard : null;

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

  let soldierBlockedTargetId: string | null = null;

  const mafiaHit = mafiaKillTarget(players, actions);
  if (mafiaHit) {
    const target = byId(players, mafiaHit.targetId);
    const attacker = byId(players, mafiaHit.attackerId);
    if (target?.alive && attacker?.alive) {
      logPower(
        attacker,
        "mafia_kill",
        target.id,
        `Mafia marked ${target.name}.`
      );

      const soldierImmune =
        target.role === "soldier" && !target.poisoned;

      if (soldierImmune) {
        soldierBlockedTargetId = target.id;
        logPower(
          attacker,
          "mafia_kill",
          target.id,
          `${target.name} (Soldier) shrugged off the mafia hit.`
        );
      } else if (doctorProtect === target.id) {
        doctorSavedTargetId = target.id;
        doctorId =
          doctorActor?.alive &&
          (doctorActor.role === "doctor" ||
            (doctorActor.role === "drunk" &&
              doctorActor.fakeRole === "doctor"))
            ? doctorActor.id
            : living(players).find((p) => p.role === "doctor")?.id ?? null;
      } else if (
        activeBodyguard &&
        bgProtect === target.id &&
        activeBodyguard.alive
      ) {
        if (activeBodyguard.id !== target.id) {
          markDead(
            activeBodyguard.id,
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
          if (mafiaAttacker && mafiaAttacker.id !== activeBodyguard.id) {
            if (doctorProtect !== mafiaAttacker.id) {
              markDead(
                mafiaAttacker.id,
                "Killed while attacking a protected target",
                activeBodyguard.id,
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

  // Vigilante
  const vig = actions.find((a) => a.type === "vigilante_shoot");
  if (vig) {
    const shooter = byId(players, vig.playerId);
    const isDrunkVig =
      shooter?.role === "drunk" && shooter.fakeRole === "vigilante";
    const realVig =
      shooter?.alive &&
      (shooter.role === "vigilante" || isDrunkVig);

    if (shooter && realVig) {
      if (vig.targetId === SKIP_VOTE_ID) {
        logPower(shooter, "vigilante_shoot", null, "Skipped the night — no shot.");
      } else if (shooter.poisoned) {
        logPower(
          shooter,
          "vigilante_shoot",
          vig.targetId,
          "Vigilante was poisoned — shot interrupted."
        );
      } else if (isDrunkVig && drunkLies()) {
        logPower(
          shooter,
          "vigilante_shoot",
          vig.targetId,
          "Drunk Vigilante believed they fired — no bullet left the chamber."
        );
        // Still burn a fake bullet feel? Don't change real bullets for drunk.
      } else if ((shooter.bulletsLeft ?? 0) > 0 || isDrunkVig) {
        const vigTarget = byId(players, vig.targetId);
        if (
          vigTarget?.alive &&
          vig.playerId !== vig.targetId
        ) {
          if (!isDrunkVig) {
            shooter.bulletsLeft = (shooter.bulletsLeft ?? 1) - 1;
          }
          if (doctorProtect === vigTarget.id) {
            doctorSavedTargetId = vigTarget.id;
            doctorId =
              doctorActor?.alive &&
              (doctorActor.role === "doctor" ||
                (doctorActor.role === "drunk" &&
                  doctorActor.fakeRole === "doctor"))
                ? doctorActor.id
                : living(players).find((p) => p.role === "doctor")?.id ??
                  null;
            logPower(
              shooter,
              "vigilante_shoot",
              vigTarget.id,
              `Shot at ${vigTarget.name} — blocked by Doctor.`
            );
          } else if (
            activeBodyguard &&
            bgProtect === vigTarget.id &&
            activeBodyguard.alive &&
            activeBodyguard.id !== vigTarget.id
          ) {
            markDead(
              activeBodyguard.id,
              "Died intercepting an attack",
              shooter.id,
              shooter.role ?? null
            );
            if (doctorProtect !== shooter.id) {
              markDead(
                shooter.id,
                "Killed while attacking a protected target",
                activeBodyguard.id,
                "bodyguard"
              );
            }
            logPower(
              shooter,
              "vigilante_shoot",
              vigTarget.id,
              `Shot at ${vigTarget.name} — Bodyguard intercepted.`
            );
          } else {
            markDead(
              vigTarget.id,
              "Gunned down overnight",
              shooter.id,
              shooter.role ?? null
            );
            logPower(
              shooter,
              "vigilante_shoot",
              vigTarget.id,
              `Shot ${vigTarget.name}.`
            );
          }
        }
      }
    }
  }

  // Detective
  let detective: NightResolution["detective"] = null;
  const detectiveAction = actions.find((a) => a.type === "detective_inspect");
  const investigator = byId(players, detectiveAction?.playerId);
  if (detectiveAction && investigator) {
    const isDrunkDet =
      investigator.role === "drunk" && investigator.fakeRole === "detective";
    const realDet =
      investigator.role === "detective" || isDrunkDet;
    const inspected = byId(players, detectiveAction.targetId);

    if (realDet && inspected?.role && investigator.id !== inspected.id) {
      if (investigator.poisoned) {
        detective = {
          investigatorId: investigator.id,
          targetId: inspected.id,
          faction: factionOf(inspected.role),
          interrupted: true,
        };
        logPower(
          investigator,
          "detective_inspect",
          inspected.id,
          "Investigation interrupted — Detective was poisoned."
        );
      } else {
        let faction = factionOf(inspected.role);
        if (isDrunkDet && drunkLies()) {
          faction = faction === "mafia" ? "town" : "mafia";
        }
        detective = {
          investigatorId: investigator.id,
          targetId: inspected.id,
          faction,
          interrupted: false,
        };
        logPower(
          investigator,
          "detective_inspect",
          inspected.id,
          isDrunkDet
            ? `Drunk Detective read ${inspected.name} as ${faction}.`
            : `Investigated ${inspected.name} — ${faction}.`
        );
      }
    }
  }

  // Clear poison at end of night (1-night duration).
  for (const p of players) p.poisoned = false;

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
    powerLogs,
    poisonClearedTargetId,
    soldierBlockedTargetId,
  };
}

export function validNightTargets(
  players: Player[],
  actor: Player
): Player[] {
  const others = living(players).filter((p) => p.id !== actor.id);
  const role = effectiveRole(actor);
  switch (role) {
    case "doctor":
    case "bodyguard":
    case "detective":
    case "vigilante":
    case "poisoner":
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

export function eligibleVoters(players: Player[]): Player[] {
  return players.filter(playerCanDayVote);
}

/**
 * Plurality vote-out: the unique top vote-getter is eliminated.
 * Skip is a normal option — unique top skip means no elimination.
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

export function countEvilAmong(
  players: Player[],
  targetIds: string[]
): number {
  let n = 0;
  for (const id of targetIds) {
    const p = byId(players, id);
    if (p && isEvilRole(p.role)) n += 1;
  }
  return n;
}

/** Promote Poisoner/Blackmailer to Goon when Boss dies and no Goon remains. */
export function promoteMafiaAfterBossDeath(
  players: Player[],
  deadBossId: string
): { promoted: Player; fromRole: Role } | null {
  const boss = byId(players, deadBossId);
  if (!boss || boss.role !== "mafia_boss" || boss.alive) return null;

  const livingGoon = living(players).find((p) => p.role === "mafia_goon");
  if (livingGoon) return null;

  const candidates = living(players).filter(
    (p) => p.role === "poisoner" || p.role === "blackmailer"
  );
  if (candidates.length === 0) return null;

  const pick =
    candidates[Math.floor(Math.random() * candidates.length)]!;
  const fromRole = pick.role!;
  pick.role = "mafia_goon";
  return { promoted: pick, fromRole };
}

export { nightActionForPlayer, effectiveRole };
