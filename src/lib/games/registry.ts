import type { GameModule } from "@/lib/types";
import { mafiaCityModule } from "./mafia-city/engine";
import { fiveAliveModule } from "./5-alive/engine";

const modules: Record<string, GameModule> = {
  [mafiaCityModule.id]: mafiaCityModule,
  [fiveAliveModule.id]: fiveAliveModule,
};

export function getGameModule(id = "mafia-city"): GameModule {
  const normalized = (id ?? "").trim().toLowerCase();
  if (!normalized) return mafiaCityModule;

  const mapped =
    normalized === "5-alive" ||
    normalized === "5alive" ||
    normalized === "fivealive" ||
    normalized === "five-alive"
      ? "five-alive"
      : normalized === "mafia" || normalized === "mafia-city"
        ? "mafia-city"
        : normalized;

  return modules[mapped] ?? mafiaCityModule;
}

export function listGames(): GameModule[] {
  return Object.values(modules);
}
