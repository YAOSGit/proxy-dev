# Integration Example

A full microservices development environment with three services behind the proxy, complete mock coverage, and workflow scripts.

## Architecture

```
                    proxy-dev (port 443)
                    ┌──────────────────┐
                    │                  │
  auth.local ──────▶│  auth service    │──▶ localhost:3001
  api.local  ──────▶│  API service     │──▶ localhost:3002
  app.local  ──────▶│  web frontend    │──▶ localhost:3003
                    │                  │
                    └──────────────────┘
```

## Services

| Domain | Port | Group | Description |
|--------|------|-------|-------------|
| `auth.local` | 3001 | auth | Authentication (login, token issuing) |
| `api.local` | 3002 | api | Core API (users, products) |
| `app.local` | 3003 | web | Frontend dev server (HTTPS upgrade) |

## Mock Variants

| Route | Variant | Status | Use Case |
|-------|---------|--------|----------|
| `auth.local/login` | `success` | 200 | Valid JWT token |
| `auth.local/login` | `invalid` | 401 | Wrong credentials |
| `auth.local/login` | `locked` | 423 | Account locked (Retry-After) |
| `api.local/users` | `success` | 200 | Three users |
| `api.local/users` | `empty` | 200 | No users |
| `api.local/users` | `paginated` | 200 | Two of 50 users (hasMore) |
| `api.local/products` | `catalog` | 200 | Three products (one out of stock) |
| `api.local/products` | `empty` | 200 | No products |

## Setup

```bash
# Copy config to global location
cp config.json ~/.config/proxy-dev/config.json

# Trust the CA (first time only)
proxy-dev trust init
proxy-dev trust system
```

## Try It

```bash
# Start all backend services
./scripts/start-all.sh

# In another terminal, launch the TUI
proxy-dev-tui

# In another terminal, make requests
curl https://auth.local/login -X POST -d '{"email":"alice@example.com","password":"password123"}'
curl https://api.local/users
curl https://api.local/products
curl https://app.local
```

## Suggested Workflows

### Frontend development without backends

Activate mocks for auth and API, work against the frontend only:

```bash
proxy-dev mock "auth.local/login" success
proxy-dev mock "api.local/users" success
proxy-dev mock "api.local/products" catalog
```

Now `app.local` can develop against stable mock data without running auth or api services.

### Testing error states

Switch mocks to simulate failures:

```bash
proxy-dev mock "auth.local/login" locked
proxy-dev mock "api.local/users" empty
```

### Simulating slow networks

Add global latency to test loading states:

```bash
# Edit proxy-dev.json or use the TUI (t key)
# Set globalMs to 2000 for a 2-second delay on every request
```

### Deactivating a service group

Disable the web frontend group to focus on API work:

```bash
proxy-dev groups deactivate web
```

## Cleanup

```bash
./scripts/stop-all.sh
proxy-dev stop
```
