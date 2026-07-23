---
name: finance-research-trading
description: "Finance + crypto/stock research toolkit: yfinance data, stock screening, CANSLIM/VCP, technical analysis, market breadth, options payoff, correlation, social/news readers, China market data via AKShare, macro/geopolitical risk. Gunakan untuk riset trading, analisis saham/crypto, backtest, screening, portfolio/risk planning."
---

# Finance Research Trading

Gabungan skill dari `SkillResearch-Crypto-Stock.zip`.

## Isi utama

- `trading-combo/` — katalog 50 skill trading: screening, CANSLIM, VCP, market breadth, sector rotation, technical analysis, risk/position sizing, backtest.
- `data-analysis-forex/` — toolkit analisis trading/forex/stock, strategy validation.
- `yahoo-finance-stock-data/` — yfinance, options payoff, stock correlation, generative UI/chart, Twitter/Discord/Telegram readers, Hormuz geopolitical monitor.
- `chinese-financial-data/` — AKShare China market data: stocks, futures, options, funds, forex, bonds, indices, crypto.

## Trigger

Gunakan saat user minta:
- analisis market/trading
- screen saham/crypto
- cari pair/correlation
- backtest strategi
- position sizing / risk
- options payoff
- market breadth / sector / macro
- data Yahoo Finance / AKShare
- sentimen Twitter/Telegram/Discord read-only
- dashboard/chart/visualisasi finansial

## Prinsip

- Riset/edukasi, bukan financial advice pasti.
- Backtest ≠ jaminan masa depan.
- Untuk live trade: gabungkan dengan `hermes-crypto-agent` safety rails: dry-run, governor, confirm, kill-switch.
- Social readers read-only: jangan post/like/reply/send.

## Workflow trading research

1. Definisikan market/pair/timeframe.
2. Pilih pair likuid: volume 24h tinggi, liquidity tebal, spread kecil, chart aktif.
3. Ambil data OHLCV/fundamental/sentiment.
4. Hitung indikator/fitur.
5. Backtest + fee/slippage.
6. Risk: max loss/day, position size, stop/TP.
7. Buat plan entry/exit.
8. Kalau eksekusi crypto/on-chain → route ke `hermes-crypto-agent`.

## DEX pair selection quick rules

- Prioritas awal: liquid majors/pairs, bukan microcap random.
- Solana/Jupiter: `SOL/USDC` sebagai default belajar/bot; lalu JUP/BONK/WIF kalau user accept risk.
- EVM/Base: `WETH/USDC`, `cbBTC/USDC`, AERO/USDC kalau volume masih kuat.
- Minimum heuristic: 24h volume > $1M, liquidity > $300k, spread kecil, no honeypot/tax trap.
- Trading skill memberi riset/plan; live execution tetap perlu dry-run/governor/confirm.

## File penting
## File penting

- `trading-combo/SKILL.md`
- `data-analysis-forex/SKILL.md`
- `yahoo-finance-stock-data/yfinance-data/SKILL.md`
- `yahoo-finance-stock-data/stock-correlation/SKILL.md`
- `yahoo-finance-stock-data/options-payoff/SKILL.md`
- `chinese-financial-data/SKILL.md`
- `references/crypto-news-volume-breakout.md` — scoring framework untuk crypto/DEX trade: news catalyst + volume/liquidity + breakout + risk.
- `references/crypto-news-volume-breakout.md` — framework news + volume + breakout untuk watchlist/sinyal crypto/DEX
