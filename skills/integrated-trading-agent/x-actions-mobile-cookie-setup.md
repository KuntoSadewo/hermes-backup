# X Actions cookie setup — mobile/browser gotchas

Use when user wants X/Twitter actions or X news/search via `/home/ubuntu/x-actions`.

## Required values

`/home/ubuntu/x-actions/.env` must contain:

```env
X_AUTH_TOKEN=<auth_token cookie value>
X_CT0=<ct0 cookie value>
```

Never ask user to paste values into chat. They should edit the file locally.

## Mobile collection path

If user only has Android:

1. Login to `https://x.com/home` in a browser with DevTools/cookie access (Mises/Kiwi/etc.).
2. Open DevTools/Storage/Application → Cookies → `https://x.com`.
3. Copy cookie values:
   - `auth_token`
   - `ct0`
4. Edit the hidden file:

```bash
nano /home/ubuntu/x-actions/.env
```

5. Save: `CTRL+O` → Enter → `CTRL+X`.

## Hidden file pitfall

`.env` is hidden. Users often create/edit `env.env` by mistake.

Check without revealing secrets:

```bash
cd /home/ubuntu/x-actions
python3 - <<'PY'
from dotenv import load_dotenv
import os
load_dotenv('.env', override=True)
for k in ['X_AUTH_TOKEN','X_CT0']:
    v=os.getenv(k,'')
    bad=(not v) or v.startswith('your_') or v in ['***','your_a...here','your_ct0_here']
    print(f'{k}:', 'OK' if not bad else 'MISSING', f'len={len(v)}')
PY
```

If user edited `env.env`, copy it:

```bash
cp /home/ubuntu/x-actions/env.env /home/ubuntu/x-actions/.env
```

Then re-run the safe check.

## Communication style for this user

When explaining setup, use plain Indonesian and concrete steps. Avoid abstract terms first. Example shape:

```text
1. Buka file ini: /home/ubuntu/x-actions/.env
2. Isi dua baris ini: X_AUTH_TOKEN=... dan X_CT0=...
3. Save.
4. Bilang “cek lagi”.
```

User got confused by terse jargon around `.env`; switch to simpler language for setup/debug flows.
