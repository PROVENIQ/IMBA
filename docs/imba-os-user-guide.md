# IMBA-OS — User Guide

**Version:** Prototype (pitch demonstration)
**Roles covered in this edition:** CEO / Executive · Finance Director
**Format:** Written guide (doc-first). An in-app Help version will follow.

> **Demo boundary.** IMBA-OS is a working prototype. Headline history uses IMBA's public
> Form 990 filings (EIN 47-1254119) and the 2025 annual report; operating records
> (projects, bills, workforce, etc.) are **illustrative** until connected to IMBA's systems.
> Every screen labels this. No live IMBA credentials or records are used, and **no money
> moves inside IMBA-OS** — payment is executed in the connected system (e.g., Bill.com) by a
> person.

---

## 1. What IMBA-OS is

IMBA-OS is a single operating system where each employee does their whole job in one place,
and that place connects out to every other system IMBA uses (QuickBooks Online, ADP, Bill.com,
banking, and more). Work is organized into **nine company sections** (pillars):

**Mission · Money · People · Development · Platform · Governance · Collaboration · System · Management**

What you can see and do is governed by your **role**. This guide covers the two lead roles:

| Role | Who | Lands on | Sees |
|---|---|---|---|
| **CEO / Executive** | Kent McNeill | Executive brief | All nine sections (curated to the decisions a CEO makes) |
| **Finance Director** | Terry Holliday | Company snapshot | All nine sections, with full depth in **Money** |

---

## 2. The shell — what's on every screen

These controls are the same everywhere, so learn them once.

### 2.1 Left sidebar — the nine sections
Click a section (e.g., **Money**) to expand it and see its views. The sidebar is
**role-filtered**: you only see the views your role is meant to use. Each section has its own
**accent color** (Mission = blue, Money = green, People = cyan, Development = amber,
Platform = violet, Governance = rose, Collaboration = indigo, System = slate,
Management = lime), and that color carries through the whole section so you always know where
you are.

### 2.2 Top bar
Directly above the content, always visible:
- **View title** — the page you're on (e.g., "Accounts payable").
- **(i) info** — hover it to see **where this section's data comes from** and important notes
  (e.g., Money → QuickBooks Online, ADP, Bill.com, bank feeds; Form 990 for public figures).
- **Illustrative** tag — reminder that current-period values are demo data.
- **Connectors indicator** — QBO / ADP demo status at a glance.
- **Your avatar** — the role you're currently acting as.

### 2.3 Intelligence Context bar (pinned)
A static bar under the top nav, present across the app because these filters apply
everywhere:
- **Role** — switch the acting role (see §3).
- **Region · Phase · Signal · Project** — narrow every downstream view to a slice of the
  portfolio. The result summary (e.g., "5 of 5 projects · $3.9M selected contract value")
  updates live.
- **Save view** — save the current role + filters as a named view to return to later.
- **Alerts + briefings** — open the alert center; the badge shows how many are active.

### 2.4 Section landing header
The first page of each section shows a one-time **section header** (title + description +
"Demo · illustrative"). Drilling into a subsection does **not** repeat it, so each page stays
distinct. *(This header is demo scaffolding and will be removed for production.)*

### 2.5 Explaining a number
Where a metric shows **"Explain,"** click it to open a panel with the metric's definition,
formula, data sources, freshness, what's driving it, any anomaly, and the recommended action —
with a link to the supporting view.

---

## 3. Switching roles (both roles)

Use **Role** in the Intelligence Context bar to switch between CEO / Executive, Finance,
and others. Switching changes:
- which sections and views appear in the sidebar,
- the home view you land on,
- the emphasis of dashboards (executive vs. operator).

This is how you demonstrate that IMBA-OS is one system serving many jobs. Your last role and
filters are remembered between sessions.

---

## 4. CEO / Executive guide (Kent)

The CEO lands on **Executive brief** and works mostly from the **Management** section, reading
across every pillar for the few decisions only the CEO makes.

### 4.1 Management section (executive home)
| View | What it does | How to use it |
|---|---|---|
| **Executive brief** | The 15-minute view — what changed, why it matters, what's forecast, what you decide | Start here each day. Use the filters to focus on a region/phase; click **Explain** on any KPI to see the story behind it. |
| **WHAT_IF Lab** | Price the next idea before committing | Enter an idea's assumptions (new program, partnership, equipment); see cost fully loaded, the cash effect over 12–24 months, and the earned-revenue / subsidy needed to sustain it. |
| **Decision room** | Approve, adjust, or pause | Review the open decisions; each states the objective, the financial/compliance boundary, and responsible options. Record a decision. |
| **First-year roadmap** | Day 1 → Year 1 plan | Track the dated deliverables (close, job costing, portfolio visibility, liquidity, audit). |

