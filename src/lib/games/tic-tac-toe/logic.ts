export type TttMark = "X" | "O";
export type TttCell = TttMark | null;

export const TTT_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyTttBoard(): TttCell[] {
  return Array.from({ length: 9 }, () => null);
}

export function checkTttWin(board: TttCell[]): {
  mark: TttMark;
  line: number[];
} | null {
  for (const line of TTT_LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { mark: v, line };
    }
  }
  return null;
}

export function isTttDraw(board: TttCell[]): boolean {
  return board.every((c) => c !== null) && !checkTttWin(board);
}

export function applyTttMove(
  board: TttCell[],
  index: number,
  mark: TttMark
): TttCell[] | null {
  if (index < 0 || index > 8 || board[index] !== null) return null;
  const next = [...board];
  next[index] = mark;
  return next;
}

export function legalTttMoves(board: TttCell[]): number[] {
  return board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
}
