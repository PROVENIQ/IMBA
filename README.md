# IMBA Finance Command Center

An isolated, IMBA-focused version of the SYSOP operating concept. This prototype turns nonprofit accounting, Trail Solutions project economics, liquidity, and pipeline information into a concise executive decision system.

## Isolation from PROVENIQ SYSOP

- Separate sibling directory: `PROVENIQ/IMBA`
- Independent Git repository
- Independent `package.json`, lockfile, dependencies, and local port
- No copied `.env.local`, Supabase project, deployment metadata, build cache, or SYSOP runtime configuration
- No imports or filesystem references back to the SYSOP project

## Application shape

A single Next.js App Router route (`/`) renders the entire IMBA-OS cockpit; navigation is state-driven. It spans 9 business pillars — Mission, Money, People, Development, Platform, Governance, Collaboration, System, and Management — across ~66 views, scoped by role. Six role profiles (Executive, Finance, People / HR, Trail Solutions, Development, Board) determine which pillars and views are visible. Light theme is the default, with a one-click dark toggle.

> This is a client-only pitch prototype: no server, database, authentication, or live integrations. Role-aware navigation demonstrates authorization intent; it is not an enforcement layer. State persists in the browser only.

## Data policy

Published IMBA facts are labeled as public baselines. Historical financials come from IMBA's filed Forms 990 (2019–2024) and the 2025 Annual Report; current-period operating values, project economics, capacity, and pipeline records are visibly labeled as illustrative until the application is connected to IMBA's internal systems.

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
npm run typecheck
npm run lint
npm run build
```
