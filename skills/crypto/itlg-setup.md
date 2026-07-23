# ITLG (Interlink Labs) Claim Bot — Setup Guide

## Repository
- GitHub: `feb-frmn/itlg-claim`
- Latest: v2.2 (bot_v2_2.py) — Full Indonesia, face login, group mining
- Dependencies: `requests` only

## Setup Steps

```bash
# 1. Clone
cd ~ && git clone https://github.com/feb-frmn/itlg-claim.git

# 2. Venv
cd itlg-claim && python3 -m venv venv
source venv/bin/activate && pip install requests

# 3. Config (user provides via Telegram file upload)
# Required: loginId, passcode, email, imapPassword
# Optional: tgBotToken, tgChatId, facePhoto
# Auto-gen: deviceId, deviceModel, deviceBrand

# 4. Login
# Option A: OTP (may fail if email provider blocks)
./venv/bin/python bot_v2_2.py --login

# Option B: Face login (recommended fallback)
./venv/bin/python bot_v2_2.py --login-face --photo selfie.jpg

# 5. Test run
./venv/bin/python bot_v2_2.py --once

# 6. Background run
terminal(command="cd ~/itlg-claim && ./venv/bin/python bot_v2_2.py 2>&1",
         background=true, notify_on_complete=true)
```

## Pitfalls Found

### 1. LoginId Format
- Config has `"loginId": "@4062025"` (with @ prefix)
- API rejects `@4062025` → "Login ID not found"
- **Fix:** Remove `@`, use just `"4062025"`

### 2. Gmail App Password
- Must be 16-char App Password from https://myaccount.google.com/apppasswords
- NOT the regular Gmail password
- **ALWAYS test IMAP before running bot:**
```python
import imaplib
m = imaplib.IMAP4_SSL('imap.gmail.com')
m.login(email, app_password)  # Should succeed
# If "[AUTHENTICATIONFAILED] Invalid credentials" → app password wrong
```

### 3. OTP Email Not Arriving
- Common issue: Interlink OTP emails blocked/delayed by Gmail
- API returns "Email has been sent" but email never arrives
- Search all folders: INBOX, Spam, Promotions, Updates
- **Solution:** Use face login instead

### 4. Face Login — Multipart Fix
- Bot v2.2 `login_with_face()` sends JSON → API returns "Not a multipart request"
- **Fix:** Use `requests.post(url, files=...)` for multipart/form-data:
```python
files = {
    "loginId": (None, str(cfg["loginId"])),
    "passcode": (None, str(cfg["passcode"])),
    "image": (None, image_key),
    "presignedUrlImage": (None, image_key)
}
r = requests.post(f"{API_BASE}/auth/login", files=files, headers=h, verify=False)
```

### 5. Face Login — FACE_NOT_REGISTER
- Error: `FACE_NOT_REGISTER` means face not KYC'd in app
- **Fix:** User must do face verification in Interlink mobile app first
- Only then can bot use face login

### 6. Login Flow (v2.2)
```
POST /auth/check-passcode?v=2 → verify passcode, get email
POST /s3/face/presigned-login → get presigned S3 URL + image key
PUT photo to S3 presigned URL → upload selfie
POST /auth/login (multipart) → get JWT access + refresh tokens
```

### 7. API Endpoints
```
Base: https://prod.interlinklabs.ai/api/v1
App Version: 5.0.5 (v2.2) / 5.0.0 (v1.x)
Auth endpoints:
  /auth/loginId-exist-check/{id}
  /auth/check-passcode?v=2
  /auth/send-otp-email-verify-login
  /auth/check-otp-email-verify-login?v=2
  /auth/login (multipart, face)
  /s3/face/presigned-login
Claim endpoints:
  /token/check-is-claimable
  /token/claim-airdrop
  /token/get-random-ads-mining-new
  /auth/current-user-full?include=userInfo,token,isClaimable
```

## v2.2 Features
- Full Bahasa Indonesia UI
- Mining claim tiap 4 jam
- Group mining claim tiap 24 jam (kalau aktif)
- Face login (alternative to OTP)
- Telegram gateway (tg_gateway.py) — bot commands via DM
- Auto-restart on crash
- Anti-detection: random device fingerprint, human-like timing
- Token auto-refresh
- Claim history tracking (claim_state.json)

## Commands
```bash
python bot_v2_2.py              # loop mode (countdown + auto-claim)
python bot_v2_2.py --once       # single run, claim if available, exit
python bot_v2_2.py --login      # OTP login
python bot_v2_2.py --login-face --photo selfie.jpg  # face login
python bot_v2_2.py --status     # check live status from API
python bot_v2_2.py --stop       # stop running bot
python bot_v2_2.py --restart    # stop + start
```

## Updating Bot
```bash
cd ~/itlg-claim
pkill -f "bot_v2_2.py"          # kill running bot first
git stash                        # save local changes
git pull origin main             # pull latest
# config.json and token.json are preserved (in .gitignore)
# Re-start bot after update
```
**Pitfall:** Always `git stash` before `git pull` if you have local changes. Config files are gitignored so they won't be overwritten.

## Group Mining
- Bot supports **multiple groups** — iterates all groups, claims from first claimable
- Claim says "claims ALL groups at once" — one claim covers all groups
- Group mining = 24-hour cycle (separate from 4-hour solo mining)
- Groups must be created/joined in the **Interlink mobile app** (not bot)
- Each group needs **minimum 3 active members** (KYC-verified + claimed at least once)
- Bot auto-detects group rate from API — no code changes needed when adding groups
- **Strategy:** Create multiple small groups (3-5 members) rather than one large group
