#!/usr/bin/env python3
import requests

PROXY_URL = "https://gram-proxy.sadewo.workers.dev"
SECRET = "gram-proxy-sadewo-2026"
headers = {
    "Authorization": "Bearer " + SECRET,
    "Content-Type": "application/json"
}

paths = [
    "/api/v1/user/balance",
    "/api/v1/mining/start",
    "/api/v1/mining/claim",
    "/api/v1/tasks",
    "/v1/user/balance",
    "/v1/mining/start",
    "/v1/mining/claim",
    "/api/user/balance",
    "/api/mining/start",
    "/api/mining/claim",
    "/graphql",
    "/api/graphql",
]

print("=== Scanning API endpoints ===")
for path in paths:
    try:
        resp = requests.post(PROXY_URL + path,
            headers=headers,
            json={"initData": "test"},
            timeout=5)
        body = resp.text[:80].replace("\n", " ")
        print(f"{path}: {resp.status_code} {body}")
    except Exception as e:
        print(f"{path}: ERROR {e}")
