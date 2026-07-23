---
name: communication-platform-automation
description: "Communication and social platform automation umbrella: email, X/Twitter, Yuanbao groups, read/write safety, auth checks, and platform-specific CLI workflows."
platforms: [linux, macos, windows]
---

# Communication Platform Automation

Use this class-level skill when the user asks Hermes to operate messaging, email, or social platforms through local CLIs or integrations.

## Email via Himalaya

Absorbs `himalaya`. Use the Himalaya CLI for IMAP/SMTP email reading and sending. Verify account configuration, keep message IDs explicit, and confirm before sending or destructive mailbox changes.

## X/Twitter via xurl

Absorbs `xurl`. Use the official X API CLI for posts, replies, search, DMs, media, and raw v2 endpoints. Never read token files or pass secrets in chat. Confirm before writes such as posting, liking, following, blocking, deleting, or sending DMs.

## Yuanbao groups

Absorbs `yuanbao`. Use Yuanbao group tooling for member lookup, group info, and @mentions. Prefer precise target selection and avoid spammy mass mentions.

## Telegram Userbot via Telethon

For tasks that need a **user account** (joining channels, sending DMs as user, accessing user-only content). Bot tokens can't do these.

### Setup
```bash
pip install telethon  # or: uv pip install telethon
```
Config file (chmod 600):
```json
// config/telegram_session.json
{"api_id": 12345678, "api_hash": "from_my.telegram.org", "phone": "+628xxx"}
```
Get `api_id` + `api_hash` from https://my.telegram.org/apps.

### Login flow (headless VPS — CRITICAL PITFALLS)

**PITFALL 1: `input()` doesn't work in Hermes terminal.** No stdin. Interactive `client.start(phone=...)` that prompts for OTP will crash with `EOFError`.

**PITFALL 2: OTP expires fast doing request→chat→verify roundtrip.** The ~30-60s delay while user types code in Telegram chat often exceeds OTP validity. Separate `send_code_request()` then `sign_in()` across terminal calls almost always fails.

**PITFALL 3: Too many OTP requests (~8+) = Telegram blocks delivery.** User stops receiving codes. Wait 15-30 min to reset.

**PITFALL 4: `force_sms=True` is deprecated** in telethon ≥1.40.

**PITFALL 5: `code=` kwarg doesn't exist** in `client.start()`. Use `code_callback=callable`.

**CORRECT PATTERN — file-based code callback in single persistent process:**
```python
# Run as foreground terminal with high timeout (200s)
import asyncio, json, time
from pathlib import Path
from telethon import TelegramClient

async def main():
    cfg = json.load(open('config/telegram_session.json'))
    CODE_FILE = Path('config/.tg_code')
    client = TelegramClient('config/tg_session', cfg['api_id'], cfg['api_hash'])
    await client.connect()

    if not await client.is_user_authorized():
        sent = await client.send_code_request(cfg['phone'])
        print(f'OTP_SENT|hash={sent.phone_code_hash}', flush=True)
        # Wait for code file (max 3 min)
        code = None
        for _ in range(360):
            if CODE_FILE.exists():
                code = CODE_FILE.read_text().strip()
                CODE_FILE.unlink()
                break
            await asyncio.sleep(0.5)
        if not code:
            print('TIMEOUT'); return
        await client.sign_in(phone=cfg['phone'], code=code,
                             phone_code_hash=sent.phone_code_hash)

    me = await client.get_me()
    print(f'SUCCESS:{me.first_name}:@{me.username}')
    await client.disconnect()

asyncio.run(main())
```
Then write code to file: `echo -n "12345" > config/.tg_code`

**Alternative: background with PYTHONUNBUFFERED=1** — unreliable, output often invisible. Prefer foreground with long timeout.

**Alternative: run OTP request foreground (fast, <5s), save hash to file, then verify foreground.** Works IF you can get code to user and verify within ~15s. Risky.

### Auto-join channels + claim tasks
After session exists, joining is straightforward:
```python
from telethon import functions
entity = await client.get_entity("ChannelUsername")
await client(functions.channels.JoinChannelRequest(entity))
```
Use 30-60s random delay between joins to avoid FloodWait. Check `is_completed` on tasks before claiming.

### Key files pattern
```
project/
├── config/
│   ├── telegram_session.json  # api_id, api_hash, phone (chmod 600)
│   ├── tg_session.session     # telethon session (auto-created, chmod 600)
│   └── .tg_code               # temp file for OTP (deleted after use)
├── tg-autojoin.py             # main script
└── config/accounts/*.json     # platform tokens
```

### Platform-specific task claiming
For Gram Network and similar platforms: after joining channels, claim tasks via the platform's API using `node do-tasks.js` or equivalent. See `references/telethon-vps-login.md` for the Gram Network workflow details.

## Safety defaults

Separate read-only research from public actions. Check auth status without printing secrets. For any action that changes remote state or contacts another person, restate the target and obtain confirmation unless the user already gave an exact instruction.
