import type { PublicFiveAliveCard } from "@/lib/types";

export type FiveAliveCardVariant = "ledger" | "ticket" | "pulse";

export type FiveAliveSampleCard = PublicFiveAliveCard;

const uid = (n: number) => `fa-sample-${n}`;

/** Starting hand for table mockups. */
export const FIVE_ALIVE_START_HAND: FiveAliveSampleCard[] = [
  { id: uid(1), type: "number", value: 3 },
  { id: uid(2), type: "number", value: 7 },
  { id: uid(3), type: "skip" },
  { id: uid(4), type: "draw1" },
  { id: uid(5), type: "reset0" },
  { id: uid(6), type: "bomb" },
];

/** Face-down draw pool — top card is last in array. */
export const FIVE_ALIVE_DRAW_POOL: FiveAliveSampleCard[] = [
  { id: uid(10), type: "number", value: 5 },
  { id: uid(11), type: "number", value: 2 },
  { id: uid(12), type: "reverse" },
  { id: uid(13), type: "eq21" },
  { id: uid(14), type: "number", value: 4 },
  { id: uid(15), type: "draw2" },
  { id: uid(16), type: "number", value: 1 },
  { id: uid(17), type: "wild" },
  { id: uid(18), type: "number", value: 6 },
  { id: uid(19), type: "number", value: 0 },
  { id: uid(20), type: "skip" },
  { id: uid(21), type: "number", value: 7 },
];

export const FIVE_ALIVE_INITIAL_DRAW_COUNT = 38;

/** Every distinct card type for the design gallery. */
export const FIVE_ALIVE_GALLERY_CARDS: FiveAliveSampleCard[] = [
  { id: "g-num-3", type: "number", value: 3 },
  { id: "g-num-0", type: "number", value: 0 },
  { id: "g-eq21", type: "eq21" },
  { id: "g-reset0", type: "reset0" },
  { id: "g-skip", type: "skip" },
  { id: "g-reverse", type: "reverse" },
  { id: "g-draw1", type: "draw1" },
  { id: "g-draw2", type: "draw2" },
  { id: "g-bomb", type: "bomb" },
  { id: "g-wild", type: "wild" },
];

export function cloneStartHand(): FiveAliveSampleCard[] {
  return FIVE_ALIVE_START_HAND.map((c) => ({ ...c }));
}

export function cloneDrawPool(): FiveAliveSampleCard[] {
  return [...FIVE_ALIVE_DRAW_POOL];
}

export function mockRunningTotalAfterPlay(
  current: number,
  card: FiveAliveSampleCard
): number {
  switch (card.type) {
    case "number":
      return current + (card.value ?? 0);
    case "reset0":
      return 0;
    case "eq21":
      return 21;
    default:
      return current;
  }
}

export function cardTypeName(card: FiveAliveSampleCard): string {
  switch (card.type) {
    case "number":
      return `Number ${card.value}`;
    case "eq21":
      return "Equals 21";
    case "reset0":
      return "Reset to 0";
    case "skip":
      return "Skip";
    case "reverse":
      return "Reverse";
    case "draw1":
      return "Draw +1";
    case "draw2":
      return "Draw +2";
    case "bomb":
      return "Bomb";
    case "wild":
      return "Wild";
  }
}
