import { randomUUID } from "crypto";
import type { DcCardInstance } from "@/lib/games/detonation-cats/cards";
import {
  buildDetonationCatsDeck,
  cardLabel,
  dealFromDeck,
  initialHandSize,
  isCatType,
} from "@/lib/games/detonation-cats/cards";
import {
  alivePlayerIds,
  matchingCatCount,
  nextAlivePlayerId,
} from "@/lib/games/detonation-cats/logic";
import type { Phase, PublicDcCard } from "@/lib/types";

export type DetonationCatsRoomState = {
  drawDeck: DcCardInstance[];
  discardPile: DcCardInstance[];
  handsByPlayerId: Record<string, DcCardInstance[]>;
  turnPlayerId: string | null;
  turnOrder: string[];
  pendingTurns: number;
  skipDraw: boolean;
  seeFuturePeek: DcCardInstance[] | null;
  defusePlayerId: string | null;
  pendingDefuseCard: DcCardInstance | null;
  pickDiscardPlayerId: string | null;
  stealActorId: string | null;
};

export type DcPlayer = {
  id: string;
  name: string;
  alive: boolean;
};

export function toPublicDcCard(card: DcCardInstance): PublicDcCard {
  return { id: card.id, type: card.type };
}

export function aliveSet(players: DcPlayer[]): Set<string> {
  return new Set(players.filter((p) => p.alive).map((p) => p.id));
}

export function createDetonationCatsState(
  players: DcPlayer[]
): DetonationCatsRoomState {
  const deck = buildDetonationCatsDeck(players.length);
  const handSize = initialHandSize(players.length);
  const handsByPlayerId: Record<string, DcCardInstance[]> = {};

  for (const p of players) {
    handsByPlayerId[p.id] = dealFromDeck(deck, handSize);
  }

  const turnOrder = players.map((p) => p.id);
  const first = turnOrder[0] ?? null;

  return {
    drawDeck: deck,
    discardPile: [],
    handsByPlayerId,
    turnPlayerId: first,
    turnOrder,
    pendingTurns: 1,
    skipDraw: false,
    seeFuturePeek: null,
    defusePlayerId: null,
    pendingDefuseCard: null,
    pickDiscardPlayerId: null,
    stealActorId: null,
  };
}

export function dcMaybeWin(
  players: DcPlayer[],
  turnOrder: string[]
): string | null {
  const living = alivePlayerIds(turnOrder, aliveSet(players));
  if (living.length === 1) return living[0]!;
  if (living.length <= 1) return living[0] ?? null;
  return null;
}

export function removeCardsFromHand(
  hand: DcCardInstance[],
  cardIds: string[]
): DcCardInstance[] {
  const idSet = new Set(cardIds);
  return hand.filter((c) => !idSet.has(c.id));
}

export function takeCardsFromHand(
  hand: DcCardInstance[],
  cardIds: string[]
): { taken: DcCardInstance[]; remaining: DcCardInstance[] } {
  const idSet = new Set(cardIds);
  const taken: DcCardInstance[] = [];
  const remaining: DcCardInstance[] = [];
  for (const c of hand) {
    if (idSet.has(c.id)) taken.push(c);
    else remaining.push(c);
  }
  return { taken, remaining };
}

export function drawOne(
  dc: DetonationCatsRoomState
): DcCardInstance | null {
  if (dc.drawDeck.length === 0) return null;
  return dc.drawDeck.pop() ?? null;
}

export function insertDefuse(
  dc: DetonationCatsRoomState,
  defuseCard: DcCardInstance,
  deckIndex: number
) {
  const idx = Math.max(0, Math.min(dc.drawDeck.length, Math.floor(deckIndex)));
  dc.drawDeck.splice(idx, 0, defuseCard);
}

