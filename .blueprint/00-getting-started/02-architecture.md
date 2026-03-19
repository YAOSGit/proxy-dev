---
title: Three-Process Architecture
teleport:
  file: src/app/tui.tsx
  line: 10
  highlight: runTUI
---

# Three-Process Model

proxy-dev uses three cooperating processes: the **CLI** parses commands and launches either headless or TUI mode, the **TUI** (this file, line 10) renders an interactive Ink dashboard, and the **Worker** runs the actual HTTPS proxy server in a separate thread.

## How it works

The TUI process at `runTUI` calls `setup()` to resolve routes, generate leaf certificates, and ensure the daemon is running. Then it renders the `App` component which connects providers for traffic, routes, hosts, and proxy state. The proxy worker communicates with the TUI via `parentPort` messages (start, update-routes, set-mock, stop).

## Data flow

A fourth process, the **Daemon**, runs with elevated privileges on ports 443/80. It performs SNI-based TCP routing to direct traffic to the correct proxy worker instance. Press `o` to teleport.
