#!/bin/bash
cd /home/ubuntu/gram-network-bot/proxy
source .env
export CLOUDFLARE_API_TOKEN

echo "=== Test with Auth ==="
curl -s -X POST https://gram-proxy.sadewo.workers.dev/v1/user/balance \
  -H "Authorization: Bearer gram-proxy-sadewo-2026" \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}'

echo ""
echo ""
echo "=== Test OPTIONS (CORS) ==="
curl -s -X OPTIONS https://gram-proxy.sadewo.workers.dev/ \
  -H "Origin: https://gram.network" \
  -H "Access-Control-Request-Method: POST" -I
