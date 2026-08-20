export const AVATAR_COUNT = 20;
/** Bump when regenerating portrait assets so clients skip stale caches. */
export const AVATAR_ASSET_VERSION = 3;

export function avatarSrc(id: number): string {
  const idx = ((id % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
  return `/avatars/avatar-${String(idx).padStart(2, "0")}.webp?v=${AVATAR_ASSET_VERSION}`;
}

export function normalizeAvatarId(id: number): number {
  return ((id % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT;
}
