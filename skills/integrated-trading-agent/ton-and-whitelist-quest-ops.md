# TON Trading And Whitelist Quest Ops Notes

## TON Auto-Trade Boundary

When the user asks whether they can trade BTC on TON or automate TON swaps:

- Native Bitcoin L1 is NOT traded directly on TON — only wrapped/bridged/synthetic BTC.
- Common TON DEX venues: **STON.fi**, **DeDust**, TON aggregators.
- STON.fi flow for DOGS→TON→BTC: connect wallet → swap DOGS to TON → swap TON to verified BTC token (e.g. tgBTC or wrapped BTC).
- Auto-trade on TON is technically possible (bot + TON SDK + DEX API) but ecosystem is less mature than Jupiter/Solana.
- For semi-auto: price monitor → alert → manual confirm in wallet → sign.
- Token verification is ALWAYS first step: contract address, verified badge, liquidity, volume, slippage, bridge/synthetic risk.
- Never ask the user to send funds to the agent or share seed/private keys.
- For bot design, specify trigger, max trade size, slippage cap, token contract, and confirmation mode before execution.

Useful response shape:

```text
Bisa teknis, tapi pakai burner wallet dan mode semi-auto dulu.
Flow: monitor harga -> quote route -> cek slippage/liquidity -> minta confirm -> sign di wallet lu.
```

## Whitelist Quest Sites With X Tasks

For quest pages that ask for X follow/like/repost/comment/quote plus wallet save:

1. Inspect page JS before doing actions; identify task URLs, quote text, and whether `submitEndpoint`/backend exists.
2. If the site only marks tasks done client-side with timers, tell the user that website completion is local and may not prove project-side submission.
3. Do not claim X tasks are complete unless logged into X and the actual follow/like/repost/comment/quote state is verified.
4. If not logged in, provide the direct X URLs and exact comment/quote text for the user to execute manually.
5. It is OK to fill a public username and public wallet address into the quest page when the user provides them, but mention if no backend submission exists.
6. Keep the final status separate: `Quest UI`, `X actions`, and `Backend/save`.

Example final status:

```text
Quest UI: 4/4 marked done
Wallet form: saved locally / success popup shown
X actions: not verified because browser was not logged in
Backend: no submitEndpoint found, so project-side receipt is uncertain
```

Session example learned from UNITS:

```text
PROFILE_URL = https://x.com/Unitsxworld
POST_URL = https://x.com/Unitsxworld/status/2064997497236254785?s=20
QUOTE_TEXT = Terminal access open for 24H , Claimed my free mint chance . Go grab yours
submitEndpoint = empty
```
