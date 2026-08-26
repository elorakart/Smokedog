export type Role =
  | "villager"
  | "doctor"
  | "detective"
  | "bodyguard"
  | "vigilante"
  | "soldier"
  | "juggler"
  | "drunk"
  | "mafia_boss"
  | "mafia_goon"
  | "blackmailer"
  | "poisoner";

export type Faction = "town" | "mafia";
export type Phase =
  | "lobby"
  | "reveal"
  | "night"
  | "day"
  | "gameover"
  | "fivealive_turn"
  | "fivealive_bomb"
  | "ek_turn"
  | "ek_defuse"
  | "ek_pick_discard"
  | "ek_steal"
  | "spotit_play"
  | "ttt_play"
  | "connect4_play";

export type DaySubPhase = "discussion" | "vote";

export type ChatChannel = "town" | "mafia" | "graveyard";

export type NightActionType =
  | "mafia_kill"
  | "doctor_protect"
  | "detective_inspect"
  | "bodyguard_protect"
  | "vigilante_shoot"
  | "blackmail"
  | "poison";

export type RoleDistribution = {
  villager: number;
  doctor: number;
  detective: number;
  bodyguard: number;
  vigilante: number;
  soldier: number;
  juggler: number;
  drunk: number;
  mafia_boss: number;
  mafia_goon: number;
  blackmailer: number;
  poisoner: number;
};

/** Day-scoped personal intel (cleared when the next night begins). */
export type DayIntel = {
  kind: "detective" | "juggler" | "other";
  title: string;
  detail: string;
  cycle: number;
  at: number;
};

export interface RoomSettings {
  nightSeconds: number;
  daySeconds: number;
  vigilanteBullets: number | null;
  roleDistribution?: RoleDistribution | null;
  /** Mafia City: no chat/voice/discussion — popups + actions only. */
  localMode?: boolean;
}

export type PhaseAnnouncement = {
  id: string;
  tone: "info" | "good" | "bad";
  title: string;
  detail?: string;
  at: number;
};

export type MafiaNightIntel = {
  blackmailTargetId?: string;
  blackmailTargetName?: string;
  bossTargetId?: string;
  bossTargetName?: string;
  goonTargetId?: string;
  goonTargetName?: string;
  poisonTargetId?: string;
  poisonTargetName?: string;
};

export type ChronicleEntry = {
  id: string;
  cycle: number;
  phase: "night" | "day";
  summary: string;
  at: number;
};

export type DetectiveLogEntry = {
  id: string;
  targetId: string;
  targetName: string;
  faction: Faction;
  at: number;
  cycle: number;
};

export const REVEAL_SECONDS = 20;
export const DAY_VOTE_SECONDS = 15;
export const SKIP_VOTE_ID = "__skip__";
export const AFK_GRACE_MS = 10000;

export interface Player {
  id: string;
  socketId: string | null;
  name: string;
  avatarId: number;
  role?: Role;
  alive: boolean;
  isHost: boolean;
  ready: boolean;
  afkCount: number;
  blackmailed: boolean;
  bulletsLeft?: number;
  /** True for one night after Poisoner marks them. */
  poisoned?: boolean;
  /** Drunk only: the town power role they believe they are. */
  fakeRole?: Role;
  /** Juggler: true after their once-per-game day action. */
  jugglerUsed?: boolean;
  // 5 Alive: remaining lives. Mafia City ignores this.
  lives?: number;
  isBot: boolean;
}

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  playerId: string;
  name: string;
  text: string;
  at: number;
}

export interface GameLog {
  id: string;
  text: string;
  at: number;
}

export interface NightAction {
  playerId: string;
  type: NightActionType;
  targetId: string;
  auto: boolean;
}

export interface PublicPlayer {
  id: string;
  name: string;
  avatarId: number;
  alive: boolean;
  isHost: boolean;
  ready: boolean;
  afkCount: number;
  blackmailed: boolean;
  role?: Role;
  // 5 Alive: remaining lives. Mafia City ignores this.
  lives?: number;
  connected: boolean;
  isBot: boolean;
}

