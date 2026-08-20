import type { PhaseAnnouncement, PublicGameState } from "@/lib/types";

/** Rewrite shared room announcements for this viewer's status. */
export function announcementForViewer(
  announcement: PhaseAnnouncement,
  state: PublicGameState
): PhaseAnnouncement {
  const you = state.you;
  if (!you) return announcement;

  const alive = you.alive;
  const blackmailed = !!you.blackmailed;
  const deadVillagerVote = !!state.deadVillagerVote;
  const yourName = state.players.find((p) => p.id === you.id)?.name;
  const title = announcement.title.trim();
  const detail = (announcement.detail ?? "").trim();
  const titleLower = title.toLowerCase();

  if (titleLower === "voting has started" || titleLower.includes("voting has started")) {
    if (!alive && deadVillagerVote) {
      return {
        ...announcement,
        title: "Voting has started",
        detail:
          "You may still cast a vote as a dead villager. Town voice is closed.",
      };
    }
    if (!alive) {
      return {
        ...announcement,
        title: "Voting has started",
        detail: "Watch the tally — you cannot vote. Town voice is closed.",
      };
    }
    if (blackmailed) {
      return {
        ...announcement,
        title: "Voting has started",
        detail:
          "You are blackmailed — you cannot vote or speak. Town voice is closed.",
      };
    }
    return {
      ...announcement,
      detail: "Cast your lynch vote or skip. Town voice is now closed.",
    };
  }

  if (titleLower.includes("discussion")) {
    if (!alive) {
      return {
        ...announcement,
        detail:
          "Watch the debate. Use graveyard chat — town voice is for the living.",
      };
    }
    if (blackmailed) {
      return {
        ...announcement,
        detail:
          "You are blackmailed and cannot speak. Voting opens in the final 15 seconds.",
      };
    }
    return {
      ...announcement,
      detail: "Town voice is open. Voting starts in the final 15 seconds.",
    };
  }

  if (titleLower === "night results" || titleLower.startsWith("night result")) {
    if (!alive && yourName && detail.includes(yourName)) {
      return {
        ...announcement,
        title: "You were eliminated",
        detail:
          "You died overnight. Spectate from the graveyard — dead villagers may still vote by day.",
      };
    }
    if (!alive) {
      return {
        ...announcement,
        detail: `${detail} Watch from the graveyard.`,
      };
    }
    return announcement;
  }

  if (titleLower === "quiet night") {
    if (!alive) {
      return {
        ...announcement,
        detail: "No one else fell overnight. Keep watching from the graveyard.",
      };
    }
    return announcement;
  }

  if (titleLower === "lynch result") {
    if (!alive && yourName && detail.includes(yourName)) {
      return {
        ...announcement,
        title: "You were lynched",
        detail: "The city voted you out. Spectate from the graveyard.",
      };
    }
    if (!alive) {
      return {
        ...announcement,
        detail: `${detail} You remain a spectator.`,
      };
    }
    return announcement;
  }

  if (titleLower === "no lynch" || titleLower === "tied vote") {
    if (!alive) {
      return {
        ...announcement,
        detail: `${detail} Keep watching the city.`,
      };
    }
    return announcement;
  }

  // Generic fallback: never push action verbs at pure spectators.
  if (!alive && !deadVillagerVote) {
    const actiony =
      /cast your|choose|mark someone|investigate|vote or skip|town voice is open/i.test(
        detail
      );
    if (actiony) {
      return {
        ...announcement,
        detail: "Spectate the city. Use graveyard chat.",
      };
    }
  }

  return announcement;
}
