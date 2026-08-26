import type { DcCardInstance } from "./cards";
import { DC_CAT_TYPES, isCatType } from "./cards";

export function canPlayCardToDiscard(
  card: DcCardInstance,
  selectedIds: string[],
  hand: DcCardInstance[]
): boolean {
  if (!isCatType(card.type)) return true;
  if (selectedIds.length === 0) return true;
  const selected = hand.filter((c) => selectedIds.includes(c.id));
  if (selected.length === 0) return true;
  return selected.every((c) => c.type === card.type);
}

export function matchingCatCount(
  hand: DcCardInstance[],
  selectedIds: string[]
): { type: DcCardInstance["type"] | null; count: number } {
  if (selectedIds.length === 0) return { type: null, count: 0 };
  const selected = hand.filter((c) => selectedIds.includes(c.id));
  if (selected.length === 0) return { type: null, count: 0 };
  const type = selected[0]!.type;
  if (!isCatType(type)) return { type: null, count: 0 };
  if (!selected.every((c) => c.type === type)) return { type: null, count: 0 };
  return { type, count: selected.length };
}

export function isValidCatCombo(count: number): boolean {
  return count === 1 || count === 2 || count === 3;
}

export function nextAlivePlayerId(
  order: string[],
  fromId: string,
  alive: Set<string>
): string | null {
  const idx = order.indexOf(fromId);
  if (idx < 0) return order.find((id) => alive.has(id)) ?? null;
  for (let i = 1; i <= order.length; i++) {
    const next = order[(idx + i) % order.length]!;
    if (alive.has(next)) return next;
  }
  return null;
}

export function alivePlayerIds(
  order: string[],
  alive: Set<string>
): string[] {
  return order.filter((id) => alive.has(id));
}

export function countAlive(alive: Set<string>): number {
  return alive.size;
}

export function catTypeLabel(type: (typeof DC_CAT_TYPES)[number]): string {
  switch (type) {
    case "taco_cat":
      return "Taco";
    case "beard_cat":
      return "Beard";
    case "rainbow_cat":
      return "Rainbow";
    case "potato_cat":
      return "Potato";
    case "melon_cat":
      return "Melon";
  }
}
