#!/usr/bin/env python3
import requests
import re
import json

# Read secret
with open("/home/ubuntu/gram-network-bot/proxy/wrangler.toml") as f:
    content = f.read()
    match = re.search(r'SECRET\s*=\s*"([^"]+)"', content)
    secret = match.group(1) if match else "not-found"

url = "https://gram-proxy.sadewo.workers.dev"
headers = {
    "Authorization": "Bearer " + secret,
    "Content-Type": "application/json"
}

# Full debug for specific paths
paths = ["/v1/user/balance", "/api/v1/user/balance", "/user/balance"]

for path in paths:
    print(f"\n=== {path} ===")
    r = requests.post(url + path, headers=headers, json={"initData": "test"}, timeout=10)
    print(f"Status: {r.status_code}")
    try:
        d = r.json()
        print(json.dumps(d, indent=2))
    except:
        print(f"Body: {r.text[:300]}")
