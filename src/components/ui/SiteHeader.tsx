"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";

function ArenaBrand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 transition hover:opacity-90"
    >
      <motion.div
        className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-crimson shadow-glow"
        animate={{
          boxShadow: [
            "0 0 12px rgba(230,25,25,0.35)",
            "0 0 28px rgba(230,25,25,0.7)",
            "0 0 12px rgba(230,25,25,0.35)",
          ],
        }}
        transition={{ duration: 2.8, repeat: Infinity }}
      >
        <span className="font-display text-sm font-extrabold tracking-[0.1em]">
          SA
        </span>
      </motion.div>
      <span className="font-display text-xl font-extrabold tracking-[0.18em]">
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
    "relative flex items-center justify-between px-6 py-5 md:px-10";

  if (animate) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <ArenaBrand />
        {trailing && <div className="flex items-center gap-3">{trailing}</div>}
      </motion.header>
    );
  }

  return (
    <header className={className}>
      <ArenaBrand />
      {trailing && <div className="flex items-center gap-3">{trailing}</div>}
    </header>
  );
}