export interface PublicGameState {
  roomId: string;
  gameId: string;
  settings: RoomSettings;
  players: PublicPlayer[];
  phase: Phase;
  cycle: number;
  phaseEndsAt: number | null;
  paused: boolean;
  logs: GameLog[];
  winner: Faction | null;
  recap: PublicPlayer[] | null;
  you: {
    id: string;
    role?: Role;
    faction?: Faction;
    bulletsLeft?: number;
    alive: boolean;
    isHost: boolean;
    blackmailed: boolean;
  } | null;
  votes: Record<string, string>;
  submittedNightAction: boolean;
  nightActionTargetId: string | null;
  detectiveResult: { targetId: string; faction: Faction } | null;
  afkWarnedPlayerIds: string[];
  chat: ChatMessage[];
  canSkipDay: boolean;
  dayVotesIn: number;
  dayVotesNeeded: number;
  voiceParticipants: Partial<Record<ChatChannel, string[]>>;
  autoPlayerCount: number;
  daySubPhase?: DaySubPhase;
  announcement?: PhaseAnnouncement | null;
  mafiaTeam?: PublicPlayer[];
  mafiaNightIntel?: MafiaNightIntel;
  /** @deprecated Prefer dayIntel — kept empty for older clients. */
  detectiveLog?: DetectiveLogEntry[];
  dayIntel?: DayIntel | null;
  jugglerAvailable?: boolean;
  chronicle?: ChronicleEntry[];
  afkGraceEndsAt?: number | null;
  afkGracePlayerId?: string | null;
  roleDistributionPreview?: RoleDistribution | null;
  deadVillagerVote?: boolean;
  // Optional per-game state for 5 Alive.
  fiveAlive?: FiveAlivePublicState;
  detonationCats?: DetonationCatsPublicState;
  spotIt?: SpotItPublicState;
  ttt?: TttPublicState;
  connect4?: Connect4PublicState;
  boardWinnerId?: string | null;
  boardDraw?: boolean;
}

export type SpotItPublicState = {
  centerCard: number[];
  yourCard: number[] | null;
  deckRemaining: number;
  scores: { playerId: string; name: string; score: number }[];
  matchSeq: number;
};

export type TttPublicState = {
  board: (null | "X" | "O")[];
  turnPlayerId: string;
  marks: Record<string, "X" | "O">;
  winningLine: number[] | null;
  lastMove: number | null;
  result?: "ongoing" | "win" | "draw";
};

export type Connect4PublicState = {
  board: (null | "R" | "Y")[][];
  turnPlayerId: string;
  colors: Record<string, "R" | "Y">;
  winningCells: { row: number; col: number }[] | null;
  lastDrop: { col: number; row: number } | null;
  result?: "ongoing" | "win" | "draw";
  winnerId?: string | null;
};

export type PublicFiveAliveCard = {
  id: string;
  type:
    | "number"
    | "eq21"
    | "reset0"
    | "skip"
    | "reverse"
    | "draw1"
    | "draw2"
    | "bomb"
    | "wild";
  value?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
};

export type PublicDcCard = {
  id: string;
  type:
    | "detonation"
    | "defuse"
    | "skip"
    | "attack"
    | "shuffle"
    | "see_future"
    | "taco_cat"
    | "beard_cat"
    | "rainbow_cat"
    | "potato_cat"
    | "melon_cat";
};

export type DetonationCatsPublicState = {
  turnPlayerId: string | null;
  pendingTurns: number;
  yourHand: PublicDcCard[];
  drawPileCount: number;
  discardCount: number;
  discardTop: PublicDcCard | null;
  seeFutureCards: PublicDcCard[] | null;
  awaitingDefuse: boolean;
  awaitingPickDiscard: boolean;
  awaitingStealTarget: boolean;
  stealTargetIds: string[];
};

export type FiveAlivePublicState = {
  runningTotal: number;
  direction: 1 | -1;
  turnPlayerId: string | null;
  skipNext: boolean;
  pendingDrawCount: number;
  yourHand: PublicFiveAliveCard[];
  bombAwaitingPlayerId: string | null;
  bombActorId: string | null;
  bombResponderIds: string[];
  drawPileCount: number;
  discardPileCount: number;
  centerPileCount: number;
  centerTopCard: PublicFiveAliveCard | null;
};

export type VoiceSignalPayload =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit | null };

export interface OpenLobby {
  roomId: string;
  gameId: string;
  hostName: string;
  hostAvatarId: number;
  playerCount: number;
  maxPlayers: number;
  openSlots: number;
  botCount: number;
  humanCount: number;
}

export interface GameModule {
  id: string;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
  status?: "live" | "maintenance" | "coming_soon";
  createSettings(): RoomSettings;
  assignRoles(playerCount: number, settings: RoomSettings): Role[];
}

