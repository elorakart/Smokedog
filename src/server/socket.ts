import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/types";
import { RoomError } from "@/lib/room-code";
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
    socket.join("lobby-browser");

    socket.on("lobbies:list", (payload) => {
      socket.emit("lobbies:list", {
        lobbies: runtime.listOpenLobbies(payload?.query),
      });
    });

    socket.on("room:create", (payload) => {
      try {
        remember(payload.playerId);
        const room = runtime.createRoom({
          socketId: socket.id,
          playerId: payload.playerId,
          name: payload.name,
          avatarId: payload.avatarId,
          gameId: payload.gameId,
          localMode: payload.localMode,
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
          code: err instanceof RoomError ? err.code : "UNKNOWN",
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
          code: err instanceof RoomError ? err.code : "UNKNOWN",
          message: err instanceof Error ? err.message : "Could not rejoin",
        });
      }
    });

    socket.on("room:leave", (payload) => {
      if (socket.data.playerId) {
        runtime.leaveRoom(payload.roomId, socket.data.playerId);
      }
      socket.leave(payload.roomId);
      socket.emit("room:left");
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

    socket.on("host:settings", (payload) => {
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
          code: err instanceof RoomError ? err.code : "UNKNOWN",
          message: err instanceof Error ? err.message : "Could not start",
        });
      }
    });

    socket.on("lobby:addBot", (payload) => {
      try {
        if (!socket.data.playerId) return;
        runtime.addBots(payload.roomId, socket.data.playerId, payload.fillTo);
      } catch (err) {
        socket.emit("room:error", {
          code: err instanceof RoomError ? err.code : "UNKNOWN",
          message: err instanceof Error ? err.message : "Could not add auto players",
        });
      }
    });

    socket.on("lobby:removeBot", (payload) => {
      try {
        if (!socket.data.playerId) return;
        runtime.removeBot(payload.roomId, socket.data.playerId);
      } catch (err) {
        socket.emit("room:error", {
          code: err instanceof RoomError ? err.code : "UNKNOWN",
          message: err instanceof Error ? err.message : "Could not remove auto player",
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

    socket.on("day:voteSkip", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitVoteSkip(payload.roomId, socket.data.playerId);
    });

    socket.on("day:juggle", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitJuggle(
        payload.roomId,
        socket.data.playerId,
        payload.targetIds
      );
    });

    socket.on("fivealive:playCard", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitFiveAlivePlayCard(
        payload.roomId,
        socket.data.playerId,
        payload.cardId,
        payload.wildValue,
        payload.pass
      );
    });

    socket.on("ek:playCards", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitEkPlayCards(
        payload.roomId,
        socket.data.playerId,
        payload.cardIds
      );
    });

    socket.on("ek:endTurn", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitEkEndTurn(payload.roomId, socket.data.playerId);
    });

    socket.on("ek:placeDefuse", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitEkPlaceDefuse(
        payload.roomId,
        socket.data.playerId,
        payload.deckIndex
      );
    });

    socket.on("ek:pickDiscard", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitEkPickDiscard(
        payload.roomId,
        socket.data.playerId,
        payload.discardIndex
      );
    });

    socket.on("ek:stealTarget", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitEkStealTarget(
        payload.roomId,
        socket.data.playerId,
        payload.targetId
      );
    });

    socket.on("spotit:submitMatch", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitSpotItMatch(
        payload.roomId,
        socket.data.playerId,
        payload.symbolId
      );
    });

    socket.on("ttt:move", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitTttMove(
        payload.roomId,
        socket.data.playerId,
        payload.cellIndex
      );
    });

    socket.on("connect4:drop", (payload) => {
      if (!socket.data.playerId) return;
      runtime.submitConnect4Drop(
        payload.roomId,
        socket.data.playerId,
        payload.column
      );
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

    socket.on("host:skipDay", (payload) => {
      if (!socket.data.playerId) return;
      runtime.skipDay(payload.roomId, socket.data.playerId);
    });

    socket.on("host:skipTimer", (payload) => {
      if (!socket.data.playerId) return;
      runtime.skipPhaseTimer(payload.roomId, socket.data.playerId);
    });

    socket.on("voice:join", (payload) => {
      if (!socket.data.playerId) return;
      runtime.joinVoice(payload.roomId, socket.data.playerId, payload.channel);
    });

    socket.on("voice:invite", (payload) => {
      if (!socket.data.playerId) return;
      runtime.inviteVoice(
        payload.roomId,
        socket.data.playerId,
        payload.channel,
        payload.targetId
      );
    });

    socket.on("voice:leave", (payload) => {
      if (!socket.data.playerId) return;
      runtime.leaveVoice(payload.roomId, socket.data.playerId, payload.channel);
    });

    socket.on("voice:signal", (payload) => {
      if (!socket.data.playerId) return;
      runtime.relayVoiceSignal(
        payload.roomId,
        socket.data.playerId,
        payload.channel,
        payload.targetId,
        payload.signal
      );
    });

    socket.on("voice:speaking", (payload) => {
      if (!socket.data.playerId) return;
      runtime.relayVoiceSpeaking(
        payload.roomId,
        socket.data.playerId,
        payload.channel,
        payload.speaking
      );
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
