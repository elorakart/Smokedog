import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { attachSocketServer } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  attachSocketServer(httpServer, process.env.CORS_ORIGIN || "*");

  httpServer.listen(port, hostname, () => {
    console.log(`SMOKEDOG ready on http://localhost:${port}`);
  });
});
