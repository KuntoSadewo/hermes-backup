#!/bin/bash
cd /home/ubuntu/gram-network-bot/proxy
CF_TOKEN=$(grep CLOUDFLARE .env | cut -d= -f2)
export CLOUDFLARE_API_TOKEN="$CF_TOKEN"

# Try wrangler subdomain command
echo "=== Setting workers.dev subdomain ==="
wrangler subdomain sadewo 2>&1 || echo "subdomain_failed"

echo ""
echo "=== Deploying Worker ==="
wrangler deploy 2>&1
