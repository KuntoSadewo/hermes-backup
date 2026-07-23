---
name: airdrop-bot-operations
description: "Setup, operate, and maintain auto-claim bots for crypto airdrops (Interlink ITLG, Gram Network, UNITS, etc). Covers: install, config, login (OTP + face), background process management, Telegram notifications, token persistence, backup, monitoring."
tags: [crypto, airdrop, automation, claim-bot, telegram]
---

# Telegram Auto-Join with Telethon (for Task Automation)

## ⚠️ STATUS: UNRELIABLE FROM VPS (2026-07-09)

**Root cause:** OTP codes sent to a Telegram user from a VPS/datacenter IP either:
- Never arrive ("ga msk" — user reports no message)
- Arrive but expire within seconds (before user can relay code back)
- Get invalidated by subsequent `send_code_request` calls

After 8+ attempts with multiple approaches (direct sign_in, file-based wait, background process, code_callback), not a single successful login was achieved. Telegram appears to aggressively rate-limit or block auth attempts from datacenter IPs.

**Recommendation:** Use manual join pattern instead:
1. Cron job checks for new `telegram_chat` tasks every 1-2 hours
2. Notifies user with channel links
3. User joins manually via Telegram app
4. Bot/script claims the tasks after user confirms

If you still want to attempt auto-join (e.g., from residential IP or Termux), the code below is correct but untested in production.

---

## Use When
Gram Network (or similar) tasks require joining Telegram channels (`telegram_chat` type) before claiming rewards. Instead of manually joining each channel, use telethon to auto-join from VPS.
- Managing background mining/claim processes on VPS
- Login issues with claim bots (OTP not arriving, face login)
- Integrating Telegram notifications for claim bots
- Backing up bot configs, tokens, and credentials

## Quick Reference

### Typical Bot Lifecycle
1. **Clone repo** → `git clone <repo-url>`
2. **Setup venv** → `python3 -m venv venv && source venv/bin/activate && pip install requests`
3. **Config** → JSON file with credentials (NEVER put in chat, use file upload or `nano`)
4. **Login** → OTP via email OR face login (see below)
5. **Run background** → `terminal(background=true, notify_on_complete=true)`
6. **Monitor** → Check logs, process status, Telegram notifs
7. **Backup** → Config + tokens + state files

### Config File Pattern
```json
{
  "loginId": "123456789",
  "passcode": "123456",
  "email": "user@gmail.com",
  "imapPassword": "xxxx xxxx xxxx xxxx",
  "facePhoto": "/path/to/selfie.jpg",
  "deviceId": "",
  "deviceModel": "",
  "deviceBrand": "",
  "tgBotToken": "",
  "tgChatId": ""
}
```
**Pitfall:** `deviceId`, `deviceModel`, `deviceBrand` — leave EMPTY, bot auto-generates. Don't fill manually.

### Security Rules
- **NEVER** put API keys, passcodes, or tokens in chat messages
- Config files: `chmod 600` immediately after creation
- Token files: `chmod 600`, always backup to `token-backup.json`
- Use `file upload` via Telegram for config transfers, NOT paste in chat

## Login Patterns

### OTP via Email (Default)
```
Bot sends OTP → Gmail IMAP reads it → auto-verify
```
**Pitfall:** Gmail App Password required (NOT regular password). Create at: https://myaccount.google.com/apppasswords
**Pitfall:** OTP email may be delayed 1-3 minutes. Set `OTP_TIMEOUT=180` minimum.
**Pitfall:** OTP emails can land in Spam/Promotions/Updates folders, not just Inbox.

### Face Login (When OTP Fails)
If OTP email never arrives (common with some providers), use face login:
1. User takes selfie photo, sends via Telegram
2. Save photo to VPS: `cp image_cache/photo.jpg ~/bot/selfie.jpg`
3. Update config: add `"facePhoto": "/path/to/selfie.jpg"`
4. Run: `python bot.py --login-face --photo selfie.jpg`

### Telegram initData (Gram Network style)
Some bots use Telegram WebApp `initData` instead of loginId/passcode:
- User extracts initData from Telegram Desktop (F12 → Console → `Telegram.WebApp.initData`)
- Or: Mini App → ⋮ menu → "Copy initData"
- Stored in config as `accounts[0].initData`
- **Pitfall:** initData can expire (~24h), no auto-refresh. If bot logs show "Mining already active!" but balance is stuck, check `auth_date` timestamp — likely expired. See `references/gram-network-setup.md` §3 for diagnosis steps.
- **Pitfall:** API may be behind Cloudflare — check before deploying on VPS
- **Pitfall:** API base URL may differ from website (e.g., `app.gramnetwork.online` vs `gram.network`)
- See `references/telegram-initdata-extraction.md` for all extraction methods

