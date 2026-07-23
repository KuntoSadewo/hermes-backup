# Crypto news + volume + breakout framework

Use when the user asks for crypto trading ideas based on news, X/public sentiment, DEX volume, or breakout setups.

## Inputs

- News/catalyst: public web, X/search when available, official blogs, funding/VC/project updates, regulatory/hack/FUD.
- Market data: DEX volume, liquidity, spread, price action, holder/token safety where relevant.
- Timeframe: default intraday/swing unless user specifies.

## Score

```text
NEWS SCORE
+2 bullish catalyst
+1 narrative/funding/partnership/project update
 0 neutral/no clear catalyst
-1 mild FUD
-2 hack/regulatory/exploit/major unlock risk

VOLUME / LIQUIDITY
+2 volume > 2x recent average, liquidity stable/rising
+1 volume > 1.3x recent average
-1 volume fading
-2 liquidity falling, spread widening, thin pool

PRICE ACTION
+2 breakout + strong close/hold above level
+1 successful retest/support hold
-1 failed breakout
-2 breakdown

RISK FLAGS
-2 low liquidity / honeypot risk / suspicious contract / unlock imminent
-1 top holder concentration / unknown team / tax/approval concern
```

## Decision

```text
score >= 4  -> entry plan/watchlist candidate
score 2-3   -> watch only, wait for confirmation
score 0-1   -> skip
score < 0   -> exit/risk-off bias
```

## Required output

```text
coin/pair | catalyst | sentiment | volume/liquidity | chart setup | risk | decision
```

## Execution handoff

Research only here. If user wants DEX execution, hand off to `hermes-crypto-agent`: dry-run/quote first, then governor + confirm before live trade.
