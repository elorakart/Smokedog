"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

function ArenaBrand() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 transition hover:opacity-90 sm:gap-3"
    >
      <motion.div
        className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-crimson shadow-glow sm:h-8 sm:w-8"
        animate={{
          boxShadow: [
            "0 0 12px rgba(230,25,25,0.35)",
            "0 0 28px rgba(230,25,25,0.7)",
            "0 0 12px rgba(230,25,25,0.35)",
          ],
        }}
        transition={{ duration: 2.8, repeat: Infinity }}
      >
        <span className="font-display text-xs font-extrabold tracking-[0.1em] sm:text-sm">
          SA
        </span>
      </motion.div>
      <span className="font-display text-base font-extrabold tracking-[0.12em] sm:text-xl sm:tracking-[0.18em]">
        SMOKEDOG&apos;s Arena
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
          Operator Access
        </span>
        <div className="overflow-hidden rounded-full ring-1 ring-white/10">
          <PlayerAvatar id={avatarId} size={36} />
        </div>
      </>
    ) : null);

  const className =
    "relative flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-5 md:px-10";

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
