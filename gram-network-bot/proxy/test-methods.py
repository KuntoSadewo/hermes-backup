#!/usr/bin/env python3
import requests

PROXY_URL = "https://gram-proxy.sadewo.workers.dev"
SECRET=*** = {
    "Authorization": "Bearer ***    "Content-Type": "application/json"
}

# Test with GET for 405 paths
paths_get = [
    "/v1/user/balance",
    "/v1/mining/start",
    "/v1/mining/claim",
    "/graphql",
]

print("=== Testing GET requests ===")
for path in paths_get:
    try:
        resp = requests.get(PROXY_URL + path,
            headers=headers,
            timeout=5)
        body = resp.text[:100].replace("\n", " ")
        print(f"GET {path}: {resp.status_code} {body}")
    except Exception as e:
        print(f"GET {path}: ERROR {e}")

print("\n=== Testing POST with different content types ===")
# Try with form data
for path in ["/v1/user/balance", "/graphql"]:
    try:
        resp = requests.post(PROXY_URL + path,
            headers={"Authorization": "Bearer ***            data={"initData": "test"},
            timeout=5)
        body = resp.text[:100].replace("\n", " ")
        print(f"POST form {path}: {resp.status_code} {body}")
    except Exception as e:
        print(f"POST form {path}: ERROR {e}")
