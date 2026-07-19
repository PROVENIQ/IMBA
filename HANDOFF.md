# IMBA-OS — Handoff for Codex

**Context.** IMBA-OS is a pitch prototype for Terry Holliday's candidacy for the IMBA Finance Director role (demo Monday). Not production; explicitly client-only. Repo: `PROVENIQ/IMBA` on GitHub, deployed to Vercel on push to `main` at `imba.pro-found.org`. Local dev: `npm run dev` (port 3910), or `npx next dev -p 3920` if 3910 is occupied.

## Where things stand right now

Last commit: `6b5d1e8` — Cost of Labor section. Recent history:

- `6b5d1e8` Cost of Labor (§3 of the correction brief) — the PEO decomposition + loaded-rate builder, live in Money → Cost of labor.
- `21295f4` Expensify view (Money → Expenses) — card spend + reconciliation.
- `e8a33ad` Real 39-person staff directory + removed the "Pitch-safe data" sidebar note + stripped personal names from role affordances.
- `56f5a51` Stabilization: Bill.com honesty, global filters/role reach AP, AP persists, README fixed, Next.js 15.5.20.
- `e58138b` Removed the wrongly-active Single Audit module (990 Part XII 3a = No; no federal awards).
- `9db895e` Light-default theme + dark toggle + tooltip portal + nav reorder + 990 history chart.

`npm run typecheck` and `npm run build` both pass. Route `/` is ~213 kB.

## What's still open (in the intended build order)

Two remaining items from the correction brief the user has explicitly said they still want:

### 1. §2.7 — Functional-vs-fully-loaded program panel (highest demonstration value)

Build a Money view (or add to the existing `finance-reports`) that shows the FY2024 program lines from 990 Part III:

| Program | Revenue | Direct expense | Spread |
|---|---|---|---|
| Trail Building | 4,036,592 | 3,657,711 | +378,881 |
| Chapters & Programs | 34,110 | 1,905,818 | (1,871,708) |
| Conservation & Advocacy | 0 | 276,841 | (276,841) |

The point of the panel is to show interactively that **+378,881 is not a margin** — it carries no share of the $712,130 M&G or $461,859 Fundraising. Add a slider that allocates M&G + fundraising across programs on a basis of the user's choosing (direct expense %, revenue %, headcount %) and shows Trail Building's fully-loaded result moving accordingly. Data lives in `src/lib/imba-data.ts` under `publicFinancialFacts` (add if not there). Use the same `Prov` badge component defined at the top of `src/components/imba/ImbaFinanceWorkspace.tsx` (functions `Prov`, `CostOfLabor`).

### 2. §0 — Roll the provenance badges out globally

The `Prov` badge (`filed | derived | illustrative | unknown`) is currently only on the Cost of Labor view. Extend it so every rendered dollar figure in Money views carries its lane. Priority spots: Statement of Activities/Position/Cash Flows footers (should say "filed" on prior-year columns), Company snapshot KPIs, Grant tracking (award = filed if from Sch B, illustrative otherwise), Budget + forecast (all illustrative except comparative bases).

The badge component to reuse:

```tsx
function Prov({ kind }: { kind: 'filed' | 'derived' | 'illustrative' | 'unknown' }) { … }
```

Located near the top of `src/components/imba/ImbaFinanceWorkspace.tsx`. Consider promoting it to `src/components/imba/Prov.tsx` so other workspaces can import it.

## Ground rules the user has been firm about

1. **Provenance discipline.** Never invent a figure that looks filed. Public 990 = `filed`. Arithmetic on filed values = `derived`. Made up for demo = `illustrative` (must render visually distinct — muted or badged). Genuinely unknowable from public data = `unknown` (e.g. PEO fee inside the invoice).

