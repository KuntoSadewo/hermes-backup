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

# Try various API paths that Gram Network might use
paths = [
    # Mining
    "/api/mining/start",
    "/api/mining/claim",
    "/api/mining/status",
    "/mining/start",
    "/mining/claim",
    "/mining/status",
    # User
    "/api/user/info",
    "/api/user/balance",
    "/user/info",
    "/user/balance",
    # Tasks
    "/api/tasks",
    "/api/tasks/list",
    "/tasks",
    "/tasks/list",
    # Auth
    "/api/auth/login",
    "/api/auth/init",
    "/auth/login",
    "/auth/init",
    # GraphQL
    "/graphql",
    "/api/graphql",
]

print("=== Scanning endpoints ===")
for path in paths:
    for method in ["GET", "POST"]:
        try:
            r = requests.request(method, url + path, headers=headers, 
                json={"initData": "test"}, timeout=5)
            if r.status_code not in [404, 502]:
                body = r.text[:80].replace("\n", " ")
                print(f"{method} {path}: {r.status_code} {body}")
        except:
            pass