### 4.2 Reading across the pillars
As CEO you can open any section for the executive cut:
- **Money → Liquidity runway** — cash you can actually deploy (after restrictions,
  obligations, deferred revenue, and cost-to-complete) with a 13-week forecast.
- **Money → Company snapshot** — revenue, expense, result, deployable cash, and close status
  in one home.
- **Mission → Trail Solutions / Project delivery** — backlog, margin, and delivery health.
- **People → Capacity plan** — staff against the pipeline.
- **Development → Development engine** — membership and philanthropy pace.
- **Governance → Board portal** — packets, decisions, and evidence.

### 4.3 Alerts & briefings
Open **Alerts + briefings** (top bar) to see exception alerts (e.g., a project outside its
guardrail, delivery ahead of billing). Use these to decide where to spend attention.

---

## 5. Finance Director guide (Terry)

The Finance role lands on **Company snapshot** and owns the **Money** pillar end-to-end. Every
Money view is available.

### 5.1 Money section — view by view
| View | What it does | Key actions |
|---|---|---|
| **Finance architecture** | The close and the three layers (job costing → portfolio → liquidity) | Orientation for the finance operating model. |
| **Company snapshot** | QuickBooks-style finance home: revenue, expense, result, deployable cash, close checklist | Launch into budget, grants, AP/AR, reports; track the monthly close. |
| **Finance calendar** | Close, payroll, billing, grant, chapter, audit, and Board deadlines | Owned schedule with owners and due dates; recurring cadence (daily→annual). |
| **Chart of accounts** | Canonical parent + chapter account standard | Search accounts; each shows type, who it applies to, and its required dimension (project/chapter/restriction). |
| **Grant tracking** | Award-to-close lifecycle | Select an award; edit allowable spend and status. Changes persist and queue a QBO tie-out for approval. |
| **Budget + forecast** | Plan vs. actual vs. forecast by revenue engine and cost center | Filter by engine; read variance and year-end forecast; see the forecast bridge. |
| **Accounts payable** | Approve & pay vendor bills (the flagship workflow — see §6) | View the invoice, then Approve & Pay / Hold / Reject. |
| **Accounts receivable** | Collections, unbilled milestones, aging | View a receivable; queue a collection follow-up. |
| **Reports** | Financial statements suite (see §7) | Open a statement; drill into any figure; print or export CSV. |
| **Bills + invoices** | Controlled transaction entry | Enter a vendor bill or client invoice with required coding; submit into the approval queue. Release to QuickBooks requires mapping validation + approval. |
| **Liquidity runway** | Deployable cash vs. gross cash + 13-week forecast | The number leadership can responsibly commit against defined milestones. |

### 5.2 Finance-relevant views in other sections
- **Platform → Integration control / QuickBooks connector / ADP connector / Mapping center /
  Sync queue / Integration audit** — the connector layer that keeps IMBA-OS and the systems of
  record in agreement (see §8).
- **People → PEO + payroll** — labor allocation and close hand-off from ADP.
- **Development → Grant workspace** — grant pipeline that hands off to Money's grant tracking.
- **Governance → Compliance / Board portal** — audit and Form 990 readiness, board packets.

---

## 6. The Accounts Payable approval workflow (detailed)

**Where:** Money → **Accounts payable**. This is the most interactive function, so here is the
full model.

### 6.1 People and limits
Use **Acting as** (in the AP view) to switch between:
| Person | Role | Can |
|---|---|---|
| Dana Reyes | AP Specialist | Enter and submit bills (approval limit $0) |
| Terry Holliday | Finance Director | Approve up to $25,000 |
| Kent McNeill | Executive | Approve any amount |

### 6.2 How a bill moves
1. **Coded → Submit for approval** (AP Specialist).
2. **In review** — routed by amount and restriction:
   - Under $5,000 → Finance Director only.
   - $5,000+ or any donor-restricted bill → Finance Director, then Executive.
3. The **final approver** decides:
   - **Approve & Pay** — initiates payment via the Bill.com API (status → Paid).
   - **Approve & Hold** — approved, payment held (status → On hold; release later).
   - **Reject** — declined, with a reason.
   Intermediate approvers use **Approve** to advance to the next approver.

