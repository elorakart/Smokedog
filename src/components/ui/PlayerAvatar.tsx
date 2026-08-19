"use client";

const PALETTES = [
  ["#3d1a1a", "#e61919"],
  ["#1a2433", "#8e97a4"],
  ["#1f2a22", "#6b8f71"],
  ["#2a1f33", "#c4a0e0"],
  ["#33291a", "#d4a017"],
  ["#1a2c33", "#5dade2"],
  ["#331a28", "#e8bcb6"],
  ["#242424", "#dae3f1"],
];

export function PlayerAvatar({
  id,
  size = 64,
  className = "",
}: {
  id: number;
  size?: number;
  className?: string;
}) {
  const idx = ((id % 8) + 8) % 8;
  const [bg, fg] = PALETTES[idx];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <rect width="64" height="64" fill={bg} />
      <circle cx="32" cy="24" r="12" fill={fg} opacity="0.9" />
      <path
        d="M12 58c2-14 12-22 20-22s18 8 20 22"
        fill={fg}
        opacity="0.75"
      />
      <rect x="0" y="0" width="64" height="64" fill="none" stroke="rgba(255,255,255,0.12)" />
    </svg>
  );
}
