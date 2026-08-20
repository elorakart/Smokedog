"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

function ArenaBrand() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90 sm:gap-3"
    >
      <motion.div
        className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-crimson bg-manila text-crimson shadow-stamp sm:h-9 sm:w-9"
        animate={{ rotate: [-6, -10, -6] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-mono text-[10px] font-bold tracking-[0.12em] sm:text-xs">
          SD
        </span>
      </motion.div>
      <span className="font-display text-lg font-bold tracking-tight text-crimson sm:text-xl">
        SMOKEDOG
      </span>
    </Link>
  );
}

export function SiteHeader({
  right,
  avatarId,
  animate = true,
}: {
  right?: ReactNode;
  avatarId?: number;
  animate?: boolean;
}) {
  const trailing =
    right ??
    (avatarId !== undefined ? (
      <>
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-crimson/60 sm:block">
          Case file
        </span>
        <div className="overflow-hidden rounded-sm ring-1 ring-crimson/30">
          <PlayerAvatar id={avatarId} size={36} />
        </div>
      </>
    ) : null);

  const className =
    "relative flex items-center justify-between gap-3 border-b border-crimson/20 px-3 py-2.5 sm:px-6 sm:py-4 md:px-10";

  if (animate) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <ArenaBrand />
        {trailing && (
          <div className="min-w-0 shrink">
            {trailing}
          </div>
        )}
      </motion.header>
    );
  }

  return (
    <header className={className}>
      <ArenaBrand />
      {trailing && <div className="min-w-0 shrink">{trailing}</div>}
    </header>
  );
}
