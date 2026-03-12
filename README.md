<p align="center">
  <a href="https://github.com/YAOSGit/proxy-dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/YAOSGit/.github/main/profile/images/proxy-dev.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/YAOSGit/.github/main/profile/images/proxy-dev-light.svg">
      <img src="https://raw.githubusercontent.com/YAOSGit/.github/main/profile/images/proxy-dev.svg" width="100%" alt="proxy-dev" />
    </picture>
  </a>
</p>

<p align="center">
  <strong>A local-first reverse proxy and interceptor CLI with a TUI dashboard</strong>
</p>

<div align="center">

![Node Version](https://img.shields.io/badge/NODE-18+-16161D?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=%235FA04E)
![TypeScript Version](https://img.shields.io/badge/TYPESCRIPT-5.9-16161D?style=for-the-badge&logo=typescript&logoColor=white&labelColor=%233178C6)
![React Version](https://img.shields.io/badge/REACT-19.2-16161D?style=for-the-badge&logo=react&logoColor=black&labelColor=%2361DAFB)

![Uses Ink](https://img.shields.io/badge/INK-16161D?style=for-the-badge&logo=react&logoColor=white&labelColor=%2361DAFB)
![Uses Vitest](https://img.shields.io/badge/VITEST-16161D?style=for-the-badge&logo=vitest&logoColor=white&labelColor=%236E9F18)
![Uses Biome](https://img.shields.io/badge/BIOME-16161D?style=for-the-badge&logo=biome&logoColor=white&labelColor=%2360A5FA)

</div>

---

## Table of Contents

### Getting Started

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)
- [TUI Keyboard Shortcuts](#tui-keyboard-shortcuts)
- [Examples](#examples)

### Configuration

- [Global Config](#global-config)
- [Local Config](#local-config)

### Development

- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Versioning](#versioning)
- [Style Guide](#style-guide)

---

## Overview

**yaos-proxy-dev** is a local-first reverse proxy and interceptor CLI with a TUI dashboard. It allows you to intercept HTTPS traffic from your local domains, toggle mock responses, inject latency, and snapshot live responses — all without modifying your app code.

### What Makes This Project Unique

- **HTTPS reverse proxy**: Route local domains to backend ports via on-the-fly TLS certs
- **Mock toggling**: Switch routes between live and mock responses per request
- **Latency injection**: Simulate network conditions globally or per-route
- **Response snapshots**: Capture live responses as mock files with one keystroke
- **TUI dashboard**: Real-time traffic log, request/response inspector, overlay controls
- **CA management**: Generates and optionally trusts a local CA certificate

---

## Installation

### Prerequisites

- Node.js >= 18
- `openssl` in PATH (standard on macOS/Linux)

```bash
# Install globally from npm
npm install -g @yaos-git/proxy-dev

# Or install as a dev dependency
npm install -D @yaos-git/proxy-dev
```

### From Source

```bash
# Clone the repository
git clone https://github.com/YAOSGit/proxy-dev.git
cd proxy-dev

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

---

## Quick Start

1. Generate a global configuration and a CA certificate:

```sh
proxy-dev trust init
```

> **Note:** This automatically creates `~/.config/proxy-dev/config.json` and a CA certificate at `~/.config/proxy-dev/certs/`.

2. Trust the CA in your OS (macOS example):

```sh
proxy-dev trust system
```

3. Add a route (e.g., mapping `api.local` to localhost port `3001`):

```sh
proxy-dev routes add api.local 3001
```

4. Start the proxy:

```sh
# Headless mode (logs to stdout)
proxy-dev start

# TUI dashboard (interactive)
proxy-dev-tui
```

---

## CLI Usage

| Command | Description |
|---|---|
| `proxy-dev trust init` | Bootstrap global config and generate CA cert |
| `proxy-dev trust system` | Add CA to OS trust store (browsers, curl, etc.) |
| `proxy-dev trust status` | Show trust status for system and runtimes |
| `proxy-dev start` | Start proxy in headless mode (stdout logging) |
| `proxy-dev stop` | Stop a running proxy-dev instance |
| `proxy-dev-tui` | Launch the interactive TUI dashboard |
| `proxy-dev routes list` | List all configured routes |
| `proxy-dev routes add <domain> <port>` | Add a route (use `-g <group>` and `-p <path>`) |
| `proxy-dev routes remove <domain>` | Remove a route |
| `proxy-dev groups activate <name>` | Activate a route group locally |
| `proxy-dev groups deactivate <name>` | Deactivate a route group locally |
| `proxy-dev mock <route> <variant>` | Set active mock variant (use `--off` for live) |
| `proxy-dev daemon status` | Check if hosts daemon is running |
| `proxy-dev daemon stop` | Stop the hosts daemon |

> Additional trust subcommands: `proxy-dev trust firefox`, `node`, `python`, `java`, `deno`, `openssl`

---

## TUI Keyboard Shortcuts

| Key | Context | Action |
|---|---|---|
| `↑` / `↓` | Traffic table | Navigate requests |
| `Enter` | Traffic table | Open detail inspector |
| `Esc` | Detail / overlay | Go back |
| `Tab` | Detail inspector | Switch request ↔ response |
| `↑` / `↓` | Detail inspector | Scroll active pane |
| `m` | Traffic table | Open mock picker |
| `s` | Traffic table | Snapshot response as mock |
| `t` | Traffic table | Set latency |
| `c` | Any | Route config screen |
| `x` | Traffic table | Clear traffic log |
| `h` | Any | Help menu |
| `q` | Any | Quit |

**Route config screen shortcuts:**

| Key | Action |
|---|---|
| `↑` / `↓` | Navigate items |
| `Enter` | Select / toggle group |
| `g` | Toggle group activation |
| `s` | Toggle HTTPS upgrade |
| `d` | Delete route or group |
| `Esc` | Close |

---

## Examples

The `examples/` directory contains ready-to-run configurations at three levels of complexity:

| Example | What it demonstrates |
|---------|---------------------|
| [`basic/`](examples/basic/) | Single route group, minimal config, one backend |
| [`custom/`](examples/custom/) | Mock variants, global latency, path-based routing |
| [`integration/`](examples/integration/) | Three-service architecture with full mock coverage and workflow scripts |

The basic example uses local config only (`proxy-dev.json`). Custom and integration demonstrate the global + local config split used in real projects.

---

## Configuration

### Global Config

The global configuration file lives at `~/.config/proxy-dev/config.json`.

```json
{
  "version": 1,
  "port": 443,
  "groups": {
    "services": {
      "description": "Local microservices",
      "routes": [
        { "domain": "api.local", "target": 3001 },
        { "domain": "api.local", "path": "/auth", "target": 3002 }
      ]
    }
  },
  "latency": { "globalMs": 0 }
}
```

### Local Config

The local configuration file lives in your project root at `./proxy-dev.json`.

```json
{
  "activeGroups": ["services"],
  "mocks": {
    "api.local/users": {
      "variants": {
        "success": { "file": "./mocks/api.local/users/success.json", "status": 200 },
        "empty":   { "file": "./mocks/api.local/users/empty.json",   "status": 200 }
      },
      "active": "success"
    }
  },
  "latency": { "globalMs": 100 }
}
```

---

## Available Scripts

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run TypeScript build in watch mode |
| `npm run dev:typescript` | Run TypeScript type checking in watch mode |

### Build Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Bundle the CLI with esbuild |

### Lint Scripts

| Script | Description |
|--------|-------------|
| `npm run lint` | Run type checking, linting, formatting, and audit |
| `npm run lint:check` | Check code for linting issues with Biome |
| `npm run lint:fix` | Check and fix linting issues with Biome |
| `npm run lint:format` | Format all files with Biome |
| `npm run lint:types` | Run TypeScript type checking only |
| `npm run lint:audit` | Run npm audit |

### Testing Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests (unit, react, types, e2e) |
| `npm run test:unit` | Run unit tests |
| `npm run test:react` | Run React component tests |
| `npm run test:types` | Run TypeScript type tests |
| `npm run test:e2e` | Run end-to-end tests |

---

## Tech Stack

### Core

- **[React 19](https://react.dev/)** - UI component library
- **[Ink 6](https://github.com/vadimdemedes/ink)** - React for CLIs
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Commander](https://github.com/tj/commander.js)** - CLI argument parsing
- **[http-proxy](https://github.com/http-party/node-http-proxy)** - Programmable proxying library
- **[zod](https://zod.dev/)** - TypeScript-first schema validation

### Build & Development

- **[esbuild](https://esbuild.github.io/)** - Fast bundler
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Biome](https://biomejs.dev/)** - Linter and formatter

### UI Components

- **[Chalk](https://github.com/chalk/chalk)** - Terminal string styling

---

## Project Structure

```
proxy-dev/
├── src/
│   ├── app/                # Application entry points
│   │   ├── cli.ts          # CLI commands and parsing
│   │   ├── app.tsx         # Main TUI component
│   │   ├── providers.tsx   # Context providers composition
│   │   └── index.tsx       # Root exports
│   ├── components/         # React TUI components
│   │   ├── SystemHeader/   # Uptime and system status
│   │   ├── TrafficTable/   # Request log table
│   │   ├── SummaryBar/     # Request summary details
│   │   ├── ControlBar/     # Bottom bar for shortcuts
│   │   ├── DetailInspector/# Request/response drilldown
│   │   └── overlays/       # Overlays (MockPicker, LatencyInput, HelpMenu, etc.)
│   ├── hooks/              # Custom React hooks
│   │   ├── useTraffic/     # Manages traffic entry buffer
│   │   ├── useRoutes/      # Manages config routing and latency state
│   │   ├── useProxy/       # Manages proxy worker process
│   │   ├── useHosts/       # Manages system hosts file wrapper
│   │   └── useUIState/     # Manages active views and overlays
│   ├── providers/          # React context providers
│   ├── proxy/              # Proxy core logic
│   │   ├── server.ts       # Main proxy worker process
│   │   ├── interceptor.ts  # Traffic interception and matching
│   │   ├── latency.ts      # Latency simulation resolver
│   │   └── ipc.ts          # IPC messages definition
│   ├── ssl/                # TLS certification management
│   │   ├── ca.ts           # Root CA generation
│   │   ├── leaf.ts         # Per-domain cert generation
│   │   └── trust.ts        # OS-specific cert trust utilities
│   ├── hosts/              # System /etc/hosts integration
│   │   ├── parser.ts       # Parse the hosts definition format
│   │   └── manager.ts      # Hosts writer via sudo subprocess
│   ├── utils/              # Pure utility functions
│   │   ├── config/         # Config loading, validating, saving
│   │   ├── format/         # Terminal formatting utilities
│   │   ├── snapshot/       # Response-to-mock dumping functionality
│   │   └── platform/       # OS-specific directory/file mappings
│   └── types/              # TypeScript type definitions
├── examples/               # Usage examples
│   ├── basic/              # Single route, minimal config
│   ├── custom/             # Mocks, latency, path routing
│   └── integration/        # Multi-service environment
├── e2e/                    # End-to-end testing
│   ├── cli-commands.e2e.ts # Testing command lines directly
│   ├── mock-system.e2e.ts  # Mock state workflows
│   └── proxy-flow.e2e.ts   # Actual request proxy routing
├── dist/                   # Built output
├── biome.json              # Biome configuration
├── tsconfig.json           # Base TypeScript configuration
├── tsconfig.app.json       # App TypeScript configuration
├── vitest.config.ts        # Vitest base configuration
├── vitest.unit.config.ts   # Unit test configuration
├── vitest.react.config.ts  # React component test configuration
├── vitest.type.config.ts   # Type test configuration
├── vitest.e2e.config.ts    # E2E test configuration
├── esbuild.config.js       # Bundler configuration
└── package.json
```

---

## Versioning

This project uses a custom versioning scheme: `MAJORYY.MINOR.PATCH`

| Part | Description | Example |
|------|-------------|---------|
| `MAJOR` | Major version number | `1` |
| `YY` | Year (last 2 digits) | `26` for 2026 |
| `MINOR` | Minor version | `0` |
| `PATCH` | Patch version | `0` |

**Example:** `126.0.0` = Major version 1, released in 2026, minor 0, patch 0

This format allows you to quickly identify both the major version and the year of release at a glance.

---

## Style Guide

Conventions for contributing to this project. All rules are enforced by code review; Biome handles formatting and lint.

### Exports

- **Named exports only** — no `export default`. Every module uses `export function`, `export const`, or `export type`.
- **`import type`** — always use `import type` for type-only imports.
- **`.js` extensions** — all relative imports use explicit `.js` extensions (ESM requirement).

### File Structure

```
src/
├── app/              # Entry points, root component, providers wrapper
├── components/       # React components (PascalCase directories)
│   └── MyComponent/
│       ├── index.tsx
│       ├── MyComponent.types.ts
│       └── MyComponent.test.tsx
├── hooks/            # Custom hooks (camelCase directories)
│   └── useMyHook/
│       ├── index.ts
│       ├── useMyHook.types.ts
│       └── useMyHook.test.tsx
├── providers/        # React context providers (PascalCase directories)
│   └── MyProvider/
│       ├── index.tsx
│       ├── MyProvider.types.ts
│       └── MyProvider.test.tsx
├── types/            # Shared type definitions (PascalCase directories)
│   └── MyType/
│       ├── index.ts
│       └── MyType.test-d.ts
└── utils/            # Pure utility functions (camelCase directories)
    └── myUtil/
        ├── index.ts
        └── myUtil.test.ts
```

### Components & Providers

- **Components** use `function` declarations: `export function MyComponent(props: MyComponentProps) {}` (or arrow syntax for shorter ones).
- **Providers** use `React.FC` arrow syntax: `export const MyProvider: React.FC<Props> = ({ children }) => {}`
- **Props** are defined in a co-located `.types.ts` file using the `interface` or `type` keyword.
- Components receive data via props — never read global state directly if avoidable.

### Types

- Use `type` for data shapes and unions. Use `interface` for component props.
- Shared types live in `src/types/TypeName/index.ts` with a co-located `TypeName.test-d.ts`.
- Local types live in co-located `.types.ts` files — never inline in implementation files.
- No duplicate type definitions — import from the canonical source.
- Runtime constants must not live in `src/types/` — use `.consts.ts` files.

### Constants

- Named constants go in `.consts.ts` files (e.g., `useMyHook.consts.ts`).
- No magic numbers in implementation files — extract to named constants.

### Testing

- Every module has a co-located test file.
- Components: `ComponentName.test.tsx`
- Hooks: `hookName.test.tsx`
- Utils: `utilName.test.ts`
- Types: `TypeName.test-d.ts` (type-level tests using `expectTypeOf`/`assertType`)

---

## License

ISC
