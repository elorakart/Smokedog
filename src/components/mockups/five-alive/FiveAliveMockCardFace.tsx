"use client";

import {
  Bomb,
  Layers,
  RotateCcw,
  SkipForward,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { fiveAliveCardVisual } from "@/lib/games/5-alive/card-visual";
import type { FiveAliveCardVariant, FiveAliveSampleCard } from "@/lib/mockups/five-alive-sample";

const CATEGORY_STYLES = {
  number: {
    stripe: "from-crimson/15 via-transparent to-crimson/5",
    corner: "border-crimson/35",
    pip: "bg-crimson/80",
  },
  special: {
    stripe: "from-amber-700/20 via-transparent to-crimson/10",
    corner: "border-amber-800/40",
    pip: "bg-amber-800/70",
  },
  action: {
    stripe: "from-teal-900/15 via-transparent to-crimson/8",
    corner: "border-teal-900/35",
    pip: "bg-teal-900/60",
  },
  penalty: {
    stripe: "from-crimson/25 via-transparent to-crimson/10",
    corner: "border-crimson",
    pip: "bg-crimson",
  },
  wild: {
    stripe: "from-violet-900/20 via-transparent to-crimson/10",
    corner: "border-violet-900/40",
    pip: "bg-violet-900/70",
  },
} as const;

function CategoryIcon({
  category,
  className,
}: {
  category: ReturnType<typeof fiveAliveCardVisual>["category"];
  className?: string;
}) {
  const props = { className: cn("size-[1em]", className), strokeWidth: 2.2 };
  switch (category) {
    case "action":
      return <Zap {...props} />;
    case "penalty":
      return <Bomb {...props} />;
    case "wild":
      return <Sparkles {...props} />;
    case "special":
      return <Layers {...props} />;
    default:
      return null;
  }
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-[0.9em] opacity-50", className)}
      aria-hidden
    >
      <path
        d="M2 2h8v8H2V2zm12 0h8v8h-8V2zM2 14h8v8H2v-8zm12 0h8v8h-8v-8z"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}

function NumberPips({ value, className }: { value: number; className?: string }) {
  const count = Math.min(value, 5);
  if (value === 0) {
    return (
      <span className={cn("font-mono text-[0.45em] uppercase tracking-widest opacity-60", className)}>
        Zero
      </span>
    );
  }
  return (
    <div className={cn("flex flex-wrap justify-center gap-[0.15em] max-w-[2.5em]", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="size-[0.35em] rounded-full bg-crimson/70"
        />
      ))}
      {value > 5 ? (
        <span className="font-mono text-[0.4em] opacity-70">+</span>
      ) : null}
    </div>
  );
}

