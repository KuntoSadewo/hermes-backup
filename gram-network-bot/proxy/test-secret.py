#!/usr/bin/env python3
import requests
import re

# Read secret from wrangler.toml
with open("/home/ubuntu/gram-network-bot/proxy/wrangler.toml") as f:
    content = f.read()
    match = re.search(r'SECRET\s*=\s*"([^"]+)"', content)
    secret = match.group(1) if match else "not-found"

url = "https://gram-proxy.sadewo.workers.dev"
headers = {
    "Authorization": "Bearer " + secret,
    "Content-Type": "application/json"
}

print(f"Using secret: {secret[:10]}...")
print()

print("=== Test 1: POST /v1/user/balance ===")
r = requests.post(url + "/v1/user/balance", headers=headers, json={"initData": "test"}, timeout=10)
print(f"Status: {r.status_code}")
print(f"Body: {r.text[:300]}")
print(f"Proxy-Endpoint: {r.headers.get('X-Proxy-Endpoint', 'N/A')}")