2. **No personal names on demo role affordances.** The acting-as bar shows "AP Specialist / Finance Director / Executive" — role labels, not people. Header avatar uses "CE" not "KM". Only the staff directory shows real names (from IMBA's public staff page). If you need a role player in an audit event, use the role title.

3. **Honesty about connectors.** QBO + ADP are `configured` (demo mode). Everything else — including Bill.com, Expensify — is `planned`. Do not write copy that says a `planned` connector "calls the API" or "executes payment". Wording should be "queues an outbound job on the IMBA-OS control plane; disbursement would execute in [X], a planned connector, not live in this demo."

4. **No federal-award machinery.** IMBA had no federal award expenditures in 2024 (Part XII 3a = No, Part VIII 1e blank). Do not add Single Audit / SEFA / Uniform Guidance readiness panels as active. The existing `Single-Audit Readiness Check` catalog entry is correctly labeled `Not currently triggered` — leave it.

5. **The user rejected "President" for Kent.** The filed 2024 return says CEO on the signature block. Demo shows "CEO". IMBA's website says "President"; do not switch.

6. **Locations in the staff directory are precise:** stated by IMBA verbatim where confirmed, `"(probable)"` suffix where only inferred from a bio, `"Not stated"` otherwise. Do not upgrade a probable to confirmed without a direct-wording source.

## Key files

- `src/lib/imba-data.ts` — `financialHistory` (real 2019-2024 990 figures, verified against ProPublica), `publicFinancialFacts` (2024 balance-sheet detail), `forecastScenarios`.
- `src/lib/imba-detail-data.ts` — `imbaEmployees` (real 39-person roster), `imbaGrants`, `imbaPayables`, `imbaReceivables`, `imbaReports` (governed catalog).
- `src/lib/imba-intelligence-data.ts` — `imbaRoleProfiles` (role allowlists — when adding a Money view, add its id to the `Money` array under `executive` AND `finance`).
- `src/lib/imba-os-data.ts` — `ImbaOsView` type union (add new view ids here).
- `src/lib/connectors.ts` — connector registry with `status`.
- `src/lib/ap-data.ts` — AP domain model, role-based `apUsers` (no personal names), `seedBills`.
- `src/components/imba/ImbaCeoCockpit.tsx` (~3200 lines) — main shell; nav lives in `imbaNavSections`, view render dispatch near line 3100.
- `src/components/imba/ImbaFinanceWorkspace.tsx` — all Money views. `Prov`, `CostOfLabor`, `ExpenseTracking`, `FilingsTrend`, `Snapshot`, `Reports`.
- `src/components/imba/ImbaPayables.tsx` — AP (persisted to localStorage, sync's actor to global role).
- `src/components/imba/ImbaStatements.tsx` — the four statement tabs.
- `src/components/imba/ImbaInfoTooltip.tsx` — tooltip portals to body; use for any hover/help text so it doesn't clip.
- `src/app/globals.css` — theme tokens (`--app-bg`, `--card`, `--text`, `--text-2/3/4`, `--line`, `--info`, `--pos`, `--sa`, `--sa-soft`); pale-green light default, hunter-green dark under `.dark`.

## Pattern to add a new Money view (5 edits)

1. Add id to `ImbaOsView` union in `src/lib/imba-os-data.ts`.
2. Add id to `financeViews` array in `src/components/imba/ImbaCeoCockpit.tsx` (line ~755).
3. Add nav item under Money section in `imbaNavSections` in the same file.
4. Add id to Money array under both `executive` and `finance` in `src/lib/imba-intelligence-data.ts`.
5. In `src/components/imba/ImbaFinanceWorkspace.tsx`: extend the `ImbaFinanceView` union, add a `viewMeta` entry, add `{view === '…' ? <Component/> : null}` to the switch, and write the component.

## Verified facts (do not re-invent)

**Financial history — from filed 990s, EIN 47-1254119:**

| Year | Revenue | Expenses | Net | Net assets |
|---|---|---|---|---|
| 2019 | 5,143,424 | 4,663,295 | +480,129 | 1,565,310 |
| 2020 | 5,137,983 | 4,658,833 | +479,150 | 2,044,460 |
| 2021 | 6,640,378 | 5,082,026 | +1,558,352 | 3,602,812 |
| 2022 | 7,382,336 | 6,866,916 | +515,420 | 4,118,232 |
| 2023 | 5,978,299 | 6,535,893 | −557,594 | 3,560,638 |
| 2024 | 7,203,961 | 7,014,359 | +189,602 | 3,754,879 |

**2021 caveat:** government-grant line (Part VIII 1e) = $1,055,711 (PPP). Normalized, four consecutive years land in a $36K band around ~$494K surplus — surplus is indifferent to fundraising swings. This is a demo talking point the user has emphasized; if you build a normalized-net toggle on the trend chart, use that framing.

**2024 functional split:** Program 5,840,370 (83.3%) / M&G 712,130 (10.2%) / Fundraising 461,859 (6.6%).

**2024 compensation:** Total $3,525,914 = Lines 5 + 7 + 8 + 9 + 10. Base wages (5+7) = $3,009,434. Payroll taxes = 8.92%. Benefits + pension = 8.25%. Loaded multiplier (public only) = 1.1716×. Comp = 50.3% of expense.

**Board:** 8 voting members, all independent (Part I lines 3-4). Officers: McNeill (CEO), Miller (Chair), Ritzler (Treasurer), Zimmerman (Secretary). Wiens = Executive Director but is `highest compensated employee, not an officer`.

**Workforce:** 56 leased via PEO (Schedule O). IMBA files no W-2s. This is the entire mechanism of the People/Cost of Labor argument.

## Gotchas

- **Shared `.next` directory.** Multiple Next dev servers in this repo have been observed clobbering each other's `.next` build output, causing `ENOENT: routes-manifest.json` and "Internal Server Error" pages. Fix: `pid=$(netstat -ano | grep :3920 | awk '{print $NF}'); taskkill //F //PID "$pid"; rm -rf .next; npx next dev -p 3920`. Not a code bug.

- **Bill.com is `planned`, not live.** Approve & Pay queues a control-plane job (currently a QBO stub); it does NOT call any Bill.com API. Do not regress this wording.

- **Ports.** Terry has processes on 3910 and 3915 that are separate from your dev server. Use 3920 to avoid conflicts. The MCP browser tools have a `seed` tab pointed at localhost.

- **Filter scope.** The global project filter narrows the portfolio/intelligence views. AP is org-wide (bills tag to internal cost portfolios, not client projects); it shows an explicit scoping note when a filter is active rather than hiding all its bills. Preserve this — hiding bills silently is what the reviewer caught.

## Deploy

`git push origin main` → Vercel builds and deploys to `imba.pro-found.org`. Verify with `npm run build` locally first; the build must produce `Route (app) /` at ~200-220 kB. Do NOT use `--force` on `npm audit fix` (would downgrade to a bad major).

## Coverage matrix artifact

Published at `https://claude.ai/code/artifact/8439ea23-5fa3-423e-b119-2f6e7918ba06` — a shareable single page mapping the JD to demo features. Source at `<scratchpad>/coverage-matrix.html`. Update the "Added today" list and any changed status chips if you ship the two remaining panels; republish the same file path.

## Where the correction brief lives

The user's authoritative brief (data corrections, PEO module spec, provenance rules) was pasted into the transcript; the essentials are baked into this handoff. The full compensation, balance sheet, program-line, and contributor-concentration figures are in the "Verified facts" section above and in `src/lib/imba-data.ts` / `imba-detail-data.ts`.

---

**One-line status:** Correctness + stabilization + Expensify + real staff + Cost of Labor are shipped to production. Remaining: §2.7 functional-vs-fully-loaded panel + global provenance rollout. The user chose the "stabilize then panels" priority path; that path is complete except for those two items.
