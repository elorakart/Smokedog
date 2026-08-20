import type { GameModule, RoomSettings, Role } from "@/lib/types";

export const CONNECT4_ID = "connect-4";

export const connect4Module: GameModule = {
  id: CONNECT4_ID,
  displayName: "Connect 4",
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
