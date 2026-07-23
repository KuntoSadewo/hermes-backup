# X Actions GitHub Automation Notes

Use when user references `https://github.com/Aripin171103/x-actions` or asks for X/Twitter automation via GitHub scripts.

## Repo role

`x-actions` provides API-based and browser/CDP-based X/Twitter actions:

- `x_auto.py` — API automation module
- `inject.py` — CDP/browser injection helper
- `login_x.py` — cookie-based login via CDP
- `nav.py` — navigation helper
- JS scripts for like/retweet/follow/quote

## Safe setup pattern

```bash
git clone https://github.com/Aripin171103/x-actions.git
cd x-actions
python3 - <<'PY'
import requests, dotenv
print('deps ok')
PY
cp .env.example .env
python3 -m py_compile x_auto.py login_x.py nav.py inject.py
```

If pip is unavailable in current venv, first check whether deps already import before trying installs.

## Credentials

`.env` needs:

```env
X_AUTH_TOKEN=
X_CT0=
```

User must edit `.env` locally. Do **not** ask them to paste cookies/session tokens into chat.

## Safety / boundaries

- Use only for user-controlled, low-volume, explicit tasks.
- Avoid spam, mass engagement, bypass-limit abuse, credential stuffing, or unauthorized automation.
- X cookies are sensitive session credentials; never log or echo values.
- Prefer read-only/news research where possible.
- Posting/like/retweet/follow are public side effects → confirm before action.

## Pitfalls from session

- README package assumption may be stale: `opencli` was not available via npm in this environment. Do not hard-code a negative conclusion; verify current install source if needed.
- `login_x.py` in the repo may contain corrupted line around auth token/ct0 assignment. Expected fix:

```python
AUTH_TOKEN = get_env("X_AUTH_TOKEN")
CT0 = get_env("X_CT0")
```

- `.env.example` placeholders can make a variable look set. Treat placeholder values as unset.
