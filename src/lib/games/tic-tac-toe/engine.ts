import type { GameModule, RoomSettings, Role } from "@/lib/types";

export const TTT_ID = "tic-tac-toe";

export const ticTacToeModule: GameModule = {
  id: TTT_ID,
  displayName: "Tic-Tac-Toe",
  minPlayers: 2,
  maxPlayers: 2,
  status: "live",
  createSettings(): RoomSettings {
    return {
      nightSeconds: 15,
      daySeconds: 15,
      vigilanteBullets: null,
    };
  },
  assignRoles(playerCount: number): Role[] {
    return Array.from({ length: playerCount }, () => "villager" as Role);
  },
};
