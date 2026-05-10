# mesa-web

Next.js 16 frontend for the Mesa restaurant reservation platform.

## Stack

- **Next.js 16** (App Router) — note: uses `proxy.ts` not `middleware.ts`
- **react-konva** — interactive floor plan canvas
- **Zustand** — auth store
- **Axios** — API client (`lib/api.ts`)
- **TypeScript**

## Routes

| Path | Role | Description |
|------|------|-------------|
| `/` | Public | Landing page |
| `/restaurants` | Public | Browse all restaurants |
| `/restaurants/[restaurantId]` | Public | Restaurant detail + reservation form |
| `/login` | Public | Sign in |
| `/register` | Public | Sign up |
| `/reservations` | User | My reservations |
| `/dashboard` | Restaurant owner | Manage reservations |
| `/editor/[floorId]` | Restaurant owner | Floor plan editor |

## Subdomain routing

`proxy.ts` rewrites `[slug].mesa.ge` → `/restaurants/[slug]`.

Set `NEXT_PUBLIC_ROOT_DOMAIN=mesa.ge` in production. Requires a wildcard DNS record `*.mesa.ge → server IP`.

Locally the subdomain routing is inactive (localhost has no subdomain).

## Guest reservations

Guests can reserve without an account. The reservation form shows name/email/phone fields when not logged in. No redirect to login.

## Env

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_ROOT_DOMAIN=mesa.ge
```

## Dev

```bash
npm install
npm run dev        # http://localhost:3000
```

## Key files

```
proxy.ts                          — subdomain routing (Next.js 16 proxy convention)
lib/api.ts                        — Axios instance, attaches Bearer token
store/auth.store.ts               — Zustand auth state
types/index.ts                    — shared TypeScript types
components/canvas/FloorCanvas.tsx     — editor canvas (react-konva)
components/canvas/FloorViewCanvas.tsx — read-only view canvas for booking
```
