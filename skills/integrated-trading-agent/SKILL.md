---
name: integrated-trading-agent
description: "Unified stack: finance research + crypto execution + browser/dApp automation + X actions + Jupiter bot. Use for crypto trading plans, news-driven watchlists, DEX swaps, airdrop workflows, browser wallet ops, and governed automation."
---

# Integrated Trading Agent

## Stack

- `finance-research` → riset/news/sentiment/backtest/screening/risk.
- `hermes-crypto-agent` → on-chain safety: simulate, decode, governor, confirm, tx report.
- `browser-agent` → browser/dApp automation, extension/popup control, WalletConnect, governed signing.
- `camofox-browser` → localhost:9377, stealth Firefox fork for Cloudflare bypass. Use when Browserbase gets blocked or for cost-sensitive scraping. API: POST /tabs, GET /tabs/:id/snapshot, POST /tabs/:id/click. Systemd: camofox.service.
- `/home/ubuntu/x-actions` → X controlled actions/task support via cookies. No spam. Note: xurl CLI not installed; X search API returns 404 as of Jul 2026; use browser scraping as fallback.
- `/home/ubuntu/jupiter-bot` → Solana Jupiter swap bot. Default `DRY_RUN=true`.
- TON DEX (STON.fi, DeDust) → manual wallet interaction only, no bot yet. See `references/ton-and-whitelist-quest-ops.md`.

## Default workflow trading

1. Cari news/narasi publik/X.
2. Cek volume/liquidity/price action.
3. Score setup:
   - bullish catalyst
   - volume naik
   - breakout/retest
   - liquidity sehat
   - risk rendah
4. Buat trade plan: pair, entry, SL, TP, size, max loss/day.
5. Dry-run quote.
6. Governor + konfirmasi user.
7. Live swap/trade.
8. Log hasil.

## Decision score

```text
NEWS: +2 bullish catalyst, +1 narrative, -1 FUD, -2 hack/regulatory
VOLUME: +2 >2x avg, +1 >1.3x avg, -1 turun, -2 liquidity drop
PRICE: +2 breakout close kuat, +1 retest sukses, -1 fail breakout, -2 breakdown
RISK: -2 honeypot/low liq/unlock, -1 holder concentration

score >=4 → entry plan
score 2-3 → watch only
score 0-1 → skip
score <0 → exit/risk-off
```

## Safety rails

- No seed/private key in chat.
- Burner wallet first.
- `DRY_RUN=true` before live.
- Tx/sign/broadcast → simulate/decode/governor/confirm.
- Public actions (X post/quote/retweet/follow) → confirm.
- No spam/bypass abuse.
- `halt` kills tx automation.

## User-facing setup style

For credentials, wallet funding, `.env`, or tool setup: use very plain Indonesian, concrete file paths, numbered steps, no jargon-first explanation. If user says “ga paham” or similar, restate as: `isi wallet → cek saldo → simulasi → confirm → live`, or equivalent class-specific flow.

## Useful paths

```bash
~/.hermes/skills/finance-research-trading
~/.hermes/skills/crypto/hermes-crypto-agent
~/.hermes/skills/browser-agent
~/camofox-browser (stealth browser, port9377)
/home/ubuntu/x-actions
/home/ubuntu/jupiter-bot
/home/ubuntu/browser-agent-venv/bin/python
```

## Third-Party Claim Bots

When user wants to run a crypto/airdrop auto-claim bot from GitHub (ITLG, Notcoin, Hamster, etc), follow the guide in `references/third-party-claim-bot-setup.md`. Key points:
- Always use venv (PEP 668 on this VPS)
- Test IMAP connection before running OTP login
- loginId: number only, no `@` prefix
- Secrets via file upload or SFTP, never chat
- **OTP debugging:** API can return 200 but email never arrives — check ALL Gmail folders (INBOX, Spam, Promotions, Updates). Each folder needs `m.select(folder)` before `m.search()`. Test API manually to isolate.
- **Face login (ITLG v2.2+):** When OTP fails, use `--login-face --photo selfie.jpg`. CRITICAL: `login_with_face()` needs multipart/form-data fix (not JSON). Face must be KYC-registered in app first.
- **Telegram file upload:** user sends file → `~/.hermes/cache/documents/` or `~/.hermes/image_cache/` → copy to target path. `.json.example` not supported — rename to `.json` first.
- **User says "pelajarin":** wants thorough investigation before action — read source code, test API manually, trace full flow. Don't just skim README.

