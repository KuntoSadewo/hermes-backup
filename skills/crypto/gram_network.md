# Gram Network Bot — Setup & Troubleshooting

## API Details
- **Website:** `https://gram.network` (landing page, not API)
- **API Base:** `https://app.gramnetwork.online` (actual API server)
- **Content-Type:** `application/x-www-form-urlencoded` (NOT JSON)
- **Endpoints (PHP):**
  | Endpoint | Method | Description |
  |----------|--------|-------------|
  | `/api/get_user_data.php` | GET | User info + balance (query: `?initData=...`) |
  | `/api/get_tasks.php` | GET | Available tasks |
  | `/api/start_mining.php` | POST | Start mining session |
  | `/api/claim_mining.php` | POST | Claim mining rewards |
  | `/api/complete_task.php` | POST | Complete task (body: `task_id`) |
  | `/api/claim_daily.php` | POST | Claim daily reward |
  | `/api/verify_channel.php` | POST | Verify Telegram channel membership |

## VPS Setup (via Cloudflare Worker Proxy) — VERIFIED 2026-07-09

Gram Network API blocks VPS IPs. Solution: Cloudflare Worker proxy.

### Quick Setup
```bash
# 1. Deploy CF Worker proxy (see airdrop-bot-operations → references/cloudflare-worker-proxy.md)
#    Target: https://app.gramnetwork.online
#    Worker URL: https://gram-proxy.<subdomain>.workers.dev

# 2. Clone bot
git clone https://github.com/exgun007/gramnetwork-bot.git ~/gram-network-vps
cd ~/gram-network-vps

# 3. Fix PROXY_SECRET — read from wrangler.toml
python3 -c "
import re
with open('../gram-network-bot/proxy/wrangler.toml') as f:
    secret = re.search(r'SECRET\s*=\s*\"([^\"]+)\"', f.read()).group(1)
with open('grammine.js') as f:
    content = f.read()
content = re.sub(r\"const PROXY_SECRET\s*=\s*'[^']*';\", f\"const PROXY_SECRET='***';\", content)
with open('grammine.js', 'w') as f:
    f.write(content)
"

# 4. Add account
node grammine.js add <name> "<initData>"

# 5. Test
node grammine.js run mine

# 6. Loop mode (background)
# Use terminal(background=true) in Hermes, NOT nohup
node grammine.js loop
```

### Modifikasi grammine.js untuk Proxy
```javascript
// 1. Ganti BASE URL:
const BASE = 'https://gram-proxy.<subdomain>.workers.dev';
const PROXY_SECRET = '<from wrangler.toml>';

// 2. Tambah Authorization header di postForm() dan getJson():
headers: {
  'Authorization': `Bearer ${PROXY_SECRET}`,
  'Origin': 'https://app.gramnetwork.online',  // tetap origin asli
  'Referer': 'https://app.gramnetwork.online/',
}
```
Worker handle JSON→form-urlencoded conversion. Bot tetap kirim JSON, worker yang convert.

## Termux Setup (Android)
```bash
pkg update -y && pkg install -y nodejs git
git clone https://github.com/exgun007/gramnetwork-bot.git ~/gram-network-bot
cd ~/gram-network-bot
node grammine.js
```

## initData Extraction
### Telegram Desktop (Recommended)
1. Buka Telegram Desktop → cari Gram Network bot → Launch Mini App
2. F12 → Network tab → centang "Preserve log"
3. Filter: XHR/Fetch
4. Trigger action (Mine/Claim) → klik request ke `app.gramnetwork.online`
5. Cari `initData` di request headers atau payload
6. Copy full string

### Direct from Mini App
1. Buka Gram Network Mini App di Telegram
2. Klik ⋮ (3 titik) → "Copy initData" atau "Share to clipboard"

## Multi-Account
- Max 2-5 akun dari IP sama
- Lebih dari itu → risk flag/ban
- Pertimbangkan proxy kalau > 5 akun

## Token Expiry
- initData expire ~24 jam
- Refresh: buka Mini App lagi → copy initData baru
- Bot Node.js nggak auto-refresh (harus manual)

## Dynamic Secret Loading (Recommended)

Instead of hardcoding secrets, read from config files at runtime:

```javascript
// grammine.js — read PROXY_SECRET from wrangler.toml
const fs = require('fs');
const wranglerContent = fs.readFileSync('/path/to/proxy/wrangler.toml', 'utf8');
const secretMatch = wranglerContent.match(/SECRET\s*=\s*"([^"]+)"/);
const PROXY_SECRET=*** ? secretMatch[1] : '';

// Reuse ITLG bot token for notifications
const itlgConfig = JSON.parse(fs.readFileSync('/path/to/itlg-claim/config.json', 'utf8'));
const TG_BOT_TOKEN=*** || '';
const TG_CHAT_ID = itlgConfig.tgChatId || '';
```

**Benefits:** Single source of truth, no duplicate secrets, easier rotation. All bots (ITLG + Gram + monitoring) share one Telegram notification channel.

## Pitfalls
- **GitHub clone butuh PAT** kalau 2FA aktif
- **Termux password input** nggak visible (normal)
- **Jangan spam** tanpa delay (rate-limit per IP + akun)
- **Default interval** 4 jam udah aman
- **initData expires** ~24 jam, no auto-refresh
- **`mining_status` vs `mining_active`** — API returns `mining_status` (string "Active") NOT `mining_active` (boolean). If claim never triggers, check this field. See `airdrop-bot-operations` → `references/gram-network-setup.md` for full fix.
- **Cloudflare 403** dari VPS → deploy CF Worker proxy dulu
- **`app.gramnetwork.online`** bukan `gram.network` — yang satu API, yang satu website
- **Content-Type** harus `application/x-www-form-urlencoded`, bukan JSON
- **Search GitHub** untuk API endpoints kalau dokumentasi nggak ada: `curl -sL "https://api.github.com/search/repositories?q=<project>-bot"`
