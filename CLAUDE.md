# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint    # eslint
```

## Architecture

**Next.js 16 App Router** with route groups:

| Group | Routes | Access |
|-------|--------|--------|
| `(auth)` | `/login`, `/register` | Public |
| `(user)` | `/restaurants`, `/reservations` | Public / User |
| `(restaurant)` | `/dashboard`, `/editor/[floorId]` | Owner |
| root | `/` | Public |

**Breaking change from training data:** `middleware.ts` is deprecated in Next.js 16. Subdomain routing lives in `proxy.ts` with a named `proxy` export. Read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` before touching it.

**Subdomain routing** (`proxy.ts`): rewrites `[slug].mesa.ge` → `/restaurants/[slug]`. Inactive locally (localhost has no subdomain). Requires `NEXT_PUBLIC_ROOT_DOMAIN=mesa.ge` and a wildcard DNS record in production.

**API client** (`lib/api.ts`): Axios instance with request interceptor that attaches `Bearer` token from `localStorage`. Response interceptor auto-refreshes on 401 using the refresh token, then retries the original request. On refresh failure, clears tokens and redirects to `/login`.

**Auth state** (`store/auth.store.ts`): Zustand. Token stored in `localStorage`, not in the store itself — the store holds user info derived from the token.

**Canvas state** (`store/canvas.store.ts`): Zustand with undo/redo (20-step history). `isDirty` tracks unsaved changes. `setTables`/`setWalls` reset history; individual mutations push to `past`.

**Canvas components** — always load with `dynamic(..., { ssr: false })`:
- `FloorCanvas` — editor (drag, resize, draw walls, tool modes: select/table/wall/erase)
- `FloorViewCanvas` — read-only booking view, table selection for reservation form

**Shared types** (`types/index.ts`): single source of truth. Update here first when adding model fields.

## Key conventions

- No auth required to view restaurants or submit reservations. Guest booking collects name/email/phone at form time.
- Restaurant lookup works by UUID or slug — both valid for `GET /api/restaurants/:idOrSlug`.
- `@tanstack/react-query` used for server state; Zustand for client-only state (auth, canvas).
