// Cloudflare Worker Proxy untuk Gram Network
// Base URL: https://app.gramnetwork.online

const GRAM_API_BASE = "https://app.gramnetwork.online";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Auth check
    const authHeader = request.headers.get("Authorization");
    const expectedAuth = `Bearer ${env.SECRET || "gram-proxy-secret"}`;
    
    if (authHeader !== expectedAuth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUrl = `${GRAM_API_BASE}${url.pathname}${url.search}`;
    
    const headers = new Headers();
    headers.set("User-Agent", "Mozilla/5.0 (Linux; Android 13) GramNetworkBot/1.0");
    headers.set("Origin", GRAM_API_BASE);
    headers.set("Referer", GRAM_API_BASE + "/");

    let body = undefined;
    
    if (request.method !== "GET" && request.method !== "HEAD") {
      const rawBody = await request.text();
      const contentType = request.headers.get("Content-Type") || "";
      
      if (contentType.includes("json")) {
        // Convert JSON to form-urlencoded
        try {
          const jsonBody = JSON.parse(rawBody);
          const params = new URLSearchParams(jsonBody);
          body = params.toString();
          headers.set("Content-Type", "application/x-www-form-urlencoded");
        } catch (e) {
          body = rawBody;
          headers.set("Content-Type", contentType);
        }
      } else {
        body = rawBody;
        headers.set("Content-Type", contentType || "application/x-www-form-urlencoded");
      }
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: body,
      });

      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
      }
      
      responseHeaders.set("X-Proxy-Endpoint", GRAM_API_BASE);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Proxy error", message: error.message, target: targetUrl }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  },
};
