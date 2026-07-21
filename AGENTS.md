# Agent Notes

- This repo is a single Next.js app router project with root-level `app/`, `components/`, `lib/`, `models/`, and `types/` folders.
- The app now uses PostgreSQL through `postgres/` as the single source of truth; MongoDB files were removed from the runtime app.
- `package.json` scripts are the source of truth: `npm run dev`, `build`, `start`, `lint`, `db:pg:schema`, `db:pg:seed`, `db:pg:migrate`, `db:pg:setup`.
- `.env.local` is the env file used by the app and the PostgreSQL scripts.
- `postgres/README.md` is the source of truth for the PostgreSQL layer; `db:pg:migrate` expects JSON exports in `postgres/migration-source/`.
- Use the `@/*` path alias from `tsconfig.json` for repo-root imports.
- When editing dynamic route handlers, follow the Next 16 validator-generated `params` shapes exactly; the repo already has known typecheck noise in `app/api/cart/[itemId]/route.ts` and `app/api/reviews/[productID]/route.ts`.
- `npx tsc --noEmit` currently reports those existing route-validator errors even when unrelated changes are correct.
