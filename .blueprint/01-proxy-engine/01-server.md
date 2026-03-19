---
title: HTTPS Proxy Worker
teleport:
  file: src/proxy/server.ts
  line: 53
  highlight: startServer
---

# HTTPS Proxy Server

The `startServer` function at line 53 creates an HTTPS server inside a worker thread. It uses SNI callbacks to dynamically load per-domain TLS certificates from a leaves directory, with an LRU cache capped at 100 contexts.

## How it works

The `requestHandler` (line 121) matches incoming requests against configured routes using `matchRoute`. For matched routes, it either serves a mock response or proxies to the target localhost port. Unmatched requests get a styled 404 page listing available routes.

## Key functions

The server listens on an OS-assigned port (port 0) so multiple instances can coexist. It reports its assigned port back to the parent thread via an IPC `ready` event. The daemon's SNI router on port 443 then forwards traffic here. Press `o` to teleport.
