# Gram Network Auto Claim — Setup Guide

## Repository
- GitHub: `mocenk/gram-network-auto-claim`
- Python agent, daemon mode (not cron)
- Dependencies: `requests`

## Key Difference from ITLG
- Uses Telegram WebApp `initData` for auth (NOT loginId/passcode)
- Server-slotted claim windows (every ~6 min)
- Energy boost + task completion + mining claim
- Daemon mode (systemd service), not loop script

## Setup Steps

```bash
# 1. Clone
cd /tmp && git clone https://github.com/mocenk/gram-network-auto-claim.git
mv /tmp/gram-network-auto-claim ~/gram-network-auto-claim

# 2. Install deps
cd ~/gram-network-auto-claim
pip3 install requests

# 3. Get initData
# Open Gram Network Mini App in Telegram
# Tap ⋮ → Open in Browser
# F12 → Console → paste: window.Telegram.WebApp.initData
# Copy the long string result

# 4. Create config
cat > gram-config.json << 'EOF'
{
  "accounts": [
    {
      "initData": "PASTE_INITDATA_HERE",
      "username": "Ardhiansyah"
    }
  ]
}
EOF
chmod 600 gram-config.json

# 5. Edit CONFIG_PATH in gram-agent.py
# Change: CONFIG_PATH = "/home/home/gram-config.json"
# To:     CONFIG_PATH = "/home/ubuntu/gram-network-auto-claim/gram-config.json"

# 6. Test run
python3 gram-agent.py once

# 7. Background run
terminal(command="cd ~/gram-network-auto-claim && python3 gram-agent.py 2>&1",
         background=true, notify_on_complete=true)
```

## Pitfalls

### 0. Cloudflare Blocks VPS (CRITICAL — CHECK FIRST)
Before deploying ANY Gram Network bot on VPS:
```bash
curl -s -o /dev/null -w "%{http_code}" "https://app.gramnetwork.online/api/get_user_data.php?initData=test"
# 403 = Cloudflare blocked → use CF Worker proxy (below) or residential IP
# 200 = OK → proceed
```

**SOLUTION: Cloudflare Worker Proxy (FREE, verified 2026-07-09)**
Deploy a Cloudflare Worker that proxies requests — CF IPs are trusted by CF-protected sites.
Full guide: see `references/cloudflare-worker-proxy.md`

Quick setup:
1. Deploy worker.js to Cloudflare Workers (free tier)
2. Set `TARGET_BASE = "https://app.gramnetwork.online"` in worker
3. Set `SECRET` in wrangler.toml `[vars]`
4. Worker URL: `https://gram-proxy.<subdomain>.workers.dev`
5. Bot sends requests to Worker URL with `Authorization: Bearer <SECRET>` header
6. Worker forwards to `app.gramnetwork.online` — no 403!

**Critical:** Gram Network API is at `app.gramnetwork.online`, NOT `gram.network`.
**Critical:** API expects `Content-Type: application/x-www-form-urlencoded`, NOT JSON.
**Critical:** Worker must convert JSON body to URLSearchParams before forwarding.

Verified working endpoints via proxy (2026-07-09):
```
GET  /api/get_user_data.php?initData=...  → 200 JSON
GET  /api/get_tasks.php?initData=...      → 200 JSON
POST /api/start_mining.php  (body: initData=...)  → 200 JSON
POST /api/claim_mining.php  (body: initData=...)  → 200 JSON
POST /api/boost_power.php   (body: initData=...)  → 200 JSON
POST /api/complete_task.php (body: initData=...&task_id=...) → 200 JSON
```

Old fallback: run on residential IP (laptop/Termux) or use residential proxy ($5-15/month).

