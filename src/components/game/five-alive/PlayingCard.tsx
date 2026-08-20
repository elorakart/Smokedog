import { cn } from "@/lib/cn";

export type DeckCardProps = {
  className?: string;
  faceDown?: boolean;
  /** Card width in pixels. Height follows the classic 5:7 ratio. */
  width?: number;
  style?: React.CSSProperties;
};

export function DeckCard({
  className,
  faceDown = true,
  width = 72,
  style,
}: DeckCardProps) {
  return (
    <div
      className={cn(
        "relative aspect-[5/7] select-none overflow-hidden rounded-xl border border-crimson/15 bg-manila shadow-[0_1px_2px_rgba(139,30,30,0.05),0_4px_10px_rgba(139,30,30,0.07)]",
        className
      )}
      style={{ width, ...style }}
    >
      {faceDown ? (
        <div
          className="absolute inset-[0.45em] rounded-lg border border-crimson/15"
          style={{
            backgroundColor: "#9d2c35",
            backgroundImage:
              "url('/five-alive/card-back.svg'), repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1.5px, transparent 1.5px, transparent 7px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1.5px, transparent 1.5px, transparent 7px)",
            backgroundPosition: "center",
            backgroundSize: "cover, auto, auto",
          }}
        />
      ) : null}
    </div>
  );
}

export function DeckStack({
  count,
  width = 72,
  className,
  label,
}: {
  count: number;
  width?: number;
  className?: string;
  label: string;
}) {
  const layers = Math.min(3, Math.max(1, count > 0 ? 3 : 0));

  return (
    <div className={cn("relative", className)} style={{ width, height: (width * 7) / 5 }}>
      {count === 0 ? (
        <div
          className="flex aspect-[5/7] items-center justify-center rounded-xl border border-dashed border-crimson/25 bg-crimson/[0.03] font-mono text-[9px] uppercase tracking-widest text-ink-steel"
          style={{ width }}
        >
          Empty
        </div>
      ) : (
        <>
          {Array.from({ length: layers }, (_, i) => (
            <DeckCard
              key={i}
              className={cn("absolute left-0 transition-shadow", i === layers - 1 && "shadow-lg")}
              style={{
                top: i * 3,
                transform: `rotate(${i === 0 ? -2 : i === 1 ? 1 : 0}deg)`,
                zIndex: i,
              }}
              width={width}
            />
          ))}
          <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8B1E1E] px-1 font-mono text-[10px] font-bold text-manila">
            {count}
          </span>
        </>
      )}
      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-widest text-ink-steel">
        {label}
      </p>
    </div>
  );
}
