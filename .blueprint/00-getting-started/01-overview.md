---
title: Overview
teleport:
  file: src/app/cli.ts
  line: 40
  highlight: runCLI
---

# proxy-dev Overview

proxy-dev is a local-first HTTPS reverse proxy with SNI routing. It maps custom domains (e.g. `api.local`) to localhost ports, handling TLS termination with auto-generated certificates signed by a local CA. Routes are defined in a global config (`~/.config/proxy-dev/config.json`) and/or a local `proxy-dev.json`.

## How it works

The CLI at line 40 exposes several command groups: `trust` manages CA certificate installation across the OS and runtimes (Node, Python, Java, Deno, Firefox), `start`/`stop` control the headless proxy, `routes` and `groups` manage routing, `mock` sets file-backed mock variants, and `daemon` manages the privileged SNI router.

## What to do

Press `o` to teleport to the CLI entry point and browse the command tree.
