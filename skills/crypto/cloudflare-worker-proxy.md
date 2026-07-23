# Cloudflare Worker Reverse Proxy — Bypass IP-Based Blocks

## When to Use
- Bot API behind Cloudflare WAF returns 403 from VPS/datacenter IPs
- Service blocks non-residential IPs
- Need to proxy requests through Cloudflare's IP range (trusted by most CF-protected sites)

## Architecture
```
VPS Bot → Cloudflare Worker → Target API
         (CF IP, trusted)    (allows CF IPs)
```

## Setup Steps

### 1. Install Wrangler
```bash
npm install -g wrangler
wrangler --version  # need 4.x+
```

### 2. Create Worker Project
```bash
mkdir ~/proxy-worker && cd ~/proxy-worker
```

### 3. Create worker.js
```javascript
const TARGET_BASE = "https://target-api.example.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Auth — require bearer token
    const authHeader = request.headers.get("Authorization");
    const expectedAuth = `Bearer ${env.SECRET || "change-me"}`;
    if (authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUrl = `${TARGET_BASE}${url.pathname}${url.search}`;
    const headers = new Headers();
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");
    headers.set("Origin", TARGET_BASE);
    headers.set("Referer", TARGET_BASE + "/");

    let body = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      // IMPORTANT: Read body ONCE with text(), then parse if needed.
      // Reading twice (e.g., request.json() then request.text()) throws "Body has already been used".
      const rawBody = await request.text();
      const contentType = request.headers.get("Content-Type") || "";
      if (contentType.includes("json")) {
        // Convert JSON → form-urlencoded if target expects it
        try {
          const jsonBody = JSON.parse(rawBody);
          body = new URLSearchParams(jsonBody).toString();
          headers.set("Content-Type", "application/x-www-form-urlencoded");
          // Do NOT set Content-Length — CF Workers handle it automatically.
          // Buffer.byteLength() is NOT available in Workers runtime.
        } catch {
          body = rawBody;
          headers.set("Content-Type", contentType);
        }
      } else {
        body = rawBody;
        headers.set("Content-Type", contentType || "application/x-www-form-urlencoded");
      }
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
      });
      const responseHeaders = new Headers(response.headers);
      for (const [k, v] of Object.entries(corsHeaders)) responseHeaders.set(k, v);
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
```

### 4. Create wrangler.toml
```toml
name = "my-proxy"
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
SECRET = "random-secret-string-here"
```

### 5. Deploy
```bash
# First time: need workers.dev subdomain
# Open https://dash.cloudflare.com/<account_id>/workers/onboarding in browser
# Register subdomain (e.g., "sadewo")
# ⚠️ MUST be done in browser — API returns "Method not allowed" for subdomain registration

# Then deploy
cd ~/proxy-worker
# Store token in .env: CLOUDFLARE_API_TOKEN=cf_xxxxx
# Deploy script (deploy.sh):
#!/bin/bash
cd ~/proxy-worker
source .env
export CLOUDFLARE_API_TOKEN
wrangler deploy
```

**Deploy script pattern** (for automation/cron):
```bash
#!/bin/bash
cd ~/proxy-worker
source .env
export CLOUDFLARE_API_TOKEN
wrangler deploy
```
**Pitfall:** Don't use `$(cat .env | cut -d= -f2)` inline — bash quoting breaks with special chars. Use `source .env` instead.

### 6. Test
```bash
# Via Python (most reliable for testing):
python3 -c "
import requests, re
with open('wrangler.toml') as f:
    secret = re.search(r'SECRET\s*=\s*\"([^\"]+)\"', f.read()).group(1)
r = requests.get('https://my-proxy.workers.dev/api/endpoint',
    headers={'Authorization': 'Bearer ' + secret})
print(r.status_code, r.text[:200])
"
```

## Pitfalls

