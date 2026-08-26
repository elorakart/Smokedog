import type { Role, RoleDistribution, RoomSettings } from "@/lib/types";
import { TOWN_POWER_ROLES } from "./roles";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const ROLE_KEYS: (keyof RoleDistribution)[] = [
  "villager",
  "doctor",
  "detective",
  "bodyguard",
  "vigilante",
  "soldier",
  "juggler",
  "drunk",
  "mafia_boss",
  "mafia_goon",
  "blackmailer",
  "poisoner",
];

export type RoleAssignment = {
  role: Role;
  fakeRole?: Role;
};

export function emptyRoleDistribution(): RoleDistribution {
  return {
    villager: 0,
    doctor: 0,
    detective: 0,
    bodyguard: 0,
    vigilante: 0,
    soldier: 0,
    juggler: 0,
    drunk: 0,
    mafia_boss: 1,
    mafia_goon: 0,
    blackmailer: 0,
    poisoner: 0,
  };
}

export function defaultRoleDistribution(playerCount: number): RoleDistribution {
  const dist = emptyRoleDistribution();

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

/** Merge older saved distributions missing new role keys. */
export function normalizeRoleDistribution(
  dist: Partial<RoleDistribution> | null | undefined,
  playerCount: number
): RoleDistribution {
  const base = emptyRoleDistribution();
  if (!dist) return defaultRoleDistribution(playerCount);
  for (const key of ROLE_KEYS) {
    base[key] = Math.max(0, dist[key] ?? 0);
  }
  if (base.mafia_boss < 1) base.mafia_boss = 1;
  const assigned = ROLE_KEYS.filter((k) => k !== "villager").reduce(
    (s, k) => s + base[k],
    0
  );
  base.villager = Math.max(0, playerCount - assigned);
  return base;
}

function validateRoleDistribution(
  dist: RoleDistribution,
  playerCount: number
): void {
  const total = ROLE_KEYS.reduce((sum, key) => sum + (dist[key] ?? 0), 0);
  if (total !== playerCount) {
    throw new Error(
      `Role count (${total}) must equal player count (${playerCount})`
    );
  }
  if (dist.mafia_boss < 1) {
    throw new Error("Need at least one Mafia Boss");
  }
  if (dist.juggler > 0 && playerCount <= 10) {
    throw new Error("Juggler requires more than 10 players");
  }
  const townPowersInDeck = TOWN_POWER_ROLES.reduce(
    (sum, role) => sum + (dist[role as keyof RoleDistribution] ?? 0),
    0
  );
  if (dist.drunk > townPowersInDeck) {
    throw new Error(
      "Each Drunk needs a town power role in the lineup to steal as their fake role"
    );
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
): RoleAssignment[] {
  if (playerCount < 4) {
    throw new Error("Need at least 4 players");
  }

  const dist = normalizeRoleDistribution(
    settings.roleDistribution,
    playerCount
  );
  validateRoleDistribution(dist, playerCount);

  const bag: Role[] = [];
  for (const key of ROLE_KEYS) {
    const count = dist[key];
    for (let i = 0; i < count; i++) {
      bag.push(key);
    }
  }

  const deals: RoleAssignment[] = [];
  const remaining = [...bag];

  // Resolve Drunks: steal a town power copy from the deck as fakeRole.
  while (remaining.includes("drunk")) {
    const drunkIdx = remaining.indexOf("drunk");
    remaining.splice(drunkIdx, 1);
    const candidates = TOWN_POWER_ROLES.filter((r) => remaining.includes(r));
    if (candidates.length === 0) {
      throw new Error("Drunk deal failed — no town power role left to fake");
    }
    const fakeRole =
      candidates[Math.floor(Math.random() * candidates.length)]!;
    const fakeIdx = remaining.indexOf(fakeRole);
    remaining.splice(fakeIdx, 1);
    deals.push({ role: "drunk", fakeRole });
  }

  for (const role of remaining) {
    deals.push({ role });
  }

  return shuffle(deals);
}

/** Flat Role[] for GameModule interface — fakeRole applied in startGame via assignMafiaCityRoleDeals. */
export function assignMafiaCityRoleList(
  playerCount: number,
  settings: RoomSettings
): Role[] {
  return assignMafiaCityRoles(playerCount, settings).map((d) => d.role);
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
