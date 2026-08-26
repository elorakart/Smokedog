import { randomUUID } from "crypto";

export type DcCardType =
  | "detonation"
  | "defuse"
  | "skip"
  | "attack"
  | "shuffle"
  | "see_future"
  | "taco_cat"
  | "beard_cat"
  | "rainbow_cat"
  | "potato_cat"
  | "melon_cat";

export type DcCardInstance = {
  id: string;
  type: DcCardType;
};

export type DcCatType = Extract<
  DcCardType,
  "taco_cat" | "beard_cat" | "rainbow_cat" | "potato_cat" | "melon_cat"
>;

export const DC_CAT_TYPES: DcCatType[] = [
  "taco_cat",
  "beard_cat",
  "rainbow_cat",
  "potato_cat",
  "melon_cat",
];

export function isCatType(type: DcCardType): type is DcCatType {
  return (DC_CAT_TYPES as DcCardType[]).includes(type);
}

export function cardLabel(card: DcCardInstance): string {
  switch (card.type) {
    case "detonation":
      return "Detonation Cat";
    case "defuse":
      return "Purr Defuse";
    case "skip":
      return "Skip Turn";
    case "attack":
      return "Double Attack";
    case "shuffle":
      return "Shuffle Deck";
    case "see_future":
      return "See the Future";
    case "taco_cat":
      return "Taco Cat";
    case "beard_cat":
      return "Beard Cat";
    case "rainbow_cat":
      return "Rainbow Cat";
    case "potato_cat":
      return "Potato Cat";
    case "melon_cat":
      return "Melon Cat";
  }
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function add(cards: DcCardInstance[], type: DcCardType, copies: number) {
  for (let i = 0; i < copies; i++) {
    cards.push({ id: randomUUID(), type });
  }
}

/** Build and shuffle a deck for N players (2–5). */
export function buildDetonationCatsDeck(playerCount: number): DcCardInstance[] {
  const n = Math.max(2, Math.min(5, playerCount));
  const cards: DcCardInstance[] = [];

  add(cards, "skip", 4);
  add(cards, "attack", 4);
  add(cards, "shuffle", 4);
  add(cards, "see_future", 5);
  for (const cat of DC_CAT_TYPES) {
    add(cards, cat, 4);
  }

  add(cards, "defuse", n + 1);
  add(cards, "detonation", n - 1);

  return shuffle(cards);
}

export function initialHandSize(playerCount: number): number {
  return playerCount <= 2 ? 7 : playerCount <= 4 ? 5 : 4;
}

export function dealFromDeck(
  deck: DcCardInstance[],
  count: number
): DcCardInstance[] {
  const out: DcCardInstance[] = [];
  while (out.length < count && deck.length > 0) {
    const card = deck.pop();
    if (card) out.push(card);
  }
  return out;
}
