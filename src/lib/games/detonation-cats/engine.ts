import type { GameModule, RoomSettings, Role } from "@/lib/types";

export const DETONATION_CATS_ID = "detonation-cats";

export const detonationCatsModule: GameModule = {
  id: DETONATION_CATS_ID,
  displayName: "Detonation Cats",
  minPlayers: 2,
  maxPlayers: 5,
  status: "coming_soon",
  createSettings(): RoomSettings {
    return {
      nightSeconds: 15,
      daySeconds: 90,
      vigilanteBullets: null,
    };
  },
  assignRoles(playerCount: number, _settings: RoomSettings): Role[] {
    return Array.from({ length: playerCount }, () => "villager" as Role);
  },
};
