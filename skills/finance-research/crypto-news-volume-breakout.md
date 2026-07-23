# Crypto News + Volume + Breakout Framework

Use when planning crypto/DEX trades from public news + market data.

## Scoring

```text
NEWS SCORE
+2 bullish catalyst
+1 narrative/funding/partnership/project update
 0 neutral
-1 light FUD
-2 hack/regulatory/exploit/major unlock shock

VOLUME / LIQUIDITY
+2 volume > 2x recent average
+1 volume > 1.3x recent average
-1 volume falling
-2 liquidity falling hard / pool thin

PRICE ACTION
+2 breakout + strong close/hold above level
+1 successful retest/support hold
-1 failed breakout
-2 breakdown

RISK
-2 low liquidity / honeypot / critical contract risk / imminent unlock
-1 concentrated holders / owner powers / tax/transfer warnings
```

## Decision

```text
score >= 4  -> prepare entry plan
score 2-3   -> watch only
score 0-1   -> skip
score < 0   -> exit / risk-off
```

## DEX workflow

1. Gather public news/catalyst.
2. Check DexScreener/Birdeye/Jupiter/Coingecko for volume + liquidity.
3. Confirm breakout/retest on chart.
4. Check holder/contract risk where available.
5. Size position from risk, not hype.
6. If live on-chain execution is requested, route through `hermes-crypto-agent`: dry-run/quote -> governor -> confirm -> trade.

Never treat news alone as a signal. Combine catalyst + volume + price action + liquidity + contract safety.