export function shuffleDrawPile(dc: DetonationCatsRoomState) {
  const pile = dc.drawDeck;
  for (let i = pile.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
}

export function peekFuture(
  dc: DetonationCatsRoomState,
  count = 3
): DcCardInstance[] {
  const n = Math.min(count, dc.drawDeck.length);
  const peek = dc.drawDeck.slice(-n).reverse();
  dc.seeFuturePeek = peek;
  return peek;
}

export function advanceTurn(
  dc: DetonationCatsRoomState,
  players: DcPlayer[],
  fromPlayerId: string
): string | null {
  dc.skipDraw = false;
  dc.seeFuturePeek = null;

  if (dc.pendingTurns > 1) {
    dc.pendingTurns -= 1;
    return fromPlayerId;
  }

  dc.pendingTurns = 1;
  const alive = aliveSet(players);
  const next = nextAlivePlayerId(dc.turnOrder, fromPlayerId, alive);
  dc.turnPlayerId = next;
  return next;
}

export function setAttackNext(
  dc: DetonationCatsRoomState,
  players: DcPlayer[],
  fromPlayerId: string
) {
  dc.skipDraw = true;
  dc.pendingTurns = 1;
  const alive = aliveSet(players);
  const next = nextAlivePlayerId(dc.turnOrder, fromPlayerId, alive);
  dc.turnPlayerId = next;
  if (next) dc.pendingTurns = 2;
}

export function validatePlayCards(
  hand: DcCardInstance[],
  cardIds: string[]
): { ok: true; cards: DcCardInstance[] } | { ok: false; reason: string } {
  if (cardIds.length === 0) {
    return { ok: false, reason: "No cards selected." };
  }
  const { taken, remaining } = takeCardsFromHand(hand, cardIds);
  if (taken.length !== cardIds.length) {
    return { ok: false, reason: "Invalid card selection." };
  }

  const cats = taken.filter((c) => isCatType(c.type));
  const actions = taken.filter((c) => !isCatType(c.type));

  if (actions.length > 0 && cats.length > 0) {
    return { ok: false, reason: "Cannot mix action and cat cards." };
  }
  if (actions.length > 1) {
    return { ok: false, reason: "Play one action card at a time." };
  }

  if (cats.length > 0) {
    const { count } = matchingCatCount(hand, cardIds);
    if (count !== cardIds.length) {
      return { ok: false, reason: "Cat cards must match." };
    }
    if (count > 3) {
      return { ok: false, reason: "Max three matching cats." };
    }
  }

  void remaining;
  return { ok: true, cards: taken };
}

export type DcPlayResult = {
  logs: string[];
  nextPhase?: Phase;
  endTurnWithoutDraw?: boolean;
  turnAlreadyAdvanced?: boolean;
  needsSteal?: boolean;
  needsPickDiscard?: boolean;
};

export function resolvePlayedCards(
  dc: DetonationCatsRoomState,
  actor: DcPlayer,
  cards: DcCardInstance[],
  players: DcPlayer[]
): DcPlayResult {
  const logs: string[] = [];
  dc.discardPile.push(...cards);

  if (cards.length === 1 && !isCatType(cards[0]!.type)) {
    const card = cards[0]!;
    switch (card.type) {
      case "skip":
        logs.push(`${actor.name} plays Skip Turn.`);
        dc.skipDraw = true;
        return { logs, endTurnWithoutDraw: true };
      case "attack":
        logs.push(`${actor.name} plays Double Attack.`);
        setAttackNext(dc, players, actor.id);
        return { logs, endTurnWithoutDraw: true, turnAlreadyAdvanced: true };
      case "shuffle":
        shuffleDrawPile(dc);
        logs.push(`${actor.name} shuffles the draw pile.`);
        return { logs };
      case "see_future": {
        const peek = peekFuture(dc);
        logs.push(`${actor.name} sees the future (${peek.length} cards).`);
        return { logs };
      }
      case "defuse":
      case "detonation":
        logs.push(`${actor.name} plays ${cardLabel(card)}.`);
        return { logs };
      default:
        return { logs };
    }
  }

  const catCards = cards.filter((c) => isCatType(c.type));
  if (catCards.length === 1) {
    logs.push(`${actor.name} plays ${cardLabel(catCards[0]!)}.`);
    return { logs };
  }
  if (catCards.length === 2) {
    logs.push(`${actor.name} plays a pair — steal a card.`);
    dc.stealActorId = actor.id;
    return { logs, needsSteal: true, nextPhase: "ek_steal" };
  }
  if (catCards.length === 3) {
    logs.push(`${actor.name} plays triple — pick from discard.`);
    dc.pickDiscardPlayerId = actor.id;
    return { logs, needsPickDiscard: true, nextPhase: "ek_pick_discard" };
  }

  return { logs };
}

export function resolveDraw(
  dc: DetonationCatsRoomState,
  actor: DcPlayer,
  players: DcPlayer[]
): {
  logs: string[];
  eliminated: boolean;
  needsDefuse: boolean;
  drawn: DcCardInstance | null;
} {
  const drawn = drawOne(dc);
  if (!drawn) {
    return {
      logs: [`${actor.name} tries to draw but the deck is empty.`],
      eliminated: false,
      needsDefuse: false,
      drawn: null,
    };
  }

  if (drawn.type !== "detonation") {
    const hand = dc.handsByPlayerId[actor.id] ?? [];
    hand.push(drawn);
    dc.handsByPlayerId[actor.id] = hand;
    return {
      logs: [`${actor.name} draws ${cardLabel(drawn)}.`],
      eliminated: false,
      needsDefuse: false,
      drawn,
    };
  }

  const hand = dc.handsByPlayerId[actor.id] ?? [];
  const defuseIdx = hand.findIndex((c) => c.type === "defuse");
  if (defuseIdx < 0) {
    actor.alive = false;
    return {
      logs: [`${actor.name} draws Detonation Cat and is out!`],
      eliminated: true,
      needsDefuse: false,
      drawn,
    };
  }

  const [defuse] = hand.splice(defuseIdx, 1);
  dc.handsByPlayerId[actor.id] = hand;
  dc.defusePlayerId = actor.id;
  dc.pendingDefuseCard = defuse ?? null;
  dc.discardPile.push(drawn);
  void players;
  return {
    logs: [`${actor.name} draws Detonation Cat — must defuse!`],
    eliminated: false,
    needsDefuse: true,
    drawn,
  };
}

export function stealRandomCard(
  dc: DetonationCatsRoomState,
  fromId: string,
  toId: string
): string | null {
  const fromHand = dc.handsByPlayerId[fromId] ?? [];
  if (fromHand.length === 0) return null;
  const idx = Math.floor(Math.random() * fromHand.length);
  const [stolen] = fromHand.splice(idx, 1);
  if (!stolen) return null;
  const toHand = dc.handsByPlayerId[toId] ?? [];
  toHand.push(stolen);
  dc.handsByPlayerId[toId] = toHand;
  dc.stealActorId = null;
  return cardLabel(stolen);
}

export function pickFromDiscard(
  dc: DetonationCatsRoomState,
  playerId: string,
  discardIndex: number
): DcCardInstance | null {
  const idx = Math.max(
    0,
    Math.min(dc.discardPile.length - 1, Math.floor(discardIndex))
  );
  const picked = dc.discardPile.splice(idx, 1)[0] ?? null;
  if (picked) {
    const hand = dc.handsByPlayerId[playerId] ?? [];
    hand.push(picked);
    dc.handsByPlayerId[playerId] = hand;
  }
  dc.pickDiscardPlayerId = null;
  return picked;
}

export function newLog(text: string) {
  return { id: randomUUID(), text, at: Date.now() };
}
