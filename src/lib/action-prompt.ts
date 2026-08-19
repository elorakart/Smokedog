import { nightActionFor } from "@/lib/games/mafia-city/roles";
import type { PublicGameState } from "@/lib/types";

export const NIGHT_ACTION_PROMPTS: Record<
  import("@/lib/types").NightActionType,
  string
> = {
  mafia_kill: "Mark someone for the hit",
  doctor_protect: "Choose someone to heal",
  detective_inspect: "Investigate an alignment",
  bodyguard_protect: "Stand in front of someone",
  vigilante_shoot: "Fire a round",
  blackmail: "Silence a civilian",
};

export const NIGHT_ACTION_LOCKED: Record<
  import("@/lib/types").NightActionType,
  (name: string) => string
> = {
  mafia_kill: (name) => `You marked ${name} for the hit`,
  doctor_protect: (name) => `You will heal ${name}`,
  detective_inspect: (name) => `You are investigating ${name}`,
  bodyguard_protect: (name) => `You are guarding ${name}`,
  vigilante_shoot: (name) => `You aimed at ${name}`,
  blackmail: (name) => `You silenced ${name}`,
};

export function pendingPlayerAction(state: PublicGameState): {
  title: string;
  detail: string;
} | null {
  const you = state.you;
  if (!you?.alive) return null;

  if (state.phase === "night") {
    const type = you.role
      ? (nightActionFor(you.role) as import("@/lib/types").NightActionType | null)
      : null;
    const noBullets = you.role === "vigilante" && (you.bulletsLeft ?? 0) <= 0;
    if (!type || noBullets) return null;
    if (state.submittedNightAction) return null;
    return {
      title: "Action needed",
      detail: NIGHT_ACTION_PROMPTS[type],
    };
  }

  if (state.phase === "day" && state.daySubPhase === "vote") {
    if (you.blackmailed) return null;
    if (state.votes[you.id]) return null;
    return {
      title: "Vote needed",
      detail: "Cast your lynch vote or skip before time runs out",
    };
  }

  return null;
}

export function pendingFiveAliveActionPrompt(state: PublicGameState): {
  title: string;
  detail: string;
} | null {
  if (state.gameId !== "five-alive") return null;
  const you = state.you;
  if (!you?.alive) return null;
  const five = state.fiveAlive;
  if (!five) return null;

  if (state.phase === "fivealive_turn") {
    if (five.turnPlayerId !== you.id) return null;
    return {
      title: "Play a card",
      detail: `Running total: ${five.runningTotal} (keep ≤ 21)`,
    };
  }

  if (state.phase === "fivealive_bomb") {
    if (five.bombAwaitingPlayerId !== you.id) return null;
    return {
      title: "Bomb response needed",
      detail: `Play a number 0 (or pass to lose 1 life)`,
    };
  }

  return null;
}
