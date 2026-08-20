import { AVATAR_COUNT, normalizeAvatarId } from "@/lib/avatars";

export const PROFILE_KEY = "smokedog.profile";
export { AVATAR_COUNT, normalizeAvatarId };

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
    parsed.avatarId = normalizeAvatarId(parsed.avatarId ?? 0);
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ ...profile, avatarId: normalizeAvatarId(profile.avatarId) })
  );
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

export function randomAvatarId(): number {
  return Math.floor(Math.random() * AVATAR_COUNT);
}
