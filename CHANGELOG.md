# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to a custom versioning scheme where the major version represents Node.js compatibility.

## [226.2.1] - 2026-07-28

### Fixed
- WebSocket / HTTP Upgrade requests were silently dropped — the proxy worker had no `upgrade`
  handler, so WS-dependent UIs hung forever (MinIO console object browser, Vite HMR, any
  socket-based dev tool). Upgrades now tunnel raw TCP to the target: the request head is
  replayed and both directions are piped.

## [226.2.0] - 2026-07-28

### Added
- `daemon install` reworked into a ROOT system service on both platforms — launchd
  LaunchDaemon (macOS, `launchctl bootstrap system`) and systemd unit (Linux,
  `systemctl enable --now`, `Restart=always`). One sudo at install; the daemon then
  survives crashes and reboots, retiring the once-per-boot `daemon start`. The service
  bakes `PROXY_DEV_SOCKET` in (system services have no user HOME) and `daemon install`
  hands over from a running ad-hoc daemon first. The daemon bundle is COPIED to a system
  path (`/Library/Application Support/proxy-dev` / `/usr/local/lib/proxy-dev`) — services
  must not execute from install locations: user paths churn and macOS TCC denies even
  root access to Desktop/Documents (EPERM crash-loop). The previous implementation wrote a USER
  LaunchAgent, which could never edit /etc/hosts.
- Daemon lifecycle log at `<config dir>/daemon.log` — the daemon runs detached with stdio
  ignored, so starts, signals, crashes (uncaughtException/unhandledRejection), and exits now
  leave evidence; a silently-dead daemon is finally diagnosable. Signal handlers also log
  SIGHUP/SIGTERM/SIGINT before exiting.

## [226.1.3] - 2026-07-28

### Fixed
- The daemon died when the terminal that ran `daemon start` was closed (SIGHUP via the
  inherited controlling tty). The spawn is now two-stage: sudo keeps the tty so it can
  prompt, and a root bootstrap spawns the real daemon `detached` into its own session —
  surviving Ctrl+C, CLI exit, and terminal close alike.

## [226.1.2] - 2026-07-28

### Fixed
- `daemon start` printed success and then hung the terminal — the spawned child's stderr pipe
  kept the event loop alive (`unref()` does not cover open stdio pipes); the pipe is now
  released once the daemon socket is up
- Interrupting a hung `daemon start` killed the daemon it had just started (same foreground
  process group) — fixed transitively by the hang fix: the command now exits immediately, so
  its group leaves the foreground before any Ctrl+C. Deliberately NOT `detached`: sudo reads
  the password from the controlling tty, which a detached child lacks
- Headless `start` never wrote its domains to /etc/hosts — it registered them with the
  daemon's SNI router only, so `.test`/`.local` domains resolved solely under the TUI (whose
  useHosts hook did the hosts half). Headless now calls `addHost` alongside `register`,
  matching the cleanup path that already removed hosts on exit.

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
