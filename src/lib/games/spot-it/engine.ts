import type { GameModule, RoomSettings, Role } from "@/lib/types";

export const SPOT_IT_ID = "spot-it";

export const spotItModule: GameModule = {
  id: SPOT_IT_ID,
  displayName: "Spot It",
  minPlayers: 2,
  maxPlayers: 8,
  status: "live",
  createSettings(): RoomSettings {
    return {
      nightSeconds: 30,
      daySeconds: 60,
      vigilanteBullets: null,
    };
  },
  assignRoles(playerCount: number): Role[] {
    return Array.from({ length: playerCount }, () => "villager" as Role);
  },
};
