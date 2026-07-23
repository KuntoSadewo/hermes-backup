# Extracting initData from Telegram Mini Apps

## What is initData?
- Auth token from Telegram WebApp (Mini App)
- Contains: user ID, username, auth_date, hash (signature)
- Format: `user=%7B%22id%22%3A123456789...&auth_date=1234567890&hash=abc123...`
- Used by: Gram Network, and similar Telegram-based airdrop apps

## Methods (ranked by reliability)

### 1. Telegram Desktop (BEST)
1. Open Telegram Desktop
2. Open the Mini App
3. Press **F12** or **Ctrl+Shift+I** (or right-click → Inspect)
4. Go to **Console** tab
5. **WHERE TO PASTE:** Look for `>` at the bottom of the Console. That's the input area. Click there, then type/paste:
   ```javascript
   Telegram.WebApp.initData
   ```
6. Press Enter → copy the result

**Pitfall:** Users often can't find where to paste. The Console tab has TWO areas:
- **Top area:** Log output (errors, messages) — DON'T paste here
- **Bottom area:** Input prompt with `>` — paste HERE
- If no `>` visible, click in the empty space at the bottom of Console

**Pitfall:** If F12 doesn't work, go to Settings → Advanced → enable "Enable web inspector"

### 2. Telegram Web (web.telegram.org)
1. Open https://web.telegram.org
2. Open the Mini App
3. F12 → Console → `Telegram.WebApp.initData`

**Pitfall:** Mini App may be blank/not load in web version. Use Telegram Desktop instead.

### 3. HTTP Catcher (Android/iOS)
1. Install "HTTP Catcher" (iOS) or "Packet Capture" (Android)
2. Start capture
3. Open Telegram → Mini App
4. Stop capture
5. Find request to the app's domain (e.g., `app.gramnetwork.online`)
6. Copy `initData` from request body/headers

### 4. Bot Method (UNRELIABLE)
- Bots like @WebAppDataBot may be dead or unreliable
- Don't depend on this method

## Storage in Config
```json
{
  "accounts": [
    {
      "initData": "PASTE_LONG_STRING_HERE",
      "username": "YourName"
    }
  ]
}
```

**Pitfall:** When user sends config via Telegram file, check for double-quote corruption around initData. Fix:
```python
init_data = raw_init_data.strip('"')
```
