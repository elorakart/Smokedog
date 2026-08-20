import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/** Dossier panel — paper on desk, or glass-lite surface on dark. */
export function GlassPanel({
  children,
  className = "",
  onClick,
  variant = "desk",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "desk" | "paper";
}) {
  const surface =
    variant === "paper"
      ? "rounded-sm border-2 border-ink-dark/80 bg-paper text-ink-dark shadow-stamp"
      : "rounded-sm border border-manila/15 bg-surface/80 backdrop-blur-md text-ink";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${surface} ${className}`}
    >
      {children}
    </div>
  );
}

export function Stamp({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`animate-stamp inline-block -rotate-[8deg] border-2 border-crimson px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-crimson ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "live" | "dead" | "mute" | "afk" | "mafia" | "town" | "bot";
}) {
  const tones: Record<string, string> = {
    neutral: "text-ink-steel border-manila/20",
    live: "text-emerald-300 border-emerald-400/30",
    dead: "text-ink-steel/70 border-manila/15 line-through opacity-60",
    mute: "text-amber-200 border-amber-400/30",
    afk: "text-crimson-glow border-crimson/40",
    mafia: "text-crimson-glow border-crimson/40",
    town: "text-manila border-manila/35",
    bot: "text-ink-muted border-manila/25",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  className = "",
  loading = false,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-sm bg-crimson px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-manila shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {loading && <LoadingSpinner size={16} className="text-manila" />}
      {children}
    </button>
  );
}
