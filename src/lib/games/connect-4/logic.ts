export type C4Color = "R" | "Y";
export type C4Cell = C4Color | null;

export const C4_ROWS = 6;
export const C4_COLS = 7;

export function emptyC4Board(): C4Cell[][] {
  return Array.from({ length: C4_ROWS }, () =>
    Array.from({ length: C4_COLS }, () => null)
  );
}

/** Drop into column; returns landing row (0 = bottom) or null if full. */
export function dropC4(
  board: C4Cell[][],
  col: number,
  color: C4Color
): { board: C4Cell[][]; row: number } | null {
  if (col < 0 || col >= C4_COLS) return null;
  for (let row = 0; row < C4_ROWS; row++) {
    if (board[row]![col] === null) {
      const next = board.map((r) => [...r]);
      next[row]![col] = color;
      return { board: next, row };
    }
  }
  return null;
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS;
}

export function checkC4Win(
  board: C4Cell[][],
  lastRow: number,
  lastCol: number
): { color: C4Color; cells: { row: number; col: number }[] } | null {
  const color = board[lastRow]?.[lastCol];
  if (!color) return null;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ] as const;

  for (const [dr, dc] of dirs) {
    const cells: { row: number; col: number }[] = [
      { row: lastRow, col: lastCol },
    ];
    for (const sign of [1, -1] as const) {
      let r = lastRow + dr * sign;
      let c = lastCol + dc * sign;
      while (inBounds(r, c) && board[r]![c] === color) {
        cells.push({ row: r, col: c });
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (cells.length >= 4) {
      return { color, cells: cells.slice(0, 4) };
    }
  }
  return null;
}

export function isC4Draw(board: C4Cell[][]): boolean {
  return board[C4_ROWS - 1]!.every((c) => c !== null);
}

export function legalC4Columns(board: C4Cell[][]): number[] {
  const cols: number[] = [];
  for (let c = 0; c < C4_COLS; c++) {
    if (board[C4_ROWS - 1]![c] === null) cols.push(c);
  }
  return cols;
}
