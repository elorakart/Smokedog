import type { DcCardInstance } from "./cards";
import { isCatType } from "./cards";

export function botDcDelayMs(): number {
  return 800 + Math.floor(Math.random() * 1200);
}

export function pickBotDcPlay(hand: DcCardInstance[]): {
  cardIds: string[];
  endTurn: boolean;
} | null {
  const action = hand.find(
    (c) =>
      c.type === "skip" ||
      c.type === "attack" ||
      c.type === "shuffle" ||
      c.type === "see_future"
  );
  if (action && Math.random() < 0.35) {
    return { cardIds: [action.id], endTurn: action.type === "skip" || action.type === "attack" };
  }

  const cats = hand.filter((c) => isCatType(c.type));
  if (cats.length >= 2 && Math.random() < 0.2) {
    const type = cats[0]!.type;
    const pair = cats.filter((c) => c.type === type).slice(0, 2);
    if (pair.length === 2) {
      return { cardIds: pair.map((c) => c.id), endTurn: false };
    }
  }

  return null;
}

export function pickBotDefusePosition(deckSize: number): number {
  return Math.floor(Math.random() * (deckSize + 1));
}

export function pickBotStealTarget(
  playerIds: string[],
  selfId: string
): string | null {
  const others = playerIds.filter((id) => id !== selfId);
  if (others.length === 0) return null;
  return others[Math.floor(Math.random() * others.length)] ?? null;
}

export function pickBotDiscardIndex(discardSize: number): number {
  if (discardSize <= 0) return 0;
  return Math.floor(Math.random() * discardSize);
}
