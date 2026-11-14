# packages/contracts

The contract between the API and the web app: `openapi.json`, exported from the API's Pydantic models, and `api.d.ts`, generated from it with `openapi-typescript`. Both files are generated. Do not edit them by hand. The web app imports the types as `@moon-maps/contracts`.

From the repository root:

```bash
pnpm contracts:generate   # after changing a model in apps/api/app/schemas
pnpm contracts:check      # fails if either file is out of date
```

How it moves: [docs/architecture/repository-structure.md](../../docs/architecture/repository-structure.md). The endpoints: [docs/backend/api-reference.md](../../docs/backend/api-reference.md).
