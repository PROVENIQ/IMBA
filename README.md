# IMBA-OS

An isolated, IMBA-focused version of the SYSOP operating concept. The public application is a pitch prototype that shows how IMBA could connect nonprofit accounting, Trail Solutions project economics, liquidity, membership, collaboration, and development information in one operating system.

## Current boundary

The UI is a client-only prototype. It has no production authentication, database, or live provider integrations; role-aware navigation demonstrates authorization intent but is not an enforcement layer. Browser state and illustrative workflows are used to make the proposed operating model visible.

The repository now also contains a tested Phase 0 production foundation:

- [Production architecture](./docs/architecture/README.md)
- [Open IMBA policy decisions](./docs/architecture/OPEN_DOMAIN_QUESTIONS.md)
- [PostgreSQL foundation migration](./db/migrations/0001_phase_zero_foundation.sql)
- Typed command, event, money, accounting, privacy, provider, authority, and projection contracts under `src/core`

This foundation is not presented as a deployed production backend. Later domain phases begin only after IMBA approves the relevant policies and production infrastructure.

## Isolation from PROVENIQ SYSOP

- Separate sibling directory: `PROVENIQ/IMBA`
- Independent Git repository and dependency lockfile
- No copied environment files, database project, deployment metadata, build cache, or SYSOP runtime configuration
- No imports or filesystem references back to the SYSOP project

## Application shape

A single Next.js App Router route renders the IMBA-OS cockpit; navigation is state-driven. It spans nine business pillars—Mission, Money, People, Development, Platform, Governance, Collaboration, System, and Management—scoped by six role profiles: Executive, Finance, People/HR, Trail Solutions, Development, and Board.

## Data policy

Published IMBA facts are labeled as public baselines. Historical financials come from IMBA's filed Forms 990 (2019–2024) and the 2025 Annual Report. Current-period operating values, project economics, capacity, and pipeline records are labeled illustrative until connected to authorized IMBA systems.

Primary public sources:

- IMBA public Form 990 filings, EIN 47-1254119 (2019–2024)
- [IMBA 2025 Annual Report](https://www.imba.com/2025-annual-report)
- [IMBA website](https://www.imba.com/)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3910](http://localhost:3910).

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run build
```