**Face Login API Flow:**
```
POST /s3/face/presigned-login → get presigned S3 URL
PUT photo to S3 presigned URL
POST /auth/login (multipart/form-data) → get JWT tokens
```
**Pitfall:** `/auth/login` endpoint requires `multipart/form-data`, NOT JSON. If bot sends JSON, you get `"Not a multipart request"` error. Fix by using `requests.post(url, files={...})` instead of `json={...}`.
**Pitfall:** Face must be registered in the app first (KYC). If `FACE_NOT_REGISTER` error, user needs to do face verification in the mobile app first.

### Token Persistence
- Tokens saved to `token.json` + `token-backup.json`
- Bot auto-refreshes expired tokens
- If both tokens die, re-login required
- Always backup `token.json` before bot upgrades

## Background Process Management

### Starting Bot
```python
# Use terminal background, NOT nohup
terminal(command="cd ~/bot && ./venv/bin/python bot.py 2>&1", background=true, notify_on_complete=true)
```
**Pitfall:** Don't use `nohup ... &` in foreground mode. Use `background=true` so Hermes tracks the process.

### Monitoring
```bash
# Check if running
ps aux | grep bot_script | grep -v grep

# Check logs
tail -20 ~/bot/bot.log

# Process status
process(action="poll", session_id="proc_xxx")
```

### Restart Pattern
```bash
pkill -f "bot_script.py"  # kill old
# Then start new with terminal(background=true)
```

### systemd Service (Persistent Bot with Auto-Restart)
For bots that must survive VPS restarts and auto-recover from crashes:
```bash
# 1. Find actual node/python path (NOT /usr/bin/node)
which node  # e.g., /home/ubuntu/.local/bin/node

# 2. Create service file
sudo tee /etc/systemd/system/<bot-name>.service > /dev/null << 'EOF'
[Unit]
Description=<Bot Description>
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/<bot-dir>
ExecStart=<full-path-to-node/python> <full-path-to-script> <args>
Restart=always
RestartSec=30
Environment=NODE_ENV=production
Environment=PATH=/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

# 3. Enable + start
sudo systemctl daemon-reload
sudo systemctl enable <bot-name>
sudo systemctl start <bot-name>
sudo systemctl status <bot-name> --no-pager
```

**Pitfall:** `which node` returns user-installed path (e.g., `/home/ubuntu/.local/bin/node`), NOT `/usr/bin/node`. Using wrong path → `exit-code 203/EXEC`. Always check with `which` first.

**Pitfall:** For interactive bots (menu-based), use `ExecStart` with pipe or CLI arg. Example: `ExecStart=/path/node script.js loop` (if CLI shortcut exists) or wrap in a shell: `ExecStart=/bin/bash -c 'echo "5" | /path/node script.js'`.

**Pitfall:** After editing service file, always run `sudo systemctl daemon-reload` before `restart`.

**Managing:**
```bash
sudo systemctl status <bot> --no-pager   # check status
sudo systemctl restart <bot>              # restart
journalctl -u <bot> -f                    # live logs
journalctl -u <bot> --since "1h ago"      # recent logs
```

## Telegram Notification Integration

Most claim bots support Telegram notifs. Config fields:
```json
{
  "tgBotToken": "BOT_TOKEN_HERE",
  "tgChatId": "CHAT_ID_HERE"
}
```

**Pattern:** Reuse existing Hermes bot token + user's chat ID for convenience.

Test notification:
```python
requests.post(f"https://api.telegram.org/bot{token}/sendMessage",
    json={"chat_id": chat_id, "text": "✅ Bot connected!"})
```

## Backup Strategy

Critical files to backup per bot:
- `config.json` — credentials (chmod 600)
- `token.json` / `token-backup.json` — auth tokens (chmod 600)
**Backup command pattern:**
```bash
tar czf ~/backup-bot.tar.gz config.json token*.json claim_state.json selfie.jpg bot*.py
```

## Known Bots & Repos

| Bot | Repo | Language | Login | Claim Interval | VPS Compatible |
|-----|------|----------|-------|----------------|----------------|
| ITLG (Interlink Labs) | feb-frmn/itlg-claim | Python | OTP + Face | 4 hours | ✅ Yes |
| Gram Network (Python) | mocenk/gram-network-auto-claim | Python | initData (TG WebApp) | 6 min (server-slotted) | ⚠️ Needs CF Worker proxy |
| Gram Network (Node.js) | exgun007/gramnetwork-bot | Node.js | initData (TG WebApp) | 240 min (configurable) | ⚠️ Needs CF Worker proxy |
| UNITS | (varies) | varies | varies | varies | Check first |

**Gram Network Node.js bot (mrnazik/gram-network-bot):**
- Zero dependencies (pure Node.js stdlib)
- Interactive menu (14 options) + CLI shortcuts
- Multi-account support (1 file per account)
- Smart scheduler with jitter + cooldown
- `chainAfterClaim: true` → abis claim langsung start sesi baru
- initData expire ~24 jam, no auto-refresh
- Same Cloudflare issue — residential IP only

