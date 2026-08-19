import type { GameModule } from "@/lib/types";
import { mafiaCityModule } from "./mafia-city/engine";

const modules: Record<string, GameModule> = {
  [mafiaCityModule.id]: mafiaCityModule,
};

export function getGameModule(id = "mafia-city"): GameModule {
  return modules[id] ?? mafiaCityModule;
}

export function listGames(): GameModule[] {
  return Object.values(modules);
}
