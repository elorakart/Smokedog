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

export type Phase = "lobby" | "reveal" | "night" | "day" | "gameover";

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
  connected: boolean;
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
  detectiveResult: { targetId: string; faction: Faction } | null;
  afkWarnedPlayerIds: string[];
  chat: ChatMessage[];
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
  "night:action": (payload: {
    roomId: string;
    type: NightActionType;
    targetId: string;
  }) => void;
  "day:vote": (payload: { roomId: string; targetId: string }) => void;
  "chat:send": (payload: {
    roomId: string;
    channel: ChatChannel;
    text: string;
  }) => void;
  "host:kick": (payload: { roomId: string; playerId: string }) => void;
  "host:pause": (payload: { roomId: string }) => void;
  "host:resume": (payload: { roomId: string }) => void;
  "lobby:return": (payload: { roomId: string }) => void;
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
  "room:error": (payload: { message: string }) => void;
};
