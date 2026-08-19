import type { Faction, Role } from "@/lib/types";

export const MAFIA_ROLES: Role[] = ["mafia_boss", "mafia_goon", "blackmailer"];

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
    ability: "Shoot a player at night. Bullets are limited.",
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
};

export function factionOf(role: Role): Faction {
  return ROLE_META[role].faction;
}

export function isMafiaRole(role?: Role): boolean {
  return !!role && MAFIA_ROLES.includes(role);
}

export function nightActionFor(role?: Role): string | null {
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
    case "mafia_boss":
    case "mafia_goon":
      return "mafia_kill";
    default:
      return null;
  }
}
