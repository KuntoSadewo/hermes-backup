# Third-Party Claim Bot Setup Guide

When user wants to run a crypto/airdrop auto-claim bot from GitHub (e.g. ITLG, Notcoin, Hamster, etc).

## General Setup Pattern

```bash
# 1. Clone
git clone <repo-url> ~/bot-name
cd ~/bot-name

# 2. Venv (PEP 668 — pip won't work directly on this VPS)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # atau pip install requests

# 3. Config
cp config.json.example config.json
nano config.json  # user fills credentials

# 4. Test run
./venv/bin/python bot.py --once  # single run, test login + claim

# 5. Background run
nohup ./venv/bin/python bot.py > bot.log 2>&1 &
# atau: tmux new -s bot-name → run → detach
```

## Common Pitfalls

### 1. loginId Format
- API biasanya expect angka doang, TANPA prefix `@`
- Kalau error "Login ID not found", coba hapus `@` dari loginId
- Contoh: `@4062025` → `4062025`

### 2. Gmail App Password (IMAP)
- Banyak claim bot pake IMAP buat auto-baca OTP dari email
- Harus pake **App Password** (16 char), BUKAN password Gmail biasa
- Bikin di: https://myaccount.google.com/apppasswords
- Pilih "Other", kasih nama (misal "claim-bot"), copy 16 char
- **Email harus sama** dengan yang dipake daftar di platform
- Test IMAP sebelum run bot:
  ```python
  import imaplib
  m = imaplib.IMAP4_SSL('imap.gmail.com')
  m.login('email@gmail.com', 'xxxx xxxx xxxx xxxx')
  print('OK' if m.state == 'AUTH' else 'FAIL')
  m.logout()
  ```
- Kalau `[AUTHENTICATIONFAILED]`: App Password salah, atau 2FA belum aktif, atau "Less secure apps" block

### 3. Device ID / Fingerprint
- Kebanyakan bot auto-generate deviceId dari hash loginId
- deviceModel/deviceBrand: random dari pool (Samsung, Xiaomi, Pixel, dll)
- Kosongin aja di config, bot yang ngisi otomatis
- Jangan edit manual kecuali user minta match device asli

### 4. Token Persistence
- Bot biasanya simpan token di `token.json` (chmod 600)
- Ada backup: `token-backup.json`
- Kalau token expired, bot auto-refresh pakai refresh token
- Kalau refresh juga mati, perlu re-login (OTP lagi)

### 5. OTP Not Arriving — Debugging Flow
- API bisa bilang `200 "Email has been sent"` tapi email nggak masuk. Ini **bukan** berarti config salah.
- **Cek semua folder Gmail**, bukan cuma INBOX:
  - INBOX, Spam, Promotions, Updates
  - Tiap folder harus di-`m.select(folder)` dulu sebelum `m.search()` — kalau nggak, error `SEARCH illegal in state AUTH`
- **Test API langsung** untuk isolasi masalah (apakah OTP benar terkirim):
  ```python
  import requests
  r = requests.post('https://prod.interlinklabs.ai/api/v1/auth/send-otp-email-verify-login',
      json={'loginId': '...', 'passcode': '...', 'email': '...', 'deviceId': '...'},
      headers={'User-Agent': 'okhttp/4.9.2', 'App-Version': '5.0.0', 'Content-Type': 'application/json'})
  print(r.status_code, r.json())
  ```
- Kalau API return 200 tapi email tetap nggak masuk setelah 60s:
  - Mungkin email provider delay/block
  - Coba request OTP manual dari app HP → cek apakah masuk
  - Kalau manual juga nggak masuk: masalah di Interlink/email provider, bukan bot
- `send-otp` endpoint butuh **passcode di body** (bukan cuma loginId + email). Bot udah handle ini, tapi kalau test manual jangan lupa include.
- `check-passcode` endpoint dulu buat verifikasi loginId + passcode bener, baru `send-otp`.

### 6. Document Upload Format
- Telegram file upload **tidak support** `.json.example`, `.env.example`, dll
- Kalau user kirim `.example`, suruh rename ke `.json` dulu di local, baru upload ulang
- Supported: `.json`, `.yaml`, `.yml`, `.py`, `.sh`, `.txt`, `.md`, `.csv`, `.zip`

## Secrets Handling

- **Jangan kirim credentials di chat** — ke-log, bisa disalahgunakan
- Upload file config.json langsung ke Telegram bot (file upload, bukan paste text)
- Atau SFTP/SCP: `scp config.json user@vps:~/bot-name/`
- Atau SSH + nano langsung di VPS
- Setelah upload: `chmod 600 config.json`

## Background Execution

