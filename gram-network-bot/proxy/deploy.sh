#!/bin/bash
cd /home/ubuntu/gram-network-bot/proxy
CF_TOKEN=$(grep CLOUDFLARE .env | cut -d= -f2)
export CLOUDFLARE_API_TOKEN="$CF_TOKEN"

echo "=== Registering workers.dev subdomain ==="
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/da80af921a6d6b08e548cdf45f495418/workers/subdomain" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"sadewo"}'

echo ""
echo "=== Deploying Worker ==="
wrangler deploy 2>&1
