Finance/trading skill at ~/.hermes/skills/finance-research. Use finance-research-trading for market research/read-only; combine with hermes-crypto-agent for live crypto execution.
§
Environment: TZ Asia/Jakarta (WIB UTC+7), format "Mon 27 Apr 2026 01:00:00 WIB". SOUL.md at ~/.hermes/SOUL.md. PEP 668 — always use venv. MIMO primary (provider=custom, base_url=https://api.xiaomimimo.com/v1). "xiaomi" as provider causes retry loops.
§
Browser-agent skill at ~/.hermes/skills/browser-agent. Playwright/CloakBrowser, extension control, WalletConnect, governed signing. No CAPTCHA solving; side-effect actions need confirm.
§
Integrated stack skill created at ~/.hermes/skills/integrated-trading-agent/SKILL.md. It routes finance-research + hermes-crypto-agent + browser-agent + x-actions + jupiter-bot into one workflow for news-driven crypto trading/airdrop/browser/on-chain automation with dry-run/governor/confirm safety.
§
Jangan pernah minta user kirim API key di chat — arahkan ke file lokal dengan chmod 600. Jangan claim jadi model/provider tertentu kalau nggak yakin; user koreksi 2x sebelumnya (salah bilang "bukan Claude" lalu salah bilang "gw MIMO"). Cek config sebelum jawab identitas model.
§
Gram Network on VPS (~/gram-network-vps/) via CF Worker proxy. Smart claim mode: wait for finish → claim → start new, auto energy boost. Balance 28.2 GRM. All crons removed (user request). initData expires ~24h (refresh via update-gram-init.sh). BUGS FIXED: `mining_status` (string) not `mining_active`; claim timing miss; energy depleted. BTX (btx.dev) interest: post-quantum MatMul PoW GPU mining. GPU cloud: Vast.ai/RunPod/TensorDock SG.
§
Gram Network bot (~/gram-network-vps/) key bugs fixed 2026-07-11: (1) mining_status string vs mining_active boolean, (2) claim timing race — smart wait using time_left_seconds, (3) auto energy boost on depletion. Runs as systemd service gram-miner.service.
§
Camofox browser installed ~/camofox-browser, systemd service camofox.service port9377. Stealth headless Firefox fork for Cloudflare/bypass. API: POST /tabs, GET /tabs/:id/snapshot, POST /tabs/:id/click.