```bash
# Option 1: tmux (recommended, bisa attach lagi)
tmux new -s bot-name
./venv/bin/python bot.py
# Ctrl+B, D untuk detach
# tmux attach -t bot-name untuk masuk lagi

# Option 2: nohup
nohup ./venv/bin/python bot.py > bot.log 2>&1 &

# Option 3: systemd service (paling robust)
# bikin /etc/systemd/system/bot-name.service
```

## Hermes Cron Alternative

Kalau bot support `--once` mode, bisa dijadwalin lewat Hermes cron:
```bash
hermes cron create --schedule "4h" --prompt "cd ~/bot-name && ./venv/bin/python bot.py --once"
```

Tapi bot yang butuh countdown loop (kayak ITLG) lebih baik jalan terus di tmux.

## Mining Bot Patterns (See Also)

For bots with mining cycles (Gram Network, etc), see `references/mining-bot-patterns.md` — covers:
- API field mismatch debugging (`mining_active` vs `mining_status`)
- Smart claim timing (wait-for-finish + retry)
- Energy/resource depletion with auto-boost
- initData expiry (~24h for Telegram Mini Apps)
- Cloudflare Worker proxy for blocked VPS IPs
- systemd service for production bots

## ITLG-Specific Notes

- Repo: https://github.com/feb-frmn/itlg-claim
- Claim interval: 4 jam
- Login: OTP via Gmail IMAP **atau** Face Login (v2.2+)
- Anti-detection: random device fingerprint, human-like timing (30-120s delay)
- Config fields: loginId, passcode, email, imapPassword, **facePhoto**, deviceId, deviceModel, deviceBrand, tgBotToken, tgChatId
- Telegram notifikasi optional (tgBotToken + tgChatId)
- Config path: `~/itlg-claim/config.json` (chmod 600)

### Versions

- `bot.py` — original (v1.x)
- `bot_v2_2.py` — v2.2: full Indonesia, face login, WIB timezone, group claim, auto-recovery
- `tg_gateway.py` — Telegram gateway: `/status`, `/claim`, `/groupclaim` commands, private bot guard
- Update: `cd ~/itlg-claim && git pull origin main`

### Commands

```bash
./venv/bin/python bot.py                # loop mode (original)
./venv/bin/python bot_v2_2.py           # loop mode (v2.2, recommended)
./venv/bin/python bot_v2_2.py --once    # single run
./venv/bin/python bot_v2_2.py --login   # force OTP re-login
./venv/bin/python bot_v2_2.py --login-face --photo selfie.jpg  # face login
./venv/bin/python bot_v2_2.py --status  # live status check
./venv/bin/python bot_v2_2.py --stop    # stop running bot
./venv/bin/python bot_v2_2.py --restart # restart bot
```

### Face Login (v2.2) — When OTP Fails

OTP from Interlink **may never arrive** (email provider blocks, delays, etc). Face login is the reliable fallback.

**Flow:**
1. Verify passcode (`/auth/check-passcode`)
2. Get presigned S3 URL (`/s3/face/presigned-login`)
3. Upload selfie photo to S3 (PUT request)
4. Login with face (`/auth/login` multipart/form-data)

**Prerequisites:**
- Face must be **registered** in Interlink app first (KYC → Face Verification)
- Error `FACE_NOT_REGISTER` = user belum KYC wajah di app

**CRITICAL BUG FIX — multipart/form-data:**
`bot_v2_2.py`'s `login_with_face()` uses `api_post()` which sends JSON. But `/auth/login` expects **multipart/form-data**. Fix:

```python
def login_with_face_multipart(cfg, image_key):
    """Login using multipart/form-data instead of JSON."""
    h = {
        "User-Agent": "okhttp/4.9.2",
        "App-Version": "5.0.5",
        "x-device-id": cfg["deviceId"],
        "x-date": str(int(time.time() * 1000))
    }
    files = {
        "loginId": (None, str(cfg["loginId"])),
        "passcode": (None, str(cfg["passcode"])),
        "image": (None, image_key),
        "presignedUrlImage": (None, image_key)
    }
    r = requests.post(f"{API_BASE}/auth/login", files=files, headers=h, verify=False, timeout=30)
    return r.json()
```

Without this fix, face login returns `"Not a multipart request"`.

### Telegram File-to-Server Workflow

When user sends a file (config.json, selfie photo, etc.) via Telegram:
1. File saved to `~/.hermes/cache/documents/` or `~/.hermes/image_cache/`
2. Copy to target: `cp ~/.hermes/cache/documents/doc_*_config.json ~/bot-name/config.json`
3. Set permissions: `chmod 600 ~/bot-name/config.json`
4. For images: `cp ~/.hermes/image_cache/img_*.jpg ~/bot-name/selfie.jpg`

**Telegram upload limits:**
- `.json.example` NOT supported — user must rename to `.json` first
- Supported: `.json`, `.yaml`, `.py`, `.sh`, `.txt`, `.md`, `.csv`, `.zip`, `.jpg`, `.png`
