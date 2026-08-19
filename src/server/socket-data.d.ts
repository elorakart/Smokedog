import type { Server as IOServer } from "socket.io";

declare module "socket.io" {
  interface SocketData {
    playerId?: string;
  }
}

export type TypedIo = IOServer;
