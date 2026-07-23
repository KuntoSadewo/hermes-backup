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

# Scan deeper API patterns
paths = [
    # TMA API patterns
    "/api/v1/users/me",
    "/api/v1/users/me/balance",
    "/api/v1/mining/status",
    "/api/v1/mining/start",
    "/api/v1/mining/claim",
    "/api/v1/tasks/list",
    "/api/v1/tasks/complete",
    # Different base
    "/tonapi/v1/mining/start",
    "/gram/v1/mining/start",
    "/miniapp/api/v1/user",
    "/miniapp/api/v1/mining",
    # Try raw gram.network paths that might be API
    "/api/user",
    "/api/mining",
    "/api/tasks",
    "/api/claim",
    "/api/start",
    "/api/status",
    "/api/me",
    "/me",
    "/me/balance",
    "/me/info",
    # Some Telegram mini-apps use these
    "/auth/telegram",
    "/user/telegram",
    "/api/telegram",
]

print("=== Deep scan ===")
for path in paths:
    try:
        r = requests.post(url + path, headers=headers, json={"initData": "test"}, timeout=5)
        if r.status_code not in [404, 502, 405]:
            body = r.text[:100].replace("\n", " ")
            print(f">>> {path}: {r.status_code} {body}")
        elif r.status_code == 502:
            try:
                d = r.json()
                if "results" in d:
                    for res in d["results"]:
                        if res.get("status") and res["status"] not in [200, 404, 405]:
                            print(f">>> {path} via {res['endpoint']}: {res['status']}")
            except:
                pass
    except:
        pass

print("\nDone.")
