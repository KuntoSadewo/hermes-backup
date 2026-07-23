# 🚀 Cloudflare Worker Proxy untuk Gram Network

## Kenapa?
VPS kena Cloudflare 403 block. Cloudflare Worker jadi "perantara" — request dari Worker (IP Cloudflare) tidak diblokir.

## Arsitektur
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  VPS/Termux  │────▶│ Cloudflare Worker │────▶│ Gram Network API│
│   (Bot lu)   │◀────│  (Proxy)         │◀────│  (Blocked)      │
└─────────────┘     └──────────────────┘     └─────────────────┘
     Banned IP           Cloudflare IP           Allow Cloudflare
```

## Setup (5 Menit)

### Step 1: Buat Cloudflare Worker
1. Buka https://dash.cloudflare.com
2. Login / Buat akun (gratis)
3. Klik **Workers & Pages** di sidebar
4. Klik **Create Application** → **Create Worker**
5. Kasih nama: `gram-proxy`
6. Copy isi `worker.js` ke editor
7. Klik **Save and Deploy**

### Step 2: Set Environment Variable
1. Di Worker lu, klik **Settings** → **Variables**
2. Tambah **Environment Variable**:
   - Name: `SECRET`
   - Value: `gram-proxy-rahasia-123` (ganti dengan random string)
3. Klik **Save**

### Step 3: Copy Worker URL
Setelah deploy, lu dapat URL kayak:
```
https://gram-proxy.<username>.workers.dev
```
Copy URL ini!

### Step 4: Update Config Bot
Edit `config.json` di Termux:
```json
{
  "proxy_url": "https://gram-proxy.<username>.workers.dev",
  "proxy_secret": "gram-proxy-rahasia-123"
}
```

### Step 5: Test Proxy
```bash
# Di Termux
cd ~/gram-network-bot

# Test koneksi
python3 -c "
from proxy_client import GramProxyClient
client = GramProxyClient('https://gram-proxy.<username>.workers.dev', 'gram-proxy-rahasia-123')
print(client.get_balance('test_init_data'))
"
```

## Integrasi dengan Bot

### Method 1: Edit grammine.js (Recommended)
Ganti semua URL API:
```javascript
// Sebelum
const API_BASE = "https://api.gram.network";

// Sesudah
const API_BASE = "https://gram-proxy.<username>.workers.dev";
```

Dan tambah header Authorization di setiap request:
```javascript
headers: {
  "Authorization": "Bearer gram-proxy-rahasia-123",
  "Content-Type": "application/json"
}
```

### Method 2: Python Wrapper (Kalau pakai Python)
```python
from proxy_client import GramProxyClient

# Init client
client = GramProxyClient(
    proxy_url="https://gram-proxy.<username>.workers.dev",
    secret="gram-proxy-rahasia-123"
)

# Pakai kayak biasa
balance = client.get_balance(init_data)
mining = client.start_mining(init_data)
claim = client.claim_mining(init_data)
```

## Limitasi Cloudflare Worker (Free Tier)
- ✅ 100,000 request/hari (lebih dari cukup)
- ✅ 10ms CPU time/request
- ✅ Unlimited Workers
- ❌ Tidak bisa WebSocket (kalau Gram pakai WS)

## Troubleshooting

### "Unauthorized" Error
- Cek SECRET di Worker matches dengan yang di config bot

### "Proxy Error" / 502
- Cek Worker logs di Cloudflare Dashboard
- Mungkin Gram Network API down

### Masih 403 dari VPS
- Pastikan pakai Worker URL, bukan URL asli Gram
- Cek Authorization header terkirim

## Keamanan
- SECRET harus random & rahasia
- Jangan share Worker URL publik
- Worker hanya proxy, tidak simpan data

## Monitoring
Cek Worker analytics di:
```
https://dash.cloudflare.com → Workers & Pages → gram-proxy → Analytics
```
