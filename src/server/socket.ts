import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/types";
import { GameRuntime, type IoServer } from "./game-runtime";

export function attachSocketServer(
  httpServer: HttpServer,
  corsOrigin: string | string[] = "*"
): IoServer {
  const io: IoServer = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"],
      },
      pingTimeout: 20000,
      pingInterval: 25000,
    }
  );

  const runtime = new GameRuntime(io);
  bindPlayerId(io);

  io.on("connection", (socket) => {
    const remember = (playerId: string) => {
      socket.data.playerId = playerId;
    };

    socket.on("room:create", (payload) => {
      try {
        remember(payload.playerId);
        const room = runtime.createRoom({
          socketId: socket.id,
          playerId: payload.playerId,
          name: payload.name,
          avatarId: payload.avatarId,
          gameId: payload.gameId,
        });
        socket.join(room.id);
        runtime.emitRoom(room);
      } catch (err) {
        socket.emit("room:error", {
          message: err instanceof Error ? err.message : "Could not create room",
        });
      }
    });

    socket.on("room:join", (payload) => {
      try {
        remember(payload.playerId);
        const room = runtime.joinRoom({
          roomId: payload.roomId,
          socketId: socket.id,
          playerId: payload.playerId,
          name: payload.name,
          avatarId: payload.avatarId,
        });
        socket.join(room.id);
        runtime.emitRoom(room);
      } catch (err) {
        socket.emit("room:error", {
          message: err instanceof Error ? err.message : "Could not join room",
        });
      }
    });

    socket.on("room:rejoin", (payload) => {
      try {
        remember(payload.playerId);
        const room = runtime.rejoin({
          roomId: payload.roomId,
          socketId: socket.id,
          playerId: payload.playerId,
        });
        runtime.emitRoom(room);
      } catch (err) {
        socket.emit("room:error", {
          message: err instanceof Error ? err.message : "Could not rejoin",
        });
      }
    });

    socket.on("lobby:ready", (payload) => {
      runtime.setReady(payload.roomId, socket.data.playerId, payload.ready);
    });

    socket.on("lobby:settings", (payload) => {
      if (!socket.data.playerId) return;
      runtime.updateSettings(
        payload.roomId,
        socket.data.playerId,
        payload.settings
      );
    });

    socket.on("lobby:start", (payload) => {
      try {
        if (!socket.data.playerId) return;
        runtime.startGame(payload.roomId, socket.data.playerId);
      } catch (err) {
        socket.emit("room:error", {
          message: err instanceof Error ? err.message : "Could not start",
        });
      }
    });

    socket.on("night:action", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitNightAction(
        payload.roomId,
        socket.data.playerId,
        payload.type,
        payload.targetId
      );
    });

    socket.on("day:vote", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitVote(payload.roomId, socket.data.playerId, payload.targetId);
    });

    socket.on("chat:send", (payload) => {
      if (!socket.data.playerId) return;
      runtime.sendChat(
        payload.roomId,
        socket.data.playerId,
        payload.channel,
        payload.text
      );
    });

    socket.on("host:kick", (payload) => {
      if (!socket.data.playerId) return;
      runtime.kick(payload.roomId, socket.data.playerId, payload.playerId);
    });

    socket.on("host:pause", (payload) => {
      if (!socket.data.playerId) return;
      runtime.pause(payload.roomId, socket.data.playerId);
    });

    socket.on("host:resume", (payload) => {
      if (!socket.data.playerId) return;
      runtime.resume(payload.roomId, socket.data.playerId);
    });

    socket.on("lobby:return", (payload) => {
      if (!socket.data.playerId) return;
      runtime.returnToLobby(payload.roomId, socket.data.playerId);
    });

    socket.on("disconnect", () => {
      runtime.disconnect(socket.id);
    });
  });

  return io;
}

export function bindPlayerId(
  io: IoServer
) {
  io.use((socket, next) => {
    const playerId = socket.handshake.auth?.playerId as string | undefined;
    if (playerId) socket.data.playerId = playerId;
    next();
  });
}