## Cron Job Patterns for Crypto Bots

When setting up monitoring/claim cron jobs:
1. **Simple watchdog** (balance change, status check) → `no_agent: true` + bash script. Silent when nothing to report.
2. **Task checker** (new tasks, TG join notif) → `no_agent: true` + script. Output only when action needed.
3. **Analysis/report** (market news, trade analysis) → LLM-driven with `enabled_toolsets: ["terminal", "web"]`.

**Token saving:** If MIMO/API returns 402, convert LLM cron → script-only immediately.

**Silent pattern (watchdog):** Script outputs nothing when OK, only prints when alert needed. Empty stdout = no notification to user.

```bash
# Good: silent when OK
if [ "$BALANCE" = "$LAST" ]; then
  exit 0  # no output = silent
fi
echo "Balance changed: $LAST → $BALANCE"
```

**Full patterns:** See `references/mining-bot-patterns.md` sections 10, 13-15.

## References

- `references/x-actions-mobile-cookie-setup.md` — X cookie setup via mobile/browser, hidden `.env` pitfall, safe secret check.
- `references/ton-and-whitelist-quest-ops.md` — TON wrapped-BTC/auto-swap boundaries plus X whitelist quest verification and local-only save pitfalls.
- `references/third-party-claim-bot-setup.md` — Claim bot setup pattern, IMAP/OTP pitfalls, secrets handling, background execution.
- `references/mining-bot-patterns.md` — Mining bot patterns: API field mismatch, smart claim timing, energy boost, initData expiry, Cloudflare proxy, systemd service, task auto-claim, cron optimization, Gram Network API reference.

## Auto-Trade BTC Decision Framework

When user asks to auto-trade BTC, follow this decision tree:

```text
1. Tentuin strategi:
   A. DCA (Dollar Cost Average)  → beli berkala, konservatif
   B. Grid Trading               → buy/sell range harga, profit dari volatilitas
   C. Momentum/Swing             → buy breakout, sell resistance
   D. Scalping (MEXC Futures)    → high frequency, leverage

2. Pilih platform:
   1. Jupiter (Solana)   → wrapped BTC, pakai burner wallet
   2. 1inch (EVM)        → WBTC/tBTC di ETH/Base/Arb
   3. MEXC Futures       → BTC/USDT perpetual (butuh API key)
   4. Binance API        → Spot BTC/USDT

3. Risk level:
   Konservatif → small size, no leverage
   Moderate    → medium size, low leverage (max 3x)
   Agresif     → big size, high leverage (max 10x)
```

**Default recommendation:** DCA di Jupiter (Solana), budget sesuai user, tiap 6 jam beli $10-50 worth BTC.

**BTC price monitoring:** Set up cron job via hermes. Example: `hermes cron create --schedule "2h" --prompt "cek harga BTC, kirim alert kalau ±3%"`.

## Auto-Trade Pattern: DCA

```text
Trigger: setiap X jam
Action: beli $Y worth of BTC
Platform: Jupiter (Solana) atau 1inch (EVM)
Wallet: burner wallet
Alert: kirim status ke Telegram
```

## Auto-Trade Pattern: Price Alert + Trigger

```text
Monitor: harga BTC via CoinGecko API
Condition: harga turun >X% dari baseline
Action: auto-buy atau alert user
Condition: harga naik >Y% dari entry
Action: auto-sell atau alert user
```

## 9Router Integration (Token Saving)

When user hits token limits or wants to save costs, recommend 9Router:
```bash
npm install -g 9router
9router   # starts on localhost:20128
```
See `model-routing-failover` skill for full setup.

## BTC News Sources (Verified Working)

```text
CoinGecko API         → https://api.coingecko.com/api/v3/coins/bitcoin (free, no key)
Fear & Greed Index    → https://api.alternative.me/fng/ (free, no key)
CoinDesk browser      → https://www.coindesk.com/tag/bitcoin/ (browser scraping, reliable)
CryptoCompare         → needs API key (July 2026)
Web search fallback   → Brave Search (may return 422)
```

## Trigger examples

- "cari news crypto buat trading"
- "buat watchlist dari X + volume"
- "cek setup SOL/USDC"
- "dry-run swap Jupiter"
- "trade live kecil"
- "kerjain task airdrop ini"
- "buka dApp dan connect wallet"
- "auto trade BTC"
- "rencana autotrade bitcoin"
- "DCA BTC"
- "setting auto buy BTC"
- "pelajari BTX blockchain" → see `references/btx-blockchain-research.md`
