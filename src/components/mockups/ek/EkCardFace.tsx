"use client";

import { cn } from "@/lib/cn";
import {
  ekCardVisual,
  type EkCardStyle,
  type EkSampleCard,
} from "@/lib/mockups/ek-sample-cards";

export type EkCardFaceProps = {
  card: EkSampleCard;
  style: EkCardStyle;
  width?: number;
  selected?: boolean;
  elevated?: boolean;
  className?: string;
};

const CATEGORY_GRADIENT: Record<EkSampleCard["category"], string> = {
  danger: "from-crimson/20 via-transparent to-crimson/5",
  save: "from-teal-800/15 via-transparent to-crimson/5",
  action: "from-amber-700/15 via-transparent to-crimson/5",
  cat: "from-violet-800/12 via-transparent to-crimson/5",
};

const PLAYFUL_GRADIENT: Record<EkSampleCard["category"], string> = {
  danger: "from-[#E65100]/25 via-transparent to-[#FFE0B2]/30",
  save: "from-[#00838F]/20 via-transparent to-[#B2EBF2]/40",
  action: "from-[#F57C00]/20 via-transparent to-[#FFECB3]/40",
  cat: "from-[#7B1FA2]/18 via-transparent to-[#E1BEE7]/40",
};

const WEEB_GRADIENT: Record<EkSampleCard["category"], string> = {
  danger: "from-[#FF4D6D]/25 via-transparent to-[#FFC2D1]/50",
  save: "from-[#42A5F5]/20 via-transparent to-[#BBDEFB]/50",
  action: "from-[#AB47BC]/18 via-transparent to-[#E1BEE7]/50",
  cat: "from-[#EC407A]/20 via-transparent to-[#F8BBD9]/50",
};

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[0.85em] opacity-45", className)} aria-hidden>
      <path
        d="M2 2h8v8H2V2zm12 0h8v8h-8V2zM2 14h8v8H2v-8zm12 0h8v8h-8v-8z"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}

export function EkCardFace({
  card,
  style,
  width = 96,
  selected = false,
  elevated = false,
  className,
}: EkCardFaceProps) {
  const visual = ekCardVisual(card, style);

  const styleTitles: Record<EkCardStyle, string> = {
    ledger: "Detonation Cats",
    playful: "BOOM CATS",
    weeb: "Neko Blast",
  };

  const gradient =
    style === "ledger"
      ? CATEGORY_GRADIENT[card.category]
      : style === "playful"
        ? PLAYFUL_GRADIENT[card.category]
        : WEEB_GRADIENT[card.category];

  return (
    <div
      className={cn(
        "relative aspect-[5/7] select-none overflow-hidden rounded-xl border-2 transition-all duration-200",
        visual.bgClass,
        visual.borderClass,
        visual.textClass,
        style === "ledger" &&
          "shadow-[0_2px_4px_rgba(139,30,30,0.12),0_8px_20px_rgba(139,30,30,0.08)]",
        style === "playful" && "shadow-[0_4px_12px_rgba(230,81,0,0.15)]",
        style === "weeb" && "shadow-[0_4px_14px_rgba(255,143,171,0.25)]",
        selected && "ring-2 ring-offset-2 scale-105",
        selected && style === "ledger" && "ring-crimson ring-offset-manila",
        selected && style === "playful" && "ring-[#F57C00] ring-offset-[#FFF8E1]",
        selected && style === "weeb" && "ring-[#FF8FAB] ring-offset-[#FFF0F5]",
        elevated && "-translate-y-2 shadow-xl",
        className
      )}
      style={{ fontSize: width / 14, width }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", gradient)} />

      {style === "ledger" ? (
        <div className="absolute inset-[0.3em] rounded-lg border border-current opacity-15" />
      ) : style === "playful" ? (
        <div className="absolute inset-x-[0.35em] top-[0.35em] h-[0.25em] rounded-full bg-current opacity-10" />
      ) : (
        <div className="absolute -right-[15%] -top-[15%] size-[55%] rounded-full bg-current opacity-[0.06] blur-xl" />
      )}

      <div className="absolute left-[0.45em] top-[0.45em]">
        <CornerOrnament className={visual.accentClass} />
      </div>

      <div
        className={cn(
          "absolute inset-x-0 top-[0.5em] text-center font-display text-[0.5em] font-extrabold uppercase tracking-[0.18em]",
          visual.accentClass
        )}
      >
        {styleTitles[style]}
      </div>

      <div className="absolute right-[0.45em] top-[0.45em] text-[1em] leading-none opacity-90">
        {visual.icon}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 pt-3">
        <div
          className={cn(
            "flex size-[2.4em] items-center justify-center rounded-full border-2 bg-white/40 shadow-inner backdrop-blur-sm",
            visual.borderClass
          )}
        >
          <span className="text-[1.4em] leading-none">{visual.icon}</span>
        </div>
        <span
          className={cn(
            "mt-[0.35em] max-w-[95%] text-center font-display text-[0.68em] font-bold leading-tight",
            visual.textClass
          )}
        >
          {card.label}
        </span>
      </div>

      <div
        className={cn(
          "absolute inset-x-[0.45em] bottom-[0.45em] rounded-md border border-current/10 px-1 py-[0.15em] text-center font-mono text-[0.48em] font-semibold uppercase tracking-wider backdrop-blur-sm",
          visual.tagClass
        )}
      >
        {card.shortLabel}
      </div>
    </div>
  );
}
