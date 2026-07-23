# Cloudflare Worker Proxy Client untuk Gram Network
# Ganti PROXY_URL dengan URL worker lu

import requests
import json

# ─── CONFIG ───
PROXY_URL = "https://gram-proxy.<your-subdomain>.workers.dev"  # Ganti ini!
PROXY_SECRET = "gram-proxy-secret"  # Ganti dengan SECRET di Worker

class GramProxyClient:
    def __init__(self, proxy_url=PROXY_URL, secret=PROXY_SECRET):
        self.proxy_url = proxy_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {secret}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
    
    def _request(self, method, path, **kwargs):
        """Forward request ke Cloudflare Worker"""
        url = f"{self.proxy_url}{path}"
        
        try:
            resp = self.session.request(method, url, **kwargs)
            return resp.json() if resp.content else {}
        except Exception as e:
            return {"error": str(e)}
    
    # ─── Gram Network API Methods ───
    
    def get_user_info(self, init_data):
        """Get user info"""
        return self._request("POST", "/v1/user/info", 
            json={"initData": init_data})
    
    def start_mining(self, init_data):
        """Start mining session"""
        return self._request("POST", "/v1/mining/start",
            json={"initData": init_data})
    
    def claim_mining(self, init_data):
        """Claim mining rewards"""
        return self._request("POST", "/v1/mining/claim",
            json={"initData": init_data})
    
    def get_balance(self, init_data):
        """Get GRM balance"""
        return self._request("POST", "/v1/user/balance",
            json={"initData": init_data})
    
    def get_tasks(self, init_data):
        """Get available tasks"""
        return self._request("POST", "/v1/tasks/list",
            json={"initData": init_data})
    
    def complete_task(self, init_data, task_id):
        """Complete a task"""
        return self._request("POST", "/v1/tasks/complete",
            json={"initData": init_data, "taskId": task_id})


# ─── TEST ───
if __name__ == "__main__":
    client = GramProxyClient()
    
    # Test dengan initData dummy
    test_init_data = "test_data_here"
    
    print("Testing proxy connection...")
    result = client.get_balance(test_init_data)
    print(f"Result: {json.dumps(result, indent=2)}")
