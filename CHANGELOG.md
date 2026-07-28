# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to a custom versioning scheme where the major version represents Node.js compatibility.

## [226.1.0] - 2026-07-28

### Added
- `proxy-dev daemon start` — authorize and spawn the hosts daemon on its own (the single sudo
  step). Once the daemon is up, `proxy-dev start` runs sudo-free, so the proxy can start from
  environments that cannot prompt for a password (run-tui panes, editors, CI wrappers).

### Changed
- Daemon bootstrap extracted from `setup()` into a shared `ensureHostsDaemon()` used by both
  `start` and `daemon start` (behavior unchanged for `start`).

## [126.1.0] - 2026-03-19

### Added
- CLI e2e tests for all command groups: trust, daemon, routes, groups, mock, flags (32 new tests)
- `SystemHeader` uses `width="100%"` for full-width rendering

### Changed
- Hardcoded colors extracted to `.consts.ts` (TrafficTable, SummaryBar, RouteConfig, MockPicker, LatencyInput)
- `ConfirmDialog`, `DetailInspector`, `ErrorBoundary` use `theme` properties
- Context initialization uses `null` (not `undefined`)
- `interface` for non-Props types converted to `type`
- Non-null assertions replaced with optional chaining
- Internal function declarations converted to const arrows
- Existing e2e tests annotated as "(integration)" with cross-references to new CLI tests
- Toolkit bumped to 0.0.26-3-19a
- Biome updated to 2.4.8

### Fixed
- `httpsServer!.address()` → `httpsServer?.address() ?? null`

## [126.0.0] - 2026-03-10

### Added
- HTTPS reverse proxy with automatic CA and leaf certificate generation
- TUI dashboard with traffic inspector, mock picker, latency controls, and route config
- Mock system with per-route variants and snapshot-to-mock (`s` key)
- Hosts daemon for automatic /etc/hosts management via Unix socket
- CLI for trust management across system, Node, Python, Java, Deno, OpenSSL, and Firefox
- Global + local config system with merged mode
- Path-based routing with most-specific-first matching
- HTTPS upgrade mode for plain HTTP backends
- Three-tier examples (basic, custom, integration)
