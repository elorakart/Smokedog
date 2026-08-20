import { randomUUID } from "crypto";
import type { Server } from "socket.io";
import type {
  ChatChannel,
  ChatMessage,
  ChronicleEntry,
  ClientToServerEvents,
  DaySubPhase,
  DetectiveLogEntry,
  GameLog,
  MafiaNightIntel,
  NightAction,
  NightActionType,
  OpenLobby,
  Phase,
  PhaseAnnouncement,
  Player,
  PublicFiveAliveCard,
  PublicGameState,
  PublicPlayer,
  RoomSettings,
  ServerToClientEvents,
  VoiceSignalPayload,
} from "@/lib/types";
import {
  AFK_GRACE_MS,
  DAY_VOTE_SECONDS,
  REVEAL_SECONDS,
  SKIP_VOTE_ID,
} from "@/lib/types";
import { generateRoomCode, RoomError, validateRoomCode } from "@/lib/room-code";
import { getGameModule, resolveGameId } from "@/lib/games/registry";
import {
  nextBotName,
  nextBotAvatarId,
  pickBotNightAction,
  pickBotVoteTarget,
  botNightDelayMs,
  botDayDelayMs,
} from "@/lib/games/mafia-city/bot-ai";
import {
  factionOf,
  isMafiaRole,
  nightActionFor,
  ROLE_META,
} from "@/lib/games/mafia-city/roles";
import {
  bulletsForLobby,
  defaultRoleDistribution,
} from "@/lib/games/mafia-city/balance";
import {
  generateDobbleDeck,
  shuffleCards,
  sharedSymbol,
} from "@/lib/games/spot-it/deck";
import { botSpotItDelayMs, pickBotSpotItSymbol } from "@/lib/games/spot-it/bot-ai";
import {
  applyTttMove,
  checkTttWin,
  emptyTttBoard,
  isTttDraw,
} from "@/lib/games/tic-tac-toe/logic";
import { botTttDelayMs, pickBotTttMove } from "@/lib/games/tic-tac-toe/bot-ai";
import {
  checkC4Win,
  dropC4,
  emptyC4Board,
  isC4Draw,
} from "@/lib/games/connect-4/logic";
import { botC4DelayMs, pickBotC4Column } from "@/lib/games/connect-4/bot-ai";
import { boardTurnSeconds } from "@/lib/games/board/turnTimer";
import {
  toPublicConnect4,
  toPublicSpotIt,
  toPublicTtt,
  type Connect4RoomState,
  type SpotItRoomState,
  type TttRoomState,
} from "@/server/board-game-state";

function isChatOnlyGame(gameId: string): boolean {
  return (
    gameId === "five-alive" ||
    gameId === "spot-it" ||
    gameId === "tic-tac-toe" ||
    gameId === "connect-4"
  );
}
import {
  eligibleVoters,
  playerCanDayVote,
  resolveNight,
  tallyLynch,
  validNightTargets,
  winCheck,
} from "@/lib/games/mafia-city/resolve";
import {
  botFiveAliveDelayMs,
  pickBotFiveAliveBombResponse,
  pickBotFiveAliveTurnPlay,
} from "@/lib/games/5-alive/bot-ai";
import { canAccessChannel } from "@/lib/chat-access";

import {
  buildFiveAliveDeck,
  cardLabel,
  type FiveAliveCardInstance,
  isNumber0,
  shuffle,
} from "@/lib/games/5-alive/cards";

export type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

const FIVE_ALIVE_HAND_SIZE = 10;

interface Room {
  id: string;
  gameId: string;
  settings: RoomSettings;
  players: Player[];
  phase: Phase;
  cycle: number;
  phaseEndsAt: number | null;
  daySubPhase: DaySubPhase | null;
  paused: boolean;
  pausedRemainingMs: number | null;
  nightActions: NightAction[];
  votes: Record<string, string>;
  logs: GameLog[];
  chat: ChatMessage[];
  chronicle: ChronicleEntry[];
  announcement: PhaseAnnouncement | null;
  mafiaNightIntel: MafiaNightIntel;
  detectiveLog: DetectiveLogEntry[];
  afkGraceEndsAt: number | null;
  afkGracePlayerId: string | null;
  winner: "town" | "mafia" | null;
  fiveAlive?: {
    drawDeck: FiveAliveCardInstance[];
    discardPile: FiveAliveCardInstance[];
    centerPile: FiveAliveCardInstance[];
    handsByPlayerId: Record<string, FiveAliveCardInstance[]>;

    runningTotal: number;
    direction: 1 | -1;
    turnPlayerId: string | null;

    skipNext: boolean;
    pendingDrawCount: number;

    bombAwaitingPlayerId: string | null;
    bombActorId: string | null;
    bombResponderIds: string[];
  };
  spotIt?: SpotItRoomState;
  ttt?: TttRoomState;
  connect4?: Connect4RoomState;
  boardWinnerId?: string | null;
  boardDraw?: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  detectiveByPlayer: Record<string, { targetId: string; faction: "town" | "mafia" }>;
  afkWarnedPlayerIds: string[];
  botTimers: ReturnType<typeof setTimeout>[];
  createdAt: number;
  voiceParticipants: Record<ChatChannel, Set<string>>;
}

function log(room: Room, text: string) {
  room.logs.push({ id: randomUUID(), text, at: Date.now() });
  if (room.logs.length > 80) room.logs.splice(0, room.logs.length - 80);
}

function toPublicFiveAliveCard(card: FiveAliveCardInstance): PublicFiveAliveCard {
  if (card.type === "number") {
    return { id: card.id, type: card.type, value: card.value };
  }
  return { id: card.id, type: card.type };
}

function living(room: Room): Player[] {
  return room.players.filter((p) => p.alive);
}

function emptyVoiceChannels(): Record<ChatChannel, Set<string>> {
  return { town: new Set(), mafia: new Set(), graveyard: new Set() };
}

function dayVoteEligible(room: Room): Player[] {
  return eligibleVoters(room.players);
}

function dayVoteStats(room: Room) {
  const eligible = dayVoteEligible(room);
  const votesIn = eligible.filter((p) => room.votes[p.id]).length;
  // Denominator is eligible voters only (living + dead villagers), never full roster.
  return { eligible, votesIn, votesNeeded: eligible.length };
}

export class GameRuntime {
  private rooms = new Map<string, Room>();
  private playerRoom = new Map<string, string>();

  constructor(private io: IoServer) {}

  private getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  private requireHost(room: Room, playerId: string): Player | null {
    const p = room.players.find((x) => x.id === playerId);
    return p?.isHost ? p : null;
  }

