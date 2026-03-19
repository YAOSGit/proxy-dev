---
title: Mock System
teleport:
  file: src/proxy/server.ts
  line: 155
  highlight: mockVariant
---

# File-Backed Mock Variants

The mock handling begins at line 155 in the request handler. When a `mockVariant` is resolved for a route (via `getMockVariant`), the server reads the mock file from disk, strips any `_mock` metadata key, and serves it as JSON with configurable status codes and headers.

## How it works

Mock variants can be set globally in the config or overridden at runtime via the `set-mock` IPC command. The `getMockVariant` function at line 37 checks runtime overrides first, then falls back to the route's configured active variant. Setting a variant to `null` explicitly disables mocking for that route.

## Data flow

Latency simulation is applied to both mock and live responses via `resolveLatency`, which merges route-level, global, and variant-level latency values. Traffic entries are tagged as `MOCK` or `LIVE` for the TUI dashboard. Press `o` to teleport.
