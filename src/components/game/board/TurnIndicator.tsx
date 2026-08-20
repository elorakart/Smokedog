"use client";

export function TurnIndicator({
  name,
  detail,
  secondsLeft,
  yours,
}: {
  name: string;
  detail?: string;
  secondsLeft?: number | null;
  yours?: boolean;
}) {
  const urgent = typeof secondsLeft === "number" && secondsLeft <= 5;
  return (
    <div
      className={`rounded-sm border px-4 py-3 ${
        yours
          ? "border-crimson/40 bg-crimson/10"
          : "border-white/10 bg-white/[0.03]"
      } ${urgent ? "animate-pulse" : ""}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-steel">
        {yours ? "Your turn" : "Waiting"}
      </p>
      <p className="mt-1 font-display text-lg font-semibold">{name}</p>
      {detail && <p className="text-sm text-ink-steel">{detail}</p>}
      {typeof secondsLeft === "number" && (
        <p
          className={`mt-1 font-mono text-xs ${
            urgent ? "text-crimson-glow" : "text-ink-steel"
          }`}
        >
          {secondsLeft}s
        </p>
      )}
    </div>
  );
}
