import { randomUUID } from "crypto";
import type { Server } from "socket.io";
import type {
  ChatChannel,
  ChatMessage,
  ClientToServerEvents,
  GameLog,
  NightAction,
  NightActionType,
  Phase,
  Player,
  PublicGameState,
  PublicPlayer,
  RoomSettings,
  ServerToClientEvents,
} from "@/lib/types";
import { getGameModule } from "@/lib/games/registry";
import {
  factionOf,
  isMafiaRole,
  nightActionFor,
  ROLE_META,
} from "@/lib/games/mafia-city/roles";
import { bulletsForLobby } from "@/lib/games/mafia-city/balance";
import {
  randomLivingTarget,
  resolveNight,
  tallyLynch,
  validNightTargets,
  winCheck,
} from "@/lib/games/mafia-city/resolve";

export type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

const REVEAL_SECONDS = 5;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface Room {
  id: string;
  gameId: string;
  settings: RoomSettings;
  players: Player[];
  phase: Phase;
  cycle: number;
  phaseEndsAt: number | null;
  paused: boolean;
  pausedRemainingMs: number | null;
  nightActions: NightAction[];
  votes: Record<string, string>;
  logs: GameLog[];
  chat: ChatMessage[];
  winner: "town" | "mafia" | null;
  timer: ReturnType<typeof setTimeout> | null;
  detectiveByPlayer: Record<string, { targetId: string; faction: "town" | "mafia" }>;
  afkWarnedPlayerIds: string[];
}

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function log(room: Room, text: string) {
  room.logs.push({ id: randomUUID(), text, at: Date.now() });
  if (room.logs.length > 80) room.logs.splice(0, room.logs.length - 80);
}

