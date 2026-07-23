---
name: finance-research-trading
description: "Finance + crypto/stock research toolkit: market/news research, crypto news-volume-breakout scoring, yfinance/AKShare data, stock screening, CANSLIM/VCP, technical analysis, market breadth, options payoff, correlation, social/news read-only, backtest, portfolio/risk planning."
---

# Finance Research Trading

## Consolidated Research And Trading Areas

Additional absorbed finance research workflows:

- `yfinance-data` / `yahoo-finance-stock-data`: fetch prices, fundamentals, dividends, earnings, analyst data, and options chains through Yahoo/yfinance; validate tickers and note data vendor caveats.
- `chinese-financial-data`: use AKShare for China A-share, futures, funds, forex, bonds, indices, and macro market datasets.
- `options-payoff`: model multi-leg options positions with payoff curves, breakevens, max risk/reward, and missing-input assumptions.
- `stock-correlation`: compute co-movement, rolling correlation, peers, pair-trade candidates, and hedging relationships.
- `discord-reader`, `telegram-reader`, `twitter-reader`: read-only social/community research sources for market sentiment; never post or mutate state from these subsections.
- `hormuz-strait`: energy/geopolitical chokepoint monitoring for shipping, oil prices, war-risk insurance, vessel status, and macro spillovers.
- `trading-skills`, `trading-combo`, and `data-analysis-forex`: fold screening, technical analysis, CANSLIM/VCP, portfolio/risk planning, backtesting, and forex data analysis into the same research-to-plan workflow.
- `generative-ui`: render charts, dashboards, payoff visualizations, and market explainers when visual output would clarify the analysis.


This skill is the umbrella for market research, trading analysis, and crypto/venue-specific research. It absorbs narrower workflows as labeled subsections:

- `crypto-airdrop-and-dex-trading`: research airdrops/testnets and plan DEX trading or bots safely, without custodying secrets or promising profit.
- `polymarket`: query prediction markets, prices, order books, and histories as one research venue inside broader market analysis.

Keep execution safety and risk framing explicit: distinguish data gathering, analysis, simulation, and live trading actions.


Class-level skill for trading research before execution.

## Use when

- user asks for trading ideas, market/news scan, crypto narratives, bullish/FUD checks
- screening stocks/crypto/pairs
- technical analysis, breakout/momentum/mean-reversion planning
- backtest, risk/reward, position sizing
- options payoff/correlation/pair trading
- public news/X/Telegram/Discord-style sentiment research when access exists

## Core workflow

1. Define market/pair/timeframe.
2. Gather data: news/catalyst, OHLCV, volume/liquidity, sentiment, macro if relevant.
3. Score setup with explicit rules.
4. Check risk: liquidity, spread, holder/contract flags, unlocks, news validity.
5. Produce plan: entry trigger, invalidation/SL, TP, size/risk.
6. If live crypto/on-chain execution requested, hand off to `hermes-crypto-agent`: dry-run/quote first, governor + confirm before live trade.

## Default crypto framework

See `references/crypto_news_trade_framework.md`.

## Crypto news & price data sources

See `references/crypto_news_price_apis.md` — working API endpoints, browser scraping fallbacks, and output format preferences for BTC/crypto price + news queries.

## Safety

- Research/education, not guaranteed profit.
- Backtest is historical, not prediction.
- News alone is never a trade signal; combine with volume/liquidity/chart/risk.
- Social readers are read-only unless user explicitly requests public action; public actions require confirmation.
