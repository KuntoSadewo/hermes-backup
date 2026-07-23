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

# Check what returns 525 specifically from api.gram.network
paths = [
    "/api/v1/tasks/list",
    "/miniapp/api/v1/mining",
    "/api/start",
    "/me/balance",
    "/auth/telegram",
    "/v1/user/balance",
    "/v1/mining/start",
    "/v1/tasks",
]

print("=== Check which endpoints fail with 525 (SSL) ===")
for path in paths:
    try:
        r = requests.post(url + path, headers=headers, json={"initData": "test"}, timeout=10)
        try:
            d = r.json()
            if "results" in d:
                for res in d["results"]:
                    endpoint = res.get("endpoint", "?")
                    status = res.get("status", "err")
                    err = res.get("error", "")
                    if status == 525 or "SSL" in str(err):
                        print(f"  SSL FAIL: {path} via {endpoint}")
                    elif status and status not in [404, 405, 200]:
                        print(f"  OTHER: {path} via {endpoint} = {status}")
        except:
            if r.status_code == 525:
                print(f"  SSL FAIL: {path} (direct 525)")
    except:
        pass

print("\nDone.")
