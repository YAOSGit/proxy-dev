# Custom Example

Demonstrates mock variants, latency injection, path-based routing, and multiple route groups.

## What's Included

| File | Purpose |
|------|---------|
| `config.json` | Global config with two groups and path-based routing |
| `proxy-dev.json` | Local config with mock variants and 200ms global latency |
| `mocks/` | Three mock variants for `/users` (success, empty, error) |
| `server.js` | Backend API server on port 3001 |

## Routes

| Domain | Path | Target | Group |
|--------|------|--------|-------|
| `api.local` | `/v2` | `localhost:3002` | api |
| `api.local` | `/` (catch-all) | `localhost:3001` | api |
| `dashboard.local` | `/` | `localhost:4000` | dashboard |

Path routes are matched most-specific-first: requests to `api.local/v2/*` go to port 3002, everything else goes to port 3001.

## Mock Variants

The `/users` endpoint has three mock variants:

| Variant | Status | Description |
|---------|--------|-------------|
| `success` | 200 | Two users (Alice, Bob) |
| `empty` | 200 | Empty user list |
| `error` | 500 | Database unavailable |

Switch variants in the TUI with `m` or via CLI:

```bash
proxy-dev mock "api.local/users" empty
proxy-dev mock "api.local/users" error
proxy-dev mock "api.local/users" success --off   # back to live
```

## Try It

```bash
# Copy config to global location
cp config.json ~/.config/proxy-dev/config.json

# Start the backend
node server.js &

# Launch the TUI
proxy-dev-tui

# In another terminal, make requests
curl https://api.local/users
curl https://api.local/products
curl https://api.local/health
```

## Latency

Global latency is set to 200ms in `proxy-dev.json`. Every request (live and mock) will be delayed by 200ms. Change it in the TUI with `t` or edit the config directly.
