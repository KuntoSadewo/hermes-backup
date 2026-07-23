---
name: software-development-workflows
description: "Software development workflow umbrella: planning, spikes, TDD, debugging, subagents, code review, and runtime debuggers."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Software-Development, Planning, Debugging, Testing, Code-Review, Subagents]
---

# Software Development Workflows

## Absorbed QA workflow

- `dogfood`: exploratory web-app QA with browser tools, console checks, annotated screenshots, issue taxonomy, evidence capture, and structured bug reports. Use it as the manual testing subsection of the broader development workflow rather than a standalone one-off skill.

Use this umbrella for class-level engineering process guidance. Select the subsection that matches the phase of work, and keep the loop tight: understand, plan, change, verify, and communicate.

## Planning And Spikes

Absorbs `plan`, `writing-plans`, and `spike`: write implementation plans to concrete files/tasks, or run throwaway experiments before committing to architecture.

## Test-Driven Development

Absorbs `test-driven-development`: follow RED-GREEN-REFACTOR when the task benefits from explicit behavioral guarantees.

## Systematic Debugging

Absorbs `systematic-debugging`: reproduce, localize, explain root cause, then patch. Do not guess-fix before understanding the failure mode.

## Runtime Debuggers

Absorbs `python-debugpy` and `node-inspect-debugger`: use pdb/debugpy for Python and `--inspect`/CDP for Node.js when logs are insufficient.

## Subagent Execution

Absorbs `subagent-driven-development`: split independent work into delegated lanes, verify child outputs, and reconcile before finalizing.

## Review Request Preparation

Absorbs `requesting-code-review`: run security/quality gates before asking for review, and fix obvious issues first.