### 6.3 Guardrails (always enforced)
- **Segregation of duties** — you cannot approve a bill you entered.
- **Approval limits** — you cannot approve above your limit.
- **Role gating** — you can only act at the step matching your role.
- **Money boundary** — IMBA-OS stages and approves; the actual disbursement happens in
  Bill.com. Approve & Pay logs an outbound job on the control plane — a person authorizes each
  payment.

### 6.4 Viewing a bill
Click **View** on any bill to open the drawer:
- **Left:** the source invoice (vendor, dates, PO#, line items, total).
- **Right:** GL coding, program/fund, restriction, the approval chain, the full audit trail,
  and the action buttons available to you.

### 6.5 Reading the board
The top KPIs (Open payables, Awaiting my decision, Overdue, Approved on hold) recompute as you
act and as you switch roles. The **Awaiting** column shows who the bill is waiting on.

---

## 7. Financial reports & drill-down (detailed)

**Where:** Money → **Reports**. Four QuickBooks-style statements rendered as white "document"
canvases:
- **Statement of Activities** (P&L) — three-year comparative + % of revenue.
- **Statement of Financial Position** (Balance Sheet).
- **Statement of Cash Flows** (deployable-cash bridge).
- **Budget vs. Actual** (base budget vs. probability-weighted forecast + variance).

**How to use:**
- Switch statements with the tabs.
- **Drill-down (QuickZoom):** on the Statement of Activities, click any figure to open its
  composition (e.g., Contributions → foundation grants, individual gifts, corporate,
  chapters). Real breakdowns where public data allows; illustrative ones are labeled, with a
  "Connect the GL for transaction detail" note.
- **Export CSV** — download the statement.
- **Print** — opens the browser's print dialog.

> **Note on print preview.** The Print button uses the browser's standard print. *Print
> preview* is supplied by the host browser, so inside the Claude in-app preview you may see
> "This app doesn't support print preview." In a normal browser (Chrome/Edge) it previews and
> prints/saves-to-PDF correctly. A dedicated PDF export is planned so output is
> host-independent.

---

## 8. Connectors (Platform)

**Where:** Platform → **Integration control** and the connector views. IMBA-OS is the system of
engagement; the connectors keep it in agreement with the systems of record:
- **QuickBooks Online** — accounting / general ledger (system of record for financials).
- **ADP** — payroll and workforce (via the PEO).
- **Bill.com** — vendor bill payment.
- Bank feeds, and more as IMBA adds systems (the connector model is open-ended).

**Controls:** connector mode (Demo / Sandbox / Production), field **mappings** (canonical
cross-system codes), the **sync queue** (approvals, retries, errors), and an **integration
audit** trail. Writes are **staged and require approval** before posting to a system of record.

---

## 9. Quick function reference (CEO + Finance)

| Function | Where | One-line how-to |
|---|---|---|
| Switch role | Intelligence Context bar → Role | Pick CEO / Finance to change access + emphasis. |
| Filter the portfolio | Intelligence Context bar | Set Region / Phase / Signal / Project; everything below updates. |
| Save a view | Intelligence Context bar → Save view | Name the current role + filters to return later. |
| Open alerts | Top bar → Alerts + briefings | Review exception alerts; badge = active count. |
| See a section's data sources | Top bar → (i) | Hover for provenance + notes. |
| Explain a metric | Any "Explain" link | Definition, formula, sources, drivers, action. |
| Approve/pay a bill | Money → Accounts payable → View | Approve & Pay / Hold / Reject (final approver). |
| Chase a receivable | Money → Accounts receivable → View | Queue a collection follow-up. |
| Read a statement | Money → Reports | Tab to a statement; click a figure to drill; Export/Print. |
| Check deployable cash | Money → Liquidity runway | Deployable vs. gross cash + 13-week forecast. |
| Manage a grant | Money → Grant tracking | Select award; edit allowable spend/status (queues QBO tie-out). |
| Enter a bill/invoice | Money → Bills + invoices | Fill required coding; submit to approval. |
| Review connectors | Platform → Integration control | Mode, mappings, sync queue, audit. |

---

## 10. What's next for this guide
- Render this to **Word / PDF** for sharing outside the app.
- Build the **in-app Help** version (pick a role → see every function with steps).
- Extend to the remaining roles (Trail Solutions, Development, Board) and the AP-specialist and
  approver actor views.
