---
title: SNI Daemon
teleport:
  file: src/daemon/server.ts
  line: 144
  highlight: startDaemonServer
---

# Privileged SNI Router

The `startDaemonServer` function at line 144 runs with elevated privileges and manages three servers: a TCP router on port 443, an HTTP redirect server on port 80, and a Unix socket IPC server for commands.

## How it works

The TCP router (line 162) peeks at the first TLS ClientHello chunk to extract the SNI hostname via `extractSNI` (line 27), then forwards the raw TCP stream to the registered proxy worker port. It never terminates TLS itself -- it only reads the unencrypted handshake header. The HTTP server on port 80 issues 301 redirects to HTTPS.

## Key functions

The IPC server handles commands like `add`/`remove` (manage /etc/hosts entries), `register`/`unregister` (map domains to proxy ports), `cleanup`, and `shutdown`. On shutdown, it cleans up all /etc/hosts entries it created. Press `o` to teleport.
