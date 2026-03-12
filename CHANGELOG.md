# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to a custom versioning scheme where the major version represents Node.js compatibility.

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
