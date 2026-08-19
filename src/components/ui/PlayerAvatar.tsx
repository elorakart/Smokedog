"use client";

import Image from "next/image";
import { avatarSrc, normalizeAvatarId } from "@/lib/avatars";

export function PlayerAvatar({
  id,
  size = 64,
  className = "",
  priority = false,
}: {
  id: number;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const idx = normalizeAvatarId(id);
  return (
    <Image
      src={avatarSrc(idx)}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={`aspect-square rounded-full object-cover ring-1 ring-white/10 ${className}`}
      aria-hidden
    />
  );
}
