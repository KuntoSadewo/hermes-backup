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

## Prerequisites
1. **Telegram API credentials** from https://my.telegram.org/apps
   - `api_id` (integer)
   - `api_hash` (string)
   - User's phone number
2. **telethon** Python package: `pip install telethon` or `uv pip install telethon`

## Critical: Non-Interactive OTP Flow
Hermes terminal cannot handle interactive `input()` calls — even with `pty=True` on async code. Use the two-step flow:

### Step 1: Request OTP (saves phone_code_hash to file)
```python
from telethon import TelegramClient
client = TelegramClient(session_path, api_id, api_hash)
await client.connect()
sent = await client.send_code_request(phone)
# Save sent.phone_code_hash to file for step 2
```

### Step 2: Verify OTP with saved hash
```python
# Read phone_code_hash from file
await client.sign_in(phone=phone, code=otp_code, phone_code_hash=hash_from_file)
me = await client.get_me()  # Confirms session is valid
await client.disconnect()
```

**Pitfall:** `client.start(phone=phone, code_callback=lambda: code)` does NOT work — the callback fires but the internal flow still fails with `PhoneCodeHash` error. Always use the explicit two-step `send_code_request` → `sign_in` flow.

**Pitfall:** OTP expires fast (~2-3 minutes). Request code right before user provides it.

**Pitfall:** `client.start(phone=phone, code=code)` raises `TypeError: got an unexpected keyword argument 'code'` in telethon 1.44+. The `code` parameter was removed; use `code_callback` or explicit two-step flow.

**Pitfall:** Background processes in Hermes don't show output (buffering issue). `PYTHONUNBUFFERED=1` and `script -qc` don't fix it. Use foreground terminal with generous timeout for OTP scripts.

## Config File Template
```json
// config/telegram_session.json (chmod 600!)
{
  "api_id": 12345678,
  "api_hash": "abcdef1234567890abcdef1234567890",
  "phone": "+628xxxxxxxxxx"
}
```

## Safe Join Rate Limits
- **30-60 seconds** random delay between channel joins
- `FloodWaitError` — telethon raises this when Telegram rate-limits; catch it, wait `e.seconds + 10`, then retry
- `UserAlreadyParticipantError` — safe to ignore, already joined
- Max ~50 joins per session before risking longer bans

## Script Usage Pattern
```bash
# Step 1: Request OTP (one-time)
python3 tg-autojoin.py --request-code

# Step 2: Verify OTP (one-time, creates persistent session)
python3 tg-autojoin.py --verify 12345

# Step 3: Auto-join + claim (reusable)
python3 tg-autojoin.py --from-tasks   # join channels from Gram tasks, then claim
python3 tg-autojoin.py --join          # join default channel list
```

## Session File Security
- Session file (`tg_session.session`) = full account access. Treat like a password.
- `chmod 600` on session file and config
- Never commit to git
- If compromised: terminate all sessions via Telegram Settings → Devices

## Integration with Gram Network Tasks
The script queries Gram Network API for pending `telegram_chat` tasks, extracts channel usernames from task links (`t.me/USERNAME`), joins them with safe delays, waits 30s, then calls `complete_task.php` for each.

```python
# Filter telegram_chat tasks
tg_tasks = [t for t in tasks if t['type'] == 'telegram_chat' and not t['is_completed']]

# Extract channel usernames
for t in tg_tasks:
    username = t['link'].split('t.me/')[-1].split('?')[0]

# After joining, claim each task
for task in tg_tasks:
    result = await post('/api/complete_task.php', {'task_id': task['task_id']})
```

## Known Issues (2026-07-09)
- OTP login FAILED from VPS after 8+ attempts
- Codes expired/invalid even with <5s roundtrip time
- Telegram appears to rate-limit or block auth from datacenter IPs
- May work from residential IP or Termux (Android) — untested

## Tested With
- telethon 1.44.0, Python 3.11.15, Ubuntu 24.04
- **FAILED** from VPS — code correct, OTP delivery blocked
