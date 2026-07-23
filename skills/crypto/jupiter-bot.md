# Jupiter Solana Swap Bot — Session Pattern

Use when user wants DEX trading via Jupiter/Solana, especially semi-auto/full-auto.

## Key facts

- Jupiter Android/app is not an exchange API-key venue. It is a swap/wallet UX; tx still requires wallet signing.
- Full-auto via Jupiter requires a separate Solana burner wallet + local/VPS signing script + Jupiter Quote/Swap API.
- Never ask user to paste seed/private key in chat. If key is needed, keep it local in `.env`/keypair file with restrictive perms.

## Safe default flow

1. Recommend semi-auto first: agent scans/quotes/plans, user signs.
2. If user insists full-auto:
   - create/import **burner** wallet only
   - keep wallet file local, e.g. `burner.json`, mode `0600`
   - start `DRY_RUN=true`
   - require small test funds only
   - set slippage, max trades, max loss/day
3. Run dry quote before live swap.
4. For live: set `DRY_RUN=false`, execute small amount, return tx hash + explorer.

## Minimal Node deps

```bash
npm install @solana/web3.js bs58 dotenv
```

## Env template

```env
RPC_URL=https://api.mainnet-beta.solana.com
KEYPAIR_PATH=./burner.json
INPUT=USDC
OUTPUT=SOL
AMOUNT_UI=1
INPUT_DECIMALS=6
SLIPPAGE_BPS=50
DRY_RUN=true
MAX_TRADES=1
INTERVAL_MS=60000
```

## Jupiter API endpoints

```text
GET  https://quote-api.jup.ag/v6/quote
POST https://quote-api.jup.ag/v6/swap
```

## Safety reminders

- Burner wallet only; never main wallet.
- Do not print raw private key unless user explicitly asks how to export/import, and warn first.
- `DRY_RUN=true` until user confirms live.
- Slippage low first: `50` = 0.5%.
- Live trading needs explicit tx/risk plan unless `auto_confirm on`; governor remains active.
