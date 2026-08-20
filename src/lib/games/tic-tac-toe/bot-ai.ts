import type { TttCell } from "./logic";
import { legalTttMoves } from "./logic";

export function pickBotTttMove(board: TttCell[]): number | null {
  const legal = legalTttMoves(board);
  if (legal.length === 0) return null;
  return legal[Math.floor(Math.random() * legal.length)] ?? null;
}

export function botTttDelayMs(): number {
  return 400 + Math.floor(Math.random() * 800);
}