### Task Auto-Completion (Gram Network)
Gram Network tasks can be batch-completed with a standalone script. Key findings (verified 2026-07-09):
- **Rate limit: 20 detik antar task** (bukan 3 detik atau 17 detik). Server return "Please wait X seconds" kalau terlalu cepat.
- **Task types:** `others` = auto-completable (social media), `telegram_chat`/`telegram_bot` = perlu join channel dulu (server cek keanggotaan), lalu claim.
- **telegram_chat tasks NOT reliably automatable from VPS** — OTP codes from datacenter IPs expire instantly or never arrive. User prefers manual join + bot auto-claim. See `references/telegram-autojoin-telethon.md` for attempted setup and known issues.
- **Standalone script pattern:** Bikin `do-tasks.js` terpisah dari mining loop. Baca secrets dari config files (wrangler.toml, itlg config). Kirim notif ke Telegram yang sama dengan ITLG.
- **Output:** Balance naik signifikan (contoh: 0 → 18+ GRM dalam 1 session dengan 50+ tasks).

**Pitfall:** Gram Network API returns `user.total_balance` (not `user.balance`). If bot shows 0 GRM while app shows real balance, check field name. Fix: replace all `user.balance` → `user.total_balance` and `data.balance` → `data.total_balance` in bot code (sed: `sed -i 's/user\\.balance/user.total_balance/g; s/data\\.balance/data.total_balance/g' grammine.js`). 8 occurrences. Backup first.

**Pitfall:** Gram Network API returns `user.mining_status` as **string** (`"Active"` / `"Inactive"`), NOT `user.mining_active` as boolean. If bot logs show "Starting mining... → Mining is already active!" but **never** show "Mining active, trying to claim..." or "Claim:" messages, the claim block is never reached. Root cause: bot code checks `user.mining_active` (undefined) instead of `user.mining_status`.

**Pitfall: Claim timing race condition.** Even after fixing `mining_active` check, claims can STILL be missed. The API state machine:
1. Mining active → `mining_status: "Active"`, `time_left_seconds > 0`
2. Mining finishes → `mining_status: "Inactive"`, `time_left_seconds: 0`
3. Claim succeeds → new mining can start

The bug: bot checks claim when mining is active (step 1) → "not finished yet". Later when mining finishes (step 2), the `mining_active` condition is false → claim block skipped → bot starts new mining WITHOUT claiming.

**Fix: Smart claim flow — use `time_left_seconds` to wait, then claim:**
```javascript
const miningStatus = (user.mining_status || '').toLowerCase();
const timeLeftSec = parseInt(user.time_left_seconds) || 0;

if (miningStatus === 'active' && timeLeftSec > 0) {
  // Mining still running — WAIT for it to finish, then claim
  const waitSec = timeLeftSec + 30; // +30s buffer
  log(acc.name, info(`Mining active, waiting ${waitSec}s for finish...`));
  await sleep(waitSec * 1000);
  const claim = await claimMining(acc);
  // handle claim result...
} else if (miningStatus === 'inactive' || miningStatus === '' || miningStatus === 'completed') {
  // Mining finished but unclaimed — claim now
  const claim = await claimMining(acc);
  // handle claim result...
}
// Then start new mining...
```

**Alternative simpler fix:** Always try claim first regardless of status. API returns "not finished yet" harmlessly if still running. But this misses the timing window if the cycle check interval is long.

**Pitfall: Energy depletion.** After extended running, energy runs out and `start_mining.php` returns "Not enough energy! Wait for recharge." Fix: call `boost_energy.php` endpoint before retrying:
```javascript
if (startMsg.includes('energy') || startMsg.includes('not enough')) {
  const boost = await boostEnergy(acc); // POST /api/boost_energy.php
  if (boost.success) {
    await sleep(2000);
    const retry = await startMining(acc);
  }
}
```

**Pitfall: Loop mode interval.** Don't use `intervalMinutes: 240` (mining duration) as loop check interval. The mining cycle function now handles waiting internally (sleeps until finish). Use short interval (15 min) for the outer loop so the bot is responsive to state changes.

**Diagnosis:** If no "Claim:" lines appear in logs at all, the claim condition is falsy — check API response fields with a direct curl/node test before assuming the claim endpoint is broken.

**Pitfall:** `grammine.js` runs in interactive mode (menu). Run in loop mode from background: `echo "5" | node gramine.js`. CLI shortcut: `node gramine.js loop` also works. Choices: 1=full, 2=mine-only, 3=daily-only, 4=tasks-only, 5=loop-forever.

