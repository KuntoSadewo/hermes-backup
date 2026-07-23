#!/bin/bash
cd /home/ubuntu/gram-network-bot/proxy
source .env
export CLOUDFLARE_API_TOKEN

echo "=== Test Worker URL ==="
curl -sv https://gram-proxy.sadewo.workers.dev/ 2>&1 | tail -20

echo ""
echo "=== Check Worker Status ==="
curl -s "https://api.cloudflare.com/client/v4/accounts/da80af921a6d6b08e548cdf45f495418/workers/scripts/gram-proxy" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool 2>/dev/null
