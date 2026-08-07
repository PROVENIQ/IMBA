# Trail Solutions Persistence (Neon Postgres)

Uploaded Data Import Lab workspaces are persisted server-side in **Neon Postgres**
(Drizzle ORM). Previously they lived in browser `localStorage`; now they are shared
across the organization, durable, and governed.

## Model
- **Multi-tenant** — every row carries `organization_id`. Today one org (IMBA,
  `IMBA_ORGANIZATION_ID`) self-seeds on first write; the schema is ready for more.
- **Shared org-wide** — Finance uploads, the CEO sees the same workspaces.
- **Identity** — rows are keyed to the authenticated Clerk `userId` (+ label); no
  more hardcoded "Finance user (prototype role)".

## Schema (`src/lib/db/schema.ts`)
- `organizations` — tenants.
- `trail_workspaces` — one row per workspace: `environment`, `data_class`
  (`test`/`production`), `active_version_id`, `archived`, soft-delete `deleted_at`.
- `trail_import_versions` — one row per import; the large computed bundle
  (`snapshot`, `projectDetails`, `normalizedDataset`, …) is a JSONB `validated_package`.
- `trail_mapping_templates` — reusable column mappings.
- `audit_events` — append-only log of every upload/commit/delete/reset/promote.

## Governance / integrity
- **Soft-delete** — deletions set `deleted_at` (recoverable), never a hard wipe.
- **Audit trail** — `audit_events` records the actor and action for every change.
- **Admin-only reset** — `POST /api/trail-solutions/workspaces/reset` (executive
  only) clears `data_class = test` workspaces and never touches production.
- **Promote to production** — executive-only; marks a workspace
  `validated-production-derived` so "Clear test data" leaves it alone.

## Layers
- `src/lib/db/client.ts` — lazy, env-gated Drizzle client (no `DATABASE_URL` → routes
  return 503 "not configured"; the app still builds and runs).
- `src/lib/trail-workspace-repo.ts` — org-scoped repository (transactional commit,
  merge for add-mode, soft-delete, reset, audit). Authz: `canWriteTrailData`
  (finance/executive), `canAdministerTrailData` (executive).
- `src/core/trail-solutions/workspace-transforms.ts` — pure merge / version-record
  logic shared by server and client.
- API routes under `src/app/api/trail-solutions/workspaces/*` and `.../mapping-templates`.
- `src/lib/trail-solutions-test-workspaces.ts` — client fetch wrappers.

## Provisioning
1. Vercel Marketplace → add **Neon** → provisions `DATABASE_URL` (standard name, no prefix).
2. `npm run db:migrate` (applies `drizzle/*.sql`). The IMBA org self-seeds on first write.

The synthetic demonstration data stays in code (`workbook-derived-adapter.ts`) and is
never written to the database.
