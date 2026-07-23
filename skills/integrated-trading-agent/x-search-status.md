# X/Twitter Search Status (July 2026)

## Current State

- xurl CLI: **not installed** on this system
- x_auto.py: exists at `/home/ubuntu/x-actions/x_auto.py` but has **no search function** (only like/retweet/post/quote/follow)
- X adaptive search API (`/i/api/2/search/adaptive.json`): returns **404**
- X GraphQL SearchTimeline: returns **404** without fresh cookies
- Browser scraping X search: works if logged in, but requires manual cookie refresh

## Workarounds

1. **Browser scrape CoinDesk/Cointelegraph** for crypto news (reliable, no auth)
2. **Install xurl** if X search is needed: check `hermes skills` for xurl skill
3. **Fresh cookies** from browser DevTools → update `.env` in x-actions
4. **Browser navigate to X search page** directly if logged in

## Cookie Refresh

When x_auto.py auth fails:
1. Open x.com in browser (logged in)
2. DevTools → Application → Cookies → x.com
3. Copy `auth_token` and `ct0` values
4. Update `/home/ubuntu/x-actions/.env`
