import type { FiveAliveCardInstance } from "./cards";
import { cardLabel } from "./cards";

/** Stitch "Vivid Pulse" palette for 5 Alive cards. */
export const FIVE_ALIVE_COLORS = {
  primary: "#e63946",
  action: "#457b9d",
  success: "#2a9d8f",
  warning: "#e9c46a",
  neutral: "#1d3557",
  cardBack: "#9d2c35",
} as const;

export type FiveAliveCardCategory =
  | "number"
  | "special"
  | "action"
  | "penalty"
  | "wild";

export type FiveAliveCardVisual = {
  label: string;
  category: FiveAliveCardCategory;
  borderClass: string;
  accentClass: string;
  tagLabel: string;
};

export function fiveAliveCardVisual(card: {
  type: FiveAliveCardInstance["type"];
  value?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}): FiveAliveCardVisual {
  switch (card.type) {
    case "number":
      return {
        label: String(card.value),
        category: "number",
        borderClass: "border-[#457b9d]",
        accentClass: "text-[#457b9d]",
        tagLabel: "Number",
      };
    case "reset0":
      return {
        label: "=0",
        category: "special",
        borderClass: "border-[#2a9d8f]",
        accentClass: "text-[#2a9d8f]",
        tagLabel: "Special",
      };
    case "eq21":
      return {
        label: "=21",
        category: "special",
        borderClass: "border-[#e63946]",
        accentClass: "text-[#e63946]",
        tagLabel: "Special",
      };
    case "skip":
      return {
        label: "Skip",
        category: "action",
        borderClass: "border-[#457b9d]",
        accentClass: "text-[#457b9d]",
        tagLabel: "Action",
      };
    case "reverse":
      return {
        label: "Reverse",
        category: "action",
        borderClass: "border-[#457b9d]",
        accentClass: "text-[#457b9d]",
        tagLabel: "Action",
      };
    case "draw1":
      return {
        label: "+1",
        category: "action",
        borderClass: "border-[#457b9d]",
        accentClass: "text-[#457b9d]",
        tagLabel: "Action",
      };
    case "draw2":
      return {
        label: "+2",
        category: "action",
        borderClass: "border-[#457b9d]",
        accentClass: "text-[#457b9d]",
        tagLabel: "Action",
      };
    case "bomb":
      return {
        label: "Bomb",
        category: "penalty",
        borderClass: "border-[#e63946]",
        accentClass: "text-[#e63946]",
        tagLabel: "Penalty",
      };
    case "wild":
      return {
        label: "5 Alive",
        category: "wild",
        borderClass: "border-[#e9c46a]",
        accentClass: "text-[#e9c46a]",
        tagLabel: "Wild",
      };
  }
}

export function fiveAliveCardLabel(card: {
  type: FiveAliveCardInstance["type"];
  value?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}): string {
  return cardLabel(card as FiveAliveCardInstance);
}
