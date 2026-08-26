import type { PublicGameState } from "@/lib/types";

/** True when this Mafia City room is running Local (no chat/voice/discussion). */
export function isLocalMafia(
  state: Pick<PublicGameState, "gameId" | "settings">
): boolean {
  return state.gameId === "mafia-city" && !!state.settings.localMode;
}

export function roomIsLocalMafia(room: {
  gameId: string;
  settings: { localMode?: boolean };
}): boolean {
  return room.gameId === "mafia-city" && !!room.settings.localMode;
}
