#!/bin/bash
cd /home/ubuntu/gram-network-bot/proxy
source .env
export CLOUDFLARE_API_TOKEN

echo "=== Test Worker with Multiple Endpoints ==="
curl -s -X POST https://gram-proxy.sadewo.workers.dev/v1/user/balance \
  -H "Authorization: Bearer gram-p...26" \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}' \
  -w "\n\nHTTP Status: %{http_code}\nProxy Endpoint: %{header_json}" 2>&1 | head -50
