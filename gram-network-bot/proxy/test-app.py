#!/usr/bin/env python3
import requests
import re

with open("/home/ubuntu/gram-network-bot/proxy/wrangler.toml") as f:
    content = f.read()
    match = re.search(r'SECRET\s*=\s*"([^"]+)"', content)
    secret = match.group(1) if match else "not-found"

url = "https://gram-proxy.sadewo.workers.dev"
headers = {
    "Authorization": "Bearer " + secret,
    "Content-Type": "application/json"
}

# Test with the correct base URL and endpoints
print("=== Test 1: GET / (root) ===")
r = requests.get(url + "/", headers=headers, timeout=10)
print(f"Status: {r.status_code}")
print(f"Proxy: {r.headers.get('X-Proxy-Endpoint', 'N/A')}")
print(f"Body: {r.text[:200]}")

print("\n=== Test 2: POST /user/info ===")
r = requests.post(url + "/user/info", headers=headers, json={"initData": "test"}, timeout=10)
print(f"Status: {r.status_code}")
print(f"Proxy: {r.headers.get('X-Proxy-Endpoint', 'N/A')}")
print(f"Target: {r.headers.get('X-Target-URL', 'N/A')}")
print(f"Body: {r.text[:300]}")

print("\n=== Test 3: POST /mining/status ===")
r = requests.post(url + "/mining/status", headers=headers, json={"initData": "test"}, timeout=10)
print(f"Status: {r.status_code}")
print(f"Body: {r.text[:200]}")
