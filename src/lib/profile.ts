export const PROFILE_KEY = "smokedog.profile";
export const AVATAR_COUNT = 8;

export interface Profile {
  playerId: string;
  name: string;
  avatarId: number;
}

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed.playerId || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function ensurePlayerId(): string {
  const existing = loadProfile();
  if (existing?.playerId) return existing.playerId;
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `p-${Math.random().toString(36).slice(2, 10)}`;
  return id;
}

export const COMING_SOON = [
  {
    id: "state-secrets",
    title: "State Secrets",
    blurb:
      "Deceive the parliament. Pass hidden agendas while masking your true allegiance.",
    image:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "the-resistance",
    title: "The Resistance",
    blurb:
      "Sabotage missions from the inside. Deduce the spies among your ranks.",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "detonation",
    title: "Detonation",
    blurb:
      "Find the VIP or deliver the payload. Large-group chaos where the clock is the enemy.",
    image:
      "https://images.unsplash.com/photo-1483104879096-29c4d8e0c4d8?auto=format&fit=crop&w=1200&q=80",
  },
];
