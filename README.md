# IMBA Finance Command Center

An isolated, IMBA-focused version of the SYSOP operating concept. This prototype turns nonprofit accounting, Trail Solutions project economics, liquidity, and pipeline information into a concise executive decision system.

## Isolation from PROVENIQ SYSOP

- Separate sibling directory: `PROVENIQ/IMBA`
- Independent Git repository
- Independent `package.json`, lockfile, dependencies, and local port
- No copied `.env.local`, Supabase project, deployment metadata, build cache, or SYSOP runtime configuration
- No imports or filesystem references back to the SYSOP project

## Prototype views

| Route | Purpose |
|---|---|
| `/` | Executive overview and public financial trend |
| `/projects` | Illustrative Trail Solutions job-costing and capacity view |
| `/forecast` | Base, stretch, and downside operating scenarios |
| `/liquidity` | Gross-to-deployable cash bridge |
| `/leadership` | One-page CEO decision brief and 30/60/90-day plan |

## Data policy

Published IMBA facts are labeled as public baselines. Project, capacity, pipeline, and forecast records are visibly labeled as illustrative scenarios until the application is connected to IMBA's internal systems.

Primary public sources:

- [IMBA 2025 Annual Report](https://www.imba.com/2025-annual-report)
- [IMBA website](https://www.imba.com/)
- National IMBA public Form 990 filings, EIN 47-1254119

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
