import {
  createDebugLogger,
  createEioActor,
  createSioActor,
  generateBase64id,
  setEnabledLoggerNamespace,
} from "socket.io-serverless/dist/cf";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { Server } from "socket.io";
import {
  restoreSocketRoomMemberships,
  wireGameSockets,
} from "../../src/server/socket";

const debugLogger = createDebugLogger("smokedog:game:cf");

setEnabledLoggerNamespace(["sio-serverless:"]);

export interface GameWorkerBindings extends Record<string, unknown> {
  engineActor: DurableObjectNamespace;
  socketActor: DurableObjectNamespace;
}

export const EngineActor = createEioActor<GameWorkerBindings>({
  getSocketActorNamespace(bindings) {
    return bindings.socketActor;
  },
});

export const SocketActor = createSioActor<GameWorkerBindings>({
  async onServerCreated(server: Server) {
    debugLogger("socket.io server ready");
    wireGameSockets(server as Parameters<typeof wireGameSockets>[0]);
  },
  async onServerStateRestored(server) {
    debugLogger("socket.io state restored", server._nsps.size, "namespaces");
    restoreSocketRoomMemberships();
  },
  getEngineActorNamespace(bindings) {
    return bindings.engineActor;
  },
});

export default {
  async fetch(req: Request, env: GameWorkerBindings): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "smokedog-game",
        host: "cloudflare",
      });
    }

    if (!url.pathname.startsWith("/socket.io/")) {
      return new Response("SMOKEDOG game server (Cloudflare)", {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("websocket only", { status: 400 });
    }

    const actorId = env.engineActor.idFromName("singleton");
    const engineActorStub = env.engineActor.get(actorId);
    const sessionId = generateBase64id();

    return engineActorStub.fetch(
      `https://eioServer.internal/socket.io/?eio_sid=${sessionId}`,
      req
    ) as Promise<Response>;
  },
};
