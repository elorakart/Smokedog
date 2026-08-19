import type { GameModule } from "@/lib/types";
import { mafiaCityModule } from "./mafia-city/engine";
import { fiveAliveModule } from "./5-alive/engine";

const modules: Record<string, GameModule> = {
  [mafiaCityModule.id]: mafiaCityModule,
  [fiveAliveModule.id]: fiveAliveModule,
};

export function resolveGameId(id?: string): string {
  const normalized = (id ?? "").trim().toLowerCase();
  if (!normalized) return mafiaCityModule.id;

  if (
    normalized === "5-alive" ||
    normalized === "5alive" ||
    normalized === "fivealive" ||
    normalized === "five-alive"
  ) {
    return fiveAliveModule.id;
  }

  if (normalized === "mafia" || normalized === "mafia-city") {
    return mafiaCityModule.id;
  }

  return normalized;
}

export function getGameModule(id = "mafia-city"): GameModule {
  const resolved = resolveGameId(id);
  const mod = modules[resolved];
  if (!mod) {
    throw new Error(
      `Game "${id ?? resolved}" is not available on this game server yet. Ask the host to redeploy the backend.`
    );
  }
  return mod;
}

export function listGames(): GameModule[] {
  return Object.values(modules);
}

export function listGameIds(): string[] {
  return Object.keys(modules);
}