export type ClientToServerEvents = {
  "room:create": (payload: {
    playerId: string;
    name: string;
    avatarId: number;
    gameId?: string;
    localMode?: boolean;
  }) => void;
  "room:join": (payload: {
    roomId: string;
    playerId: string;
    name: string;
    avatarId: number;
  }) => void;
  "room:rejoin": (payload: { roomId: string; playerId: string }) => void;
  "room:leave": (payload: { roomId: string }) => void;
  "lobby:ready": (payload: { roomId: string; ready: boolean }) => void;
  "lobby:settings": (payload: {
    roomId: string;
    settings: Partial<RoomSettings>;
  }) => void;
  "host:settings": (payload: {
    roomId: string;
    settings: Partial<RoomSettings>;
  }) => void;
  "lobby:start": (payload: { roomId: string }) => void;
  "lobby:addBot": (payload: { roomId: string; fillTo?: number }) => void;
  "lobby:removeBot": (payload: { roomId: string }) => void;
  "night:action": (payload: {
    roomId: string;
    type: NightActionType;
    targetId: string;
  }) => void;
  "day:vote": (payload: { roomId: string; targetId: string }) => void;
  "day:voteSkip": (payload: { roomId: string }) => void;
  "day:juggle": (payload: { roomId: string; targetIds: string[] }) => void;
  "fivealive:playCard": (payload: {
    roomId: string;
    cardId?: string | null;
    // For wild cards: desired running total (0..21).
    wildValue?: number;
    // For bomb forced responses when you cannot (or choose not) to play 0.
    pass?: boolean;
  }) => void;
  "ek:playCards": (payload: { roomId: string; cardIds: string[] }) => void;
  "ek:endTurn": (payload: { roomId: string }) => void;
  "ek:placeDefuse": (payload: { roomId: string; deckIndex: number }) => void;
  "ek:pickDiscard": (payload: { roomId: string; discardIndex: number }) => void;
  "ek:stealTarget": (payload: { roomId: string; targetId: string }) => void;
  "spotit:submitMatch": (payload: {
    roomId: string;
    symbolId: number;
  }) => void;
  "ttt:move": (payload: { roomId: string; cellIndex: number }) => void;
  "connect4:drop": (payload: { roomId: string; column: number }) => void;
  "chat:send": (payload: {
    roomId: string;
    channel: ChatChannel;
    text: string;
  }) => void;
  "host:kick": (payload: { roomId: string; playerId: string }) => void;
  "host:pause": (payload: { roomId: string }) => void;
  "host:resume": (payload: { roomId: string }) => void;
  "lobby:return": (payload: { roomId: string }) => void;
  "lobbies:list": (payload?: { query?: string }) => void;
  "host:skipDay": (payload: { roomId: string }) => void;
  "host:skipTimer": (payload: { roomId: string }) => void;
  "voice:join": (payload: { roomId: string; channel: ChatChannel }) => void;
  "voice:leave": (payload: { roomId: string; channel: ChatChannel }) => void;
  "voice:invite": (payload: {
    roomId: string;
    channel: ChatChannel;
    targetId: string;
  }) => void;
  "voice:signal": (payload: {
    roomId: string;
    channel: ChatChannel;
    targetId: string;
    signal: VoiceSignalPayload;
  }) => void;
  "voice:speaking": (payload: {
    roomId: string;
    channel: ChatChannel;
    speaking: boolean;
  }) => void;
};

export type ServerToClientEvents = {
  "room:state": (state: PublicGameState) => void;
  "role:reveal": (payload: {
    role: Role;
    faction: Faction;
    ability: string;
  }) => void;
  "detective:result": (payload: {
    targetId: string;
    targetName: string;
    faction: Faction;
    cycle?: number;
  }) => void;
  /** Personal night-power outcome — shown before town phase announcements. */
  "night:powerResult": (payload: {
    id: string;
    tone: "info" | "good" | "bad";
    title: string;
    detail: string;
  }) => void;
  "chat:message": (message: ChatMessage) => void;
  "host:afkWarning": (payload: {
    playerId: string;
    name: string;
    afkCount: number;
  }) => void;
  "game:over": (payload: { winner: Faction; recap: PublicPlayer[] }) => void;
  "room:error": (payload: { message: string; code?: string }) => void;
  "room:left": () => void;
  "lobbies:list": (payload: { lobbies: OpenLobby[] }) => void;
  "voice:participants": (payload: {
    channel: ChatChannel;
    participantIds: string[];
  }) => void;
  "voice:signal": (payload: {
    channel: ChatChannel;
    fromId: string;
    signal: VoiceSignalPayload;
  }) => void;
  "voice:error": (payload: { message: string }) => void;
  "voice:invite": (payload: {
    channel: ChatChannel;
    fromId: string;
    fromName: string;
  }) => void;
  "voice:speaking": (payload: {
    channel: ChatChannel;
    playerId: string;
    speaking: boolean;
  }) => void;
  "spotit:matchResolved": (payload: {
    winnerId: string;
    symbolId: number;
    matchSeq: number;
  }) => void;
  "spotit:reject": (payload: { message: string }) => void;
};
