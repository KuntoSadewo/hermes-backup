# Telethon on Headless VPS — Session Notes

## Problem recap
Telethon OTP login fails on headless VPS because:
1. `input()` crashes (no stdin in Hermes terminal)
2. OTP expires before user can relay code through chat (~30-60s roundtrip)
3. Background processes don't show output reliably
4. Too many OTP requests → Telegram blocks delivery

## Working solution: file-based code callback
See SKILL.md "Telegram Userbot via Telethon" section for the pattern.

The key insight: the script must stay in ONE process for both `send_code_request` and `sign_in`. The `phone_code_hash` is tied to the connection. Splitting across terminal calls = new connection = hash mismatch or expiry.

## Gram Network task claiming workflow
After user manually joins Telegram channels:
1. Run `node do-tasks.js` in project dir
2. Script fetches tasks via proxy, claims all non-completed ones
3. telegram_chat tasks require actual channel membership (verified server-side)
4. Other task types (social/others) claim directly via API
5. Sends Telegram notification on completion

Task types and their requirements:
- `telegram_chat` → must join the t.me/ channel first (manual or telethon)
- `others` / `social` → can claim directly, no action needed
- Server rate limit: 20s delay between task claims recommended

## Confirmed: split request→verify across terminal calls DOES NOT WORK
Tried multiple times: `send_code_request()` in foreground → save `phone_code_hash` to file → user gives code → `sign_in()` in new foreground call. **Always fails with "code expired"** even when delay is <15s. The hash appears tied to the connection/session state, not just the string value. Only reliable approach is single-process with file-based code callback.

## User code confusion
When asking user for OTP, they often give codes from PREVIOUS requests (which are now invalid). Always specify: "Check the LATEST message from Telegram (service notifications), not old ones." Each new `send_code_request()` invalidates all previous codes.

## Rate limit recovery
If Telegram stops sending OTP codes:
- Wait 15-30 minutes
- Then try once (don't spam)
- If still blocked, wait 1-2 hours
- After ~8 requests in quick succession, codes stop arriving entirely

## telethon API notes (v1.44)
- `client.start(phone=phone, code_callback=lambda: code)` — correct
- `client.start(phone=phone, code=code)` — WRONG, no such kwarg
- `force_sms=True` — deprecated, does nothing
- `client.sign_in(phone, code, phone_code_hash=hash)` — manual flow
- Session file: `.session` suffix auto-added by telethon
