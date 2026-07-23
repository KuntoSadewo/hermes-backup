#!/usr/bin/env python3
import requests
import re

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

print("=== Test Worker Debug ===")
r = requests.post(url + "/user/info", headers=headers, json={"initData": "test"}, timeout=15)
print(f"Status: {r.status_code}")
print(f"Body: {r.text[:500]}")
