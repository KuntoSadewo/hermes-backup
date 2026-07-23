#!/usr/bin/env python3
import requests
import json

# Test the Cloudflare Worker proxy
PROXY_URL = "https://gram-proxy.sadewo.workers.dev"
SECRET = "gram-proxy-sadewo-2026"

headers = {
    "Authorization": f"Bearer {SECRET}",
    "Content-Type": "application/json"
}

# Test 1: GET request
print("=== Test 1: GET / ===")
try:
    resp = requests.get(f"{PROXY_URL}/", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text[:200]}")
    if "X-Proxy-Endpoint" in resp.headers:
        print(f"Proxy Endpoint: {resp.headers['X-Proxy-Endpoint']}")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test 2: POST /v1/user/balance ===")
try:
    resp = requests.post(f"{PROXY_URL}/v1/user/balance", 
        headers=headers,
        json={"initData": "test"},
        timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text[:200]}")
    if "X-Proxy-Endpoint" in resp.headers:
        print(f"Proxy Endpoint: {resp.headers['X-Proxy-Endpoint']}")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test 3: POST /api/v1/user/balance ===")
try:
    resp = requests.post(f"{PROXY_URL}/api/v1/user/balance", 
        headers=headers,
        json={"initData": "test"},
        timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text[:200]}")
    if "X-Proxy-Endpoint" in resp.headers:
        print(f"Proxy Endpoint: {resp.headers['X-Proxy-Endpoint']}")
except Exception as e:
    print(f"Error: {e}")
