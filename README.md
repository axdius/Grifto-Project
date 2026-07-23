# Grifto

Wedding gifting platform — create and share wedding wishlists, receive contributions from guests, manage wallets and withdrawals.

- **Architecture documents:** [docs/architecture/](docs/architecture/00-INDEX.md)
- **Phase 1 strategy:** local-first frontend. Both apps run against a contract-first mock API (shared HTTP server + seeded local DB). The real NestJS backend later implements the same contracts — swap is an environment variable, not a rewrite.

## Workspace layout

| Path | What |
|---|---|
| `apps/web` | Storefront + customer dashboard (Next.js, port 3000) |
| `apps/admin` | Admin dashboard + theme editor (Next.js, port 3001) |
| `packages/contracts` | Zod schemas + endpoint contracts (the API source of truth) |
| `packages/sdk` | Typed API client + TanStack Query hooks |
| `packages/mock-api` | MSW handlers + seeded mock DB + shared HTTP server (port 4000) |
| `packages/platform-services` | Client-side service interfaces (storage, payments checkout, push, analytics) |
| `packages/theme-schemas` | Theme section/block schema definitions |
| `packages/theme-runtime` | JSON theme document → React renderer |
| `packages/ui` | Design system (Tailwind preset, shared components) |
| `packages/config` | Shared tsconfig / eslint configs |

## Getting started

Requires Node 22+ and pnpm 9 (`corepack enable pnpm`).

```bash
pnpm install
pnpm dev        # mock-api :4000, web :3000, admin :3001
pnpm build
pnpm lint
pnpm typecheck
```

| Process | URL |
|---|---|
| Storefront | http://localhost:3000 |
| Admin | http://localhost:3001 |
| Shared mock API | http://localhost:4000 |

Guest actions on the storefront (contributions, etc.) persist in `packages/mock-api/.data/db.json` and show up in admin because both apps share that mock API process.

Default env: `NEXT_PUBLIC_API_MODE=mock`, `NEXT_PUBLIC_API_URL=http://localhost:4000`.

## Architectural rules (enforced by ESLint)

- No `fetch()` in components/features — data access goes through `@grifto/sdk` hooks.
- No direct `localStorage` — use `StorageService` from `@grifto/platform-services`.
- App code never imports `@grifto/mock-api` — the mock layer is the shared HTTP server (or optional browser MSW bootstrap).

Layering: Component → Hook (TanStack Query) → SDK client → HTTP → mock-api (today) / NestJS API (later).
