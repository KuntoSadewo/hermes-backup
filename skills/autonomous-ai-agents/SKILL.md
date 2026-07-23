---
name: ai-coding-agents
description: "AI coding agent delegation umbrella: Claude Code, Codex, OpenCode, and Kanban agent lanes."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [AI-Agents, Coding, Delegation, Codex, Claude-Code, OpenCode, Kanban]
---

# AI Coding Agents

Use this umbrella when the user wants Hermes to delegate implementation, reviews, or isolated coding lanes to another CLI coding agent. Hermes remains responsible for scoping, verification, reconciliation, and final communication.

## Claude Code

Absorbs `claude-code`: delegate coding features or PR work to Claude Code CLI when available.

## Codex

Absorbs `codex`: delegate implementation or review work to OpenAI Codex CLI while preserving sandbox and approval constraints.

## OpenCode

Absorbs `opencode`: delegate features or PR review to OpenCode CLI.

## Kanban Codex Lane

Absorbs `kanban-codex-lane`: run Codex as an isolated Kanban implementation lane while Hermes owns task lifecycle and handoff.
