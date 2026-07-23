# Auto-Claim Bot Setup (Telegram Mini App / Web-Based Mining)

Reference untuk setup bot auto-claim dari platform mining berbasis web/Telegram Mini App. Beda dari airdrop on-chain — ini HTTP API-based, bukan smart contract.

## Kapan pakai reference ini

- User minta setup auto-claim untuk platform seperti Interlink Labs (ITLG), Gram Network, atau sejenisnya
- Platform punya API endpoint untuk claim mining, energy boost, task completion
- Bot jalan 24/7 di VPS, bukan on-chain transaction

## Pattern umum

```
┌─────────────────────────────────────┐
│  Config (loginId, passcode, token)  │
│  + face photo (opsional)            │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Auth Flow                          │
│  1. OTP via email IMAP (rentan fail)│
│  2. Face login (lebih reliable)     │
│  3. Token manual (capture dari HP)  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Main Loop                          │
│  - Countdown ke next claim          │
│  - Auto-claim saat waktunya         │
│  - Telegram notif berhasil          │
│  - Auto-restart kalau crash         │
└─────────────────────────────────────┘
```

## Pitfalls & Lessons

### 1. Mining claim timing bug (Gram Network, umum di semua platform)
**Root cause:** API return `mining_status` sebagai STRING ("Active"/"Inactive"), bukan boolean `mining_active`. Kalau bot check `user.mining_active`, nilainya selalu `undefined` → claim block nggak pernah ke-trigger.

**Fix pattern — ALWAYS claim first, smart wait:**
```javascript
const miningStatus = (user.mining_status || '').toLowerCase();
const timeLeftSec = parseInt(user.time_left_seconds) || 0;

if (miningStatus === 'active' && timeLeftSec > 0) {
  // Mining masih jalan — TUNGGU sampai selesai
  const waitSec = timeLeftSec + 30; // +30s buffer
  await sleep(waitSec * 1000);
  const claim = await claimMining(acc);
  // ... handle claim
} else if (miningStatus === 'inactive' || miningStatus === 'completed') {
  // Mining udah selesai tapi belum di-claim
  const claim = await claimMining(acc);
  // ... handle claim
}
// AFTER claim → start mining baru
```

**Pitfall:** Kalau bot cek claim → "not finished yet" → lanjut tanpa nunggu, begitu mining selesai `mining_status` berubah "Inactive" tapi bot nggak claim karena udah lewat. **Selalu parse `time_left_seconds` dan tunggu.**

### 2. Energy depletion auto-boost
Kalau `startMining` return "Not enough energy", coba `POST /api/boost_energy.php`. Kalau berhasil, retry `startMining`. Pattern:
```javascript
const start = await startMining(acc);
if (!start.success && startMsg.includes('energy')) {
  const boost = await boostEnergy(acc);
  if (boost.success) {
    await sleep(2000);
    const retry = await startMining(acc);
  }
}
```

### 3. initData Telegram WebApp expire ~24 jam
- Buka Mini App di `web.telegram.org` → F12 → Network tab → cari request ke API → copy `initData` dari payload
- Simpan di config, update via script `update-gram-init.sh`
- Bot nggak bisa auto-refresh — user harus manual copy tiap hari

### 4. Loop mode: smart interval vs fixed interval
Jangan pakai fixed `intervalMinutes` (misal 240). Pakai short check interval (15 menit) tapi di dalam `runMiningCycle`, kalau mining aktif, bot **tunggu sampai selesai** (sleep `time_left_seconds + 30s`). Ini memastikan claim nggak kelewat.

### 5. MIMO API — pakai `no_agent: true` buat cron hemat token
Cron yang cuma monitoring (cek log, bash script) → set `no_agent: true` + `script`. Nggak pakai token LLM sama sekali. Output stdout dikirim verbatim; kalau stdout kosong = silent (no notif).

### 6. OTP via IMAP sering gagal
- Gmail kadang block OTP dari provider tertentu
- App Password harus dari email yang SAMA dengan yang didaftarkan
- Cek Spam, Promotions, Updates folder — kadang nyasar
- **Solusi**: Face login atau manual token capture lebih reliable

### 7. Face login butuh multipart/form-data
- Banyak API login face pakai multipart, bukan JSON
- Kalau error "Not a multipart request", ganti dari `requests.post(json=...)` ke `requests.post(files=...)`
- Pattern:
```python
files = {
    "loginId": (None, str(cfg["loginId"])),
    "passcode": (None, str(cfg["passcode"])),
    "image": (None, image_key),
    "presignedUrlImage": (None, image_key)
}
r = requests.post(f"{API_BASE}/auth/login", files=files, headers=headers)
```
- Error `FACE_NOT_REGISTER` = user belum KYC face di app

### 8. Config secrets handling
- **Jangan kirim API key/token/passcode di chat**
- Simpan langsung ke file: `chmod 600 config.json`
- Face photo juga chmod 600

### 9. Venv wajib untuk Python deps
- PEP 668 environment (Ubuntu 24.04+) — jangan pakai `pip install` langsung
- Selalu: `python3 -m venv venv && ./venv/bin/pip install requests`

### 10. Background process management
- Pakai `terminal(background=true, notify_on_complete=true)` dari Hermes
- Jangan `nohup` shell wrapper — bikin Hermes kehilangan track
- Cek PID masih hidup sebelum restart

### 11. Telegram notification integration
- Hampir semua bot ini support Telegram notif
- Butuh: bot token + chat ID
- Test kirim pesan dulu sebelum run bot

### 12. Bot update via git pull
- Banyak project sering update (bug fix, API changes)
- Selalu `git pull` sebelum deploy ulang
- Cek `config.json.example` untuk field baru

### 13. systemd service pattern (Python bot + venv)
```ini
[Unit]
Description=Bot Name
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/bot-dir
ExecStart=/home/ubuntu/bot-dir/venv/bin/python bot.py
Restart=always
RestartSec=30
StandardOutput=append:/home/ubuntu/bot-dir/bot.log
StandardError=append:/home/ubuntu/bot-dir/bot.log

[Install]
WantedBy=multi-user.target
```
Pakai path absolut ke `venv/bin/python`, bukan `python3` biasa. `Restart=always` + `RestartSec=30` bikin auto-restart kalau crash.

### 14. Task auto-claim pattern
Banyak platform mining juga punya tasks (follow social, watch video, dll). Buat script `do-tasks.js`/`do_tasks.py` yang:
1. Fetch tasks dari API
2. Filter yang belum completed
3. Skip `telegram_chat` type (perlu manual join)
4. Auto-claim `others` type (social media, dll)
5. Report ke Telegram

### 15. MIMO API — ternary operator `? :` di-redact
Di beberapa context (execute_code, terminal inline), karakter `? :` dari ternary operator bisa di-redact jadi `***`. Workaround: pakai `if/else` block, bukan ternary. Atau tulis ke file dulu baru run.

## Contoh platform yang pakai pattern ini

| Platform | Repo | Auth | Claim interval |
|---|---|---|---|
| Interlink Labs (ITLG) | feb-frmn/itlg-claim | OTP/face | 4 jam |
| Gram Network | mocenk/gram-network-auto-claim | initData (TG WebApp) | 4 jam |

## User preference: "pelajarin/pelajari"
Kalau user bilang "pelajari" atau "pelajarin", mereka mau gw beneran baca kode-nya secara mendalam — bukan cuma README. Cek source code, API endpoints, config structure, error handling, sebelum kasih summary.
