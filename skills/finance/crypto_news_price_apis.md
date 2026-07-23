# Crypto News & Price Data Sources — Working Methods

Proven data-gathering methods as of July 2026. Use this when the user asks for crypto prices, news, or market analysis.

## Price Data (No Auth Required)

### CoinGecko Free API
```bash
curl -s "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false"
```
Returns: current_price, 24h/7d/30d change, high/low, market_cap, ATH, circulating supply.
Rate limit: ~10-30 req/min free tier. No key needed for basic endpoints.

### CoinGecko Trending
```bash
curl -s "https://api.coingecko.com/api/v3/search/trending"
```
Returns: top trending coins by search volume.

### CoinDesk Live Ticker (Browser)
URL: `https://www.coindesk.com/price/bitcoin/`
Headers bar shows: BTC, ETH, SOL, XRP prices with % change.
Scrape via browser_navigate + browser_snapshot when API is down.

## News Gathering

### Method 1: Browser Scraping CoinDesk (Recommended)
```bash
browser_navigate("https://www.coindesk.com/tag/bitcoin/")
browser_snapshot(full=True)
```
Returns: headline, author, time, snippet for each article.
Works reliably. Stealth warning is normal, content still loads.

### Method 2: Browser Scraping Cointelegraph
```bash
browser_navigate("https://cointelegraph.com/tags/bitcoin")
```
Alternative when CoinDesk is slow.

### Method 3: CryptoCompare News API (Requires Key)
```bash
curl -s "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular"
```
Free tier exists but needs API key now. Returns: title, source, body, categories.

### Method 4: X/Twitter Search (When Available)
Requires: xurl CLI or x_auto.py with working cookies.
X API adaptive search returns 404 as of July 2026 — GraphQL search also broken without fresh cookies.
Fallback: browser scrape X search page directly if logged in.

## APIs That Failed (July 2026)

- CryptoCompare free (no key): returns401 "API key required"
- X adaptive search API: 404
- X GraphQL SearchTimeline: 404 without fresh auth
- newsdata.io: needs API key
- CryptoPanic: needs API key
- web_extract with Brave Search backend: not supported
- CoinGecko: works free but rate limited ~10-30 req/min

## Quick Analysis Template

When user asks "harga BTC" or "cek harga crypto":

```bash
# 1. Get price
curl -s "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false" | python3 -c "..."

# 2. Get news (browser)
browser_navigate("https://www.coindesk.com/tag/bitcoin/")

# 3. Combine into summary
# Price + % change + key news headlines + sentiment signal
```

## Cron Job Pattern (BTC Monitor)

Best setup: cron job every 2 hours with `finance-research-trading` skill + `terminal` + `web` toolsets.

Prompt template:
```
You are a BTC market analyst. Gather comprehensive Bitcoin news and price data from MULTIPLE sources.

Steps:
1. Price: CoinGecko API → current price, 24h/7d/30d change, range, ATH, market cap, volume
2. News: web_search with 5 queries (Bitcoin news today, BTC price analysis, Bitcoin ETF, whale movement, crypto regulation)
3. Sentiment: Fear & Greed Index from alternative.me
4. Compile report in Indonesian with: price, news headlines (5-8), whale/ETF info, regulation, signal (BULLISH/BEARISH/MIXED)
```

Key settings:
- `schedule: "every 120m"`
- `skills: ["finance-research-trading"]`
- `enabled_toolsets: ["terminal", "web"]`
- `deliver: "telegram:CHAT_ID"`

## Output Format (User Preference)

Keep it brief. Indonesian. Structure:
```text
Harga: $XX,XXX (+X.XX%)
24h range: $low - $high
News: [2-3 headline terpenting]
Signal: bullish/bearish/mixed + alasan 1 line
```
No lengthy disclaimers unless user asks for detail.
