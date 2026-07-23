# Jupiter Bot Setup — session notes

Use when user wants Solana/Jupiter DEX auto-trading without exchange API keys.

## Key points

- Jupiter swap does **not** need an exchange-style API key for normal public quote/swap flow.
- Live execution needs a Solana burner wallet/keypair on the agent/VPS plus SOL for gas and trade funds.
- Explain this in simple terms for this user: `isi dompet bot → cek saldo → simulasi → confirm → live kecil`.
- Avoid jargon-first explanations; user explicitly needed simpler wording.

## Safe sequence

1. Create/identify burner wallet.
2. Keep private key/keypair local; never paste seed/private key in chat.
3. Fund wallet with small amount first, e.g. `0.02 SOL + 5 USDC`.
4. Keep `.env` at `DRY_RUN=true` until quote works.
5. Run quote/simulation.
6. Collect simple rules:
   - pair
   - amount per trade
   - max trades/day
   - max loss/day
   - TP/SL
   - slippage
7. Only then set `DRY_RUN=false` after explicit user confirmation.

## Simple user-facing wording

```text
Jupiter nggak butuh API key.
Bot pakai wallet burner lokal.
Sekarang simulasi dulu.
Kalau saldo sudah ada + lu setuju, baru live.
```

## Pitfalls

- Do not imply Jupiter Android app has an API-key setting; it does not for this workflow.
- Do not call the setup “fully automatic” until funds, rules, and live mode are configured.
- For any tx: quote/simulate → governor/risk check → confirmation unless explicit auto-confirm policy is active.
