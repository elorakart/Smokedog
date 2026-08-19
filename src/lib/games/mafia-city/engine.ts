import type { GameModule } from "@/lib/types";
import { assignMafiaCityRoles } from "./balance";

export const mafiaCityModule: GameModule = {
  id: "mafia-city",
  displayName: "Mafia City",
  minPlayers: 4,
  maxPlayers: 12,
  createSettings() {
    return {
      nightSeconds: 30,
      daySeconds: 60,
      vigilanteBullets: null,
    };
  },
  assignRoles(playerCount, settings) {
    return assignMafiaCityRoles(playerCount, settings);
  },
};
