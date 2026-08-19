# Oracle Cloud migration — step-by-step

Everything marked **YOU** needs your Oracle login or SSH. Everything else is already done in the repo.

---

## Already done (no action needed)

- [x] Game server code runs standalone (`npm run start:game`)
- [x] Railway backup live: https://game-production-22ef.up.railway.app/health
- [x] Vercel UI live: https://smokedog.vercel.app
- [x] Railway `CORS_ORIGIN=https://smokedog.vercel.app`
- [x] One-shot Oracle install script: `deploy/oracle/install-game-server.sh`
- [x] Rollback script: `scripts/rollback-to-railway.ps1`
- [x] Cutover script: `scripts/cutover-to-oracle.ps1`

---

## Phase 1 — Create the Oracle VM **YOU**

### 1.1 Sign up

1. Go to https://cloud.oracle.com and create an account (card required for verification; Always Free tier).
2. Pick a home region close to your players (e.g. **UK London**, **Germany Frankfurt**, or **US Ashburn**). **Cannot change later.**

### 1.2 Create the instance

1. **Menu → Compute → Instances → Create instance**
2. **Name:** `smokedog-game`
3. **Image:** Ubuntu 22.04 or 24.04
4. **Shape:** Click **Change shape**
   - **Ampere** → **VM.Standard.A1.Flex**
   - **1 OCPU**, **6 GB RAM** (enough for the game server; stays in Always Free)
5. **Networking:** Ensure **Assign a public IPv4 address** is checked
6. **SSH keys:** Choose **Generate a key pair for me** → **Save private key** (`smokedog-oracle.key`) and keep it safe
7. Click **Create**

Wait until state is **Running**. Copy the **Public IP address** (example: `123.45.67.89`).

### 1.3 Open the firewall **YOU**

Oracle blocks traffic until you allow it:

1. On the instance page, click the **Subnet** link (under Primary VNIC)
2. Click the **Security list** link
3. **Add ingress rules:**
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination port:** `3001`
   - Description: `SMOKEDOG game server`
4. Save

*(Optional later: port 443 if you add nginx + domain.)*

---

## Phase 2 — Install the game server on the VM **YOU (one command)**

On your **Windows PC**, open PowerShell in a folder where you saved the SSH key:

```powershell
# Fix key permissions (Windows OpenSSH)
icacls ".\smokedog-oracle.key" /inheritance:r
icacls ".\smokedog-oracle.key" /grant:r "$($env:USERNAME):(R)"

# SSH into the VM (replace IP)
ssh -i ".\smokedog-oracle.key" ubuntu@YOUR_PUBLIC_IP
```

On the **Oracle VM** (after SSH connects), paste this **single command**:

```bash
curl -fsSL https://raw.githubusercontent.com/elorakart/Smokedog/main/deploy/oracle/install-game-server.sh | bash
```

Wait ~2–3 minutes. You should see:

```
OK — game server running locally.
Public health URL: http://YOUR_PUBLIC_IP:3001/health
```

### 2.1 Verify from your PC **YOU**

In PowerShell (replace IP):

```powershell
Invoke-RestMethod -Uri "http://YOUR_PUBLIC_IP:3001/health"
```

Expected: `ok : True`, `service : smokedog-game`

If this fails, the OCI security list (Phase 1.3) is usually the issue.

---

## Phase 3 — Cutover to Oracle **YOU (tell me the URL) or run script**

Once public `/health` works, run from the Smokedog project on your PC:

```powershell
cd "c:\Users\balme\OneDrive\Desktop\Smokedog"
.\scripts\cutover-to-oracle.ps1 -OracleUrl "http://YOUR_PUBLIC_IP:3001"
```

Or paste your Oracle URL here in chat and I can run the cutover for you.

**Do not shut down Railway** — it stays as instant rollback.

---

## Phase 4 — Test **YOU**

1. Open https://smokedog.vercel.app
2. Create a party, join from a second browser/phone
3. Start game, test night action, day vote, chat

---

## Rollback (if anything breaks)

From your PC:

```powershell
cd "c:\Users\balme\OneDrive\Desktop\Smokedog"
.\scripts\rollback-to-railway.ps1
```

Takes under 2 minutes. Switches Vercel back to Railway.

---

## What to send me after Phase 1

Reply with:

1. **Public IP** of the VM (e.g. `123.45.67.89`)
2. Whether **Phase 2 install** finished OK
3. Output of `Invoke-RestMethod http://IP:3001/health` from your PC

I will run the Vercel cutover script for you once health checks pass.

---

## Optional later: custom domain + HTTPS

1. DNS A record: `game.yourdomain.com` → VM public IP
2. On VM: install nginx + certbot using `deploy/oracle/nginx-smokedog.conf`
3. Cutover with `https://game.yourdomain.com` instead of raw IP

Railway rollback URL stays the same.