  private playerBySocket(socketId: string): { room: Room; player: Player } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) return { room, player };
    }
    return null;
  }

  private toPublicPlayer(room: Room, p: Player, viewerId: string, revealAll: boolean): PublicPlayer {
    const viewer = room.players.find((x) => x.id === viewerId);
    const viewerIsHost = !!viewer?.isHost;
    const viewerIsMafia = viewer?.role ? isMafiaRole(viewer.role) : false;
    const viewerIsTown = viewer?.role ? !isMafiaRole(viewer.role) : false;
    const showRole =
      revealAll ||
      p.id === viewerId ||
      (viewerIsMafia && isMafiaRole(p.role) && room.phase !== "gameover");
    return {
      id: p.id,
      name: p.name,
      avatarId: p.avatarId,
      alive: p.alive,
      isHost: p.isHost,
      ready: p.ready,
      afkCount: p.afkCount,
      blackmailed: p.blackmailed && room.phase === "day",
      role: showRole ? p.role : undefined,
      lives: p.lives,
      connected: p.isBot || !!p.socketId,
      isBot: viewerIsHost ? !!p.isBot : false,
    };
  }

  private setAnnouncement(
    room: Room,
    tone: PhaseAnnouncement["tone"],
    title: string,
    detail?: string
  ) {
    room.announcement = {
      id: randomUUID(),
      tone,
      title,
      detail,
      at: Date.now(),
    };
  }

  private addChronicle(
    room: Room,
    phase: "night" | "day",
    summary: string
  ) {
    room.chronicle.push({
      id: randomUUID(),
      cycle: room.cycle,
      phase,
      summary,
      at: Date.now(),
    });
  }

  private channelAccessOpts(room: Room, you: Player | null) {
    return {
      alive: !!you?.alive,
      role: you?.role,
      blackmailed: !!you?.blackmailed,
      phase: room.phase,
      daySubPhase: room.daySubPhase ?? undefined,
    };
  }

  private sanitize(room: Room, viewerId: string | null): PublicGameState {
    const you = viewerId
      ? room.players.find((p) => p.id === viewerId) ?? null
      : null;
    const revealAll = room.phase === "gameover";
    const viewerIsMafia = you?.role ? isMafiaRole(you.role) : false;
    const viewerIsDetective = you?.role === "detective";
    const viewerIsTown = you?.role ? !isMafiaRole(you.role) : false;
    const five = room.gameId === "five-alive" ? room.fiveAlive : undefined;
    const rolePreview =
      room.phase === "lobby"
        ? room.settings.roleDistribution ??
          defaultRoleDistribution(room.players.length)
        : null;
    return {
      roomId: room.id,
      gameId: room.gameId,
      settings: room.settings,
      players: room.players.map((p) =>
        this.toPublicPlayer(room, p, viewerId ?? "", revealAll)
      ),
      phase: room.phase,
      cycle: room.cycle,
      phaseEndsAt: room.paused ? null : room.phaseEndsAt,
      paused: room.paused,
      logs: room.logs,
      winner: room.winner,
      recap: revealAll
        ? room.players.map((p) => this.toPublicPlayer(room, p, viewerId ?? "", true))
        : null,
      you: you
        ? {
            id: you.id,
            role: you.role,
            faction: you.role ? factionOf(you.role) : undefined,
            bulletsLeft: you.bulletsLeft,
            alive: you.alive,
            isHost: you.isHost,
            blackmailed: you.blackmailed && room.phase === "day",
          }
        : null,
      votes: room.phase === "day" && room.daySubPhase === "vote" ? room.votes : {},
      submittedNightAction:
        !!you &&
        room.nightActions.some((a) => a.playerId === you.id && !a.auto),
      nightActionTargetId:
        you && room.phase === "night"
          ? room.nightActions.find((a) => a.playerId === you.id)?.targetId ??
            null
          : null,
      detectiveResult: you ? room.detectiveByPlayer[you.id] ?? null : null,
      afkWarnedPlayerIds: you?.isHost ? room.afkWarnedPlayerIds : [],
      chat: this.visibleChat(room, you),
      canSkipDay: this.canSkipDay(room),
      dayVotesIn: dayVoteStats(room).votesIn,
      dayVotesNeeded: dayVoteStats(room).votesNeeded,
      voiceParticipants: this.publicVoiceParticipants(room),
      autoPlayerCount: you?.isHost
        ? room.players.filter((p) => p.isBot).length
        : 0,
      daySubPhase: room.daySubPhase ?? undefined,
      announcement: room.announcement,
      mafiaTeam:
        viewerIsMafia && room.phase !== "lobby"
          ? room.players
              .filter((p) => isMafiaRole(p.role))
              .map((p) => this.toPublicPlayer(room, p, viewerId ?? "", false))
          : undefined,
      mafiaNightIntel:
        viewerIsMafia && room.phase === "night"
          ? room.mafiaNightIntel
          : undefined,
      detectiveLog:
        viewerIsDetective && room.detectiveLog.length > 0
          ? room.detectiveLog
          : undefined,
      chronicle: revealAll ? room.chronicle : undefined,
      afkGraceEndsAt: room.afkGraceEndsAt,
      afkGracePlayerId: room.afkGracePlayerId,
      roleDistributionPreview: rolePreview,
      deadVillagerVote:
        !!you &&
        !you.alive &&
        playerCanDayVote(you) &&
        room.daySubPhase === "vote",
      fiveAlive: five
        ? {
            runningTotal: five.runningTotal,
            direction: five.direction,
            turnPlayerId: five.turnPlayerId,
            skipNext: five.skipNext,
            pendingDrawCount: five.pendingDrawCount,
            yourHand: (five.handsByPlayerId[you?.id ?? ""] ?? []).map(
              toPublicFiveAliveCard
            ),
            bombAwaitingPlayerId: five.bombAwaitingPlayerId,
            bombActorId: five.bombActorId,
            bombResponderIds: five.bombResponderIds,
            drawPileCount: five.drawDeck.length,
            discardPileCount: five.discardPile.length,
            centerPileCount: five.centerPile.length,
            centerTopCard:
              five.centerPile.length > 0
                ? toPublicFiveAliveCard(
                    five.centerPile[five.centerPile.length - 1] as FiveAliveCardInstance
                  )
                : null,
          }
        : undefined,
      spotIt:
        room.spotIt && room.gameId === "spot-it"
          ? toPublicSpotIt(
              room.spotIt,
              you?.id,
              room.players.map((p) => ({ id: p.id, name: p.name }))
            )
          : undefined,
      ttt:
        room.ttt && room.gameId === "tic-tac-toe"
          ? toPublicTtt(room.ttt)
          : undefined,
      connect4:
        room.connect4 && room.gameId === "connect-4"
          ? toPublicConnect4(room.connect4)
          : undefined,
      boardWinnerId: revealAll ? room.boardWinnerId ?? null : undefined,
      boardDraw: revealAll ? !!room.boardDraw : undefined,
    };
  }

  private canSkipDay(room: Room): boolean {
    if (
      room.phase !== "day" ||
      room.daySubPhase !== "vote" ||
      room.paused
    ) {
      return false;
    }
    const { eligible, votesIn } = dayVoteStats(room);
    if (eligible.length === 0) return true;
    return votesIn >= eligible.length;
  }

  private maybeFinishDayFromVotes(room: Room) {
    // Plurality can resolve with few votes — wait until every eligible voter has cast.
    if (!this.canSkipDay(room)) return;
    this.finishDayPhase(room);
  }

  private publicVoiceParticipants(
    room: Room
  ): Partial<Record<ChatChannel, string[]>> {
    const out: Partial<Record<ChatChannel, string[]>> = {};
    for (const channel of ["town", "mafia", "graveyard"] as ChatChannel[]) {
      const ids = [...room.voiceParticipants[channel]];
      if (ids.length > 0) out[channel] = ids;
    }
    return out;
  }

  private visibleChat(room: Room, you: Player | null): ChatMessage[] {
    const opts = this.channelAccessOpts(room, you);
    return room.chat
      .filter((m) => {
        if (m.channel === "town") {
          return (
            canAccessChannel("town", opts) ||
            (!!you && !you.alive && room.phase === "day")
          );
        }
        if (m.channel === "graveyard") return !!you && !you.alive;
        if (m.channel === "mafia") {
          return canAccessChannel("mafia", opts);
        }
        return false;
      })
      .slice(-50);
  }

  emitRoom(room: Room) {
    for (const player of room.players) {
      if (!player.socketId) continue;
      this.io.to(player.socketId).emit("room:state", this.sanitize(room, player.id));
    }
    this.broadcastLobbies();
  }

  listOpenLobbies(query = ""): OpenLobby[] {
    const q = query.trim().toUpperCase();
    const rows: OpenLobby[] = [];
    for (const room of this.rooms.values()) {
      if (room.phase !== "lobby") continue;
      const mod = getGameModule(room.gameId);
      const openSlots = mod.maxPlayers - room.players.length;
      if (openSlots <= 0) continue;
      const host = room.players.find((p) => p.isHost) ?? room.players[0];
      if (!host) continue;
      const listing: OpenLobby = {
        roomId: room.id,
        gameId: room.gameId,
        hostName: host.name,
        hostAvatarId: host.avatarId,
        playerCount: room.players.length,
        maxPlayers: mod.maxPlayers,
        openSlots,
        botCount: room.players.filter((p) => p.isBot).length,
        humanCount: room.players.filter((p) => !p.isBot).length,
      };
      if (
        q &&
        !listing.roomId.includes(q) &&
        !listing.hostName.toUpperCase().includes(q)
      ) {
        continue;
      }
      rows.push(listing);
    }
    return rows.sort((a, b) => b.openSlots - a.openSlots || a.roomId.localeCompare(b.roomId));
  }

  broadcastLobbies() {
    this.io.to("lobby-browser").emit("lobbies:list", {
      lobbies: this.listOpenLobbies(),
    });
  }

  private clearTimer(room: Room) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
    this.clearBotTimers(room);
  }

  private clearBotTimers(room: Room) {
    for (const t of room.botTimers) clearTimeout(t);
    room.botTimers = [];
  }

  private delayBot(room: Room, ms: number, fn: () => void) {
    const t = setTimeout(() => {
      room.botTimers = room.botTimers.filter((x) => x !== t);
      fn();
    }, ms);
    room.botTimers.push(t);
  }

  private scheduleBots(room: Room) {
    this.clearBotTimers(room);
    if (room.paused) return;

    if (room.gameId === "five-alive") {
      const five = room.fiveAlive;
      if (!five) return;

      if (room.phase === "fivealive_turn" && five.turnPlayerId) {
        const bot = room.players.find(
          (p) => p.id === five.turnPlayerId && p.isBot && p.alive
        );
        if (!bot) return;
        const wait = botFiveAliveDelayMs();
        this.delayBot(room, wait, () => {
          if (room.phase !== "fivealive_turn" || room.paused || !bot.alive) return;
          if (five.turnPlayerId !== bot.id) return;
          const currentHand = five.handsByPlayerId[bot.id] ?? [];
          const play = pickBotFiveAliveTurnPlay(currentHand, five.runningTotal);
          if (!play) return;
          this.submitFiveAlivePlayCard(
            room.id,
            bot.id,
            play.cardId,
            play.wildValue
          );
        });
        return;
      }

      if (room.phase === "fivealive_bomb" && five.bombAwaitingPlayerId) {
        const bot = room.players.find(
          (p) =>
            p.id === five.bombAwaitingPlayerId && p.isBot && p.alive
        );
        if (!bot) return;
        const wait = botFiveAliveDelayMs();
        this.delayBot(room, wait, () => {
          if (room.phase !== "fivealive_bomb" || room.paused || !bot.alive) return;
          if (five.bombAwaitingPlayerId !== bot.id) return;
          const currentHand = five.handsByPlayerId[bot.id] ?? [];
          const response = pickBotFiveAliveBombResponse(currentHand);
          if ("pass" in response) {
            this.submitFiveAlivePlayCard(room.id, bot.id, null, undefined, true);
          } else {
            this.submitFiveAlivePlayCard(room.id, bot.id, response.cardId);
          }
        });
      }
      return;
    }

    if (room.gameId === "spot-it" && room.phase === "spotit_play" && room.spotIt) {
      const spot = room.spotIt;
      const center = spot.deck[0];
      if (!center) return;
      for (const bot of room.players.filter((p) => p.isBot)) {
        const top = spot.piles[bot.id]?.[0];
        if (!top) continue;
        const symbolId = pickBotSpotItSymbol(top, center);
        if (symbolId == null) continue;
        const seq = spot.matchSeq;
        this.delayBot(room, botSpotItDelayMs(), () => {
          if (
            room.phase !== "spotit_play" ||
            room.paused ||
            !room.spotIt ||
            room.spotIt.matchSeq !== seq
          ) {
            return;
          }
          this.submitSpotItMatch(room.id, bot.id, symbolId);
        });
      }
      return;
    }

    if (room.gameId === "tic-tac-toe" && room.phase === "ttt_play" && room.ttt) {
      const turn = room.players.find(
        (p) => p.id === room.ttt!.turnPlayerId && p.isBot
      );
      if (!turn) return;
      this.delayBot(room, botTttDelayMs(), () => {
        if (room.phase !== "ttt_play" || room.paused || !room.ttt) return;
        if (room.ttt.turnPlayerId !== turn.id) return;
        const cell = pickBotTttMove(room.ttt.board);
        if (cell == null) return;
        this.submitTttMove(room.id, turn.id, cell);
      });
      return;
    }

    if (room.gameId === "connect-4" && room.phase === "connect4_play" && room.connect4) {
      const turn = room.players.find(
        (p) => p.id === room.connect4!.turnPlayerId && p.isBot
      );
      if (!turn) return;
      this.delayBot(room, botC4DelayMs(), () => {
        if (room.phase !== "connect4_play" || room.paused || !room.connect4) return;
        if (room.connect4.turnPlayerId !== turn.id) return;
        const col = pickBotC4Column(room.connect4.board);
        if (col == null) return;
        this.submitConnect4Drop(room.id, turn.id, col);
      });
      return;
    }

    if (room.phase === "night") {
      for (const bot of living(room).filter((p) => p.isBot)) {
        const wait = botNightDelayMs(bot.role);
        this.delayBot(room, wait, () => {
          if (room.phase !== "night" || room.paused || !bot.alive) return;
          const action = pickBotNightAction(room.players, bot);
          if (!action) return;
          this.submitNightAction(room.id, bot.id, action.type, action.targetId);
        });
      }
    }
    if (room.phase === "day" && room.daySubPhase === "vote") {
      const voters = dayVoteEligible(room).filter(
        (p) => p.isBot && !(p.alive && p.blackmailed)
      );
      voters.forEach((bot, index) => {
        const wait =
          botDayDelayMs() + index * (500 + Math.floor(Math.random() * 900));
        this.delayBot(room, wait, () => {
          if (
            room.phase !== "day" ||
            room.daySubPhase !== "vote" ||
            room.paused ||
            (bot.alive && bot.blackmailed)
          ) {
            return;
          }
          if (!playerCanDayVote(bot) || room.votes[bot.id]) return;
          const targetId = pickBotVoteTarget(room.players, bot, room.votes);
          if (!targetId) return;
          this.submitVote(room.id, bot.id, targetId);
        });
      });
    }
  }

  private schedule(room: Room) {
    this.clearTimer(room);
    if (room.paused || !room.phaseEndsAt) return;
    const delay = Math.max(0, room.phaseEndsAt - Date.now());
    room.timer = setTimeout(() => this.onTimeout(room.id), delay + 30);
  }

  private setPhase(room: Room, phase: Phase, seconds: number | null) {
    room.phase = phase;
    room.paused = false;
    room.pausedRemainingMs = null;
    if (seconds == null) {
      room.phaseEndsAt = null;
      this.clearTimer(room);
    } else {
      room.phaseEndsAt = Date.now() + seconds * 1000;
      this.schedule(room);
    }
  }

  private joinMafiaRoom(player: Player, roomId: string) {
    if (player.socketId && isMafiaRole(player.role) && player.alive) {
      this.io.sockets.sockets.get(player.socketId)?.join(`mafia:${roomId}`);
    }
  }

  private leaveMafiaRooms(player: Player, roomId: string) {
    if (player.socketId) {
      this.io.sockets.sockets.get(player.socketId)?.leave(`mafia:${roomId}`);
    }
  }

  private voiceSocketIds(room: Room, channel: ChatChannel): string[] {
    const ids = room.voiceParticipants[channel];
    const sockets: string[] = [];
    for (const playerId of ids) {
      const p = room.players.find((x) => x.id === playerId);
      if (p?.socketId) sockets.push(p.socketId);
    }
    return sockets;
  }

  private broadcastVoiceParticipants(room: Room, channel: ChatChannel) {
    const participantIds = [...room.voiceParticipants[channel]];
    for (const socketId of this.voiceSocketIds(room, channel)) {
      this.io.to(socketId).emit("voice:participants", { channel, participantIds });
    }
  }

  private removeFromAllVoice(room: Room, playerId: string) {
    for (const channel of ["town", "mafia", "graveyard"] as ChatChannel[]) {
      if (!room.voiceParticipants[channel].delete(playerId)) continue;
      this.broadcastVoiceParticipants(room, channel);
    }
  }

  private clearVoiceChannels(room: Room, ...channels: ChatChannel[]) {
    for (const channel of channels) {
      if (room.voiceParticipants[channel].size === 0) continue;
      room.voiceParticipants[channel].clear();
      this.broadcastVoiceParticipants(room, channel);
    }
  }

  private finishDayPhase(room: Room) {
    this.clearTimer(room);
    room.daySubPhase = null;
    this.resolveDayPhase(room);
    if (this.maybeWin(room)) return;
    room.cycle += 1;
    for (const p of room.players) p.blackmailed = false;
    this.startNight(room);
  }

  private startDayVoteSubphase(room: Room) {
    room.daySubPhase = "vote";
    room.votes = {};
    this.clearVoiceChannels(room, "town");
    this.setAnnouncement(
      room,
      "info",
      "Voting has started",
      "Cast your lynch vote or skip. Town voice is now closed."
    );
    log(room, `Day ${room.cycle} — voting open for ${DAY_VOTE_SECONDS}s.`);
    room.phaseEndsAt = Date.now() + DAY_VOTE_SECONDS * 1000;
    this.schedule(room);
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  createRoom(opts: {
    socketId: string;
    playerId: string;
    name: string;
    avatarId: number;
    gameId?: string;
  }): Room {
    const requestedId = resolveGameId(opts.gameId);
    const mod = getGameModule(opts.gameId);
    if (mod.status === "maintenance") {
      throw new Error(
        `${mod.displayName} is under maintenance. Try another game.`
      );
    }
    if (mod.id !== requestedId) {
      throw new Error(
        `Could not start ${requestedId}. This game server may need a redeploy.`
      );
    }
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();

    const player: Player = {
      id: opts.playerId,
      socketId: opts.socketId,
      name: opts.name.trim().slice(0, 18) || "Operator",
      avatarId: opts.avatarId,
      alive: true,
      isHost: true,
      ready: true,
      afkCount: 0,
      blackmailed: false,
      isBot: false,
    };

    const room: Room = {
      id: code,
      gameId: mod.id,
      settings: mod.createSettings(),
      players: [player],
      phase: "lobby",
      cycle: 0,
      phaseEndsAt: null,
      daySubPhase: null,
      paused: false,
      pausedRemainingMs: null,
      nightActions: [],
      votes: {},
      logs: [],
      chat: [],
      chronicle: [],
      announcement: null,
      mafiaNightIntel: {},
      detectiveLog: [],
      afkGraceEndsAt: null,
      afkGracePlayerId: null,
      winner: null,
      timer: null,
      detectiveByPlayer: {},
      afkWarnedPlayerIds: [],
      botTimers: [],
      createdAt: Date.now(),
      voiceParticipants: emptyVoiceChannels(),
    };

    this.rooms.set(code, room);
    this.playerRoom.set(opts.playerId, code);
    return room;
  }

  joinRoom(opts: {
    roomId: string;
    socketId: string;
    playerId: string;
    name: string;
    avatarId: number;
  }): Room {
    const parsed = validateRoomCode(opts.roomId);
    if (!parsed.ok) {
      throw new RoomError("INVALID_CODE", parsed.message);
    }
    const room = this.getRoom(parsed.code);
    if (!room) {
      throw new RoomError(
        "NOT_FOUND",
        `No lobby exists for code ${parsed.code}. Check the party code and try again.`
      );
    }
    const mod = getGameModule(room.gameId);

    const existing = room.players.find((p) => p.id === opts.playerId);
    if (existing) {
      existing.socketId = opts.socketId;
      existing.name = opts.name.trim().slice(0, 18) || existing.name;
      existing.avatarId = opts.avatarId;
      if (room.phase === "lobby") existing.ready = true;
      this.playerRoom.set(opts.playerId, room.id);
      this.joinMafiaRoom(existing, room.id);
      return room;
    }

    if (room.phase !== "lobby") {
      throw new RoomError(
        "IN_PROGRESS",
        "That lobby already started a match. Ask the host for a new code."
      );
    }
    if (room.players.length >= mod.maxPlayers) {
      throw new RoomError("FULL", "That lobby is full.");
    }
    if (room.players.some((p) => p.name.toLowerCase() === opts.name.trim().toLowerCase())) {
      throw new RoomError("NAME_TAKEN", "That display name is taken in this room.");
    }

    room.players.push({
      id: opts.playerId,
      socketId: opts.socketId,
      name: opts.name.trim().slice(0, 18) || "Operator",
      avatarId: opts.avatarId,
      alive: true,
      isHost: false,
      ready: true,
      afkCount: 0,
      blackmailed: false,
      isBot: false,
    });
    this.playerRoom.set(opts.playerId, room.id);
    return room;
  }

  rejoin(opts: { roomId: string; socketId: string; playerId: string }): Room {
    const parsed = validateRoomCode(opts.roomId);
    if (!parsed.ok) {
      throw new RoomError("INVALID_CODE", parsed.message);
    }
    const room = this.getRoom(parsed.code);
    if (!room) {
      throw new RoomError(
        "NOT_FOUND",
        `No lobby exists for code ${parsed.code}. It may have closed.`
      );
    }
    const player = room.players.find((p) => p.id === opts.playerId);
    if (!player || player.isBot) {
      throw new RoomError("NOT_IN_ROOM", "You are not in this lobby. Join with the party code from the hub.");
    }
    player.socketId = opts.socketId;
    if (room.phase === "lobby") player.ready = true;
    this.playerRoom.set(opts.playerId, room.id);
    this.joinMafiaRoom(player, room.id);
    this.io.sockets.sockets.get(opts.socketId)?.join(room.id);
    return room;
  }

  setReady(roomId: string, playerId: string, ready: boolean) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "lobby") return;
    const p = room.players.find((x) => x.id === playerId);
    if (p && !p.isBot) p.ready = ready;
    this.emitRoom(room);
  }

  updateSettings(roomId: string, playerId: string, patch: Partial<RoomSettings>) {
    const room = this.getRoom(roomId);
    if (!room) return;
    if (!this.requireHost(room, playerId)) return;

    const midGame = room.phase !== "lobby" && room.phase !== "gameover";

    if (typeof patch.nightSeconds === "number") {
      room.settings.nightSeconds = Math.min(120, Math.max(15, patch.nightSeconds));
    }
    if (typeof patch.daySeconds === "number") {
      room.settings.daySeconds = Math.min(200, Math.max(20, patch.daySeconds));
    }
    if (!midGame) {
      if (patch.vigilanteBullets === null) {
        room.settings.vigilanteBullets = null;
      } else if (typeof patch.vigilanteBullets === "number") {
        room.settings.vigilanteBullets = Math.min(
          3,
          Math.max(1, patch.vigilanteBullets)
        );
      }
      if (patch.roleDistribution !== undefined) {
        room.settings.roleDistribution = patch.roleDistribution;
      }
    }
    this.emitRoom(room);
  }

  addBots(roomId: string, playerId: string, fillTo?: number) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "lobby") {
      throw new RoomError("NOT_LOBBY", "Bots can only be added in the lobby.");
    }
    if (!this.requireHost(room, playerId)) {
      throw new RoomError("NOT_HOST", "Only the host can add bots.");
    }
    const mod = getGameModule(room.gameId);
    if (fillTo != null) {
      const target = Math.min(mod.maxPlayers, fillTo);
      while (room.players.length < target) {
        this.pushBot(room);
      }
    } else {
      if (room.players.length >= mod.maxPlayers) {
        throw new RoomError("FULL", "Lobby is full.");
      }
      this.pushBot(room);
    }
    this.emitRoom(room);
  }

  private pushBot(room: Room) {
    const name = nextBotName(room.players.map((p) => p.name));
    const avatarId = nextBotAvatarId(room.players.map((p) => p.avatarId));
    room.players.push({
      id: `bot-${randomUUID()}`,
      socketId: null,
      name,
      avatarId,
      alive: true,
      isHost: false,
      ready: true,
      afkCount: 0,
      blackmailed: false,
      isBot: true,
    });
  }

  removeBot(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "lobby") {
      throw new RoomError("NOT_LOBBY", "Auto players can only be removed in the lobby.");
    }
    if (!this.requireHost(room, playerId)) {
      throw new RoomError("NOT_HOST", "Only the host can remove auto players.");
    }
    const idx = [...room.players].reverse().findIndex((p) => p.isBot);
    if (idx === -1) {
      throw new RoomError("NO_BOTS", "No auto players to remove.");
    }
    const removeAt = room.players.length - 1 - idx;
    room.players.splice(removeAt, 1);
    this.emitRoom(room);
  }

  startGame(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (!room) throw new Error("Room not found");
    if (!this.requireHost(room, playerId)) throw new Error("Only the host can start");
    if (room.phase !== "lobby") throw new Error("Game already started");
    const mod = getGameModule(room.gameId);
    if (room.players.length < mod.minPlayers) {
      throw new Error(`Need at least ${mod.minPlayers} players`);
    }

    if (room.gameId === "five-alive") {
      this.startFiveAlive(room);
      return;
    }
    if (room.gameId === "spot-it") {
      this.startSpotIt(room);
      return;
    }
    if (room.gameId === "tic-tac-toe") {
      this.startTicTacToe(room);
      return;
    }
    if (room.gameId === "connect-4") {
      this.startConnect4(room);
      return;
    }

    const roles = mod.assignRoles(room.players.length, room.settings);
    const bullets = bulletsForLobby(room.players.length, room.settings);
    room.players.forEach((p, i) => {
      p.role = roles[i];
      p.alive = true;
      p.ready = false;
      p.afkCount = 0;
      p.blackmailed = false;
      p.bulletsLeft = p.role === "vigilante" ? bullets : undefined;
      this.leaveMafiaRooms(p, room.id);
      this.joinMafiaRoom(p, room.id);
    });
    room.cycle = 1;
    room.winner = null;
    room.logs = [];
    room.votes = {};
    room.nightActions = [];
    room.detectiveByPlayer = {};
    room.afkWarnedPlayerIds = [];
    room.chronicle = [];
    room.announcement = null;
    room.mafiaNightIntel = {};
    room.detectiveLog = [];
    room.daySubPhase = null;
    room.afkGraceEndsAt = null;
    room.afkGracePlayerId = null;
    log(room, "The city goes dark. Roles have been sealed.");
    this.setPhase(room, "reveal", REVEAL_SECONDS);

    for (const p of room.players) {
      if (!p.socketId || !p.role) continue;
      const meta = ROLE_META[p.role];
      this.io.to(p.socketId).emit("role:reveal", {
        role: p.role,
        faction: meta.faction,
        ability: meta.ability,
      });
    }
    this.emitRoom(room);
  }

  private startFiveAlive(room: Room) {
    // Reset all Mafia-City-specific round state.
    room.cycle = 1;
    room.winner = null;
    room.logs = [];
    room.votes = {};
    room.nightActions = [];
    room.detectiveByPlayer = {};
    room.afkWarnedPlayerIds = [];
    room.fiveAlive = {
      drawDeck: buildFiveAliveDeck(),
      discardPile: [],
      centerPile: [],
      handsByPlayerId: {},
      runningTotal: 0,
      direction: 1,
      turnPlayerId: null,
      skipNext: false,
      pendingDrawCount: 0,
      bombAwaitingPlayerId: null,
      bombActorId: null,
      bombResponderIds: [],
    };

    const five = room.fiveAlive;
    if (!five) return;

    // Initialize lives and clear Mafia room voice/channel membership.
    for (const p of room.players) {
      p.role = undefined;
      p.bulletsLeft = undefined;
      p.blackmailed = false;
      p.lives = 5;
      p.alive = true;
      p.ready = false;
      p.afkCount = 0;
      this.leaveMafiaRooms(p, room.id);
    }

    const drawFromDeck = (count: number) => {
      const out: FiveAliveCardInstance[] = [];
      while (out.length < count) {
        if (five.drawDeck.length === 0) {
          if (five.discardPile.length > 0) {
            five.drawDeck = shuffle(five.discardPile);
            five.discardPile = [];
          } else {
            // Should never happen during normal play, but keep the game from crashing.
            five.drawDeck = buildFiveAliveDeck();
          }
        }
        const drawn = five.drawDeck.pop();
        if (drawn) out.push(drawn);
      }
      return out;
    };

    // Deal initial hands.
    for (const p of room.players) {
      five.handsByPlayerId[p.id] = drawFromDeck(FIVE_ALIVE_HAND_SIZE);
    }

    // Turn order: first seat in `room.players` order starts.
    const first = room.players.find((p) => (p.lives ?? 0) > 0);
    five.turnPlayerId = first?.id ?? null;

    log(room, "5 Alive begins: keep the running total at or below 21.");
    this.setPhase(room, "fivealive_turn", room.settings.daySeconds);
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  private startNight(room: Room) {
    room.nightActions = [];
    room.votes = {};
    room.detectiveByPlayer = {};
    room.daySubPhase = null;
    room.mafiaNightIntel = {};
    room.afkGraceEndsAt = null;
    room.afkGracePlayerId = null;
    this.clearVoiceChannels(room, "town", "graveyard");
    log(room, `Night ${room.cycle} falls over the city.`);
    this.setPhase(room, "night", room.settings.nightSeconds);
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  private startDay(room: Room) {
    this.clearVoiceChannels(room, "mafia");
    room.daySubPhase = "discussion";
    room.votes = {};
    const discussionSeconds = Math.max(
      DAY_VOTE_SECONDS,
      room.settings.daySeconds - DAY_VOTE_SECONDS
    );
    log(room, `Day ${room.cycle} — discuss, accuse, survive.`);
    this.setAnnouncement(
      room,
      "info",
      `Day ${room.cycle} discussion`,
      "Town voice is open. Voting starts in the final 15 seconds."
    );
    room.phase = "day";
    room.paused = false;
    room.pausedRemainingMs = null;
    room.phaseEndsAt = Date.now() + discussionSeconds * 1000;
    this.schedule(room);
    this.emitRoom(room);
  }

  private maybeWin(room: Room): boolean {
    if (room.gameId === "five-alive") {
      return this.fiveAliveMaybeWin(room);
    }
    const winner = winCheck(room.players);
    if (!winner) return false;
    room.winner = winner;
    this.setPhase(room, "gameover", null);
    const recap = room.players.map((p) =>
      this.toPublicPlayer(room, p, "", true)
    );
    this.io.to(room.id).emit("game:over", { winner, recap });
    this.emitRoom(room);
    return true;
  }

  private playersNeedingNightAction(room: Room): Player[] {
    return living(room).filter((p) => {
      const type = nightActionFor(p.role) as NightActionType | null;
      if (!type) return false;
      if (type === "vigilante_shoot" && (p.bulletsLeft ?? 0) <= 0) return false;
      if (room.nightActions.some((a) => a.playerId === p.id)) return false;
      return true;
    });
  }

  private playersNeedingVote(room: Room): Player[] {
    return dayVoteEligible(room).filter((p) => !room.votes[p.id]);
  }

  private startAfkGrace(room: Room, player: Player) {
    room.afkGracePlayerId = player.id;
    room.afkGraceEndsAt = Date.now() + AFK_GRACE_MS;
    log(room, `${player.name} missed their action — ${AFK_GRACE_MS / 1000}s grace period.`);
    this.emitRoom(room);
    this.delayBot(room, AFK_GRACE_MS, () => {
      if (room.afkGracePlayerId !== player.id) return;
      this.killAfkPlayer(room, player.id);
    });
  }

  private killAfkPlayer(room: Room, playerId: string) {
    const player = room.players.find((p) => p.id === playerId);
    if (!player?.alive) return;
    player.alive = false;
    room.afkGracePlayerId = null;
    room.afkGraceEndsAt = null;
    log(room, `${player.name} died due to AFK.`);
    this.leaveMafiaRooms(player, room.id);
    this.removeFromAllVoice(room, player.id);
    this.addChronicle(room, room.phase === "night" ? "night" : "day", `${player.name} died due to AFK`);
    this.emitRoom(room);
    this.maybeWin(room);
  }

  private handlePhaseTimeoutAfk(room: Room) {
    if (room.phase === "night") {
      for (const player of this.playersNeedingNightAction(room)) {
        if (player.isBot) continue;
        player.afkCount += 1;
        if (player.afkCount >= 2) {
          this.killAfkPlayer(room, player.id);
        } else if (room.afkGracePlayerId !== player.id) {
          this.startAfkGrace(room, player);
        }
      }
      return;
    }
    if (room.phase === "day" && room.daySubPhase === "vote") {
      for (const player of this.playersNeedingVote(room)) {
        if (player.isBot) continue;
        player.afkCount += 1;
        if (player.afkCount >= 2) {
          this.killAfkPlayer(room, player.id);
        } else if (room.afkGracePlayerId !== player.id) {
          this.startAfkGrace(room, player);
        }
      }
    }
  }

  private updateMafiaNightIntel(room: Room) {
    const intel: MafiaNightIntel = {};
    for (const action of room.nightActions) {
      const actor = room.players.find((p) => p.id === action.playerId);
      const target = room.players.find((p) => p.id === action.targetId);
      if (!actor || !target) continue;
      if (action.type === "blackmail") {
        intel.blackmailTargetId = target.id;
        intel.blackmailTargetName = target.name;
      }
      if (action.type === "mafia_kill" && actor.role === "mafia_boss") {
        intel.bossTargetId = target.id;
        intel.bossTargetName = target.name;
      }
      if (action.type === "mafia_kill" && actor.role === "mafia_goon") {
        intel.goonTargetId = target.id;
        intel.goonTargetName = target.name;
      }
    }
    room.mafiaNightIntel = intel;
  }

  private byActorRolePhrase(
    room: Room,
    actorId: string | null | undefined,
    actorRole?: string | null
  ): string {
    if (!actorId) return "";
    const actor = room.players.find((p) => p.id === actorId);
    if (!actor) return "";
    const role =
      (actorRole && actorRole in ROLE_META
        ? ROLE_META[actorRole as keyof typeof ROLE_META].label
        : actor.role
          ? ROLE_META[actor.role].label
          : null) ?? "Unknown";
    return ` by ${actor.name} with ${role} role`;
  }

  private resolveNightPhase(room: Room) {
    this.handlePhaseTimeoutAfk(room);
    const result = resolveNight(room.players, room.nightActions);

    if (result.detective) {
      const target = room.players.find((p) => p.id === result.detective!.targetId);
      const inv = room.players.find((p) => p.id === result.detective!.investigatorId);
      room.detectiveByPlayer[result.detective.investigatorId] = {
        targetId: result.detective.targetId,
        faction: result.detective.faction,
      };
      if (target) {
        room.detectiveLog.push({
          id: randomUUID(),
          targetId: target.id,
          targetName: target.name,
          faction: result.detective.faction,
          at: Date.now(),
          cycle: room.cycle,
        });
        const by = this.byActorRolePhrase(
          room,
          result.detective.investigatorId,
          "detective"
        );
        this.addChronicle(
          room,
          "night",
          `${target.name} was investigated${by} — ${result.detective.faction}.`
        );
      }
      if (inv?.socketId) {
        this.io.to(inv.socketId).emit("detective:result", {
          targetId: result.detective.targetId,
          targetName: target?.name ?? "Unknown",
          faction: result.detective.faction,
        });
      }
    }

    if (result.doctorSavedTargetId) {
      const saved = room.players.find((p) => p.id === result.doctorSavedTargetId);
      if (saved) {
        const by = this.byActorRolePhrase(room, result.doctorId, "doctor");
        this.addChronicle(
          room,
          "night",
          `${saved.name} was saved${by || " by the Doctor"}.`
        );
      }
    }

    if (result.silencedId) {
      const p = room.players.find((x) => x.id === result.silencedId);
      if (p) {
        log(room, `${p.name} has been blackmailed into silence.`);
        const by = this.byActorRolePhrase(
          room,
          result.blackmailerId,
          "blackmailer"
        );
        this.addChronicle(
          room,
          "night",
          `${p.name} was blackmailed${by}.`
        );
      }
    }

    if (result.deaths.length === 0) {
      log(room, "The night passes without blood.");
      if (
        !result.doctorSavedTargetId &&
        !result.detective &&
        !result.silencedId
      ) {
        this.addChronicle(room, "night", "The night passed quietly.");
      }
      this.setAnnouncement(
        room,
        "good",
        "Quiet night",
        "No one was eliminated overnight."
      );
    } else {
      const names = result.deaths
        .map((d) => room.players.find((x) => x.id === d.playerId)?.name)
        .filter((n): n is string => Boolean(n));
      const nameList =
        names.length === 0
          ? "Someone"
          : names.length === 1
            ? names[0]
            : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
      const verb = names.length === 1 || names.length === 0 ? "was" : "were";
      log(room, `${nameList} ${verb} eliminated overnight.`);
      for (const d of result.deaths) {
        const p = room.players.find((x) => x.id === d.playerId);
        if (p) {
          const by = this.byActorRolePhrase(room, d.actorId, d.actorRole);
          this.addChronicle(
            room,
            "night",
            `${p.name} was eliminated overnight${by}.`
          );
          this.leaveMafiaRooms(p, room.id);
          this.removeFromAllVoice(room, p.id);
        }
      }
      if (names.length === 0) {
        this.addChronicle(room, "night", "Someone was eliminated overnight.");
      }
      this.setAnnouncement(
        room,
        "bad",
        "Night results",
        `${nameList} ${verb} eliminated overnight.`
      );
    }

    for (const p of room.players) {
      if (!p.alive) this.leaveMafiaRooms(p, room.id);
    }
  }

  private resolveDayPhase(room: Room) {
    this.handlePhaseTimeoutAfk(room);
    const lynchedId = tallyLynch(room.players, room.votes);
    if (lynchedId === SKIP_VOTE_ID) {
      log(room, "The city votes to skip the lynch.");
      this.addChronicle(room, "day", "No one was lynched — vote skipped.");
      this.setAnnouncement(room, "info", "No lynch", "The city voted to skip.");
      return;
    }
    if (!lynchedId) {
      log(room, "The vote ties. The city lets the day die without a hanging.");
      this.addChronicle(room, "day", "Vote tied — no lynch.");
      this.setAnnouncement(
        room,
        "info",
        "Tied vote",
        "No one held the most votes alone."
      );
      return;
    }
    const target = room.players.find((p) => p.id === lynchedId);
    if (!target || !target.alive) return;
    target.alive = false;
    log(room, `The city lynches ${target.name}.`);
    this.addChronicle(room, "day", `${target.name} was lynched.`);
    this.setAnnouncement(
      room,
      "bad",
      "Lynch result",
      `${target.name} was eliminated by vote.`
    );
    this.leaveMafiaRooms(target, room.id);
    this.removeFromAllVoice(room, target.id);
  }

  private onTimeout(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room || room.paused) return;
    if (room.gameId === "five-alive") {
      this.onTimeoutFiveAlive(roomId);
      return;
    }
    if (room.gameId === "tic-tac-toe" && room.phase === "ttt_play" && room.ttt) {
      const turnId = room.ttt.turnPlayerId;
      const bot = room.players.find((p) => p.id === turnId);
      if (bot) {
        const cell = pickBotTttMove(room.ttt.board);
        if (cell != null) this.submitTttMove(room.id, turnId, cell);
      }
      return;
    }
    if (room.gameId === "connect-4" && room.phase === "connect4_play" && room.connect4) {
      const turnId = room.connect4.turnPlayerId;
      const col = pickBotC4Column(room.connect4.board);
      if (col != null) this.submitConnect4Drop(room.id, turnId, col);
      return;
    }
    if (room.phase === "reveal") {
      this.startNight(room);
      return;
    }
    if (room.phase === "night") {
      this.resolveNightPhase(room);
      if (this.maybeWin(room)) return;
      this.startDay(room);
      return;
    }
    if (room.phase === "day") {
      if (room.daySubPhase === "discussion") {
        this.startDayVoteSubphase(room);
        return;
      }
      this.finishDayPhase(room);
    }
  }

  private fiveAliveMaybeWin(room: Room): boolean {
    const five = room.fiveAlive;
    if (!five) return false;
    const livingIds = room.players
      .filter((p) => (p.lives ?? 0) > 0 && p.alive)
      .map((p) => p.id);
    if (livingIds.length > 1) return false;

    room.winner = "town";
    this.setPhase(room, "gameover", null);
    const recap = room.players.map((p) =>
      this.toPublicPlayer(room, p, "", true)
    );
    this.io.to(room.id).emit("game:over", { winner: "town", recap });
    this.emitRoom(room);
    return true;
  }

  private fiveAliveDrawIntoHand(
    room: Room,
    playerId: string,
    count: number
  ) {
    const five = room.fiveAlive;
    if (!five || count <= 0) return;
    if (!five.handsByPlayerId[playerId]) five.handsByPlayerId[playerId] = [];

    const drawOne = (): FiveAliveCardInstance => {
      if (five.drawDeck.length === 0) {
        if (five.discardPile.length === 0) {
          // Safety fallback; the deck should be large enough in practice.
          five.drawDeck = buildFiveAliveDeck();
        } else {
          five.drawDeck = shuffle(five.discardPile);
          five.discardPile = [];
        }
      }
      const drawn = five.drawDeck.pop();
      if (!drawn) {
        five.drawDeck = buildFiveAliveDeck();
        return five.drawDeck.pop() as FiveAliveCardInstance;
      }
      return drawn;
    };

    for (let i = 0; i < count; i++) {
      five.handsByPlayerId[playerId].push(drawOne());
    }
  }

  private fiveAliveRedealIfEmpty(room: Room, playerId: string) {
    const five = room.fiveAlive;
    if (!five) return;
    const hand = five.handsByPlayerId[playerId] ?? [];
    if (hand.length > 0) return;
    five.handsByPlayerId[playerId] = [];
    this.fiveAliveDrawIntoHand(room, playerId, FIVE_ALIVE_HAND_SIZE);
  }

  private fiveAliveClearCenterToDiscard(room: Room) {
    const five = room.fiveAlive;
    if (!five) return;
    if (five.centerPile.length === 0) return;
    five.discardPile.push(...five.centerPile);
    five.centerPile = [];
  }

  private fiveAliveNextNormalPlayerId(
    room: Room,
    fromPlayerId: string
  ): string | null {
    const five = room.fiveAlive;
    if (!five) return null;
    const dir = five.direction;
    const n = room.players.length;
    const fromIdx = room.players.findIndex((p) => p.id === fromPlayerId);
    if (fromIdx < 0) return null;

    const steps = 1 + (five.skipNext ? 1 : 0);
    let remaining = steps;
    let idx = fromIdx;
    while (remaining > 0) {
      idx = (idx + dir + n) % n;
      const candidate = room.players[idx];
      if ((candidate.lives ?? 0) > 0 && candidate.alive) {
        remaining -= 1;
      }
      // Safety: if somehow nobody else is living, return null.
      if (remaining > 0 && idx === fromIdx) return null;
    }
    five.skipNext = false;
    return room.players[idx]?.id ?? null;
  }

  private fiveAliveAdvanceToNextTurn(room: Room, fromPlayerId: string) {
    const five = room.fiveAlive;
    if (!five) return;

    const nextId = this.fiveAliveNextNormalPlayerId(room, fromPlayerId);
    if (!nextId) {
      this.fiveAliveMaybeWin(room);
      return;
    }

    // Apply pending draw to the next player before their turn begins.
    if (five.pendingDrawCount > 0) {
      this.fiveAliveDrawIntoHand(room, nextId, five.pendingDrawCount);
      log(room, `${room.players.find((p) => p.id === nextId)?.name ?? "Someone"} draws ${five.pendingDrawCount}.`);
      five.pendingDrawCount = 0;
    }

    five.turnPlayerId = nextId;
    five.bombAwaitingPlayerId = null;
    five.bombResponderIds = [];
    five.bombActorId = null;
    this.setPhase(room, "fivealive_turn", room.settings.daySeconds);
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  private fiveAliveStartBombResolution(room: Room, actorId: string) {
    const five = room.fiveAlive;
    if (!five) return;
    const living = room.players.filter((p) => (p.lives ?? 0) > 0 && p.alive);
    if (living.length <= 1) return;

    // Start responders from the next normal player after the bomb actor, in
    // the current turn direction, then walk the table until all other living
    // players have responded.
    const n = room.players.length;
    const actorIdx = room.players.findIndex((p) => p.id === actorId);
    const dir = five.direction;

    const responders: string[] = [];
    let idx = actorIdx;
    while (responders.length < living.length - 1) {
      idx = (idx + dir + n) % n;
      const candidate = room.players[idx];
      if ((candidate.lives ?? 0) > 0 && candidate.alive && candidate.id !== actorId) {
        responders.push(candidate.id);
      }
      // Safety break to avoid infinite loops.
      if (idx === actorIdx && responders.length === living.length - 1) break;
      if (idx === actorIdx && responders.length < living.length - 1) break;
    }

    five.bombActorId = actorId;
    five.bombResponderIds = responders;
    five.bombAwaitingPlayerId = responders[0] ?? null;
    five.turnPlayerId = null;
    five.skipNext = false;
    // Bomb does not specify carrying forward pending draw/skip.
    five.pendingDrawCount = 0;

    this.setPhase(room, "fivealive_bomb", room.settings.daySeconds);
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  private onTimeoutFiveAlive(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room || room.paused || room.gameId !== "five-alive") return;
    const five = room.fiveAlive;
    if (!five) return;

    if (room.phase === "fivealive_turn") {
      const actorId = five.turnPlayerId;
      const actorName =
        room.players.find((p) => p.id === actorId)?.name ?? "Someone";
      log(room, `${actorName} timed out. Turn skipped.`);
      // Skip to next normal turn.
      if (actorId) {
        this.fiveAliveAdvanceToNextTurn(room, actorId);
      } else {
        this.fiveAliveMaybeWin(room);
      }
      return;
    }

    if (room.phase === "fivealive_bomb") {
      const awaitingId = five.bombAwaitingPlayerId;
      if (awaitingId) {
        const p = room.players.find((x) => x.id === awaitingId);
        if (p && p.alive) {
          p.lives = Math.max(0, (p.lives ?? 0) - 1);
          p.alive = (p.lives ?? 0) > 0;
          this.fiveAliveRedealIfEmpty(room, p.id);
        }
      }

      // Advance bomb awaiting to next responder (or finish).
      const idx = five.bombResponderIds.indexOf(awaitingId ?? "");
      const nextAwaiting = five.bombResponderIds[idx + 1] ?? null;
      five.bombAwaitingPlayerId = nextAwaiting;
      if (!nextAwaiting) {
        const actorId = five.bombActorId;
        five.bombActorId = null;
        five.bombResponderIds = [];
        five.bombAwaitingPlayerId = null;
        if (actorId) {
          this.fiveAliveAdvanceToNextTurn(room, actorId);
        } else {
          this.fiveAliveMaybeWin(room);
        }
      }
      void this.fiveAliveMaybeWin(room);
      this.emitRoom(room);
    }
  }

  submitFiveAlivePlayCard(
    roomId: string,
    playerId: string,
    cardId?: string | null,
    wildValue?: number,
    pass?: boolean
  ) {
    const room = this.getRoom(roomId);
    if (!room || room.paused || room.gameId !== "five-alive") return;
    const five = room.fiveAlive;
    if (!five) return;

    const actor = room.players.find((p) => p.id === playerId);
    if (!actor || !actor.alive || (actor.lives ?? 0) <= 0) return;
    if (!five.handsByPlayerId[playerId]) five.handsByPlayerId[playerId] = [];

    if (room.phase === "fivealive_turn") {
      if (five.turnPlayerId !== playerId) return;
      if (pass) return; // no “pass” on a normal turn by spec

      const id = cardId ?? null;
      if (!id) return;

      const hand = five.handsByPlayerId[playerId] ?? [];
      const idx = hand.findIndex((c) => c.id === id);
      if (idx < 0) return;

      const card = hand[idx] as FiveAliveCardInstance;
      hand.splice(idx, 1);
      five.centerPile.push(card);

      const advanceAfterPlay = () => {
        // Re-deal before advancing so the next player sees updated hands.
        this.fiveAliveRedealIfEmpty(room, playerId);
        if (this.fiveAliveMaybeWin(room)) return;
        this.fiveAliveAdvanceToNextTurn(room, playerId);
      };

      const doBust = (reason: string) => {
        actor.lives = Math.max(0, (actor.lives ?? 0) - 1);
        actor.alive = (actor.lives ?? 0) > 0;
        five.runningTotal = 0;
        five.pendingDrawCount = 0;
        five.skipNext = false;
        this.fiveAliveClearCenterToDiscard(room);
        log(room, `${actor.name} busts (${reason}) — lose 1 life, reset to 0.`);
        this.fiveAliveRedealIfEmpty(room, playerId);
        if (this.fiveAliveMaybeWin(room)) return;
        this.fiveAliveAdvanceToNextTurn(room, playerId);
      };

      switch (card.type) {
        case "number": {
          const tentative = five.runningTotal + card.value;
          if (tentative > 21) {
            doBust(`>${21}`);
            return;
          }
          five.runningTotal = tentative;
          log(room, `${actor.name} plays ${cardLabel(card)} (total: ${five.runningTotal}).`);
          advanceAfterPlay();
          return;
        }
        case "eq21":
          five.runningTotal = 21;
          log(room, `${actor.name} plays =21 (total: 21).`);
          advanceAfterPlay();
          return;
        case "reset0":
          five.runningTotal = 0;
          log(room, `${actor.name} plays =0 (total: 0).`);
          advanceAfterPlay();
          return;
        case "skip":
          five.skipNext = true;
          log(room, `${actor.name} plays Skip.`);
          advanceAfterPlay();
          return;
        case "reverse":
          five.direction = five.direction === 1 ? -1 : 1;
          log(room, `${actor.name} plays Reverse.`);
          advanceAfterPlay();
          return;
        case "draw1":
          five.pendingDrawCount = 1;
          log(room, `${actor.name} plays Draw 1.`);
          advanceAfterPlay();
          return;
        case "draw2":
          five.pendingDrawCount = 2;
          log(room, `${actor.name} plays Draw 2.`);
          advanceAfterPlay();
          return;
        case "bomb":
          // Bomb: running total unchanged; next we collect 0-defuses from everyone else.
          log(room, `${actor.name} plays Bomb.`);
          five.skipNext = false;
          five.pendingDrawCount = 0;
          this.fiveAliveRedealIfEmpty(room, playerId);
          if (this.fiveAliveMaybeWin(room)) return;
          this.fiveAliveStartBombResolution(room, playerId);
          return;
        case "wild": {
          const v = wildValue;
          if (typeof v !== "number" || !Number.isFinite(v))
            return;
          const clamped = Math.max(0, Math.min(21, Math.floor(v)));
          five.runningTotal = clamped;
          log(room, `${actor.name} plays Wild (total: ${five.runningTotal}).`);
          advanceAfterPlay();
          return;
        }
      }
    }

    if (room.phase === "fivealive_bomb") {
      if (five.bombAwaitingPlayerId !== playerId) return;

      if (pass) {
        const hand = five.handsByPlayerId[playerId] ?? [];
        const hasZero = hand.some((c) => isNumber0(c));
        if (hasZero) return;
        actor.lives = Math.max(0, (actor.lives ?? 0) - 1);
        actor.alive = (actor.lives ?? 0) > 0;
        log(room, `${actor.name} cannot defuse — lose 1 life.`);
      } else {
        const id = cardId ?? null;
        if (!id) return;

        const hand = five.handsByPlayerId[playerId] ?? [];
        const idx = hand.findIndex((c) => c.id === id);
        if (idx < 0) return;
        const card = hand[idx] as FiveAliveCardInstance;
        if (!isNumber0(card)) return;

        hand.splice(idx, 1);
        five.centerPile.push(card);
        log(room, `${actor.name} defuses with 0.`);
      }

      // Redeal if they emptied their hand as part of the response.
      this.fiveAliveRedealIfEmpty(room, playerId);
      if (this.fiveAliveMaybeWin(room)) return;

      const idx = five.bombResponderIds.indexOf(playerId);
      const nextAwaiting = five.bombResponderIds[idx + 1] ?? null;
      five.bombAwaitingPlayerId = nextAwaiting;

      if (!nextAwaiting) {
        const actorId = five.bombActorId;
        five.bombActorId = null;
        five.bombResponderIds = [];
        five.bombAwaitingPlayerId = null;
        if (actorId) {
          this.fiveAliveAdvanceToNextTurn(room, actorId);
        } else {
          this.fiveAliveMaybeWin(room);
        }
      } else {
        this.scheduleBots(room);
        this.emitRoom(room);
      }
    }
  }

  submitNightAction(
    roomId: string,
    playerId: string,
    type: NightActionType,
    targetId: string
  ) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "night" || room.paused) return;
    const actor = room.players.find((p) => p.id === playerId);
    if (!actor?.alive) return;
    const expected = nightActionFor(actor.role);
    if (expected !== type) return;
    if (type === "vigilante_shoot" && (actor.bulletsLeft ?? 0) <= 0) return;
    const legal = validNightTargets(room.players, actor);
    if (!legal.some((p) => p.id === targetId)) {
      return;
    }
    room.nightActions = room.nightActions.filter((a) => a.playerId !== playerId);
    room.nightActions.push({ playerId, type, targetId, auto: false });
    this.updateMafiaNightIntel(room);
    if (room.afkGracePlayerId === playerId) {
      room.afkGracePlayerId = null;
      room.afkGraceEndsAt = null;
    }
    this.emitRoom(room);
  }

  submitVoteSkip(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (
      !room ||
      room.phase !== "day" ||
      room.daySubPhase !== "vote" ||
      room.paused
    ) {
      return;
    }
    const voter = room.players.find((p) => p.id === playerId);
    if (!voter) return;
    if (!playerCanDayVote(voter)) return;
    room.votes[playerId] = SKIP_VOTE_ID;
    if (room.afkGracePlayerId === playerId) {
      room.afkGracePlayerId = null;
      room.afkGraceEndsAt = null;
    }
    this.emitRoom(room);

    this.maybeFinishDayFromVotes(room);
  }

  submitVote(roomId: string, playerId: string, targetId: string) {
    const room = this.getRoom(roomId);
    if (
      !room ||
      room.phase !== "day" ||
      room.daySubPhase !== "vote" ||
      room.paused
    ) {
      return;
    }
    const voter = room.players.find((p) => p.id === playerId);
    const target = room.players.find((p) => p.id === targetId);
    if (!voter || !playerCanDayVote(voter) || !target?.alive || target.id === voter.id) {
      return;
    }
    room.votes[playerId] = targetId;
    if (room.afkGracePlayerId === playerId) {
      room.afkGracePlayerId = null;
      room.afkGraceEndsAt = null;
    }
    this.emitRoom(room);

    this.maybeFinishDayFromVotes(room);
  }

  skipDay(roomId: string, hostId: string) {
    const room = this.getRoom(roomId);
    if (!room || !this.requireHost(room, hostId)) return;
    if (
      room.phase !== "day" ||
      room.daySubPhase !== "vote" ||
      room.paused ||
      !this.canSkipDay(room)
    ) {
      return;
    }
    log(room, "The host ends the day early.");
    this.finishDayPhase(room);
  }

  /** Host force-advances the current timed phase (night / discussion / vote / reveal). */
  skipPhaseTimer(roomId: string, hostId: string) {
    const room = this.getRoom(roomId);
    if (!room || !this.requireHost(room, hostId)) return;
    if (room.paused) return;
    if (room.phase === "lobby" || room.phase === "gameover") return;
    if (!room.phaseEndsAt && room.gameId === "mafia-city") return;
    log(room, "The host skips the timer.");
    this.clearTimer(room);
    this.onTimeout(roomId);
  }

  relayVoiceSpeaking(
    roomId: string,
    playerId: string,
    channel: ChatChannel,
    speaking: boolean
  ) {
    const room = this.getRoom(roomId);
    if (!room || isChatOnlyGame(room.gameId)) return;
    if (!room.voiceParticipants[channel].has(playerId)) return;
    for (const socketId of this.voiceSocketIds(room, channel)) {
      this.io.to(socketId).emit("voice:speaking", {
        channel,
        playerId,
        speaking,
      });
    }
  }

  joinVoice(roomId: string, playerId: string, channel: ChatChannel) {
    const room = this.getRoom(roomId);
    const player = room?.players.find((p) => p.id === playerId);
    if (!room || isChatOnlyGame(room.gameId)) {
      if (player?.socketId) {
        this.io.to(player.socketId).emit("voice:error", {
          message: "Voice is not available in this game.",
        });
      }
      return;
    }
    if (!player?.socketId) return;
    const opts = this.channelAccessOpts(room, player);
    if (!canAccessChannel(channel, opts)) {
      this.io.to(player.socketId).emit("voice:error", {
        message: "This voice channel is closed right now.",
      });
      return;
    }
    if (channel === "town" && opts.daySubPhase === "vote") {
      this.io.to(player.socketId).emit("voice:error", {
        message: "Town voice is closed during voting.",
      });
      return;
    }
    this.removeFromAllVoice(room, playerId);
    room.voiceParticipants[channel].add(playerId);
    this.broadcastVoiceParticipants(room, channel);
    this.emitRoom(room);
  }

  inviteVoice(
    roomId: string,
    fromId: string,
    channel: ChatChannel,
    targetId: string
  ) {
    const room = this.getRoom(roomId);
    if (!room || isChatOnlyGame(room.gameId)) return;
    const from = room.players.find((p) => p.id === fromId);
    const target = room.players.find((p) => p.id === targetId);
    if (!from?.socketId || !target?.socketId || target.isBot || from.id === target.id) {
      return;
    }
    const fromOk = canAccessChannel(channel, this.channelAccessOpts(room, from));
    const targetOk = canAccessChannel(channel, this.channelAccessOpts(room, target));
    if (!fromOk || !targetOk) {
      this.io.to(from.socketId).emit("voice:error", {
        message: "That operator cannot join this channel right now.",
      });
      return;
    }
    if (room.voiceParticipants[channel].has(targetId)) return;
    this.io.to(target.socketId).emit("voice:invite", {
      channel,
      fromId: from.id,
      fromName: from.name,
    });
  }

  leaveVoice(roomId: string, playerId: string, channel: ChatChannel) {
    const room = this.getRoom(roomId);
    if (!room) return;
    if (!room.voiceParticipants[channel].delete(playerId)) return;
    this.broadcastVoiceParticipants(room, channel);
    this.emitRoom(room);
  }

  relayVoiceSignal(
    roomId: string,
    fromId: string,
    channel: ChatChannel,
    targetId: string,
    signal: VoiceSignalPayload
  ) {
    const room = this.getRoom(roomId);
    if (!room || isChatOnlyGame(room.gameId)) return;
    const from = room.players.find((p) => p.id === fromId);
    const target = room.players.find((p) => p.id === targetId);
    if (!from?.socketId || !target?.socketId) return;
    if (!room.voiceParticipants[channel].has(fromId)) return;
    if (!room.voiceParticipants[channel].has(targetId)) return;
    this.io.to(target.socketId).emit("voice:signal", {
      channel,
      fromId,
      signal,
    });
  }

  sendChat(
    roomId: string,
    playerId: string,
    channel: ChatChannel,
    text: string
  ) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;
    const trimmed = text.trim().slice(0, 240);
    if (!trimmed) return;

    if (channel === "graveyard" && player.alive) return;
    if (channel === "town" && !player.alive) return;
    if (
      !canAccessChannel(channel, this.channelAccessOpts(room, player))
    ) {
      return;
    }

    const message: ChatMessage = {
      id: randomUUID(),
      channel,
      playerId: player.id,
      name: player.name,
      text: trimmed,
      at: Date.now(),
    };
    room.chat.push(message);

    if (channel === "mafia") {
      this.io.to(`mafia:${room.id}`).emit("chat:message", message);
    } else if (channel === "graveyard") {
      for (const p of room.players) {
        if (!p.alive && p.socketId) this.io.to(p.socketId).emit("chat:message", message);
      }
    } else {
      this.io.to(room.id).emit("chat:message", message);
    }
  }

  private fiveAliveHandlePlayerDeparted(room: Room, playerId: string) {
    const five = room.fiveAlive;
    if (!five) return;

    if (room.phase === "fivealive_turn" && five.turnPlayerId === playerId) {
      log(room, `${room.players.find((p) => p.id === playerId)?.name ?? "Someone"} left — turn skipped.`);
      this.fiveAliveAdvanceToNextTurn(room, playerId);
      return;
    }

    if (room.phase === "fivealive_bomb" && five.bombAwaitingPlayerId === playerId) {
      const idx = five.bombResponderIds.indexOf(playerId);
      const nextAwaiting = five.bombResponderIds[idx + 1] ?? null;
      five.bombAwaitingPlayerId = nextAwaiting;
      if (!nextAwaiting) {
        const actorId = five.bombActorId;
        five.bombActorId = null;
        five.bombResponderIds = [];
        five.bombAwaitingPlayerId = null;
        if (actorId) {
          this.fiveAliveAdvanceToNextTurn(room, actorId);
        } else {
          this.fiveAliveMaybeWin(room);
        }
      }
    }
  }

  leaveRoom(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.isBot) return;

    const socketId = player.socketId;
    this.removeFromAllVoice(room, player.id);
    this.leaveMafiaRooms(player, room.id);

    if (room.gameId === "five-alive" && room.fiveAlive && room.phase !== "lobby") {
      this.fiveAliveHandlePlayerDeparted(room, player.id);
    }

    if (room.phase !== "lobby" && player.alive) {
      player.alive = false;
      if (room.gameId === "five-alive") {
        player.lives = 0;
      }
      log(room, `${player.name} left the game.`);
      this.maybeWin(room);
    } else if (room.phase === "lobby") {
      log(room, `${player.name} left the lobby.`);
    }

    if (player.isHost) {
      const next =
        room.players.find(
          (p) => p.id !== player.id && !p.isBot && p.socketId
        ) ??
        room.players.find((p) => p.id !== player.id && !p.isBot);
      if (next) {
        player.isHost = false;
        next.isHost = true;
        log(room, `${next.name} is now the host.`);
      }
    }

    room.players = room.players.filter((p) => p.id !== playerId);
    room.afkWarnedPlayerIds = room.afkWarnedPlayerIds.filter(
      (id) => id !== playerId
    );
    this.playerRoom.delete(playerId);

    if (socketId) {
      this.io.sockets.sockets.get(socketId)?.leave(room.id);
    }

    const humansRemaining = room.players.filter((p) => !p.isBot);
    if (humansRemaining.length === 0) {
      this.clearTimer(room);
      this.clearBotTimers(room);
      this.rooms.delete(room.id);
      this.broadcastLobbies();
      return;
    }

    this.emitRoom(room);
  }

  kick(roomId: string, hostId: string, targetId: string) {
    const room = this.getRoom(roomId);
    if (!room || !this.requireHost(room, hostId)) return;
    const target = room.players.find((p) => p.id === targetId);
    if (!target || target.isHost) return;

    if (room.phase === "lobby") {
      room.players = room.players.filter((p) => p.id !== targetId);
      if (target.socketId) {
        this.io.to(target.socketId).emit("room:error", { message: "Kicked by host" });
        this.io.sockets.sockets.get(target.socketId)?.leave(room.id);
      }
      this.playerRoom.delete(targetId);
      this.emitRoom(room);
      return;
    }

    if (target.alive) {
      target.alive = false;
      if (room.gameId === "five-alive") {
        target.lives = 0;
      }
      log(room, `${target.name} was removed from the city.`);
      this.leaveMafiaRooms(target, room.id);
      this.removeFromAllVoice(room, target.id);
    }
    room.afkWarnedPlayerIds = room.afkWarnedPlayerIds.filter((id) => id !== targetId);
    this.emitRoom(room);
    this.maybeWin(room);
  }

  pause(roomId: string, hostId: string) {
    const room = this.getRoom(roomId);
    if (!room || !this.requireHost(room, hostId)) return;
    if (room.paused) return;
    // Timed phases store remaining ms; untimed games (e.g. Spot It) pause without a clock.
    if (room.phaseEndsAt) {
      room.pausedRemainingMs = Math.max(0, room.phaseEndsAt - Date.now());
      room.phaseEndsAt = null;
    } else {
      room.pausedRemainingMs = null;
    }
    room.paused = true;
    this.clearTimer(room);
    log(room, "The host paused the game.");
    this.emitRoom(room);
  }

  resume(roomId: string, hostId: string) {
    const room = this.getRoom(roomId);
    if (!room || !this.requireHost(room, hostId)) return;
    if (!room.paused) return;
    room.paused = false;
    const ms = room.pausedRemainingMs;
    room.pausedRemainingMs = null;
    if (typeof ms === "number") {
      room.phaseEndsAt = Date.now() + ms;
    }
    log(room, "The host resumed the game.");
    this.schedule(room);
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  returnToLobby(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "gameover") return;
    if (!this.requireHost(room, playerId)) return;
    this.clearTimer(room);
    for (const p of room.players) {
      p.role = undefined;
      p.alive = true;
      if (room.gameId === "five-alive") {
        p.lives = 5;
      } else {
        p.lives = undefined;
      }
      p.ready = true;
      p.afkCount = 0;
      p.blackmailed = false;
      p.bulletsLeft = undefined;
      this.leaveMafiaRooms(p, room.id);
    }
    room.phase = "lobby";
    room.cycle = 0;
    room.phaseEndsAt = null;
    room.daySubPhase = null;
    room.paused = false;
    room.winner = null;
    room.logs = [];
    room.votes = {};
    room.nightActions = [];
    room.detectiveByPlayer = {};
    room.afkWarnedPlayerIds = [];
    room.chronicle = [];
    room.announcement = null;
    room.mafiaNightIntel = {};
    room.detectiveLog = [];
    room.afkGraceEndsAt = null;
    room.afkGracePlayerId = null;
    room.fiveAlive = undefined;
    room.spotIt = undefined;
    room.ttt = undefined;
    room.connect4 = undefined;
    room.boardWinnerId = null;
    room.boardDraw = false;
    room.voiceParticipants = emptyVoiceChannels();
    this.emitRoom(room);
  }

  private startSpotIt(room: Room) {
    const generated = generateDobbleDeck(7);
    const deck = shuffleCards(generated.cards);
    const piles: Record<string, number[][]> = {};
    for (const p of room.players) {
      const card = deck.pop();
      if (!card) throw new Error("Deck too small for players");
      piles[p.id] = [card];
      p.alive = true;
      p.ready = false;
      p.role = "villager";
    }
    room.spotIt = {
      deck,
      piles,
      matchSeq: 0,
      startedAt: Date.now(),
    };
    room.boardWinnerId = null;
    room.boardDraw = false;
    room.cycle = 1;
    room.winner = null;
    room.logs = [];
    log(room, "Spot It — find the match. First click wins the card.");
    this.setPhase(room, "spotit_play", null);
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  submitSpotItMatch(roomId: string, playerId: string, symbolId: number) {
    const room = this.getRoom(roomId);
    if (!room || room.gameId !== "spot-it" || room.phase !== "spotit_play") return;
    if (room.paused || !room.spotIt) return;
    const spot = room.spotIt;
    const center = spot.deck[0];
    const playerCard = spot.piles[playerId]?.[0];
    const player = room.players.find((p) => p.id === playerId);
    if (!center || !playerCard || !player) return;

    const expected = sharedSymbol(playerCard, center);
    if (expected == null || expected !== symbolId) {
      if (player.socketId) {
        this.io.to(player.socketId).emit("spotit:reject", {
          message: "That’s not the matching symbol.",
        });
      }
      return;
    }

    spot.matchSeq += 1;
    const claimed = spot.deck.shift()!;
    spot.piles[playerId] = [claimed, ...(spot.piles[playerId] ?? [])];
    log(room, `${player.name} claimed a card.`);
    this.io.to(room.id).emit("spotit:matchResolved", {
      winnerId: playerId,
      symbolId,
      matchSeq: spot.matchSeq,
    });

    if (spot.deck.length === 0) {
      const ranked = room.players
        .map((p) => ({
          id: p.id,
          score: spot.piles[p.id]?.length ?? 0,
        }))
        .sort((a, b) => b.score - a.score);
      const top = ranked[0]?.score ?? 0;
      const winners = ranked.filter((r) => r.score === top);
      room.boardDraw = winners.length > 1;
      room.boardWinnerId = winners.length === 1 ? winners[0]!.id : null;
      room.phase = "gameover";
      room.phaseEndsAt = null;
      this.clearTimer(room);
      this.clearBotTimers(room);
      log(
        room,
        room.boardDraw
          ? "Spot It ended in a draw."
          : `${room.players.find((p) => p.id === room.boardWinnerId)?.name ?? "Someone"} wins Spot It!`
      );
      this.emitRoom(room);
      return;
    }

    this.scheduleBots(room);
    this.emitRoom(room);
  }

  private startTicTacToe(room: Room) {
    if (room.players.length !== 2) {
      throw new Error("Tic-Tac-Toe needs exactly 2 players");
    }
    const [a, b] = room.players;
    for (const p of room.players) {
      p.alive = true;
      p.ready = false;
      p.role = "villager";
    }
    room.ttt = {
      board: emptyTttBoard(),
      turnPlayerId: a!.id,
      marks: { [a!.id]: "X", [b!.id]: "O" },
      winningLine: null,
      lastMove: null,
      result: "ongoing",
      winnerId: null,
    };
    room.boardWinnerId = null;
    room.boardDraw = false;
    room.cycle = 1;
    room.winner = null;
    room.logs = [];
    log(room, "Tic-Tac-Toe — X goes first.");
    this.setPhase(room, "ttt_play", boardTurnSeconds(room.settings.daySeconds));
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  submitTttMove(roomId: string, playerId: string, cellIndex: number) {
    const room = this.getRoom(roomId);
    if (!room || room.gameId !== "tic-tac-toe" || room.phase !== "ttt_play") return;
    if (room.paused || !room.ttt || room.ttt.result !== "ongoing") return;
    const ttt = room.ttt;
    if (ttt.turnPlayerId !== playerId) return;
    const mark = ttt.marks[playerId];
    if (!mark) return;
    const next = applyTttMove(ttt.board, cellIndex, mark);
    if (!next) return;
    ttt.board = next;
    ttt.lastMove = cellIndex;
    const win = checkTttWin(ttt.board);
    if (win) {
      ttt.winningLine = win.line;
      ttt.result = "win";
      ttt.winnerId = playerId;
      room.boardWinnerId = playerId;
      room.boardDraw = false;
      room.phaseEndsAt = null;
      this.clearTimer(room);
      this.clearBotTimers(room);
      log(room, `${room.players.find((p) => p.id === playerId)?.name ?? "Player"} wins!`);
      this.emitRoom(room);
      this.scheduleBoardGameOver(room.id, "tic-tac-toe");
      return;
    }
    if (isTttDraw(ttt.board)) {
      ttt.result = "draw";
      room.boardDraw = true;
      room.boardWinnerId = null;
      room.phaseEndsAt = null;
      this.clearTimer(room);
      this.clearBotTimers(room);
      log(room, "Tic-Tac-Toe draw.");
      this.emitRoom(room);
      this.scheduleBoardGameOver(room.id, "tic-tac-toe");
      return;
    }
    const other = room.players.find((p) => p.id !== playerId);
    if (other) ttt.turnPlayerId = other.id;
    this.setPhase(room, "ttt_play", boardTurnSeconds(room.settings.daySeconds));
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  private scheduleBoardGameOver(
    roomId: string,
    gameId: "connect-4" | "tic-tac-toe",
    delayMs = 700
  ) {
    setTimeout(() => {
      const room = this.getRoom(roomId);
      if (!room || room.gameId !== gameId) return;
      if (gameId === "connect-4") {
        if (room.phase !== "connect4_play") return;
        if (!room.connect4 || room.connect4.result === "ongoing") return;
      } else {
        if (room.phase !== "ttt_play") return;
        if (!room.ttt || room.ttt.result === "ongoing") return;
      }
      room.phase = "gameover";
      room.phaseEndsAt = null;
      this.clearTimer(room);
      this.emitRoom(room);
    }, delayMs);
  }

  private startConnect4(room: Room) {
    if (room.players.length !== 2) {
      throw new Error("Connect 4 needs exactly 2 players");
    }
    const [a, b] = room.players;
    for (const p of room.players) {
      p.alive = true;
      p.ready = false;
      p.role = "villager";
    }
    room.connect4 = {
      board: emptyC4Board(),
      turnPlayerId: a!.id,
      colors: { [a!.id]: "R", [b!.id]: "Y" },
      winningCells: null,
      lastDrop: null,
      result: "ongoing",
      winnerId: null,
    };
    room.boardWinnerId = null;
    room.boardDraw = false;
    room.cycle = 1;
    room.winner = null;
    room.logs = [];
    log(room, "Connect 4 — Red drops first.");
    this.setPhase(room, "connect4_play", boardTurnSeconds(room.settings.daySeconds));
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  submitConnect4Drop(roomId: string, playerId: string, column: number) {
    const room = this.getRoom(roomId);
    if (!room || room.gameId !== "connect-4" || room.phase !== "connect4_play") {
      return;
    }
    if (room.paused || !room.connect4 || room.connect4.result !== "ongoing") return;
    const c4 = room.connect4;
    if (c4.turnPlayerId !== playerId) return;
    const color = c4.colors[playerId];
    if (!color) return;
    const dropped = dropC4(c4.board, column, color);
    if (!dropped) return;
    c4.board = dropped.board;
    c4.lastDrop = { col: column, row: dropped.row };
    const win = checkC4Win(c4.board, dropped.row, column);
    if (win) {
      c4.winningCells = win.cells;
      c4.result = "win";
      c4.winnerId = playerId;
      room.boardWinnerId = playerId;
      room.boardDraw = false;
      room.phaseEndsAt = null;
      this.clearTimer(room);
      this.clearBotTimers(room);
      log(room, `${room.players.find((p) => p.id === playerId)?.name ?? "Player"} wins!`);
      this.emitRoom(room);
      this.scheduleBoardGameOver(room.id, "connect-4");
      return;
    }
    if (isC4Draw(c4.board)) {
      c4.result = "draw";
      room.boardDraw = true;
      room.boardWinnerId = null;
      room.phaseEndsAt = null;
      this.clearTimer(room);
      this.clearBotTimers(room);
      log(room, "Connect 4 draw.");
      this.emitRoom(room);
      this.scheduleBoardGameOver(room.id, "connect-4");
      return;
    }
    const other = room.players.find((p) => p.id !== playerId);
    if (other) c4.turnPlayerId = other.id;
    this.setPhase(room, "connect4_play", boardTurnSeconds(room.settings.daySeconds));
    this.scheduleBots(room);
    this.emitRoom(room);
  }

  disconnect(socketId: string) {
    const found = this.playerBySocket(socketId);
    if (!found) return;
    const { room, player } = found;
    this.removeFromAllVoice(room, player.id);
    player.socketId = null;

    if (player.isHost) {
      const next = room.players.find(
        (p) => !p.isBot && p.socketId && p.id !== player.id
      );
      if (next) {
        player.isHost = false;
        next.isHost = true;
        log(room, `${next.name} is now the host.`);
      }
    }

    if (room.phase === "lobby") {
      // keep seat for a short reconnect window; drop if nobody is connected
    }

    const anyoneConnected = room.players.some((p) => p.socketId);
    if (!anyoneConnected && room.phase === "lobby") {
      this.clearTimer(room);
      this.rooms.delete(room.id);
      this.broadcastLobbies();
      return;
    }
    this.emitRoom(room);
  }
}
