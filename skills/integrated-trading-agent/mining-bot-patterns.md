# Mining Bot Patterns & Pitfalls

Patterns learned from running Gram Network, ITLG, and similar crypto mining bots on VPS.

## 1. API Field Mismatch — Always Verify

**Pitfall:** Code assumes `user.mining_active` (boolean) but API returns `user.mining_status` (string `"Active"`/`"Inactive"`). Result: claim block never executes, GRM silently lost.

**Fix pattern:** Read the actual API response first, then code against real field names.

```bash
# Quick API probe
curl -s "https://api.example.com/get_user_data.php" \
  -d "initData=..." | python3 -m json.tool | grep -i min
```

**Rule:** Never trust field names from README/docs. Always `console.log(JSON.stringify(response))` on first run and code against actual response shape.

## 2. Smart Claim Timing (Don't Fire-and-Forget)

**Pitfall:** Bot checks claim → "not finished yet" → continues loop → mining finishes → `mining_status` changes to "Inactive" → claim block skipped because condition was `if (mining_active)`.

**Pattern — Wait-and-Claim:**
```javascript
// Read time_left_seconds from status API
const timeLeftSec = parseInt(user.time_left_seconds) || 0;

if (miningStatus === 'active' && timeLeftSec > 0) {
  // Wait for mining to finish + buffer
  await sleep((timeLeftSec + 30) * 1000);
  // Now claim
  const claim = await claimMining(acc);
  // ...
} else if (miningStatus === 'inactive') {
  // Mining finished, claim immediately
  const claim = await claimMining(acc);
  // ...
}
// THEN start new mining
```

**Key insight:** The claim/start sequence matters. Always claim BEFORE starting new mining. The loop should be: check → wait if needed → claim → start new.

## 3. Energy/Resource Depletion Handling

**Pitfall:** Mining bot returns "Not enough energy! Wait for recharge." — bot loops forever trying to start, never succeeds.

**Pattern — Auto-Boost:**
```javascript
const start = await startMining(acc);
if (!start.success) {
  const msg = (start.message || '').toLowerCase();
  if (msg.includes('energy') || msg.includes('not enough')) {
    const boost = await boostEnergy(acc); // e.g. /api/boost_energy.php
    if (boost.success) {
      await sleep(2000);
      await startMining(acc); // retry
    }
  }
}
```

**Gram Network specifics:**
- Energy = 20 (base), depleted after each mining cycle
- Boost via `/api/boost_energy.php` (requires ad watch in-app, but API call works)
- Energy regenerates over time (~1/hour)
- `energy_boost_amount: 10` per boost

## 4. Telegram Mini App initData Expiry

**Pitfall:** initData from Telegram Mini Apps expires ~24 hours. Bot runs fine for a day, then all API calls return 401/Unauthorized silently.

**Signs:** Balance stops updating, claims return empty, status shows old data.

**Fix:** 
- Save `auth_date` from initData and track expiry
- Set up daily reminder to user to paste new initData
- Script: `update-gram-init.sh` for quick config update + service restart

**initData format:**
```
user=%7B%22id%22...%7D&chat_instance=...&chat_type=sender&auth_date=TIMESTAMP&signature=...&hash=...
```

Extract auth_date: `grep -oP 'auth_date=\K\d+' <<< "$INITDATA"`

## 5. Cloudflare Worker Proxy (for blocked VPS IPs)

**Problem:** Gram Network (and similar) block direct VPS IP ranges (cloud provider IPs).

**Solution:** Deploy Cloudflare Worker as proxy:
- VPS → Worker (Cloudflare IP) → Target API
- Worker adds proper headers (Origin, Referer, User-Agent)
- Auth via `Authorization: Bearer <SECRET>` header

**Worker auth pitfall:** The worker checks `Authorization: Bearer <SECRET>`, NOT `x-proxy-secret`. Bot code must send correct header.

**Wrangler deploy:**
```bash
cd ~/project/proxy
npx wrangler deploy
# Set secret: echo "SECRET" | npx wrangler secret put SECRET
```

## 6. systemd Service (Production Mining Bots)

Better than tmux/nohup for 24/7 bots:

```ini
# /etc/systemd/system/gram-miner.service
[Unit]
Description=Gram Network Miner Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/gram-network-vps
ExecStart=/home/ubuntu/.local/bin/node /home/ubuntu/gram-network-vps/grammine.js loop
Restart=on-failure
RestartSec=30
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable gram-miner
sudo systemctl start gram-miner
sudo journalctl -u gram-miner -f  # live logs
```

## 7. API Inconsistency Handling

**Reality:** Crypto/mining APIs are unreliable. Server may return conflicting states:
- `mining_status: "Inactive"` but claim returns "Mining is not finished yet"
- `mining_status: "Active"` but `time_left_seconds: 0`
- Balance shows 27 in one call, 28.2 in the next

**Pattern:** Defensive coding — try claim in every state, don't rely on status field alone:
```javascript
// Always try claim regardless of status
const claim = await claimMining(acc);
if (claim.success) { /* claimed */ }
else { /* log reason, continue */ }
```

