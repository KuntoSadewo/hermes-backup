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

endpoints = [
    ("GET", "/api/get_user_data.php?initData=test123"),
    ("GET", "/api/get_tasks.php?initData=test123"),
    ("POST", "/api/start_mining.php"),
    ("POST", "/api/claim_mining.php"),
    ("POST", "/api/claim_daily.php"),
]

print("=== Test Real Gram Network API Endpoints ===")
for method, path in endpoints:
    try:
        if method == "GET":
            r = requests.get(url + path, headers=headers, timeout=10)
        else:
            r = requests.post(url + path, headers=headers, json={"initData": "test123"}, timeout=10)
        
        body = r.text[:200].replace("\n", " ")
        proxy = r.headers.get("X-Proxy-Endpoint", "N/A")
        print(f"{method} {path}: {r.status_code} | proxy: {proxy}")
        print(f"  → {body}")
        print()
    except Exception as e:
        print(f"{method} {path}: ERROR {e}")
