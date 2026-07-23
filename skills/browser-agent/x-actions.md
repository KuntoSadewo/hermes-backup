# X Actions Integration Notes

Use when the user wants controlled X/Twitter automation via a repo like `x-actions`.

## Safe scope

Allowed with explicit user intent/account ownership:
- read/check setup
- controlled single like/retweet/follow/post/quote
- airdrop task action with confirmation
- syntax/config validation

Avoid/refuse:
- spam
- mass abuse
- credential stuffing
- bypassing platform enforcement at scale
- asking user to paste cookies/tokens in chat

## Cookie/env setup

Repo pattern:

```env
X_AUTH_TOKEN=<auth_token cookie value>
X_CT0=<ct0 cookie value>
```

Expected path from this session:

```bash
/home/ubuntu/x-actions/.env
```

Pitfall: `.env` is hidden. Users may create `env.env` by mistake. Check both, but the program loads `.env`.

Useful check without printing secrets:

```python
from dotenv import load_dotenv
import os
load_dotenv('.env', override=True)
for k in ['X_AUTH_TOKEN','X_CT0']:
    v=os.getenv(k,'')
    bad=(not v) or v.startswith('your_') or v in ['***','your_a...here','your_ct0_here']
    print(f'{k}:', 'OK' if not bad else 'MISSING', f'len={len(v)}')
```

## Mobile cookie acquisition

If user only has phone:
- X APK is not useful for browser cookies.
- Use Mises/Kiwi/browser DevTools if available.
- Navigate: `Storage/Application -> Cookies -> https://x.com`.
- Copy cookie values `auth_token` and `ct0` into `.env`; never paste them into chat.

Bookmarklet may reveal `ct0`, but `auth_token` can be HttpOnly and not visible; DevTools/cookie editor is more reliable.

## Repo setup gotcha

If a cloned helper script has syntax corruption, patch the script and run `python3 -m py_compile` for quick validation. Capture the fix, not the transient error.