### 1. CONFIG_PATH Hardcoded
- Script has `CONFIG_PATH = "/home/home/gram-config.json"` (author's path)
- **Fix:** `sed -i 's|/home/home/gram-config.json|/home/ubuntu/gram-network-auto-claim/gram-config.json|' gram-agent.py`
- Also fix LOG_PATH: `sed -i 's|/home/home/gramnetwork-autoclaim/agent.log|/home/ubuntu/gram-network-auto-claim/agent.log|' gram-agent.py`

### 2. Cloudflare Protection
- API `app.gramnetwork.online` is behind **Cloudflare WAF**
- ALL direct requests from VPS/datacenter IPs get **403 "Just a moment..."**
- **Solutions (in order of preference):**
  1. **Cloudflare Worker proxy** — FREE, verified working 2026-07-09. See pitfall #0 above and `references/cloudflare-worker-proxy.md`
  2. Run bot on **residential IP** (laptop/HP via Termux)
  3. Use **residential proxy** ($5-15/month)
  4. Use Browserbase with advanced stealth (expensive)
- **Verified:** Direct VPS access blocked. CF Worker proxy bypasses it completely.

### 3. initData Expiry (Common Cause of "Stuck Balance")
- Telegram WebApp initData expires ~24 hours after generation
- **No auto-refresh mechanism** — user must manually regenerate
- **Symptom:** Bot logs show repeated `"Mining is already active!"` every check cycle, but balance stays flat. No `"Claimed!"` or `"Claim: not ready"` messages appear. Bot looks healthy but isn't actually claiming.
- **Root cause:** Expired initData lets `get_user_data` return cached/basic info (so bot thinks mining is active), but `claim_mining` and `start_mining` silently fail.
- **Diagnosis:** Check `auth_date` in initData string — it's a Unix timestamp:
  ```bash
  # Extract auth_date from config
  grep -oP 'auth_date=\K[0-9]+' config/accounts/*.json
  # Compare with current time — if delta > 86400, expired
  echo $(( $(date +%s) - AUTH_DATE_VALUE ))
  ```
- **Fix:** User opens Gram Network Mini App → copies fresh initData → update config file → restart bot (`sudo systemctl restart gram-miner`)
- **Prevention:** Set a cron reminder every 20h to notify user to refresh initData

### 3b. Proxy Auth Debugging
- CF Worker expects `Authorization: Bearer <SECRET>` header (NOT `x-proxy-secret` or other custom headers)
- If proxy returns `{"error": "Unauthorized"}`, check:
  1. Secret loaded correctly? Add `console.log('SECRET length:', PROXY_SECRET.length)` to verify
  2. Regex match failing? Common issue: escaped characters in `wrangler.toml` read. Use simple string match, not complex regex
  3. Wrong header name? Must be exactly `Authorization: Bearer <value>`
- **Quick proxy test** (bypass bot, test proxy directly):
  ```bash
  curl -s -H "Authorization: Bearer YOUR_SECRET" \
       -d "initData=YOUR_DATA" \
       https://gram-proxy.sadewo.workers.dev/api/get_user_data.php
  ```

### 4. BOT_TOKEN in Script
- Script has hardcoded `BOT_TOKEN_ENV` and `CHAT_ID` for @rizbugsbot
- **Fix:** Either change to your own bot token, or leave as-is (goes to author's topic)
- Better: create your own config with `tgBotToken` + `tgChatId`

### 5. Config Path
- Config is `gram-config.json` (NOT `config.json`)
- Different from ITLG which uses `config.json`

### 6. initData Extraction
- **From Telegram Desktop:** F12 → Console → `Telegram.WebApp.initData`
- **From Telegram Web:** web.telegram.org → F12 → Console → same
- **From Android:** HTTP Catcher app → capture request to `app.gramnetwork.online`
- **From iOS:** HTTP Catcher / Stream app → capture request
- **Bot alternative:** @WebAppDataBot (may be dead/unreliable)
- **Pitfall:** Mini App may be blank in web.telegram.org — use Telegram Desktop instead

## API Endpoints
```
Base: https://app.gramnetwork.online/api
GET  get_user_data.php?initData=...   → user status, mining, balance
GET  get_tasks.php?initData=...&_t=ts → tasks, boost_time_left
POST start_mining.php  body initData=...
POST claim_mining.php  body initData=...
POST boost_power.php   body initData=...
POST complete_task.php body initData=...&task_id=...
```

## Workflow
1. Poll `get_user_data` + `get_tasks` every 5 min
2. If `energy_boost_time_left == 0` → `boost_power`
3. If mining claimable → `claim_mining` → `start_mining`
4. Complete social tasks with **20 detik delay** (server rate-limit, verified 2026-07-09)
5. Sleep: `min(time_left_seconds) + 60s buffer`
6. Report to Telegram after each cycle

## Task Auto-Completion (Verified 2026-07-09)
Gram Network tasks can be batch-completed via API. Key findings:
- **Rate limit: 20 detik antar task** (bukan 17s yang didokumentasikan sebelumnya). Server return "Please wait X seconds before completing another task" kalau terlalu cepat.
- **Task types:**
  - `others` = auto-completable (social media likes/shares/watch videos)
  - `telegram_chat` = perlu join channel Telegram dulu (server cek keanggotaan)
  - `telegram_bot` = perlu start bot Telegram dulu (server cek)
- **Reward range:** 0.10 - 1.00 GRM per task (kebanyakan 0.20 GRM)
- **Total tasks:** Biasanya 50-60+ tasks tersedia
- **Completion time:** ~20-30 menit untuk batch complete semua tasks (dengan 20s delay)
- **Balance impact:** Signifikan (contoh: 0 → 18+ GRM dalam 1 session)

### Standalone Task Script Pattern
Bikin script terpisah (`do-tasks.js`) untuk batch complete tasks:
```javascript
const TASK_DELAY = 20000; // 20 detik (server rate limit)
for (const task of pending) {
  if (task.type === 'telegram_chat' || task.type === 'telegram_bot') {
    console.log('Skip (need manual join):', task.title);
    continue;
  }
  const result = await postForm('/api/complete_task.php', acc.initData, { task_id: task.id });
  console.log(task.title, ':', result.message);
  if (result.success) await tgSend('Task Done: ' + task.title + ' +' + task.reward + ' GRM');
  await sleep(TASK_DELAY);
}
```

**Pitfall:** Jangan kurangi delay di bawah 20 detik — server reject dan task gagal.

---

## Node.js Alternative: mrnazik/gram-network-bot

**Repo:** `https://github.com/exgun007/gramnetwork-bot.git`
**Language:** Node.js 14+ (zero dependencies)
**Better than Python version:** Interactive menu, multi-account, CLI shortcuts

### Quick Setup
```bash
git clone https://github.com/exgun007/gramnetwork-bot.git ~/gram-network-bot
cd ~/gram-network-bot
node grammine.js   # interactive menu → option 9 to add account
```

### CLI Shortcuts
```bash
node grammine.js              # interactive menu
node grammine.js run mine     # mine 1x
node grammine.js run claim    # claim 1x
node grammine.js run full     # task + daily + mine
node grammine.js loop         # loop forever (mine+claim)
node grammine.js accounts     # list accounts + status
node grammine.js add <name> <initData>  # add account CLI
```

### Config Structure
```
config/accounts/<name>.json  → 1 file per account
config/settings.json         → global settings
config/state.json            → auto-managed state
```

### Key Settings
```json
{
  "intervalMinutes": 240,     // 4 hours (claim cycle)
  "jitterSeconds": 30,        // random delay
  "parallel": 1,              // 1=sequential (safe), 2+=parallel
  "chainAfterClaim": true,    // start new session right after claim
  "skipJoinTasks": true       // skip channel/bot join tasks (manual only)
}
```

### Same Cloudflare Issue → SOLVED with CF Worker Proxy
- Bot makes direct HTTPS requests to `app.gramnetwork.online`
- Direct VPS access = 403 block
- **Solution:** Deploy CF Worker proxy, then change BASE URL in grammine.js:
  ```javascript
  // Original:
  const BASE = 'https://app.gramnetwork.online';
  // With proxy:
  const BASE = 'https://gram-proxy.<subdomain>.workers.dev';
  ```
- Add Authorization header to postForm/getJson functions (see below)
- Worker handles JSON→form-urlencoded conversion
- See `references/cloudflare-worker-proxy.md` for full setup

### Exact grammine.js Proxy Modifications
Three changes needed in grammine.js:
```javascript
// 1. Change BASE (line ~20):
const BASE = 'https://gram-proxy.<subdomain>.workers.dev';
// Read PROXY_SECRET from wrangler.toml (not hardcoded!)
const fs = require('fs');
const wranglerContent = fs.readFileSync('/path/to/proxy/wrangler.toml', 'utf8');
const secretMatch = wranglerContent.match(/SECRET\s*=\s*"([^"]+)"/);
const PROXY_SECRET=*** ? secretMatch[1] : '';

// 2. In postForm() — add to headers object:
'Authorization': `Bearer ${PROXY_SECRET}`,
'Origin': 'https://app.gramnetwork.online',   // keep original origin
'Referer': 'https://app.gramnetwork.online/',

// 3. In getJson() — add to headers object:
'Authorization': `Bearer ${PROXY_SECRET}`,
'Origin': 'https://app.gramnetwork.online',
'Referer': 'https://app.gramnetwork.online/',
```
**Pitfall:** Don't change Origin/Referer to the Worker URL — the proxy forwards these headers and the target API may check them.

### total_balance Pitfall (Verified 2026-07-10)
API returns `user.total_balance`, NOT `user.balance`. If bot shows 0 GRM while app shows real balance:
```bash
cp grammine.js grammine.js.bak
sed -i 's/user\\.balance/user.total_balance/g; s/data\\.balance/data.total_balance/g' grammine.js
# 8 occurrences. Restart after: sudo systemctl restart gram-miner
```

### mining_status vs mining_active Bug (Verified 2026-07-10)
**Symptom:** Bot logs show `"Mining is already active!"` every cycle but **never** show `"Mining active, trying to claim..."` or `"Claim:"` messages. Balance stays flat.

**Root cause:** API returns `user.mining_status` as **string** (`"Active"` / `"Inactive"`), NOT `user.mining_active` as boolean. Bot code checks `if (user.mining_active)` which is always `undefined` → claim block never executes.

**Diagnosis:** Test API directly to see actual response fields:
```bash
node -e "
  // ... load proxy config + account initData ...
  const status = await getJson('/api/get_user_data.php', initData);
  console.log('mining_status:', status.user.mining_status);  // 'Active'
  console.log('mining_active:', status.user.mining_active);  // undefined
  console.log('time_left:', status.user.time_left);          // '03:41:10'
  console.log('tokens_earned:', status.user.tokens_earned);  // '4.00'
"
```

**Fix in grammine.js** (line ~286):
```javascript
// OLD (broken):
if (user.mining_active) {

// NEW (correct):
const miningActive = user.mining_active || (user.mining_status && user.mining_status.toLowerCase() === 'active');
if (miningActive) {
  log(acc.name, info(`Mining active (${user.time_left || '?'} left), trying to claim...`));
```

**Key API fields for debugging:**
- `mining_status`: `"Active"` / `"Inactive"` (string, primary indicator)
- `mining_active`: undefined (legacy field, don't rely on)
- `time_left`: `"HH:MM:SS"` (human-readable countdown)
- `time_left_seconds`: integer (seconds remaining)
- `tokens_earned`: `"4.00"` (accumulated this cycle, not yet claimed)
- `mining_start_time`: `"2026-07-10 11:46:12"` (WIB)
- `mining_end_time`: `"2026-07-10 15:46:12"` (WIB)
- `claim_in`: `"00:00:00"` (daily claim cooldown, separate from mining claim)

### VPS Full Setup Pattern (Verified 2026-07-09)
Complete setup for running Gram Network bot on VPS with Cloudflare Worker proxy:

```bash
# 1. Clone repo
git clone https://github.com/exgun007/gramnetwork-bot.git ~/gram-network-vps

# 2. Deploy Cloudflare Worker proxy (see cloudflare-worker-proxy.md)

# 3. Modify grammine.js:
#    - Change BASE to Worker URL
#    - Add Authorization header to postForm/getJson
#    - Keep Origin/Referer as app.gramnetwork.online

# 4. Read secrets from config files (not hardcoded):
const fs = require('fs');
const wranglerContent = fs.readFileSync('/path/to/proxy/wrangler.toml', 'utf8');
const secretMatch = wranglerContent.match(/SECRET\s*=\s*"([^"]+)"/);
const PROXY_SECRET=*** ? secretMatch[1] : '';

# 5. Add account
node grammine.js add Ardhisadewo "<initData>"

# 6. Run in background
terminal(command="cd ~/gram-network-vps && node grammine.js loop", background=true, notify_on_complete=true)

# 7. Monitor
tail -f ~/gram-network-vps/logs/Ardhisadewo.log

# 8. For 24/7 persistence, use systemd (see system-service-pattern reference)
# Key: which node → NOT /usr/bin/node, use actual path
# Key: grammine.js loop (CLI arg) or echo "5" | node grammine.js (pipe)
```

### Telegram Notification Integration
Reuse existing ITLG bot token for unified notifications:
```javascript
const itlgConfig = JSON.parse(fs.readFileSync('/home/ubuntu/itlg-claim/config.json', 'utf8'));
const TG_BOT_TOKEN=*** || '';
const TG_CHAT_ID = itlgConfig.tgChatId || '';
```
All bots (ITLG, Gram, monitoring) send to same Telegram conversation. No duplicate config needed.

### Termux One-Liner (Android)
```bash
pkg update -y && pkg install -y nodejs git && git clone https://github.com/exgun007/gramnetwork-bot.git ~/gram-network-bot && cd ~/gram-network-bot && echo "✅ Done! Run: node grammine.js"
```
