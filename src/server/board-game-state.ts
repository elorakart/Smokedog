import type {
  Connect4PublicState,
  SpotItPublicState,
  TttPublicState,
} from "@/lib/types";
import type { C4Cell, C4Color } from "@/lib/games/connect-4/logic";
import type { TttCell, TttMark } from "@/lib/games/tic-tac-toe/logic";

export type SpotItRoomState = {
  deck: number[][];
  piles: Record<string, number[][]>;
  matchSeq: number;
  startedAt: number;
};

export type TttRoomState = {
  board: TttCell[];
  turnPlayerId: string;
  marks: Record<string, TttMark>;
  winningLine: number[] | null;
  lastMove: number | null;
  result: "ongoing" | "win" | "draw";
  winnerId: string | null;
};

export type Connect4RoomState = {
  board: C4Cell[][];
  turnPlayerId: string;
  colors: Record<string, C4Color>;
  winningCells: { row: number; col: number }[] | null;
  lastDrop: { col: number; row: number } | null;
  result: "ongoing" | "win" | "draw";
  winnerId: string | null;
};

export function toPublicSpotIt(
  spot: SpotItRoomState,
  playerId: string | undefined,
  players: { id: string; name: string }[]
): SpotItPublicState {
  const scores = players
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      score: spot.piles[p.id]?.length ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
  return {
    centerCard: spot.deck[0] ? [...spot.deck[0]] : [],
    yourCard: playerId && spot.piles[playerId]?.[0]
      ? [...spot.piles[playerId]![0]!]
      : null,
    deckRemaining: Math.max(0, spot.deck.length - 1),
    scores,
    matchSeq: spot.matchSeq,
  };
}

export function toPublicTtt(ttt: TttRoomState): TttPublicState {
  return {
    board: [...ttt.board],
    turnPlayerId: ttt.turnPlayerId,
    marks: { ...ttt.marks },
    winningLine: ttt.winningLine ? [...ttt.winningLine] : null,
    lastMove: ttt.lastMove,
  };
}

export function toPublicConnect4(c4: Connect4RoomState): Connect4PublicState {
  return {
    board: c4.board.map((r) => [...r]),
    turnPlayerId: c4.turnPlayerId,
    colors: { ...c4.colors },
    winningCells: c4.winningCells ? c4.winningCells.map((c) => ({ ...c })) : null,
    lastDrop: c4.lastDrop ? { ...c4.lastDrop } : null,
  };
}
