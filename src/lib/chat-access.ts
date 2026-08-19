import { isMafiaRole } from "@/lib/games/mafia-city/roles";
import type { ChatChannel, Phase, Role } from "@/lib/types";

export const CHANNEL_LABELS: Record<ChatChannel, string> = {
  town: "Public Channel",
  mafia: "Mafia Channel",
  graveyard: "Graveyard",
};

export function canAccessChannel(
  channel: ChatChannel,
  opts: {
    alive: boolean;
    role?: Role;
    blackmailed: boolean;
    phase: Phase;
  }
): boolean {
  if (channel === "graveyard") return !opts.alive;
  if (channel === "town") {
    return opts.alive && opts.phase === "day" && !opts.blackmailed;
  }
  if (channel === "mafia") {
    return (
      opts.alive &&
      opts.phase === "night" &&
      !!opts.role &&
      isMafiaRole(opts.role)
    );
  }
  return false;
}

export function availableChannels(opts: {
  alive: boolean;
  role?: Role;
  blackmailed: boolean;
  phase: Phase;
}): ChatChannel[] {
  const channels: ChatChannel[] = [];
  if (canAccessChannel("town", opts)) channels.push("town");
  if (canAccessChannel("mafia", opts)) channels.push("mafia");
  if (canAccessChannel("graveyard", opts)) channels.push("graveyard");
  return channels;
}
