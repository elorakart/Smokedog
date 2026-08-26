import type { Faction, NightActionType, Player, Role } from "@/lib/types";

export const MAFIA_ROLES: Role[] = [
  "mafia_boss",
  "mafia_goon",
  "blackmailer",
  "poisoner",
];

/** Town power roles the Drunk may be shown as (never Villager). */
export const TOWN_POWER_ROLES: Role[] = [
  "doctor",
  "detective",
  "bodyguard",
  "vigilante",
  "soldier",
  "juggler",
];

export const ROLE_META: Record<
  Role,
  { label: string; faction: Faction; ability: string }
> = {
  villager: {
    label: "Villager",
    faction: "town",
    ability: "Vote during the day. Trust no one.",
  },
  doctor: {
    label: "Doctor",
    faction: "town",
    ability: "Protect one player each night from elimination.",
  },
  detective: {
    label: "Detective",
    faction: "town",
    ability: "Investigate one player each night to learn their alignment.",
  },
  bodyguard: {
    label: "Bodyguard",
    faction: "town",
    ability:
      "Protect one player. If they are attacked, you die instead and kill the attacker.",
  },
  vigilante: {
    label: "Vigilante",
    faction: "town",
    ability: "Shoot a player at night. Bullets are limited. You may skip a night.",
  },
  soldier: {
    label: "Soldier",
    faction: "town",
    ability:
      "Immune to the mafia's direct night kill unless poisoned that night.",
  },
  juggler: {
    label: "Juggler",
    faction: "town",
    ability:
      "Once per game during the day, pick four players and learn how many are evil.",
  },
  drunk: {
    label: "Drunk",
    faction: "town",
    ability:
      "You believe you hold a town power role — your actions are unreliable.",
  },
  mafia_boss: {
    label: "Mafia Boss",
    faction: "mafia",
    ability: "Lead the night kill. Your target is the final mafia vote.",
  },
  mafia_goon: {
    label: "Mafia Goon",
    faction: "mafia",
    ability: "Conspire in the shadows and vote on the nightly hit.",
  },
  blackmailer: {
    label: "Blackmailer",
    faction: "mafia",
    ability:
      "Silence one player at night. They cannot chat or vote the next day.",
  },
  poisoner: {
    label: "Poisoner",
    faction: "mafia",
    ability:
      "Poison one player each night. Their power fails that night unless the Doctor clears it.",
  },
};

export function factionOf(role: Role): Faction {
  return ROLE_META[role].faction;
}

export function isMafiaRole(role?: Role): boolean {
  return !!role && MAFIA_ROLES.includes(role);
}

export function isEvilRole(role?: Role): boolean {
  return isMafiaRole(role);
}

/** Role the player acts / sees as (Drunk uses fakeRole). */
export function effectiveRole(player: Player | { role?: Role; fakeRole?: Role }): Role | undefined {
  if (player.role === "drunk" && player.fakeRole) return player.fakeRole;
  return player.role;
}

export function nightActionFor(role?: Role): NightActionType | null {
  switch (role) {
    case "doctor":
      return "doctor_protect";
    case "detective":
      return "detective_inspect";
    case "bodyguard":
      return "bodyguard_protect";
    case "vigilante":
      return "vigilante_shoot";
    case "blackmailer":
      return "blackmail";
    case "poisoner":
      return "poison";
    case "mafia_boss":
    case "mafia_goon":
      return "mafia_kill";
    default:
      return null;
  }
}

/** Night action for this player (respects Drunk fakeRole). */
export function nightActionForPlayer(player: Player): NightActionType | null {
  return nightActionFor(effectiveRole(player));
}
