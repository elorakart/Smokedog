import { randomUUID } from "crypto";

export type FiveAliveCardType =
  | "number"
  | "eq21"
  | "reset0"
  | "skip"
  | "reverse"
  | "draw1"
  | "draw2"
  | "bomb"
  | "wild";

export type FiveAliveCardInstance =
  | { id: string; type: "number"; value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { id: string; type: "eq21" }
  | { id: string; type: "reset0" }
  | { id: string; type: "skip" }
  | { id: string; type: "reverse" }
  | { id: string; type: "draw1" }
  | { id: string; type: "draw2" }
  | { id: string; type: "bomb" }
  | { id: string; type: "wild" };

export function isNumber0(
  card: FiveAliveCardInstance
): card is Extract<FiveAliveCardInstance, { type: "number" }> {
  return card.type === "number" && card.value === 0;
}

export function isWild(card: FiveAliveCardInstance): card is Extract<
  FiveAliveCardInstance,
  { type: "wild" }
> {
  return card.type === "wild";
}

export function cardLabel(card: FiveAliveCardInstance): string {
  switch (card.type) {
    case "number":
      return String(card.value);
    case "eq21":
      return "=21";
    case "reset0":
      return "=0";
    case "skip":
      return "Skip";
    case "reverse":
      return "Reverse";
    case "draw1":
      return "Draw 1";
    case "draw2":
      return "Draw 2";
    case "bomb":
      return "Bomb";
    case "wild":
      return "Wild";
  }
}

export function buildFiveAliveDeck(): FiveAliveCardInstance[] {
  const cards: FiveAliveCardInstance[] = [];

  const addNumberValue = (value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7, copies: number) => {
    for (let i = 0; i < copies; i++) {
      cards.push({ id: randomUUID(), type: "number", value });
    }
  };

  for (let v = 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; v <= 7; v = (v + 1) as any) {
    addNumberValue(v, 8);
  }

  const addNonNumber = (
    type: Exclude<FiveAliveCardInstance["type"], "number">,
    copies: number
  ) => {
    for (let i = 0; i < copies; i++) {
      cards.push({ id: randomUUID(), type } as FiveAliveCardInstance);
    }
  };

  addNonNumber("eq21", 6);
  addNonNumber("reset0", 6);
  addNonNumber("skip", 8);
  addNonNumber("reverse", 8);
  addNonNumber("draw1", 4);
  addNonNumber("draw2", 4);
  addNonNumber("bomb", 4);
  addNonNumber("wild", 4);

  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  // Fisher–Yates shuffle
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

