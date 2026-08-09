// The single seeded tenant id for now (multi-tenant schema, one organization in
// use). Kept in a client-safe module — with no server-only imports — so both the
// browser (stamping snapshot org ids on manual entry) and the server repository can
// share one source of truth. The DB self-seeds this exact id on first write.
export const IMBA_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
