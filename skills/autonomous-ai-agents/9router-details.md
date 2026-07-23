# 9Router — Detailed Provider & Integration Reference

Source: https://9router.com/ (scraped Jul 2026)

## Install
```bash
npm install -g 9router
9router   # default: localhost:20128
```

## Free Providers (8)
- Kiro AI
- iFlow
- Qwen
- OpenCode Free
- OpenRouter (free tier)
- NVIDIA NIM
- Gemini (free tier)
- Cloudflare AI

## OAuth/Subscription Providers (6)
- Claude Code
- OpenAI Codex
- GitHub Copilot
- Cursor IDE
- Kilo Code
- Cline

## API Key Providers (10)
- GLM Coding ($0.60)
- Kimi ($9/mo)
- MiniMax ($0.20)
- OpenAI
- Anthropic
- DeepSeek
- Groq
- xAI Grok
- Mistral
- Azure OpenAI

## CLI/IDE Integrations (10)
Claude Code, OpenAI Codex, OpenClaw, Cursor, Cline, Kilo Code, Roo, Continue, Factory Droid, **Hermes Agent**

## 9 Service Kinds
1. Chat/LLM — 60+ providers
2. Embeddings — Voyage, Jina, OpenAI, Cohere, Mistral, NVIDIA, Together, Fireworks
3. TTS — ElevenLabs, Deepgram, Inworld, AWS Polly, Google/Edge TTS, OpenAI
4. STT — Deepgram, AssemblyAI, Whisper, Qwen
5. Image Gen — Fal, Stability, BFL Flux, Recraft, OpenAI, Gemini, MiniMax
6. Vision — OpenAI, Gemini, Anthropic, Groq, xAI, Mistral, HuggingFace
7. Video Gen — Runway ML, Topaz
8. Web Search — Tavily, Brave, Serper, Exa, Linkup, Perplexity, Google PSE, SearchAPI
9. Web Fetch — Tavily, Exa, Firecrawl, Jina Reader

## Token Saving
- RTK (Request Token Killer) — strips unnecessary tokens
- Caveman — compresses prompts
- Claimed savings: 20–65%

## MITM Bridge
Can intercept IDE subscription traffic (Antigravity, GitHub Copilot, Kiro IDE) and route through 9Router to any backend. Check each tool's policy before using.

## Pitfalls
- Needs Node.js installed
- FREE tier may have per-provider rate limits
- OAuth providers need browser-based auth (headless won't work for initial auth)
- Always verify endpoint is running: `curl http://localhost:20128/v1/models`