```javascript
// Task completion with rate limiting
const TASK_DELAY = 20000; // 20 detik (server rate limit)
for (const task of pending) {
  if (task.type === 'telegram_chat' || task.type === 'telegram_bot') continue; // skip manual
  const result = await postForm('/api/complete_task.php', acc.initData, { task_id: task.id });
  if (result.success) await tgSend('Task Done: ' + task.title + ' +' + task.reward + ' GRM');
  await sleep(TASK_DELAY);
}
```

**⚠️ Cloudflare Check:** Before deploying ANY new claim bot on VPS, test API access first:
```bash
curl -s -o /dev/null -w "%{http_code}" "https://target-domain/api/endpoint"
# 403 + "Just a moment..." = Cloudflare blocked → use CF Worker proxy or residential IP
# 200 = OK → proceed with setup
```
If blocked by Cloudflare: deploy a **Cloudflare Worker proxy** (FREE, see `references/cloudflare-worker-proxy.md`). The Worker's IP range is trusted by most CF-protected sites. Verified working for Gram Network 2026-07-09.

### Finding Actual API Endpoints (When Docs Don't Exist)
Most Telegram Mini App bots don't have official API docs. Find endpoints by reading open-source bot repos:
```bash
# 1. Search GitHub for bots targeting the same API
curl -sL "https://api.github.com/search/repositories?q=<project>-bot" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(i['full_name']) for i in d.get('items',[])]"

# 2. Read source for BASE URL and endpoints
curl -sL "https://raw.githubusercontent.com/<user>/<repo>/main/<script>" | grep -E "(BASE|endpoint|api|\.php|postForm|getJson)"
```
**Key patterns to grep:**
- `const BASE = '...'` → actual API base URL
- `'/api/...'` or `endpoint = '...'` → API paths
- `postForm(` vs `getJson(` → which methods use POST vs GET
- `'Content-Type': 'application/x-www-form-urlencoded'` → expected content type
**Verified:** Gram Network API discovered this way — `app.gramnetwork.online` with PHP endpoints.

## GitHub Backup
Full ecosystem backup to private GitHub repo:
```bash
bash ~/backup-to-github.sh  # pushes config, skills, bots, cron to GitHub
```
**Pattern:** Create private repo → use PAT (Personal Access Token) for auth → `git push -f origin main`
**Pitfall:** User may paste GitHub token in chat — immediately save to `~/.hermes/secrets/github_token.txt` (chmod 600) and advise against chat pasting in future.
See `references/hermes-backup-restore.md` for full GitHub backup workflow.

### Monitoring with Cron Jobs
Set up periodic monitoring via Hermes cron jobs:
```javascript
// Example: check bot status every hour
cronjob(action='create', schedule='every 60m', name='gram-monitor',
  prompt='Check bot logs, report status to Telegram',
  enabled_toolsets=['terminal'])
```
**Pattern:** Separate monitoring job checks logs + process status, sends summary to same Telegram chat as bot notifications. Creates a unified notification stream.

### Task Checker Cron (Auto-Claim + Notify Pattern)
For bots with tasks that need manual action (e.g., joining TG channels):
1. Create a shell script that checks tasks via API
2. Auto-claim `others` type tasks silently
3. Notify user only about `telegram_chat` tasks (with links)
4. Silent output if nothing new (watchdog pattern)
5. Cron runs every 1h with `no_agent=true` (no LLM overhead)

```bash
# Script pattern: check-tasks.sh
# - Auto-claim non-TG tasks
# - Output TG join tasks for user notification
# - Silent if nothing to do
```
**Pitfall:** Use `no_agent: true` + `script` parameter for cron, NOT `prompt`. Saves tokens.

**Pitfall:** Cron script paths must be relative to `~/.hermes/scripts/`. Absolute paths like `/home/ubuntu/bot/check-tasks.sh` fail with "Script not found". Fix: copy/symlink script to `~/.hermes/scripts/` and use just the filename. Example: `script: "check-tasks.sh"` (NOT `script: "/home/ubuntu/gram-network-vps/scripts/check-tasks.sh"`).

## References
- See `references/itlg-setup.md` for ITLG-specific setup guide
- See `references/gram-network-setup.md` for Gram Network setup (includes Cloudflare Worker proxy solution)
- See `references/cloudflare-worker-proxy.md` for reusable CF Worker proxy pattern (bypass IP blocks)
- See `references/hermes-backup-restore.md` for backup/restore procedure covering bot configs + Hermes ecosystem + GitHub backup
- See `references/telegram-initdata-extraction.md` for all initData extraction methods
- See `references/telegram-autojoin-telethon.md` for auto-joining Telegram channels via telethon (solves telegram_chat tasks)
- See `references/termux-residential-ip.md` for running bots on Android when VPS is blocked by Cloudflare
- See `references/systemd-service-pattern.md` for persistent bot services with auto-restart
- See `references/hermes-cron-scripts.md` for cron job script patterns and path rules
