import type { GameModule } from "@/lib/types";
import { mafiaCityModule } from "./mafia-city/engine";
import { fiveAliveModule } from "./5-alive/engine";

const modules: Record<string, GameModule> = {
  [mafiaCityModule.id]: mafiaCityModule,
  [fiveAliveModule.id]: fiveAliveModule,
};

export function getGameModule(id = "mafia-city"): GameModule {
  return modules[id] ?? mafiaCityModule;
}

export function listGames(): GameModule[] {
  return Object.values(modules);
}
