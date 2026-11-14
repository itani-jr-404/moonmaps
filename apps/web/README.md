# apps/web

The Moon Maps web app: Next.js 16, React 19, TypeScript, Tailwind CSS v4, three.js used directly, GSAP and Lenis, TanStack Query over a typed `openapi-fetch` client, zustand. One page, `/`. It shows only what the API returns.

## Run

From the repository root, with the API running on port 8000 (see [apps/api/README.md](../api/README.md)):

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # sets NEXT_PUBLIC_API_URL
pnpm dev                                        # http://localhost:3000
```

## Check

```bash
pnpm lint && pnpm typecheck && pnpm test
```

## More

Layout: [docs/architecture/repository-structure.md](../../docs/architecture/repository-structure.md). Sections, state and data: [docs/frontend/routes-and-state.md](../../docs/frontend/routes-and-state.md). 3D: [docs/frontend/3d-scenes.md](../../docs/frontend/3d-scenes.md). Assets and their credits: [docs/data/sources.md](../../docs/data/sources.md).

End-to-end tests (real browser, real API): `pnpm build && pnpm test:e2e` from `apps/web`. See [docs/developer/testing.md](../../docs/developer/testing.md).
