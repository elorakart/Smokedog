import type { GameModule } from "@/lib/types";
import { assignMafiaCityRoles, defaultRoleDistribution } from "./balance";

export { defaultRoleDistribution };

export const mafiaCityModule: GameModule = {
  id: "mafia-city",
  displayName: "Mafia City",
  minPlayers: 4,
  maxPlayers: 12,
  createSettings() {
    return {
      nightSeconds: 30,
      daySeconds: 100,
      vigilanteBullets: null,
      roleDistribution: null,
    };
  },
  assignRoles(playerCount, settings) {
    return assignMafiaCityRoles(playerCount, settings);
  },
};
