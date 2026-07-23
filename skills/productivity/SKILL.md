---
name: apple-ecosystem-automation
description: "Apple ecosystem automation: Notes, Reminders, Find My, iMessage, and macOS computer-use workflows."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [macos]
metadata:
  hermes:
    tags: [Apple, macOS, Notes, Reminders, iMessage, FindMy, Automation]
---

# Apple Ecosystem Automation

Use this umbrella when the user asks Hermes to work with local Apple apps, personal Mac state, or Apple-device services. Prefer app-specific CLIs or AppleScript/Shortcuts where available, and preserve privacy by reading only the requested scope.

## Notes

Use the former `apple-notes` workflow for searching, creating, and updating Apple Notes. Confirm the target folder/account before broad writes, and quote note titles exactly when editing.

## Reminders

Use the former `apple-reminders` workflow for creating tasks, listing reminders, and managing due dates. Normalize dates/time zones before writing reminders.

## Find My

Use the former `findmy` workflow for device/item location checks. Treat locations as sensitive and do not expose them outside the user's requested channel.

## iMessage

Use the former `imessage` workflow for local Messages access and composition. Never send without explicit user intent and recipient verification.

## macOS Computer Use

Use the former `macos-computer-use` workflow for GUI automation on the user's Mac. Prefer scriptable APIs first; use screen interaction only when app APIs are unavailable.
