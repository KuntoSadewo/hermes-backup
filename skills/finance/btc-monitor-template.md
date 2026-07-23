# BTC Comprehensive Monitor — Cron Job Template

Enhanced BTC monitoring pattern that gathers data from multiple sources.

## Sources Used
1. **CoinGecko API** — price, market cap, volume, ATH, 24h/7d/30d change
2. **Web Search** — 5 targeted queries for diverse news coverage:
   - "Bitcoin news today" — general headlines
   - "BTC price analysis" — technical/market analysis
   - "Bitcoin ETF inflows outflows" — institutional flow
   - "Bitcoin whale movement" — large holder activity
   - "crypto regulation news" — regulatory developments
3. **Alternative.me API** — Fear & Greed Index
4. **finance-research-trading skill** — structured analysis framework

## Cron Job Prompt Template

```
You are a BTC market analyst. Gather comprehensive Bitcoin news and price data from MULTIPLE sources. Report in Indonesian (Bahasa Indonesia).

## Step 1: Price Data
Run this in terminal:
curl -s "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false" | python3 -c "
import json,sys
d=json.load(sys.stdin)
m=d.get('market_data',{})
print(f\"Harga: \${m.get('current_price',{}).get('usd'):,.0f}\")
print(f\"24h: {m.get('price_change_percentage_24h',0):+.2f}%\")
print(f\"7d: {m.get('price_change_percentage_7d',0):+.2f}%\")
print(f\"30d: {m.get('price_change_percentage_30d',0):+.2f}%\")
print(f\"24h Range: \${m.get('low_24h',{}).get('usd'):,.0f} - \${m.get('high_24h',{}).get('usd'):,.0f}\")
print(f\"ATH: \${m.get('ath',{}).get('usd'):,.0f} ({m.get('ath_change_percentage',{}).get('usd',0):+.1f}%)\")
print(f\"Market Cap: \${m.get('market_cap',{}).get('usd',0)/1e9:.1f}B\")
print(f\"Vol 24h: \${m.get('total_volume',{}).get('usd',0)/1e9:.1f}B\")
"

## Step 2: News from Multiple Sources
Search the web for latest BTC news using these queries:
- "Bitcoin news today"
- "BTC price analysis"
- "Bitcoin ETF inflows outflows"
- "Bitcoin whale movement"
- "crypto regulation news"

Use web_search for each query (limit=3 per query).

## Step 3: Market Sentiment
Check Fear & Greed Index:
curl -s "https://api.alternative.me/fng/?limit=1" | python3 -c "
import json,sys
d=json.load(sys.stdin)['data'][0]
print(f\"Fear & Greed: {d['value']} ({d['value_classification']})\")
"

## Step 4: Compile Report
Format:
📊 BTC Market Report
━━━━━━━━━━━━━━━━━━━
💰 Harga: $XX,XXX
📈 24h: +X.XX% | 7d: +X.XX% | 30d: +X.XX%
📊 24h Range: $low - $high
💎 ATH: $XX,XXX (XX% dari ATH)
🏦 Market Cap: $XXX B
💹 Volume 24h: $XX B
😱 Fear & Greed: XX (Label)

📰 NEWS TERKINI (5-8 headline terpenting):
1. [headline] — [sumber]
...

🐋 Whale & ETF:
- [info kalau ada]

⚖️ Regulasi:
- [info kalau ada]

🔮 Signal: BULLISH/BEARISH/MIXED
[alasan singkat 2-3 kalimat]
```

## Cron Job Config
```json
{
  "schedule": "every 120m",
  "enabled_toolsets": ["terminal", "web"],
  "skills": ["finance-research-trading"],
  "deliver": "telegram:CHAT_ID"
}
```

## Upgrade Path
- Add `browser` toolset to scrape CoinDesk/Cointelegraph for richer news
- Add CoinGecko trending endpoint for altcoin momentum
- Add on-chain data (whale alerts) via blockchain API
- CoinGecko free API has rate limit ~10-30 req/min — space requests
- CoinDesk browser scraping: `browser_navigate("https://www.coindesk.com/tag/bitcoin/")` → `browser_snapshot(full=True)` — returns headlines, authors, timestamps reliably
- Fear & Greed under25= Extreme Fear (contrarian signal); over75= Extreme Greed
- MIMO API 402 error → convert cron to `no_agent: true` + bash script immediately
