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

# Try different path patterns
paths = [
    # Telegram Web App patterns
    "/api/v1/user/info",
    "/api/v1/user/balance",
    "/api/v1/mining/start",
    "/api/v1/mining/claim",
    "/api/v1/tasks",
    # REST patterns
    "/user/info",
    "/user/balance",
    "/mining/start",
    "/mining/claim",
    "/tasks",
    # GraphQL
    "/graphql",
    "/api/graphql",
    # Other patterns
    "/api/user",
    "/api/mining",
    "/api/tasks",
]

print("=== Testing different path patterns ===")
for path in paths:
    try:
        # Try with initData in different formats
        for data_format in [
            {"initData": "test"},
            {"data": "test"},
            {"token": "test"},
            {},
        ]:
            r = requests.post(url + path, headers=headers, json=data_format, timeout=5)
            if r.status_code not in [404, 502]:
                body = r.text[:100].replace("\n", " ")
                print(f"POST {path} {data_format}: {r.status_code} {body}")
                break
    except Exception as e:
        print(f"POST {path}: ERROR {e}")
