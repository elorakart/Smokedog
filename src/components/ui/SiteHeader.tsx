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
        className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-crimson bg-paper text-crimson shadow-stamp sm:h-9 sm:w-9"
        animate={{ rotate: [-6, -10, -6] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="font-mono text-[10px] font-bold tracking-[0.12em] sm:text-xs">
          SD
        </span>
      </motion.div>
      <span className="font-display text-lg font-bold tracking-tight text-manila sm:text-xl">
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
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-steel sm:block">
          Case file
        </span>
        <div className="overflow-hidden rounded-sm ring-1 ring-manila/20">
          <PlayerAvatar id={avatarId} size={36} />
        </div>
      </>
    ) : null);

  const className =
    "relative flex flex-col gap-2 border-b border-manila/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4 md:px-10";

  if (animate) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <ArenaBrand />
        {trailing && (
          <div className="w-full min-w-0 overflow-x-auto sm:w-auto sm:overflow-visible">
            <div className="flex min-w-max items-center justify-end gap-2 sm:min-w-0 sm:flex-wrap">
              {trailing}
            </div>
          </div>
        )}
      </motion.header>
    );
  }

  return (
    <header className={className}>
      <ArenaBrand />
      {trailing && (
        <div className="w-full min-w-0 overflow-x-auto sm:w-auto sm:overflow-visible">
          <div className="flex min-w-max items-center justify-end gap-2 sm:min-w-0 sm:flex-wrap">
            {trailing}
          </div>
        </div>
      )}
    </header>
  );
}
