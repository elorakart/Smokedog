import type { FiveAliveCardInstance } from "./cards";
import { isNumber0 } from "./cards";

function pick<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function botFiveAliveDelayMs(): number {
  return 1500 + Math.floor(Math.random() * 4500);
}

export function pickBotFiveAliveTurnPlay(
  hand: FiveAliveCardInstance[],
  runningTotal: number
): { cardId: string; wildValue?: number } | null {
  if (hand.length === 0) return null;

  const safeNumbers = hand.filter(
    (c): c is Extract<FiveAliveCardInstance, { type: "number" }> =>
      c.type === "number" && runningTotal + c.value <= 21
  );
  if (safeNumbers.length > 0) {
    const sorted = [...safeNumbers].sort((a, b) => b.value - a.value);
    const topHalf = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    const chosen = pick(topHalf)!;
    return { cardId: chosen.id };
  }

  const reset0 = hand.find((c) => c.type === "reset0");
  if (reset0) return { cardId: reset0.id };

  const eq21 = hand.find((c) => c.type === "eq21");
  if (eq21 && runningTotal !== 21) return { cardId: eq21.id };

  const wild = hand.find((c) => c.type === "wild");
  if (wild) {
    const safeTotal = Math.min(21, runningTotal + 3);
    return { cardId: wild.id, wildValue: safeTotal };
  }

  const utilities = hand.filter((c) =>
    ["skip", "reverse", "draw1", "draw2"].includes(c.type)
  );
  if (utilities.length > 0 && Math.random() < 0.6) {
    const chosen = pick(utilities)!;
    return { cardId: chosen.id };
  }

  const bomb = hand.find((c) => c.type === "bomb");
  if (bomb) return { cardId: bomb.id };

  const anyNumber = hand.find((c) => c.type === "number");
  if (anyNumber) return { cardId: anyNumber.id };

  return { cardId: hand[0].id };
}

export function pickBotFiveAliveBombResponse(
  hand: FiveAliveCardInstance[]
): { cardId: string } | { pass: true } {
  const zero = hand.find((c) => isNumber0(c));
  if (zero) return { cardId: zero.id };
  return { pass: true };
}
