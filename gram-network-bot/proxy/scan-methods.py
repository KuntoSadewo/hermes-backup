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

# Try different methods on /user/info
path = "/user/info"
for method in ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]:
    try:
        r = requests.request(method, url + path, headers=headers, 
            json={"initData": "test"}, timeout=5)
        body = r.text[:100].replace("\n", " ")
        print(f"{method} {path}: {r.status_code} {body}")
    except Exception as e:
        print(f"{method} {path}: ERROR {e}")

print("\n=== Try with query parameters ===")
# Try with query parameters
params = [
    "?initData=test",
    "?data=test",
    "?token=test",
]
for param in params:
    try:
        r = requests.get(url + path + param, headers=headers, timeout=5)
        body = r.text[:100].replace("\n", " ")
        print(f"GET {path}{param}: {r.status_code} {body}")
    except Exception as e:
        print(f"GET {path}{param}: ERROR {e}")
