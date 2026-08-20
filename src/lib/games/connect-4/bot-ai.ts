import type { C4Cell } from "./logic";
import { legalC4Columns } from "./logic";

export function pickBotC4Column(board: C4Cell[][]): number | null {
  const legal = legalC4Columns(board);
  if (legal.length === 0) return null;
  return legal[Math.floor(Math.random() * legal.length)] ?? null;
}

export function botC4DelayMs(): number {
  return 500 + Math.floor(Math.random() * 900);
}