export function FiveAliveMockCardFace({
  card,
  variant = "ledger",
  width = 96,
  selected = false,
  elevated = false,
  className,
}: {
  card: FiveAliveSampleCard;
  variant?: FiveAliveCardVariant;
  width?: number;
  selected?: boolean;
  elevated?: boolean;
  className?: string;
}) {
  const visual = fiveAliveCardVisual(card);
  const cat = CATEGORY_STYLES[visual.category];
  const isSkip = card.type === "skip";
  const isReverse = card.type === "reverse";

  const base = cn(
    "relative aspect-[5/7] select-none overflow-hidden rounded-xl border-2 transition-all duration-200",
    selected && "ring-2 ring-crimson ring-offset-2 ring-offset-manila scale-[1.04]",
    elevated && "-translate-y-1 shadow-xl",
    className
  );

  if (variant === "ticket") {
    return (
      <div
        className={cn(base, "border-crimson/50 bg-[#f5ead8] shadow-[0_3px_0_#8B1E1E,0_8px_24px_rgba(139,30,30,0.12)]")}
        style={{ fontSize: width / 14, width }}
      >
        <div className="absolute inset-x-0 top-0 h-[0.35em] bg-[repeating-linear-gradient(90deg,#8B1E1E_0,#8B1E1E_4px,transparent_4px,transparent_8px)] opacity-30" />
        <div className="absolute inset-x-[0.4em] top-[0.55em] flex items-center justify-between">
          <span className="font-mono text-[0.45em] uppercase tracking-[0.2em] text-crimson/70">
            No. {card.id.slice(-2)}
          </span>
          <CornerOrnament className="text-crimson" />
        </div>
        <div className="absolute inset-[0.35em] rounded-lg border border-dashed border-crimson/25" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 pt-2">
          {card.type === "number" ? (
            <NumberPips value={card.value ?? 0} className="mb-1" />
          ) : (
            <CategoryIcon category={visual.category} className="mb-1 text-crimson/80" />
          )}
          <span className="font-display text-[2.4em] font-extrabold leading-none text-crimson">
            {visual.label}
          </span>
          <span className="mt-1 rounded border border-crimson/30 bg-crimson/5 px-1.5 py-0.5 font-mono text-[0.45em] uppercase tracking-widest text-crimson/80">
            {visual.tagLabel}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[0.35em] bg-[repeating-linear-gradient(90deg,#8B1E1E_0,#8B1E1E_4px,transparent_4px,transparent_8px)] opacity-30" />
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          base,
          "border-crimson/40 bg-gradient-to-br from-manila via-[#f0e4d0] to-[#e8dcc8]",
          "shadow-[0_0_0_1px_rgba(139,30,30,0.08),0_12px_28px_rgba(139,30,30,0.14)]"
        )}
        style={{ fontSize: width / 14, width }}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", cat.stripe)} />
        <div className="absolute -right-[20%] -top-[20%] size-[70%] rounded-full bg-crimson/[0.06] blur-xl" />
        <div className="absolute left-[0.45em] top-[0.45em]">
          <CategoryIcon category={visual.category} className="text-crimson/70" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className={cn(
              "flex size-[2.8em] items-center justify-center rounded-full border-2 bg-manila/90 shadow-inner",
              cat.corner
            )}
          >
            {isSkip ? (
              <SkipForward className="size-[1.2em] text-crimson" strokeWidth={2.5} />
            ) : isReverse ? (
              <RotateCcw className="size-[1.2em] text-crimson" strokeWidth={2.5} />
            ) : (
              <span className="font-display text-[1.4em] font-extrabold leading-none text-crimson">
                {visual.label.length > 3 ? visual.label.slice(0, 3) : visual.label}
              </span>
            )}
          </div>
          <p className="mt-[0.4em] max-w-[90%] text-center font-display text-[0.55em] font-bold uppercase tracking-wide text-crimson/90">
            {visual.label}
          </p>
        </div>
        <div className="absolute inset-x-[0.45em] bottom-[0.45em] flex justify-center">
          <span className={cn("rounded-full px-2 py-0.5 font-mono text-[0.45em] uppercase tracking-widest text-manila", cat.pip)}>
            {visual.tagLabel}
          </span>
        </div>
      </div>
    );
  }

  /* ledger — ornate default */
  return (
    <div
      className={cn(
        base,
        "border-crimson/45 bg-manila shadow-[0_2px_4px_rgba(139,30,30,0.1),0_10px_24px_rgba(139,30,30,0.1)]",
        visual.borderClass
      )}
      style={{ fontSize: width / 14, width }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", cat.stripe)} />
      <div className="absolute inset-[0.3em] rounded-lg border border-crimson/15" />
      <div className="absolute left-[0.45em] top-[0.45em]">
        <CornerOrnament className="text-crimson/60" />
      </div>
      <div className="absolute right-[0.45em] top-[0.45em]">
        <CategoryIcon category={visual.category} className="text-crimson/75" />
      </div>
      <div className="absolute inset-x-0 top-[0.55em] text-center font-display text-[0.5em] font-extrabold uppercase tracking-[0.22em] text-crimson/80">
        5 Alive
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 pt-3">
        {isSkip ? (
          <SkipForward className="mb-1 size-[1.8em] text-crimson/90" strokeWidth={2.5} />
        ) : isReverse ? (
          <RotateCcw className="mb-1 size-[1.8em] text-crimson/90" strokeWidth={2.5} />
        ) : card.type === "number" ? (
          <NumberPips value={card.value ?? 0} className="mb-1" />
        ) : null}
        <span
          className={cn(
            "font-display font-extrabold leading-none text-crimson",
            visual.label.length > 3 ? "text-[1.8em]" : "text-[2.8em]"
          )}
        >
          {visual.label}
        </span>
      </div>
      <div className="absolute inset-x-[0.45em] bottom-[0.45em] flex justify-center">
        <span className="rounded-md border border-crimson/20 bg-manila/80 px-1.5 py-0.5 font-mono text-[0.45em] uppercase tracking-widest text-crimson/75 backdrop-blur-sm">
          {visual.tagLabel}
        </span>
      </div>
    </div>
  );
}