function living(room: Room): Player[] {
  return room.players.filter((p) => p.alive);
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
    const showRole =
      revealAll || p.id === viewerId || room.phase === "gameover";
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
      connected: !!p.socketId,
    };
  }

  private sanitize(room: Room, viewerId: string | null): PublicGameState {
    const you = viewerId
      ? room.players.find((p) => p.id === viewerId) ?? null
      : null;
    const revealAll = room.phase === "gameover";
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
      votes: room.phase === "day" ? room.votes : {},
      submittedNightAction:
        !!you &&
        room.nightActions.some((a) => a.playerId === you.id && !a.auto),
      detectiveResult: you ? room.detectiveByPlayer[you.id] ?? null : null,
      afkWarnedPlayerIds: you?.isHost ? room.afkWarnedPlayerIds : [],
      chat: this.visibleChat(room, you),
    };
  }

  private visibleChat(room: Room, you: Player | null): ChatMessage[] {
    return room.chat.filter((m) => {
      if (m.channel === "town") return true;
      if (m.channel === "graveyard") return !!you && !you.alive;
      if (m.channel === "mafia") {
        return !!you && you.alive && isMafiaRole(you.role);
      }
      return false;
    }).slice(-50);
  }

  emitRoom(room: Room) {
    for (const player of room.players) {
      if (!player.socketId) continue;
      this.io.to(player.socketId).emit("room:state", this.sanitize(room, player.id));
    }
  }

  private clearTimer(room: Room) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
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

  createRoom(opts: {
    socketId: string;
    playerId: string;
    name: string;
    avatarId: number;
    gameId?: string;
  }): Room {
    const mod = getGameModule(opts.gameId);
    let code = generateCode();
    while (this.rooms.has(code)) code = generateCode();

    const player: Player = {
      id: opts.playerId,
      socketId: opts.socketId,
      name: opts.name.trim().slice(0, 18) || "Operator",
      avatarId: opts.avatarId,
      alive: true,
      isHost: true,
      ready: false,
      afkCount: 0,
      blackmailed: false,
    };

    const room: Room = {
      id: code,
      gameId: mod.id,
      settings: mod.createSettings(),
      players: [player],
      phase: "lobby",
      cycle: 0,
      phaseEndsAt: null,
      paused: false,
      pausedRemainingMs: null,
      nightActions: [],
      votes: {},
      logs: [],
      chat: [],
      winner: null,
      timer: null,
      detectiveByPlayer: {},
      afkWarnedPlayerIds: [],
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
    const room = this.getRoom(opts.roomId);
    if (!room) throw new Error("Room not found");
    const mod = getGameModule(room.gameId);

    const existing = room.players.find((p) => p.id === opts.playerId);
    if (existing) {
      existing.socketId = opts.socketId;
      existing.name = opts.name.trim().slice(0, 18) || existing.name;
      existing.avatarId = opts.avatarId;
      this.playerRoom.set(opts.playerId, room.id);
      this.joinMafiaRoom(existing, room.id);
      return room;
    }

    if (room.phase !== "lobby") {
      throw new Error("Game already in progress");
    }
    if (room.players.length >= mod.maxPlayers) {
      throw new Error("Room is full");
    }
    if (room.players.some((p) => p.name.toLowerCase() === opts.name.trim().toLowerCase())) {
      throw new Error("That display name is taken in this room");
    }

    room.players.push({
      id: opts.playerId,
      socketId: opts.socketId,
      name: opts.name.trim().slice(0, 18) || "Operator",
      avatarId: opts.avatarId,
      alive: true,
      isHost: false,
      ready: false,
      afkCount: 0,
      blackmailed: false,
    });
    this.playerRoom.set(opts.playerId, room.id);
    return room;
  }

  rejoin(opts: { roomId: string; socketId: string; playerId: string }): Room {
    const room = this.getRoom(opts.roomId);
    if (!room) throw new Error("Room not found");
    const player = room.players.find((p) => p.id === opts.playerId);
    if (!player) throw new Error("Player not in this room");
    player.socketId = opts.socketId;
    this.playerRoom.set(opts.playerId, room.id);
    this.joinMafiaRoom(player, room.id);
    this.io.sockets.sockets.get(opts.socketId)?.join(room.id);
    return room;
  }

  setReady(roomId: string, playerId: string, ready: boolean) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "lobby") return;
    const p = room.players.find((x) => x.id === playerId);
    if (p) p.ready = ready;
    this.emitRoom(room);
  }

  updateSettings(roomId: string, playerId: string, patch: Partial<RoomSettings>) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "lobby") return;
    if (!this.requireHost(room, playerId)) return;
    if (typeof patch.nightSeconds === "number") {
      room.settings.nightSeconds = Math.min(120, Math.max(15, patch.nightSeconds));
    }
    if (typeof patch.daySeconds === "number") {
      room.settings.daySeconds = Math.min(180, Math.max(20, patch.daySeconds));
    }
    if (patch.vigilanteBullets === null) {
      room.settings.vigilanteBullets = null;
    } else if (typeof patch.vigilanteBullets === "number") {
      room.settings.vigilanteBullets = Math.min(3, Math.max(1, patch.vigilanteBullets));
    }
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

  private startNight(room: Room) {
    room.nightActions = [];
    room.votes = {};
    room.detectiveByPlayer = {};
    for (const p of room.players) {
      if (room.cycle > 1) {
        // blackmail lasts one day; clear at next night start after it was applied
      }
    }
    log(room, `Night ${room.cycle} falls over the city.`);
    this.setPhase(room, "night", room.settings.nightSeconds);
    this.emitRoom(room);
  }

  private startDay(room: Room) {
    log(room, `Day ${room.cycle} — argue, accuse, survive.`);
    this.setPhase(room, "day", room.settings.daySeconds);
    this.emitRoom(room);
  }

  private maybeWin(room: Room): boolean {
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

  private autoFillNight(room: Room) {
    for (const player of living(room)) {
      const type = nightActionFor(player.role) as NightActionType | null;
      if (!type) continue;
      if (type === "vigilante_shoot" && (player.bulletsLeft ?? 0) <= 0) continue;
      if (room.nightActions.some((a) => a.playerId === player.id)) continue;

      const targets = validNightTargets(room.players, player);
      if (targets.length === 0) continue;
      const pick =
        randomLivingTarget(room.players, player.id, (p) =>
          targets.some((t) => t.id === p.id)
        ) ?? targets[0];
      if (type === "doctor_protect" || type === "bodyguard_protect") {
        const selfOk = targets.find((t) => t.id === player.id);
        const chosen = targets[Math.floor(Math.random() * targets.length)] ?? selfOk;
        if (!chosen) continue;
        room.nightActions.push({
          playerId: player.id,
          type,
          targetId: chosen.id,
          auto: true,
        });
      } else {
        room.nightActions.push({
          playerId: player.id,
          type,
          targetId: pick.id,
          auto: true,
        });
      }
      player.afkCount += 1;
      if (player.afkCount >= 2 && !room.afkWarnedPlayerIds.includes(player.id)) {
        room.afkWarnedPlayerIds.push(player.id);
        this.io.to(room.id).emit("host:afkWarning", {
          playerId: player.id,
          name: player.name,
          afkCount: player.afkCount,
        });
      }
    }
  }

  private resolveNightPhase(room: Room) {
    this.autoFillNight(room);
    const result = resolveNight(room.players, room.nightActions);

    if (result.deaths.length === 0) {
      log(room, "The night passes without blood.");
    } else {
      for (const d of result.deaths) {
        const p = room.players.find((x) => x.id === d.playerId);
        if (p) {
          log(room, `${p.name} was found at dawn. ${d.reason}.`);
          this.leaveMafiaRooms(p, room.id);
        }
      }
    }
    if (result.silencedId) {
      const p = room.players.find((x) => x.id === result.silencedId);
      if (p) log(room, `${p.name} has been blackmailed into silence.`);
    }
    if (result.detective) {
      const inv = room.players.find((p) => p.id === result.detective!.investigatorId);
      room.detectiveByPlayer[result.detective.investigatorId] = {
        targetId: result.detective.targetId,
        faction: result.detective.faction,
      };
      if (inv?.socketId) {
        this.io.to(inv.socketId).emit("detective:result", {
          targetId: result.detective.targetId,
          faction: result.detective.faction,
        });
      }
    }

    for (const p of room.players) {
      if (!p.alive) this.leaveMafiaRooms(p, room.id);
    }
  }

  private resolveDayPhase(room: Room) {
    const lynchedId = tallyLynch(room.players, room.votes);
    if (!lynchedId) {
      log(room, "No majority. The city lets the day die without a hanging.");
      return;
    }
    const target = room.players.find((p) => p.id === lynchedId);
    if (!target || !target.alive) return;
    target.alive = false;
    const role = target.role ? ROLE_META[target.role].label : "Unknown";
    log(room, `The city lynches ${target.name}. They were the ${role}.`);
    this.leaveMafiaRooms(target, room.id);
  }

  private onTimeout(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room || room.paused) return;
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
      this.resolveDayPhase(room);
      if (this.maybeWin(room)) return;
      room.cycle += 1;
      for (const p of room.players) p.blackmailed = false;
      this.startNight(room);
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
    if (!legal.some((p) => p.id === targetId) && !(type === "doctor_protect" || type === "bodyguard_protect") ) {
      return;
    }
    if (
      (type === "doctor_protect" || type === "bodyguard_protect") &&
      !living(room).some((p) => p.id === targetId)
    ) {
      return;
    }
    room.nightActions = room.nightActions.filter((a) => a.playerId !== playerId);
    room.nightActions.push({ playerId, type, targetId, auto: false });
    this.emitRoom(room);
  }

  submitVote(roomId: string, playerId: string, targetId: string) {
    const room = this.getRoom(roomId);
    if (!room || room.phase !== "day" || room.paused) return;
    const voter = room.players.find((p) => p.id === playerId);
    const target = room.players.find((p) => p.id === targetId);
    if (!voter?.alive || voter.blackmailed || !target?.alive || target.id === voter.id) {
      return;
    }
    room.votes[playerId] = targetId;
    this.emitRoom(room);

    const lynchedId = tallyLynch(room.players, room.votes);
    if (lynchedId) {
      this.resolveDayPhase(room);
      if (this.maybeWin(room)) return;
      room.cycle += 1;
      for (const p of room.players) p.blackmailed = false;
      this.startNight(room);
    }
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
    if (channel === "town" && player.blackmailed && room.phase === "day") return;
    if (channel === "mafia") {
      if (!isMafiaRole(player.role) || !player.alive || room.phase !== "night") return;
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
      log(room, `${target.name} was removed from the city.`);
      this.leaveMafiaRooms(target, room.id);
    }
    room.afkWarnedPlayerIds = room.afkWarnedPlayerIds.filter((id) => id !== targetId);
    this.emitRoom(room);
    this.maybeWin(room);
  }

  pause(roomId: string, hostId: string) {
    const room = this.getRoom(roomId);
    if (!room || !this.requireHost(room, hostId)) return;
    if (room.paused || !room.phaseEndsAt) return;
    room.paused = true;
    room.pausedRemainingMs = Math.max(0, room.phaseEndsAt - Date.now());
    room.phaseEndsAt = null;
    this.clearTimer(room);
    log(room, "The host paused the game.");
    this.emitRoom(room);
  }

  resume(roomId: string, hostId: string) {
    const room = this.getRoom(roomId);
    if (!room || !this.requireHost(room, hostId)) return;
    if (!room.paused) return;
    room.paused = false;
    const ms = room.pausedRemainingMs ?? 0;
    room.pausedRemainingMs = null;
    room.phaseEndsAt = Date.now() + ms;
    log(room, "The host resumed the game.");
    this.schedule(room);
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
      p.ready = false;
      p.afkCount = 0;
      p.blackmailed = false;
      p.bulletsLeft = undefined;
      this.leaveMafiaRooms(p, room.id);
    }
    room.phase = "lobby";
    room.cycle = 0;
    room.phaseEndsAt = null;
    room.paused = false;
    room.winner = null;
    room.logs = [];
    room.votes = {};
    room.nightActions = [];
    room.detectiveByPlayer = {};
    room.afkWarnedPlayerIds = [];
    this.emitRoom(room);
  }

  disconnect(socketId: string) {
    const found = this.playerBySocket(socketId);
    if (!found) return;
    const { room, player } = found;
    player.socketId = null;

    if (player.isHost) {
      const next = room.players.find((p) => p.socketId && p.id !== player.id);
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
      return;
    }
    this.emitRoom(room);
  }
}
