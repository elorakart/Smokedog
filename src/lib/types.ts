export type Role =
  | "villager"
  | "doctor"
  | "detective"
  | "bodyguard"
  | "vigilante"
  | "mafia_boss"
  | "mafia_goon"
  | "blackmailer";

export type Faction = "town" | "mafia";
export type Phase =
  | "lobby"
  | "reveal"
  | "night"
  | "day"
  | "gameover"
  | "fivealive_turn"
  | "fivealive_bomb";

export type ChatChannel = "town" | "mafia" | "graveyard";

export type NightActionType =
  | "mafia_kill"
  | "doctor_protect"
  | "detective_inspect"
  | "bodyguard_protect"
  | "vigilante_shoot"
  | "blackmail";

export interface RoomSettings {
  nightSeconds: number;
  daySeconds: number;
  vigilanteBullets: number | null;
}

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
  // Optional per-game state for 5 Alive.
  fiveAlive?: FiveAlivePublicState;
}

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
  createSettings(): RoomSettings;
  assignRoles(playerCount: number, settings: RoomSettings): Role[];
}

export type ClientToServerEvents = {
  "room:create": (payload: {
    playerId: string;
    name: string;
    avatarId: number;
    gameId?: string;
  }) => void;
  "room:join": (payload: {
    roomId: string;
    playerId: string;
    name: string;
    avatarId: number;
  }) => void;
  "room:rejoin": (payload: { roomId: string; playerId: string }) => void;
  "lobby:ready": (payload: { roomId: string; ready: boolean }) => void;
  "lobby:settings": (payload: {
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
  "fivealive:playCard": (payload: {
    roomId: string;
    cardId?: string | null;
    // For wild cards: desired running total (0..21).
    wildValue?: number;
    // For bomb forced responses when you cannot (or choose not) to play 0.
    pass?: boolean;
  }) => void;
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
    faction: Faction;
  }) => void;
  "chat:message": (message: ChatMessage) => void;
  "host:afkWarning": (payload: {
    playerId: string;
    name: string;
    afkCount: number;
  }) => void;
  "game:over": (payload: { winner: Faction; recap: PublicPlayer[] }) => void;
  "room:error": (payload: { message: string; code?: string }) => void;
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
};
