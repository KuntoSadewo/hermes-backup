# TON Trading and Telegram WebApp Automation Notes

Session-derived notes for TON swap/trading requests, Telegram mini-app farming bots, and prop/funding-program pages.

## TON BTC / DOGS Trading

- Native Bitcoin is not traded directly on TON. Treat any BTC exposure on TON as wrapped, bridged, or synthetic BTC unless the protocol proves otherwise.
- Before swapping TON/DOGS into a BTC-like token, verify token contract, verified status, liquidity, volume, slippage, and bridge/custody model.
- Prefer guiding the user through their own wallet. Do not accept user funds, seed phrases, private keys, or confirm wallet transactions on their behalf.
- For automation, start with semi-auto alerts and manual confirmation before any auto-swap. If auto-swap is requested, use a burner wallet, caps, slippage limits, and a kill switch.

## Telegram WebApp Farming Bots

Some Telegram mini-apps use `initData` as the signed WebApp login token. For bots like Gram Network automation:

- `initData` is sensitive and should be treated like a temporary login token, not a harmless config value.
- Store it only in local config files with restrictive permissions where possible; avoid printing it back in logs or final replies.
- It may expire after roughly 24 hours or return `401/403`; refresh from the WebApp instead of hardcoding stale tokens.
- Inspect static code before running a GitHub bot. Look for `eval`, `Function`, `child_process`, `exec`, `spawn`, unknown network destinations, wallet/seed handling, and transfer/withdraw flows.
- Prefer safe first run: one account, `parallel: 1`, no loop, no auto external tasks, no auto Telegram join tasks, then run status/mine once.
- Multi-account automation can violate app ToS and trigger bans. Explain this once, especially when the user hints at farming many accounts.

## Promotional Credits / Airdrops / Manual Profiles

- Help with one legitimate account, truthful profile text, and form answers.
- Refuse fake identities, mass registration, fingerprint bypass, or scripts to abuse credits/promos.
- For campaign pages without a backend submit endpoint, tell the user that local success screens do not prove database submission.

## Prop/Funded Trading Pages

When checking funded-account pages such as Vest Capital:

- Distinguish simulated capital/evaluation fees from real free capital.
- Extract plan details from page/API when possible: fee, simulated account size, profit target, drawdown, daily loss, leverage, refund/payout terms.
- Highlight conflicts of interest and non-refundable evaluation fees.
- Recommend burner wallet/login for exploration and avoid connecting a main wallet.
