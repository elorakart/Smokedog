import { isMafiaRole } from "@/lib/games/mafia-city/roles";
import type { ChatChannel, DaySubPhase, Phase, Role } from "@/lib/types";

export const CHANNEL_LABELS: Record<ChatChannel, string> = {
  town: "Public Channel",
  mafia: "Mafia Channel",
  graveyard: "Graveyard",
};

export type ChannelAccessOpts = {
  alive: boolean;
  role?: Role;
  blackmailed: boolean;
  phase: Phase;
  daySubPhase?: DaySubPhase;
};

export function canAccessChannel(
  channel: ChatChannel,
  opts: ChannelAccessOpts
): boolean {
  if (channel === "graveyard") return !opts.alive;
  if (channel === "town") {
    if (opts.phase === "fivealive_turn" || opts.phase === "fivealive_bomb") {
      return opts.alive && !opts.blackmailed;
    }
    return (
      opts.alive &&
      opts.phase === "day" &&
      !opts.blackmailed &&
      (opts.daySubPhase === "discussion" ||
        opts.daySubPhase === "vote" ||
        !opts.daySubPhase)
    );
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

export function canUseTownVoice(opts: ChannelAccessOpts): boolean {
  return canAccessChannel("town", opts) && opts.daySubPhase !== "vote";
}

export function availableChannels(opts: ChannelAccessOpts): ChatChannel[] {
  const channels: ChatChannel[] = [];
  if (canAccessChannel("town", opts)) channels.push("town");
  if (canAccessChannel("mafia", opts)) channels.push("mafia");
  if (canAccessChannel("graveyard", opts)) channels.push("graveyard");
  return channels;
}