### Workers.dev Subdomain Not Registered
```
ERROR: You need to register a workers.dev subdomain before publishing
```
**Fix:** Open `https://dash.cloudflare.com/<account_id>/workers/onboarding` in browser, register subdomain. Can't be done via API (returns "Method not allowed"). Interactive `wrangler deploy` would prompt, but non-interactive falls back to error.
**Wrangler subdomain command doesn't exist** in v4.x — must use browser.

### "Body has already been used" Error
**Cause:** Reading request body twice (e.g., `request.json()` then `request.text()`).
**Fix:** Read body ONCE with `request.text()`, then parse if needed. See worker.js above.

### SSL Handshake Failed (525) to Target
**Cause:** Target API uses incompatible SSL config, or Worker IP still blocked.
**Fix:** Check if target actually works. Try different base URLs (e.g., `app.example.com` vs `api.example.com`). Some APIs use different subdomains than the main site.

### API Endpoints Return HTML Instead of JSON
**Cause:** Wrong base URL — hitting website instead of API.
**Fix:** Find actual API base by checking open-source bot repos on GitHub:
```bash
# Search GitHub for bots targeting the same API
curl -sL "https://api.github.com/search/repositories?q=<project>-bot" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(i['full_name']) for i in d.get('items',[])]"
# Then read their source for BASE URL and endpoint paths
curl -sL "https://raw.githubusercontent.com/<user>/<repo>/main/<script>" | grep -E "(BASE|endpoint|api|\.php)"
```
**Verified pattern:** Gram Network — `gram.network` is the website, `app.gramnetwork.online` is the API. Only discoverable by reading bot source code.

### JSON vs form-urlencoded
Many Telegram Mini App APIs expect `application/x-www-form-urlencoded`, NOT JSON.
**Fix:** Worker should convert incoming JSON to URLSearchParams. See worker.js pattern above.

### Buffer.byteLength Not Available in Workers
**Cause:** Cloudflare Workers runtime doesn't have Node.js `Buffer` API.
**Fix:** Don't set `Content-Length` header manually — Workers handle it automatically. Remove any `Buffer.byteLength(body)` calls.

### Free Tier Limits
- 100,000 requests/day (more than enough for bots)
- 10ms CPU time/request
- Unlimited Workers

## Dynamic Secret Loading (Recommended Pattern)

Instead of hardcoding secrets in bot code, read from config files at runtime:

```javascript
// Node.js: read from wrangler.toml
const fs = require('fs');
const wranglerContent = fs.readFileSync('/path/to/proxy/wrangler.toml', 'utf8');
const secretMatch = wranglerContent.match(/SECRET\s*=\s*"([^"]+)"/);
const PROXY_SECRET=*** ? secretMatch[1] : '';

// Reuse existing Telegram config for notifications
const itlgConfig = JSON.parse(fs.readFileSync('/path/to/itlg-claim/config.json', 'utf8'));
const TG_BOT_TOKEN=itlgCo...oken || '';
const TG_CHAT_ID = itlgConfig.tgChatId || '';
```

**Benefits:**
- Single source of truth for secrets
- No duplicate config files to maintain
- Easier secret rotation (update one file, all services pick it up)
- Secrets never appear in source code or chat logs

**Pattern for shared Telegram notifications:**
All bots (ITLG, Gram, monitoring) can share one Telegram bot token + chat ID. Load from the central config (e.g., ITLG's config.json) and send notifications from any service to the same conversation.

## Security
- Always require `Authorization: Bearer <SECRET>` header
- SECRET stored in wrangler.toml `[vars]` (visible in dashboard, not in code)
- Never expose Worker URL publicly
- Rotate SECRET if compromised: update wrangler.toml → `wrangler deploy`

## Cloudflare API Token Setup
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create Token → "Edit Cloudflare Workers" template
3. Permissions: Account → Workers Scripts → Edit
4. Copy token → save to `.env` (chmod 600)

## Worker Logs & Monitoring
Dashboard: https://dash.cloudflare.com → Workers & Pages → my-proxy → Logs
Real-time: `wrangler tail` (streams logs to terminal)
