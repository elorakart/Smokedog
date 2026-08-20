import { sharedSymbol } from "./deck";

export function pickBotSpotItSymbol(
  playerCard: number[],
  centerCard: number[]
): number | null {
  return sharedSymbol(playerCard, centerCard);
}

export function botSpotItDelayMs(): number {
  return 800 + Math.floor(Math.random() * 1700);
}
