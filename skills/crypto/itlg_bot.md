# ITLG Bot v2.2 — Setup & Troubleshooting

## Lokasi & Stack
- **Path:** `~/itlg-claim/`
- **Python:** venv at `~/itlg-claim/venv/`
- **Bot:** `bot_v2_2.py` (v2.2, full Indonesia)
- **Gateway:** `tg_gateway.py` (Telegram command interface)

## Config
```json
{
  "loginId": "4062025",        // Nomor ID (tanpa @)
  "passcode": "021021",        // 6 digit
  "email": "...@gmail.com",
  "imapPassword": "xxxx xxxx xxxx xxxx",  // Gmail App Password
  "facePhoto": "/home/ubuntu/itlg-claim/selfie.jpg",
  "deviceId": "",              // auto-generated
  "deviceModel": "",           // auto-random
  "deviceBrand": "",           // auto-random
  "tgBotToken": "...",         // Telegram notif
  "tgChatId": "480316338"
}
```

## Login Methods

### Face Login (Recommended, tanpa OTP)
```bash
./venv/bin/python bot_v2_2.py --login-face --photo selfie.jpg
```
1. Verifikasi passcode
2. Get presigned URL (`/s3/face/presigned-login`)
3. Upload foto ke S3
4. Login multipart (`/auth/login`)

**Critical:** `/auth/login` MINTA multipart/form-data, BUKAN JSON!
- Bot v2.2 default pakai `api_post()` → JSON → gagal "Not a multipart request"
- Fix: pakai `requests.post(files=...)` buat multipart
- Lihat script fix di session history

**Face Registration:** Wajah harus udah di-register di Interlink app (KYC).Error `FACE_NOT_REGISTER` = belum KYC.

### OTP Login
```bash
./venv/bin/python bot_v2_2.py --login
```
1. Cek passcode → ambil email
2. Kirim OTP ke email (`/auth/send-otp-email-verify-login`)
3. IMAP auto-baca OTP dari inbox
4. Verifikasi OTP

**Pitfalls OTP:**
- Gmail App Password salah → IMAP auth fail
- OTP delayed 1-3 menit (Interlink lambat)
- Kadang masuk Spam/Promotions, bukan Primary
- 3x gagal = tunggu, coba lagi

## Run Modes
```bash
./venv/bin/python bot_v2_2.py           # loop (mining 4h + group 24h)
./venv/bin/python bot_v2_2.py --once     # test sekali, exit
./venv/bin/python bot_v2_2.py --status   # cek status live
./venv/bin/python bot_v2_2.py --stop     # stop bot
./venv/bin/python bot_v2_2.py --restart  # restart
```

## Background Run
```bash
cd ~/itlg-claim && ./venv/bin/python bot_v2_2.py > bot.log 2>&1 &
# PID disimpan di .bot.pid
```

## Telegram Notifications
- Otomatis kalau tgBotToken + tgChatId di config
- Format: claim amount, balance, rate, streak, group
- Notif masuk ke Telegram chat

## Token Management
- `token.json` → main token
- `token-backup.json` → backup copy
- Auto-refresh kalau expired
- Face login fallback kalau refresh gagal

## Files
```
~/itlg-claim/
├── bot_v2_2.py          # Main bot (v2.2)
├── bot.py               # Old version
├── tg_gateway.py        # Telegram gateway
├── config.json          # Config (chmod 600)
├── token.json           # JWT token
├── selfie.jpg           # Face photo
├── claim_state.json     # Claim history
├── bot.log              # Runtime log
└── .bot.pid             # PID file
```

## Pitfalls
- loginId: tanpa @ (bukan "@4062025", tapi "4062025")
- Config upload: kirim file .json via Telegram (bukan .example)
- Face login: API butuh multipart, bukan JSON
- OTP: Gmail App Password 16 char, bukan password Gmail
- IMAP: `imap.gmail.com`, port 993 (SSL)
- Group mining: "pending aktivasi" kalau belum punya referral
- `chmod 600` config.json dan token.json
