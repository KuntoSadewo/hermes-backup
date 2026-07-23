---
name: kanban-agent-operations
description: "Kanban agent operations umbrella: orchestrator decomposition, worker execution, and webhook-triggered task runs."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Kanban, Orchestration, Workers, Webhooks, DevOps]
---

# Kanban Agent Operations

Use this umbrella for Hermes Kanban task routing and event-driven worker operations. Keep role boundaries explicit: orchestrators decompose and route, workers execute assigned scope, and webhooks trigger bounded runs.

## Orchestrator Playbook

Absorbs `kanban-orchestrator`: decompose tasks, avoid doing worker work directly, assign lanes, and reconcile outputs.

## Worker Playbook

Absorbs `kanban-worker`: follow worker lifecycle, handle edge cases, and report verifiable completion.

## Event-Driven Runs

Absorbs `webhook-subscriptions`: wire webhook subscriptions to agent runs and keep triggers idempotent.