## 8. Loop Interval Design

**Wrong:** Fixed 240-minute interval (mining duration). Bot checks once every 4 hours — misses claim window if timing is off.

**Right:** Short check interval (15 min) + smart waiting inside cycle function:
- Check status every 15 min
- If mining active with time_left > 0: sleep until finish, then claim
- If mining inactive: claim immediately, start new
- Energy depleted: boost and retry

This way bot never misses a claim window.

## 9. Task Auto-Claiming Pattern

Many mining apps have tasks (social media follows, video watches, etc). Two types:
- `type: "others"` — auto-claimable (FB, X, YT interactions)
- `type: "telegram_chat"` — requires manual Telegram channel join

**Pattern:**
```javascript
for (const task of uncompletedTasks) {
  if (task.type === 'telegram_chat') {
    // Notify user with link, skip auto-claim
    continue;
  }
  // Auto-claim others tasks
  await completeTask(acc, task.id);
  await sleep(1500); // rate limit
}
```

**Cron for task checking:** Run every 1-2 hours via `no_agent: true` script. Silent when no new tasks, output only when TG join tasks appear.

## 10. Cron Job Token Optimization

When MIMO/API credits are low, convert LLM-driven cron jobs to script-only:
- `no_agent: true` + `script: "check.sh"` — runs bash script, delivers stdout verbatim
- Empty stdout = silent (no notification to user)
- Non-empty stdout = delivered as message
- No tokens consumed

**When to convert:** Cron returns 402/insufficient balance, or task is simple enough for bash.

## 11. Node.js `-e` Eval Pitfall

**Problem:** `node -e "const x = a ? b : c"` — the ternary `? :` gets corrupted/redacted by the system, producing `***` syntax errors.

**Workarounds:**
1. Write to temp file first: `write_file('/tmp/script.js', code)` then `node /tmp/script.js`
2. Use if/else instead of ternary in inline eval
3. Use existing scripts in the project instead of inline eval

**Rule:** Never use ternary operators in `node -e` one-liners. Write to file or use if/else.

## 13. VPS Migration Backup Pattern

When migrating bots to a new VPS, backup script must include:
- Bot source code + config files
- **systemd service files** (often forgotten!)
- Helper scripts (update-gram-init.sh, etc.)
- Hermes core (.env, config.yaml, skills, memories)

```bash
# Critical: include systemd services
mkdir -p "$BACKUP_DIR/systemd"
sudo cp /etc/systemd/system/*.service "$BACKUP_DIR/systemd/"
sudo chown ubuntu:ubuntu "$BACKUP_DIR/systemd/"*.service
```

**Restore on new VPS:**
```bash
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gram-miner.service
```

**Full backup script:** `~/backup-to-github.sh` — pushes everything to private GitHub repo.

## 14. GitHub Backup Script

Auto-backup cron runs daily at 03:00 WIB. Script at `~/backup-to-github.sh`.

**What's included:**
- `.hermes/` (SOUL.md, .env, config.yaml, memories, cron, skills/*.md)
- `itlg-claim/` (config, tokens, bot scripts, requirements.txt)
- `gram-network-vps/` (grammine.js, do-tasks.js, config/)
- `gram-network-bot/proxy/` (worker.js, wrangler.toml)
- `systemd/` (gram-miner.service, itlg-claim.service)
- Helper scripts (update-gram-init.sh, check-tasks.sh)

**Repo:** `KuntoSadewo/hermes-backup` (private)

## 15. Gram Network Task Types

| Type | Auto-claim? | Action |
|------|-------------|--------|
| `others` | ✅ Yes | Auto-complete via API |
| `telegram_chat` | ❌ No | Notify user with link, manual join required |

**do-tasks.js** handles auto-claiming. Run manually or via cron.

Base URL (via Cloudflare proxy): `https://gram-proxy.sadewo.workers.dev`

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/get_user_data.php` | GET/POST | Status, balance, mining info |
| `/api/start_mining.php` | POST | Start 4h mining cycle |
| `/api/claim_mining.php` | POST | Claim finished mining rewards |
| `/api/claim_daily.php` | POST | Daily login bonus (returns 404) |
| `/api/get_tasks.php` | GET | List available tasks |
| `/api/complete_task.php` | POST | Complete a task (body: task_id) |
| `/api/boost_energy.php` | POST | Boost energy (ad-based) |

**Auth:** All requests need `initData` (from Telegram Mini App, expires ~24h).
**Proxy auth:** `Authorization: Bearer <SECRET>` header (NOT `x-proxy-secret`).

**Known quirks:**
- `total_balance` (string), not `balance`
- `mining_status` (string "Active"/"Inactive"), not `mining_active` (boolean)
- `claim_daily.php` returns 404 — endpoint doesn't exist
- `claim_mining.php` can return "not finished yet" even when `mining_status` is "Inactive" (server bug)
- Balance can show different values between calls (API caching)
