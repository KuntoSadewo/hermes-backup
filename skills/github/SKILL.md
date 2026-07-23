---
name: github-collaboration
description: "GitHub collaboration umbrella: auth, repo management, issues, pull requests, review, and codebase inspection."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [GitHub, Git, Pull-Requests, Issues, Code-Review, Repos]
---

# GitHub Collaboration

Use this umbrella for end-to-end GitHub work. Pick the narrow subsection that matches the user request, but keep the full repository lifecycle in view: authenticate, inspect, branch, change, review, open/triage PRs, monitor CI, and merge.

## Authentication

Absorbs `github-auth`: set up `gh`, HTTPS tokens, SSH keys, credential helpers, and token discovery. Verify auth before writes with `gh auth status` or a minimal API call.

## Repository Management

Absorbs `github-repo-management`: clone, create, fork, configure remotes, manage releases, and inspect repository metadata. Never overwrite an existing remote or branch without checking current state.

## Issues

Absorbs `github-issues`: create, triage, label, assign, comment on, and close issues through `gh issue` or REST. Preserve issue numbers and quote labels exactly.

## Pull Request Workflow

Absorbs `github-pr-workflow`: branch, commit, push, open PRs, check CI, repair failures, and merge. Prefer `gh`; fall back to REST/curl when `gh` is unavailable.

## Code Review

Absorbs `github-code-review` and `requesting-code-review`: inspect diffs first, identify bugs/regressions/security risks before style notes, and include file/line references. Use inline PR comments only when the user asks to post them.

## Codebase Inspection

Absorbs `codebase-inspection`: quantify languages, LOC, ownership hotspots, and dependency shape before large reviews or migration planning.
