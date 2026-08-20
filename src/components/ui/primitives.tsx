import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function GlassPanel({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
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
      className={`rounded-lg border border-white/10 bg-surface/70 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
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
    neutral: "text-ink-steel border-white/10",
    live: "text-emerald-300 border-emerald-400/30",
    dead: "text-ink-steel/70 border-white/10 line-through opacity-60",
    mute: "text-amber-200 border-amber-400/30",
    afk: "text-crimson-glow border-crimson/40",
    mafia: "text-crimson-glow border-crimson/40",
    town: "text-sky-200 border-sky-400/30",
    bot: "text-violet-200 border-violet-400/30",
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
      className={`inline-flex items-center justify-center gap-2 rounded-sm bg-crimson px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-glow transition hover:brightness-110 hover:shadow-[0_0_32px_rgba(230,25,25,0.55)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {loading && <LoadingSpinner size={16} className="text-white" />}
      {children}
    </button>
  );
}
