/**
 * Finite projective plane of order n → Dobble/Spot It deck.
 * Symbols per card: n+1
 * Cards: n² + n + 1
 * Symbols: n² + n + 1
 */
export function generateDobbleDeck(n = 7): {
  symbolCount: number;
  symbolsPerCard: number;
  cards: number[][];
} {
  if (n < 2) throw new Error("Order n must be >= 2");
  const cards: number[][] = [];

  // Type 1: (∞) points — cards for "points at infinity"
  // Card i (0..n-1): symbols { (i,j) mapped } + infinity symbol
  // Standard construction:
  // Symbols: (x,y) for x,y in 0..n-1, plus n+1 "infinity" symbols → total n²+n+1
  // Simpler well-known algorithm:

  // Cards of the form: for a in 0..n-1, b in 0..n-1:
  //   { (a*i + b) mod n  for i in 0..n-1 }  with y-coords...
  // Use the classic:
  // https://math.stackexchange.com — projective plane over F_n

  const symbol = (a: number, b: number) => a * n + b; // 0..n²-1
  const infinity = (k: number) => n * n + k; // n² .. n²+n

  // Parallel class 1: horizontal-ish
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      const card: number[] = [];
      for (let i = 0; i < n; i++) {
        card.push(symbol(i, (a * i + b) % n));
      }
      card.push(infinity(a));
      cards.push(card);
    }
  }

  // Vertical lines
  for (let b = 0; b < n; b++) {
    const card: number[] = [];
    for (let i = 0; i < n; i++) {
      card.push(symbol(b, i));
    }
    card.push(infinity(n));
    cards.push(card);
  }

  // Infinity line
  const infCard: number[] = [];
  for (let a = 0; a <= n; a++) {
    infCard.push(infinity(a));
  }
  cards.push(infCard);

  return {
    symbolCount: n * n + n + 1,
    symbolsPerCard: n + 1,
    cards,
  };
}

export function assertDobbleDeck(cards: number[][], n = 7): void {
  const expected = n * n + n + 1;
  if (cards.length !== expected) {
    throw new Error(`Expected ${expected} cards, got ${cards.length}`);
  }
  for (let i = 0; i < cards.length; i++) {
    if (cards[i]!.length !== n + 1) {
      throw new Error(`Card ${i} has ${cards[i]!.length} symbols`);
    }
    for (let j = i + 1; j < cards.length; j++) {
      const set = new Set(cards[i]);
      let shared = 0;
      for (const s of cards[j]!) if (set.has(s)) shared++;
      if (shared !== 1) {
        throw new Error(
          `Cards ${i} and ${j} share ${shared} symbols (want 1)`
        );
      }
    }
  }
}

export function shuffleCards<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function sharedSymbol(a: number[], b: number[]): number | null {
  const set = new Set(a);
  for (const s of b) if (set.has(s)) return s;
  return null;
}
