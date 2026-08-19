# SMOKEDOG

Real-time multiplayer social deduction, starting with **Mafia City**.

Design reference: [Stitch — Mafia Card Party](https://stitch.withgoogle.com/projects/7822900312632106893).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The custom `server.ts` serves Next.js and Socket.io on one port.

## Production

- **UI:** Vercel (Next.js). Set `NEXT_PUBLIC_SOCKET_URL` to the game server origin.
- **Game server:** Railway (or any always-on Node host).

```bash
npm run start:game
```

Env for the game process:

- `PORT` — provided by the host
- `CORS_ORIGIN` — your Vercel URL, e.g. `https://smokedog.vercel.app`

`.env.example` lists all variables. Do not commit `.env`.

## Play

1. Open the hub, click **Mafia City**.
2. Set a display name and mugshot.
3. **Create Party** or **Join Party** with a 6-character code.
4. Host starts at 4+ players. Roles scale with lobby size.
