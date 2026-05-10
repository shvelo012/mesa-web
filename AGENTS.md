<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Known breaking changes (Next.js 16)

- `middleware.ts` is deprecated — use `proxy.ts` with a named `proxy` export instead.
  See `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.

## Project conventions

- No auth required to view restaurants or submit reservations. Guest fields (name, email, phone) collected at booking time.
- Restaurant lookup by UUID **or** slug — both work via `GET /api/restaurants/:idOrSlug`.
- Subdomain routing handled in `proxy.ts` — rewrites `[slug].mesa.ge` to `/restaurants/[slug]`.
- Canvas components (`FloorCanvas`, `FloorViewCanvas`) use `react-konva` — always load with `dynamic(..., { ssr: false })`.
- Auth state in `store/auth.store.ts` (Zustand). Token attached automatically by `lib/api.ts`.
- All shared types in `types/index.ts` — update there first when adding model fields.
