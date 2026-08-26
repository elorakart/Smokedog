import type { DcCardInstance, DcCardType } from "./cards";
import { cardLabel } from "./cards";

export type DcCardCategory = "danger" | "save" | "action" | "cat";

export type DcCardVisual = {
  label: string;
  category: DcCardCategory;
  bgClass: string;
  borderClass: string;
  accentClass: string;
  textClass: string;
  tagClass: string;
  tagLabel: string;
  icon: string;
};

const BASE_BG = "bg-manila";
const BASE_TEXT = "text-crimson";
const BASE_TAG = "bg-crimson/10 text-crimson";

const ICONS: Record<DcCardType, string> = {
  detonation: "💣",
  defuse: "🛡",
  skip: "⏭",
  attack: "⚡",
  shuffle: "🔀",
  see_future: "👁",
  taco_cat: "🌮",
  beard_cat: "🧔",
  rainbow_cat: "🌈",
  potato_cat: "🥔",
  melon_cat: "🍈",
};

export function dcCardVisual(card: { type: DcCardType }): DcCardVisual {
  const icon = ICONS[card.type];
  const label = cardLabel({ id: "", type: card.type });

  switch (card.type) {
    case "detonation":
      return {
        label,
        category: "danger",
        bgClass: BASE_BG,
        borderClass: "border-crimson",
        accentClass: "text-crimson",
        textClass: BASE_TEXT,
        tagClass: BASE_TAG,
        tagLabel: "BOOM",
        icon,
      };
    case "defuse":
      return {
        label,
        category: "save",
        bgClass: BASE_BG,
        borderClass: "border-crimson/70",
        accentClass: "text-crimson",
        textClass: BASE_TEXT,
        tagClass: BASE_TAG,
        tagLabel: "Save",
        icon,
      };
    case "skip":
    case "attack":
    case "shuffle":
    case "see_future":
      return {
        label,
        category: "action",
        bgClass: BASE_BG,
        borderClass: "border-crimson/60",
        accentClass: "text-crimson/90",
        textClass: BASE_TEXT,
        tagClass: BASE_TAG,
        tagLabel: card.type === "attack" ? "Attack" : card.type === "skip" ? "Skip" : "Action",
        icon,
      };
    default:
      return {
        label,
        category: "cat",
        bgClass: BASE_BG,
        borderClass: "border-crimson/40",
        accentClass: "text-crimson/80",
        textClass: BASE_TEXT,
        tagClass: BASE_TAG,
        tagLabel: "Cat",
        icon,
      };
  }
}

export function dcCardLabel(card: DcCardInstance): string {
  return cardLabel(card);
}
