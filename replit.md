# Finomaly

A GST invoice risk and review workspace for Indian MSMEs and accounting teams. It flags unusual invoices, explains the signals, and keeps a human reviewer in control.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the shared API server
- `pnpm --filter @workspace/finomaly run dev` — run the Finomaly web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter, TanStack Query, Tailwind
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/finomaly/src/` — dashboard, invoice workflows, vendor pages, simulator, reconciliation, and model insights
- `artifacts/api-server/src/routes/finomaly.ts` — Finomaly REST endpoints
- `artifacts/api-server/src/lib/finomaly-engine.ts` — synthetic seed data, GST rules, risk scoring, and Isolation Forest
- `lib/db/src/schema/finomaly.ts` — Postgres entities
- `lib/api-spec/openapi.yaml` — API contract; generated client hooks and validation schemas are under `lib/api-client-react` and `lib/api-zod`

## Architecture decisions

- Finomaly uses the workspace's shared Express/Postgres services and OpenAPI codegen rather than a separate Flask/SQLite service from the original prototype brief.
- The home route is the invoice-risk dashboard, not a personalized greeting.
- Dashboard, vendor, and invoice data is synthetic demo data; do not treat risk flags as proof of fraud or as live GST portal results.

## Product

Review GST invoice risk, analyze new invoices, inspect vendor histories, simulate six anomaly scenarios, reconcile sample ITC data, and record review decisions with an audit trail.

## User preferences

- An anomaly is not proof of fraud; Finomaly is decision support and the human reviewer makes the final call.
- Dark mode is the default; a light theme is also supported.

## Gotchas

- The API seeds demo data when the development database has no Finomaly invoices.
- After editing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using changed client schemas or hooks.
- Use the database push command for development schema changes; do not hand-edit generated API files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
