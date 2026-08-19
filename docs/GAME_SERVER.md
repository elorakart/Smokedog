# Game server deployment & rollback

SMOKEDOG splits production into two parts:

| Layer | Host | URL (current) |
| --- | --- | --- |
| **UI** | Vercel | https://smokedog.vercel.app |
| **Game server** | Railway (primary today) | https://game-production-22ef.up.railway.app |

The UI connects via **`NEXT_PUBLIC_SOCKET_URL`** (Vercel env). The game server accepts WebSockets and runs `npm run start:game`.

---

## Rollback plan (keep this working)

**Rule:** Do not shut down Railway until Oracle has been stable for at least a week.

### Instant rollback (under 2 minutes)

If Oracle fails or players cannot connect:

1. Open **Vercel → smokedog → Settings → Environment Variables**
2. Set `NEXT_PUBLIC_SOCKET_URL` back to the Railway URL:
   ```
   https://game-production-22ef.up.railway.app
   ```
3. **Redeploy** the Vercel production deployment (or push any commit to `main`).
4. Confirm health: open  
   `https://game-production-22ef.up.railway.app/health`  
   → should return `{"ok":true,"service":"smokedog-game"}`

No code changes required. Active lobbies on Oracle will be lost; Railway starts fresh rooms.

### Keep Railway alive during migration

- Leave the Railway **game** service **Online** (Hobby plan or trial).
- Railway auto-deploys from `main` — same code as Oracle.
- CORS on Railway must include `https://smokedog.vercel.app`:
  ```
  CORS_ORIGIN=https://smokedog.vercel.app
  ```

### Backup env values (save in password manager / Vercel notes)

| Variable | Railway (backup) | Oracle (future) |
| --- | --- | --- |
| `NEXT_PUBLIC_SOCKET_URL` | `https://game-production-22ef.up.railway.app` | `https://<your-oracle-domain-or-ip>` |
| `CORS_ORIGIN` | `https://smokedog.vercel.app` | same |
| `PORT` | Railway sets automatically | `3001` (or behind nginx) |

---

## Oracle Cloud migration plan (next step)

### Why Oracle

Always-free ARM VM (24/7, no spin-down) — good fit for Socket.io + in-memory rooms.

### High-level steps

1. **Create OCI account** → Always Free → Ubuntu 22.04/24.04 VM (Ampere A1).
2. **Open firewall:** allow TCP `3001` (or `80`/`443` if using nginx).
3. **Install Node 20+**, clone repo, `npm ci`, `npm run build` (optional for game-only).
4. **Run game server:**
   ```bash
   PORT=3001 CORS_ORIGIN=https://smokedog.vercel.app npm run start:game
   ```
5. **systemd** — use `deploy/oracle/smokedog-game.service` (copy to `/etc/systemd/system/`).
6. **Health check:** `curl https://<host>/health`
7. **Cutover:** set Vercel `NEXT_PUBLIC_SOCKET_URL` to Oracle URL → redeploy.
8. **Monitor** 24–48h; keep Railway running for rollback.

### Oracle checklist before cutover

- [ ] `/health` returns OK from public internet
- [ ] Create party + join from two browsers on https://smokedog.vercel.app
- [ ] Night/day actions, chat, voice signaling work
- [ ] CORS_ORIGIN matches Vercel URL exactly (no trailing slash)
- [ ] Railway still online (rollback ready)

### Optional: nginx + TLS on Oracle

Point a subdomain (e.g. `game.smokedog.app`) to the VM, terminate TLS with Let's Encrypt, proxy to `localhost:3001`.

---

## Local dev

Single process (Next + Socket.io):

```bash
npm run dev
```

Game server only:

```bash
PORT=3001 CORS_ORIGIN=http://localhost:3000 npm run start:game
```

Set `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001` in `.env.local` to test split mode locally.

---

## Deploy commands

**Vercel (UI):**

```bash
npx vercel --prod --yes
```

**Railway (game server):**

```bash
railway up --service game --detach
```

Both deploy from the same GitHub repo: https://github.com/elorakart/Smokedog
