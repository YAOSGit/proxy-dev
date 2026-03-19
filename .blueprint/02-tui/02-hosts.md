---
title: Hosts Management
teleport:
  file: src/daemon/client.ts
  line: 4
  highlight: DaemonClient
---

# Automatic /etc/hosts Management

The `DaemonClient` class at line 4 communicates with the privileged daemon over a Unix socket. Each method sends a JSON command and waits for a JSON response, with a 5-second timeout per request.

## Key functions

The client exposes `addHost` and `removeHost` to insert/remove `127.0.0.1 <domain>` entries in `/etc/hosts`, `register`/`unregister` to map domains to proxy worker ports in the daemon's SNI route registry, and `listHosts` to query current entries. The `cleanup` method removes all proxy-dev entries at once.

## How it works

The TUI's `HostsProvider` uses this client to automatically add hosts entries when routes are configured and remove them on shutdown. Each command creates a fresh socket connection (no persistent connection), making the client safe against daemon restarts. Press `o` to teleport.
