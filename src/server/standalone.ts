import { createServer } from "http";
import { attachSocketServer } from "./socket";

const port = parseInt(process.env.PORT || "3001", 10);
const cors = process.env.CORS_ORIGIN || "*";
const corsOrigin = cors.includes(",")
  ? cors.split(",").map((s) => s.trim())
  : cors;

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "smokedog-game" }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("SMOKEDOG game server");
});

attachSocketServer(httpServer, corsOrigin);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`SMOKEDOG game server on :${port} (CORS ${cors})`);
});
