"use client";

import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/types";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function getSocketUrl(): string {
  const env = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (env && env.trim()) return env.trim();
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function getSocket(playerId: string): GameSocket {
  if (socket) return socket;
  socket = io(getSocketUrl(), {
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: { playerId },
  });
  return socket;
}
