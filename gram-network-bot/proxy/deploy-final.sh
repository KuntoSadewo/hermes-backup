#!/bin/bash
cd /home/ubuntu/gram-network-bot/proxy
source .env
export CLOUDFLARE_API_TOKEN
echo "=== Deploying Worker ==="
wrangler deploy 2>&1
