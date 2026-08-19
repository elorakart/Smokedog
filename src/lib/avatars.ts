export const AVATAR_COUNT = 20;

export function avatarSrc(id: number): string {
  const idx = ((id % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
  return `/avatars/avatar-${String(idx).padStart(2, "0")}.webp`;
}

export function normalizeAvatarId(id: number): number {
  return ((id % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
}
