"use client";

import Image from "next/image";
import { avatarSrc, normalizeAvatarId } from "@/lib/avatars";

/**
 * Stitch portraits are circular mugshots with transparent corners.
 * Scale with object-contain — do not cover-crop into a square plate or CSS remask.
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
      className={`relative block shrink-0 overflow-visible bg-transparent ${
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
        className="object-contain object-center"
        aria-hidden
      />
    </span>
  );
}
