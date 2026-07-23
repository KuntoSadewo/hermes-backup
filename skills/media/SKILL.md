---
name: media-content-workflows
description: "Media content umbrella: GIF search, YouTube repurposing, Spotify control, music generation, songwriting, and audio analysis."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Media, Audio, Music, YouTube, Spotify, GIF]
---

# Media Content Workflows

Use this umbrella when the user asks to find, transform, generate, analyze, or control media. Preserve licensing/source context and prefer reversible edits or generated drafts unless the user asks to publish.

## GIFs And Short Visual Media

Absorbs `gif-search`: search and download GIFs with provider APIs, preserving source attribution.

## YouTube Repurposing

Absorbs `youtube-content`: fetch transcripts and turn them into summaries, threads, blogs, or briefs.

## Music Playback And Libraries

Absorbs `spotify`: search, play, queue, and manage playlists/devices through the user's configured Spotify tooling.

## Songwriting And Generation

Absorbs `songwriting-and-ai-music` and `heartmula`: write lyrics, structure songs, and create Suno-like prompts or generated tracks.

## Audio Analysis

Absorbs `songsee`: create spectrograms and audio features such as mel, chroma, and MFCC for inspection or downstream analysis.
