#!/bin/bash
cd /home/ubuntu/gram-network-bot/proxy
source .env

# Test with actual secret
echo "=== Testing Worker with Auth ==="
curl -s -X POST https://gram-proxy.sadewo.workers.dev/v1/user/balance \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"initData":"test"}' \
  -w "\n\nHTTP: %{http_code}" 2>&1 | head -30
