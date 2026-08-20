const NAME_MAX = 18;

/** Pick a lobby display name; if taken, append _1, _2, … without blocking join. */
export function uniquePlayerName(
  desired: string,
  takenNames: string[]
): string {
  const taken = new Set(
    takenNames.map((n) => n.trim().toLowerCase()).filter(Boolean)
  );
  const base = desired.trim().slice(0, NAME_MAX) || "Operator";
  if (!taken.has(base.toLowerCase())) return base;

  for (let n = 1; n < 1000; n++) {
    const suffix = `_${n}`;
    const stem = base.slice(0, Math.max(1, NAME_MAX - suffix.length));
    const candidate = `${stem}${suffix}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }

  const fallback = `_${Date.now().toString(36).slice(-4)}`;
  return `${base.slice(0, Math.max(1, NAME_MAX - fallback.length))}${fallback}`;
}
