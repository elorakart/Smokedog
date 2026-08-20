"use client";

import Image from "next/image";
import { avatarSrc, normalizeAvatarId } from "@/lib/avatars";

/**
 * Portrait art already fills most of the square. Clip to a circle and
 * use a light cover so faces stay visible (no aggressive zoom).
 */
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
  const fillsParent = /\b(h-full|w-full|size-full)\b/.test(className);

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full bg-manila ring-1 ring-crimson/20 ${
        fillsParent ? "aspect-square" : ""
      } ${className}`}
      style={fillsParent ? undefined : { width: size, height: size }}
    >
      <Image
        src={avatarSrc(idx)}
        alt=""
        fill
        sizes={fillsParent ? "(max-width: 768px) 28vw, 128px" : `${size}px`}
        priority={priority}
        className="object-cover object-[center_30%] brightness-[1.04] contrast-[0.96]"
        aria-hidden
      />
    </span>
  );
}
