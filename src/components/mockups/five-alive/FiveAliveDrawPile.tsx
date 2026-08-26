"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { EK_THROW_EASE } from "@/components/mockups/ek/EkPlayAnimation";

export function FiveAliveDrawPile({
  count,
  width = 80,
  onDraw,
  disabled,
  drawing,
  label = "Draw pile",
}: {
  count: number;
  width?: number;
  onDraw: () => void;
  disabled?: boolean;
  drawing?: boolean;
  label?: string;
}) {
  const layers = Math.min(4, Math.max(1, count > 0 ? 4 : 0));
  const height = (width * 7) / 5;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled || count <= 0 || drawing}
        onClick={onDraw}
        className={cn(
          "relative transition focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson",
          count > 0 && !disabled && !drawing && "hover:scale-[1.03] active:scale-[0.98]"
        )}
        style={{ width, height }}
        aria-label={`Draw from pile, ${count} cards remaining`}
      >
        {count === 0 ? (
          <div
            className="flex aspect-[5/7] w-full items-center justify-center rounded-xl border border-dashed border-crimson/30 bg-crimson/[0.04] font-mono text-[9px] uppercase tracking-widest text-crimson/50"
          >
            Empty
          </div>
        ) : (
          <>
            {Array.from({ length: layers }, (_, i) => (
              <motion.div
                key={i}
                className="absolute left-0 aspect-[5/7] overflow-hidden rounded-xl border border-crimson/20 shadow-md"
                style={{
                  width,
                  top: i * 2.5,
                  zIndex: i,
                  transform: `rotate(${i === 0 ? -2.5 : i === 1 ? 1 : i === 2 ? -0.5 : 0}deg)`,
                }}
                animate={
                  drawing && i === layers - 1
                    ? { y: -8, scale: 0.96, opacity: 0.7 }
                    : { y: 0, scale: 1, opacity: 1 }
                }
                transition={{ duration: 0.35, ease: EK_THROW_EASE }}
              >
                <div
                  className="absolute inset-[0.35em] rounded-lg border border-white/10"
                  style={{
                    backgroundColor: "#9d2c35",
                    backgroundImage:
                      "url('/five-alive/card-back.svg'), repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0, rgba(255,255,255,0.14) 1.5px, transparent 1.5px, transparent 7px)",
                    backgroundPosition: "center",
                    backgroundSize: "cover, auto",
                  }}
                />
              </motion.div>
            ))}
            <motion.span
              key={count}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="absolute -right-2 -top-2 z-20 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-manila bg-crimson px-1.5 font-mono text-xs font-bold text-manila shadow-md"
            >
              {count}
            </motion.span>
          </>
        )}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-crimson/60">
        {label}
      </p>
      {count > 0 ? (
        <p className="font-sans text-[11px] text-crimson/45">Tap to draw</p>
      ) : null}
    </div>
  );
}
