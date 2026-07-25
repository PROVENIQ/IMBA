# EveryAction integration

## Current posture

The EveryAction adapter is a provider boundary, not a browser client. The default is
`mock`; no credentials are needed for the CRM Migration demonstration. Production
writes remain disabled.

Verified against Bonterra's official EveryAction API reference on 2026-07-24:

- API base: `https://api.securevan.com/v4`
- Authentication: HTTP Basic Auth, with Application Name as the username and API
  Key as the password.
- Changed Entity Export is an asynchronous polling workflow, not a general outbound
  webhook.
- Changed Entity requests can cover no more than the preceding 90 days and return
  the current form of a record, even when the requested period is historical.
- The API exposes Changed Entity resource and field discovery endpoints.
- Current documented changed-entity resources are ActivistCodes, ContactHistory,
  Contacts, ContactsActivistCodes, ContactsOnlineForms, ContactsSurveyResponses,
  ContributionAdjustments, Contributions, EventTicketTransactionsGuests and
  RecurringContributions.
- Financial batch reads and bulk-import workflows exist as separate API surfaces.
- The contribution payment endpoint is not authority to store or process payment
  card data; IMBA-OS does neither.

Official references:

- [Authentication](https://docs.everyaction.com/reference/authentication)
- [API overview](https://docs.everyaction.com/reference/api-overview)
- [Changed Entities overview](https://docs.everyaction.com/reference/changed-entities-overview)
- [Changed Entity resources](https://docs.everyaction.com/reference/changedentityexportjobs-resources)
- [Create an export job](https://docs.everyaction.com/reference/changedentityexportjobs)
- [Poll an export job](https://docs.everyaction.com/reference/changedentityexportjobs-exportjobid)
- [Changed Entity fields](https://docs.everyaction.com/reference/changedentityexportjobs-fields-resourcetype)
- [Bulk import overview](https://docs.everyaction.com/reference/bulk-import-overview)
- [Financial batches overview](https://docs.everyaction.com/reference/financial-batches-overview)

The overview and job-status pages describe different download-link lifetimes. The
adapter therefore does not hard-code either value: it validates the returned
`dateExpired` and treats every download URL as short-lived.

## Modes and safeguards

Configuration is server-only:

```dotenv
EVERYACTION_BASE_URL=https://api.securevan.com/v4
EVERYACTION_CONNECTION_MODE=mock
EVERYACTION_WRITES_ENABLED=false
EVERYACTION_APPLICATION_NAME=
EVERYACTION_API_KEY=
```

`mock` uses deterministic demonstration records. `live-readonly` requires an
Application Name and API Key and can issue reads from trusted server code.
`live-write` remains inert unless the write flag is also true. A write invocation
then additionally requires an approval actor and time, preview hash, idempotency
key, and immutable audit event ID. Missing any condition fails closed before a
network call.

The implementation does not serialize credentials into props, client bundles,
telemetry, configuration summaries, or errors. Basic Auth is constructed only in
the HTTP transport.

## Changed Entity workflow

The pollable workflow:

1. Reads the prior durable cursor.
2. Requests records through a fixed `dateTo`.
3. Polls asynchronous job status with a bounded attempt count.
4. Rejects invalid or expired job responses.
5. Fingerprints every source record.
6. Skips an already durable fingerprint.
7. Durably ingests each new record.
8. Advances the cursor only after every record succeeds.

Any failure preserves the previous cursor. The sync-run event lifecycle is
`SYNC_RUN_STARTED`, source import events, `SYNC_CURSOR_ADVANCED`, then
`SYNC_RUN_COMPLETED`; failures append `SYNC_RUN_FAILED` without hiding the prior
successful cursor.

Unsupported resources remain explicit capabilities with `UNSUPPORTED`,
`PERIODIC_SNAPSHOT`, `MANUAL_EXPORT`, or `BULK_EXPORT_JOB` strategies. Resource
discovery must precede activating a previously unsupported surface.

## Enabling authorized read-only access

1. Create the narrowest EveryAction API context needed for discovery/read work.
2. Store the Application Name and API Key in the deployment secret store.
3. Set `EVERYACTION_CONNECTION_MODE=live-readonly`.
4. Keep `EVERYACTION_WRITES_ENABLED=false`.
5. Test the connection from server-side operations and review the reported
   capabilities before scheduling polling.
6. Begin the initial cursor within the documented 90-day window and retain the
   source export evidence.

To revoke access, rotate or revoke the EveryAction API key, remove both credential
variables from the deployment, set the mode to `mock`, redeploy, and record the
revocation as an integration audit event.

## IMBA-specific unknowns

Actual API context, enabled resources, field IDs, source codes, designations,
activist codes, supporter groups, custom fields, volumes, retention requirements,
rate limits in IMBA's context, and operational owners remain unknown. Synthetic
crosswalks are examples, not claims about IMBA's configuration.
