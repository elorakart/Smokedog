import type { Role, RoleDistribution, RoomSettings } from "@/lib/types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const ROLE_KEYS: (keyof RoleDistribution)[] = [
  "villager",
  "doctor",
  "detective",
  "bodyguard",
  "vigilante",
  "mafia_boss",
  "mafia_goon",
  "blackmailer",
];

export function defaultRoleDistribution(playerCount: number): RoleDistribution {
  const dist: RoleDistribution = {
    villager: 0,
    doctor: 0,
    detective: 0,
    bodyguard: 0,
    vigilante: 0,
    mafia_boss: 1,
    mafia_goon: 0,
    blackmailer: 0,
  };

  if (playerCount <= 5) {
    dist.doctor = 1;
    dist.detective = 1;
  } else if (playerCount <= 7) {
    dist.blackmailer = 1;
    dist.doctor = 1;
    dist.detective = 1;
    dist.vigilante = 1;
  } else if (playerCount <= 10) {
    dist.blackmailer = 1;
    dist.doctor = 1;
    dist.detective = 1;
    dist.bodyguard = 1;
    dist.vigilante = 1;
    if (playerCount >= 9) dist.mafia_goon = 1;
  } else {
    dist.blackmailer = 1;
    dist.mafia_goon = 1;
    dist.doctor = 1;
    dist.detective = 1;
    dist.bodyguard = 1;
    dist.vigilante = 1;
  }

  const assigned = ROLE_KEYS.reduce((sum, key) => sum + dist[key], 0);
  dist.villager = Math.max(0, playerCount - assigned);
  return dist;
}

function validateRoleDistribution(
  dist: RoleDistribution,
  playerCount: number
): void {
  const total = ROLE_KEYS.reduce((sum, key) => sum + (dist[key] ?? 0), 0);
  if (total !== playerCount) {
    throw new Error(`Role count (${total}) must equal player count (${playerCount})`);
  }
  if (dist.mafia_boss < 1) {
    throw new Error("Need at least one Mafia Boss");
  }
  for (const key of ROLE_KEYS) {
    if ((dist[key] ?? 0) < 0) {
      throw new Error(`Invalid negative count for ${key}`);
    }
  }
}

export function assignMafiaCityRoles(
  playerCount: number,
  settings: RoomSettings
): Role[] {
  if (playerCount < 4) {
    throw new Error("Need at least 4 players");
  }

  const dist =
    settings.roleDistribution ?? defaultRoleDistribution(playerCount);
  validateRoleDistribution(dist, playerCount);

  const roles: Role[] = [];
  for (const key of ROLE_KEYS) {
    const count = dist[key];
    for (let i = 0; i < count; i++) {
      roles.push(key);
    }
  }

  return shuffle(roles);
}

export function bulletsForLobby(
  playerCount: number,
  settings: RoomSettings
): number {
  if (settings.vigilanteBullets != null) return settings.vigilanteBullets;
  if (playerCount <= 7) return 1;
  if (playerCount >= 10) return 3;
  return 2;
}
