---
title: TUI Dashboard
teleport:
  file: src/app/app.tsx
  line: 28
  highlight: AppContent
---

# Dashboard Layout

The `AppContent` component at line 28 is the main TUI dashboard. It renders a `SystemHeader` showing uptime, host count, CA trust status, and proxy state, followed by either a `TrafficTable` with `SummaryBar` (list view) or a `DetailInspector` (detail view).

## How it works

The dashboard connects five context providers: `TrafficProvider` collects request entries from the proxy worker, `RoutesProvider` manages route config with live reload, `HostsProvider` tracks active domains via the daemon, `ProxyProvider` controls the worker lifecycle, and `UIStateProvider` manages view mode and overlays.

## What to expect

Three overlay modes are available: `RouteConfig` for editing routes, `MockPicker` for selecting mock variants, and `LatencyInput` for setting global latency. The content area height is computed dynamically based on terminal rows minus chrome overhead. Press `o` to teleport.
