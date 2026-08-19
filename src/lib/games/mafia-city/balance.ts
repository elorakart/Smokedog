import type { Role, RoomSettings } from "@/lib/types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function defaultVigilanteBullets(playerCount: number): number {
  return playerCount <= 6 ? 1 : 2;
}

export function assignMafiaCityRoles(
  playerCount: number,
  settings: RoomSettings
): Role[] {
  if (playerCount < 4) {
    throw new Error("Need at least 4 players");
  }

  const roles: Role[] = [];

  if (playerCount <= 5) {
    roles.push("mafia_boss", "doctor", "detective");
  } else if (playerCount <= 7) {
    roles.push("mafia_boss", "blackmailer", "doctor", "detective", "vigilante");
  } else if (playerCount <= 10) {
    roles.push(
      "mafia_boss",
      "blackmailer",
      "doctor",
      "detective",
      "bodyguard",
      "vigilante"
    );
    if (playerCount >= 9) roles.push("mafia_goon");
  } else {
    roles.push(
      "mafia_boss",
      "blackmailer",
      "mafia_goon",
      "doctor",
      "detective",
      "bodyguard",
      "vigilante"
    );
  }

  while (roles.length < playerCount) {
    roles.push("villager");
  }

  return shuffle(roles.slice(0, playerCount));
}

export function bulletsForLobby(
  playerCount: number,
  settings: RoomSettings
): number {
  if (settings.vigilanteBullets != null) return settings.vigilanteBullets;
  if (playerCount <= 7) return 1;
  return 2;
}
