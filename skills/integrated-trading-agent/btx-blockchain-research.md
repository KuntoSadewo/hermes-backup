# BTX Blockchain — Initial Research (2026-07-10)

## What is BTX?
Layer-1 blockchain designed for post-quantum era + AI infrastructure. Very early — genesis 19 March 2026 (~4 months old at research time).

## Key Technical Specs
- **Consensus:** MatMul Proof-of-Work (512×512 matrix multiplication over M31/Mersenne prime)
- **Block time:** 90 seconds target
- **Difficulty:** ASERT (per-block adjustment)
- **Cryptography:** Post-quantum from genesis
  - ML-DSA-44 (FIPS 204) — routine signatures
  - SLH-DSA-128s (FIPS 205) — recovery keys
- **Privacy:** SMILE v2 lattice-based confidential transactions (shielded pool)
- **Version:** v0.32.12

## Why It's Interesting
- Mining hardware = AI training hardware (GPU/CUDA). "Productive" mining — not wasted hash
- Post-quantum from day 1 — no migration needed later
- Layered settlement — base layer for banks, exchanges, bridges, AI agents
- Bounded authority — spend policies committed at output creation

## Mining Requirements
- Linux x86_64, Linux aarch64, Mac arm64
- CUDA12 support (GPU mining)
- Build from source (CMake)
- Fast-start snapshot (v9) available

## Site Fit Profiles
1. Solo Evaluator — lab/independent miner
2. Apple/Small GPU Shop
3. Managed Fleet
4. Pool/Integrator

## Status (as of research)
- No known exchange listing yet
- No price discovery
- Community size unknown
- Website: https://btx.dev
- GitHub: linked from site (not directly accessible at research time)
- Whitepapers: "The Protocol of Record" (9 pages) + "Specification Document" (5 pages) — PDFs on site

## Relevance to User
- User interested in GPU cloud rental (RTX 4090/5090) for crypto mining
- BTX mining uses same hardware as AI training — dual-use potential
- Very early = high risk/high reward
- Need to monitor: exchange listings, community growth, mining profitability

## TODO
- [ ] Download and test build on VPS
- [ ] Check mining difficulty and expected rewards
- [ ] Monitor for exchange listings
- [ ] Read whitepapers in detail
