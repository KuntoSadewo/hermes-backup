# Crypto News + Volume + Breakout Framework

Use for DEX/crypto trade planning when user asks whether a pair/setup is valid.

## Signal model

Combine public news, volume/liquidity, price action, and risk flags. Never treat news alone as an entry.

### News score

```text
+2 bullish catalyst: major listing, mainnet, ETF/regulatory positive, major integration, exploit resolved
+1 narrative/funding/partnership/project update
 0 neutral/no clear catalyst
-1 mild FUD/delay/unverified negative rumor
-2 hack/exploit/regulatory action/bridge issue/insolvency/major unlock dump risk
```

### Volume/liquidity

```text
+2 24h volume > 2x recent average AND liquidity rising
+1 24h volume > 1.3x average
-1 volume fading OR liquidity flat/down
-2 liquidity draining, spread wide, LP unlock/removal risk
```

### Price action

```text
+2 breakout with strong close/hold above level
+1 retest support succeeds
-1 failed breakout/rejection
-2 breakdown below support
```

### Risk flags

```text
-2 honeypot/drainer/exploit/blacklist/tax trap/critical contract risk
-1 top holder concentration, mintable owner, unlock near, low liquidity, unverified contract
```

## Decision

```text
score >= 4  -> valid watch/entry plan; still size small + SL
score 2-3   -> watch only; wait confirmation
score 0-1   -> skip
score < 0   -> exit/risk-off
critical risk -> no trade regardless of score
```

## Required output

```text
News:
Volume/Liq:
Price action:
Risk:
Score:
Decision:
Plan: entry / invalidation / TP / SL / size
```

## Safety

For live DEX execution, hand off to `hermes-crypto-agent`: dry-run quote, simulate, governor, confirm, then broadcast. No profit guarantee.
