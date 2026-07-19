'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Database,
  Download,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';

export type ImbaEnterpriseView =
  | 'development-crm'
  | 'development-grant-pipeline'
  | 'development-campaigns'
  | 'development-trail-solutions'
  | 'development-marketing'
  | 'development-partnerships'
  | 'governance-board'
  | 'governance-compliance'
  | 'governance-vault'
  | 'communications-inbox'
  | 'communications-templates'
  | 'platform-systems'
  | 'platform-health'
  | 'platform-federated-data'
  | 'system-runbooks'
  | 'system-activity';

type Tone = 'amber' | 'rose' | 'indigo' | 'violet' | 'slate';

interface WorkspaceRecord {
  id: string;
  name: string;
  secondary: string;
  value: string;
  owner: string;
  due: string;
  status: string;
  detail: string;
}

interface WorkspaceConfig {
  section: string;
  title: string;
  description: string;
  tone: Tone;
  valueLabel: string;
  ownerLabel: string;
  dueLabel: string;
  metrics: Array<{ label: string; value: string; note: string }>;
  records: WorkspaceRecord[];
}

const configs: Record<ImbaEnterpriseView, WorkspaceConfig> = {
  'development-crm': {
    section: 'Development · relationship pipeline', title: 'CRM workspace', tone: 'amber', valueLabel: 'Potential', ownerLabel: 'Relationship owner', dueLabel: 'Next move', description: 'One relationship record for major gifts, sponsorships, institutional funders, member growth, restrictions, and next actions.',
    metrics: [{ label: 'Qualified pipeline', value: '$6.4M', note: 'Probability-adjusted $3.1M' }, { label: 'Active relationships', value: '47', note: '12 need a next action' }, { label: 'Campaign commitments', value: '$9.2M', note: 'Leading with Trails demo baseline' }, { label: '90-day opportunity', value: '$1.1M', note: 'Five leadership moves' }],
    records: [
      { id: 'REL-042', name: 'National Outdoor Brand', secondary: 'Corporate partnership', value: '$750K', owner: 'Kent', due: 'Executive briefing', status: 'Cultivation', detail: 'Three-year trail access partnership; align national visibility with measurable community outcomes.' },
      { id: 'REL-057', name: 'Community Health Foundation', secondary: 'Institutional funder', value: '$425K', owner: 'Development', due: 'Concept paper · Jul 29', status: 'Qualified', detail: 'Trails and public-health case; program budget must separate evaluation and direct delivery.' },
      { id: 'REL-063', name: 'Leadership Circle Prospect', secondary: 'Major gift', value: '$250K', owner: 'Board member', due: 'Introduction · Aug 2', status: 'Relationship', detail: 'Board-connected prospect with interest in youth access and rural economic development.' },
      { id: 'REL-071', name: 'Evergreen Trails Foundation', secondary: 'Foundation relationship', value: '$1.2M', owner: 'Programs', due: 'Renewal strategy', status: 'Stewardship', detail: 'Current award performance and reimbursement timeliness drive renewal confidence.' },
    ],
  },
  'development-grant-pipeline': {
    section: 'Development · pre-award grants', title: 'Grant workspace', tone: 'amber', valueLabel: 'Request', ownerLabel: 'Proposal owner', dueLabel: 'Deadline', description: 'Research, qualify, draft, budget, review, submit, and hand awarded grants into Finance without losing restrictions or assumptions.',
    metrics: [{ label: 'Open opportunities', value: '14', note: 'Seven qualified' }, { label: 'Qualified request value', value: '$2.7M', note: '$1.4M probability adjusted' }, { label: 'Next 30 days', value: '4', note: 'Two budgets need review' }, { label: 'Award handoffs', value: '3', note: 'Restriction setup pending' }],
    records: [
      { id: 'OPP-118', name: 'Rural Trails Catalyst', secondary: 'Planning + community engagement', value: '$600K', owner: 'Programs + Development', due: 'Aug 16', status: 'Budget review', detail: 'Build proposal budget directly from project labor, indirect rate, travel, and deliverable assumptions.' },
      { id: 'OPP-124', name: 'Youth Outdoor Access Fund', secondary: 'Education + access', value: '$275K', owner: 'Programs', due: 'Sep 5', status: 'Drafting', detail: 'Needs outcome framework and chapter implementation commitments before final narrative.' },
      { id: 'OPP-131', name: 'Climate Resilient Recreation', secondary: 'Conservation planning', value: '$850K', owner: 'Advocacy', due: 'Oct 1', status: 'Qualified', detail: 'Multi-state opportunity; requires subrecipient and chapter compliance design.' },
      { id: 'OPP-135', name: 'Trail Workforce Initiative', secondary: 'Training + equipment', value: '$390K', owner: 'Trail Solutions', due: 'Sep 18', status: 'Research', detail: 'Test eligibility for equipment, seasonal labor, and credentialing before committing scope.' },
    ],
  },
  'development-campaigns': {
    section: 'Development · campaigns + membership', title: 'Campaign command center', tone: 'amber', valueLabel: 'Progress', ownerLabel: 'Campaign owner', dueLabel: 'Next milestone', description: 'Commitments, cash, restrictions, membership conversion, stewardship, and the operational milestones promised to funders.',
    metrics: [{ label: 'Campaign goal', value: '$20M', note: 'Public campaign framing' }, { label: 'Commitments', value: '46%', note: 'Illustrative progress' }, { label: 'Cash conversion', value: '71%', note: 'Of booked commitments' }, { label: 'Membership trend', value: '+23%', note: '2025 public baseline' }],
    records: [
      { id: 'CAM-01', name: 'Leading with Trails', secondary: 'National campaign', value: '46%', owner: 'Kent + Development', due: 'Leadership phase review', status: 'Active', detail: 'Connect every commitment to use-of-funds, cash schedule, deliverables, and leadership stewardship.' },
      { id: 'CAM-07', name: 'Member Renewal Sprint', secondary: 'Individual membership', value: '68%', owner: 'Membership', due: 'August wave', status: 'On track', detail: 'Renewal, chapter attribution, processing cost, and unrestricted contribution tracked together.' },
      { id: 'CAM-11', name: 'Trail Champions', secondary: 'Mid-level giving', value: '39%', owner: 'Development', due: 'Fall launch', status: 'Build', detail: 'Segment by engagement, geography, and chapter relationship; establish a clear upgrade path.' },
      { id: 'CAM-14', name: 'Equipment Investment Case', secondary: 'Restricted capital', value: '54%', owner: 'Trail Solutions', due: 'Impact update', status: 'Stewardship', detail: 'Report utilization, project starts enabled, cost recovery, and maintenance reserve.' },
    ],
  },
  'development-trail-solutions': {
    section: 'Development / earned-revenue growth', title: 'Trail Solutions business development', tone: 'amber', valueLabel: 'Potential', ownerLabel: 'Opportunity owner', dueLabel: 'Next evidence', description: 'Move qualified demand from inquiry through discovery, scope, pricing, proposal, contract, funding mix, and a controlled handoff into project delivery.',
    metrics: [{ label: 'Qualified pipeline', value: '$5.8M', note: 'Illustrative opportunity value' }, { label: 'Weighted pipeline', value: '$2.9M', note: 'Certified stage probabilities' }, { label: 'Proposals open', value: '9', note: 'Three decisions in 30 days' }, { label: 'Delivery handoffs', value: '4', note: 'Scope and economics accepted' }],
    records: [
      { id: 'TSBD-104', name: 'County trail master plan', secondary: 'Planning and design', value: '$420K', owner: 'Trail Solutions BD', due: 'Discovery workshop', status: 'Qualified', detail: 'Confirm decision makers, community readiness, site access, scope boundaries, funding source, schedule, and procurement path before estimating.' },
      { id: 'TSBD-117', name: 'Regional bike park build', secondary: 'Construction', value: '$1.6M', owner: 'Construction Director', due: 'Concept estimate / Aug 12', status: 'Scoping', detail: 'Separate probable construction from alternates, owner-provided work, contingency, permitting, equipment, subcontractors, and acceptance.' },
      { id: 'TSBD-123', name: 'Destination signage system', secondary: 'Signage and wayfinding', value: '$285K', owner: 'Signage Lead', due: 'Proposal / Aug 4', status: 'Proposal', detail: 'Proposal joins sign inventory, design, approvals, fabrication, installation, asset data, and maintenance ownership.' },
      { id: 'TSBD-131', name: 'Trail maintenance partnership', secondary: 'Recurring stewardship', value: '$190K', owner: 'Trail Solutions BD', due: 'Funding mix review', status: 'Decision', detail: 'Model a paid, grant-supported, and local-capacity blend with clear service levels and renewal evidence.' },
    ],
  },
  'development-marketing': {
    section: 'Development / marketing + communications', title: 'Marketing and communications', tone: 'amber', valueLabel: 'Audience / reach', ownerLabel: 'Content owner', dueLabel: 'Publish / send', description: 'Join audience strategy, editorial planning, email lifecycle, digital fundraising, public education, press, brand control, and measurable campaign attribution.',
    metrics: [{ label: 'Active audiences', value: '12', note: 'Members through decision makers' }, { label: 'Editorial queue', value: '18', note: 'Six mission-critical stories' }, { label: 'Attributed actions', value: '4,820', note: 'Illustrative 90-day total' }, { label: 'Approval exceptions', value: '2', note: 'Brand or policy review' }],
    records: [
      { id: 'MKT-2607', name: 'Community progress story series', secondary: 'Mission storytelling', value: 'National', owner: 'Communications', due: 'Jul 31', status: 'Production', detail: 'Stories draw from certified community milestones, partner permissions, approved images, impact evidence, calls to action, and source attribution.' },
      { id: 'MKT-2610', name: 'Fall membership drive', secondary: 'Acquisition and retention', value: 'Members + prospects', owner: 'Membership', due: 'Aug 15', status: 'Build', detail: 'Segments, local attribution, benefits, partner incentives, templates, training, conversion, renewals, fees, and cash all reconcile.' },
      { id: 'MKT-2614', name: 'Policy action alert', secondary: 'Advocacy communications', value: '3 states', owner: 'Government Affairs', due: 'Aug 2', status: 'Approval', detail: 'Geographic audience, policy position, decision-maker target, deadline, message approval, actions, and outcome are linked to the issue record.' },
      { id: 'MKT-2619', name: 'Trails Count impact package', secondary: 'Data storytelling', value: 'Grant cohort', owner: 'Programs + Comms', due: 'Sep 10', status: 'Data wait', detail: 'Infographics, social cards, presentations, press obligations, partner branding, and data provenance share one production record.' },
    ],
  },
  'development-partnerships': {
    section: 'Development / corporate partnerships', title: 'Corporate partnerships', tone: 'amber', valueLabel: 'Value', ownerLabel: 'Partner owner', dueLabel: 'Next commitment', description: 'Manage sponsorship strategy, contracts, cash and in-kind value, benefit inventory, activation, co-branding, reporting, renewals, and mission outcomes.',
    metrics: [{ label: 'Active partners', value: '24', note: 'Illustrative national portfolio' }, { label: 'Annual value', value: '$2.1M', note: 'Cash plus approved in-kind' }, { label: 'Benefits due', value: '17', note: 'Next 60 days' }, { label: 'Renewal risk', value: '$280K', note: 'Three relationships' }],
    records: [
      { id: 'PTR-041', name: 'National bike manufacturer', secondary: 'Mission sponsor', value: '$600K', owner: 'Partnerships', due: 'Impact briefing', status: 'Active', detail: 'Agreement value, payment schedule, category rights, campaign benefits, community outcomes, content approvals, and renewal plan stay connected.' },
      { id: 'PTR-056', name: 'Trail-count technology partner', secondary: 'Program delivery partner', value: '$180K in-kind', owner: 'Local Programs', due: 'Cohort review', status: 'Delivering', detail: 'Equipment, licenses, consultation, installation, data responsibilities, branded deliverables, support, and grant reporting are tracked.' },
      { id: 'PTR-063', name: 'Outdoor coalition partner', secondary: 'Advocacy alliance', value: 'Shared platform', owner: 'Government Affairs', due: 'Annual MOU', status: 'Renewal', detail: 'Coalition roles, platform access, data sharing, approved issues, audience rules, costs, and outcomes are explicit.' },
      { id: 'PTR-074', name: 'Member benefits network', secondary: 'Membership fulfillment', value: '14 benefits', owner: 'Membership', due: 'Fall activation', status: 'On track', detail: 'Eligibility, offers, fulfillment, co-marketing, data exchange, service support, and partner performance are visible.' },
    ],
  },
  'governance-board': {
    section: 'Governance · Board portal', title: 'Board finance room', tone: 'rose', valueLabel: 'Decision / packet', ownerLabel: 'Owner', dueLabel: 'Meeting / due', description: 'Board packets, decisions, scenarios, committee work, minutes, evidence, and follow-through in one controlled room.',
    metrics: [{ label: 'Next meeting', value: 'Aug 21', note: 'Packet lock Aug 14' }, { label: 'Open decisions', value: '4', note: 'Two finance recommendations' }, { label: 'Packet readiness', value: '72%', note: 'Three owner inputs open' }, { label: 'Prior actions', value: '8 / 10', note: 'Two due this month' }],
    records: [
      { id: 'BD-2608-01', name: 'FY2026 forecast reset', secondary: 'Finance Committee', value: 'Decision', owner: 'Finance Director', due: 'Aug 14', status: 'Drafting', detail: 'Base, conservative, and expansion cases with liquidity, capacity, and milestone gates.' },
      { id: 'BD-2608-02', name: 'Technology investment scorecard', secondary: 'Full Board', value: 'Monitor', owner: 'Kent + Platform', due: 'Aug 12', status: 'Owner input', detail: 'Compare expected operational outcomes with actual implementation milestones and spend.' },
      { id: 'BD-2608-03', name: 'Trail Solutions portfolio risk', secondary: 'Finance Committee', value: 'Discuss', owner: 'Trail Solutions', due: 'Aug 10', status: 'Ready', detail: 'Backlog, EAC, billing, capacity, equipment exposure, and top three project exceptions.' },
      { id: 'BD-2608-04', name: 'Chapter uniformity standard', secondary: 'Governance Committee', value: 'Approve', owner: 'Finance + Network', due: 'Aug 8', status: 'Review', detail: 'Minimum monthly packet, canonical mapping, certifications, and exception escalation.' },
    ],
  },
  'governance-compliance': {
    section: 'Governance · organizational compliance', title: 'Compliance calendar', tone: 'rose', valueLabel: 'Scope', ownerLabel: 'Control owner', dueLabel: 'Due', description: 'Parent and chapter filings, audit, tax, registrations, contracts, conflicts, donor restrictions, and policy reviews.',
    metrics: [{ label: 'Standing controls', value: '26', note: 'Parent + chapter network' }, { label: 'Due in 60 days', value: '7', note: 'Two need evidence' }, { label: 'Network exceptions', value: '5', note: 'Owned remediation' }, { label: 'Overdue', value: '1', note: 'Chapter good-standing receipt' }],
    records: [
      { id: 'CMP-091', name: 'Independent audit preparation', secondary: 'Parent association', value: 'PBC', owner: 'Finance', due: 'Nov 15', status: 'On track', detail: 'Standing PBC evidence, management-letter actions, restrictions, functional expense, and governance support.' },
      { id: 'CMP-097', name: 'State charitable registrations', secondary: 'Multi-state fundraising', value: '22 states', owner: 'Finance + legal', due: 'Rolling', status: 'Watch', detail: 'Calendar renewals, revenue thresholds, exemptions, and filing evidence by jurisdiction.' },
      { id: 'CMP-104', name: 'Conflict-of-interest attestations', secondary: 'Board + officers', value: '31 / 33', owner: 'Governance', due: 'Jul 31', status: 'Action', detail: 'Collect missing attestations and retain review/evaluation evidence.' },
      { id: 'CMP-110', name: 'Chapter annual certification', secondary: 'Member organizations', value: '87%', owner: 'Network', due: 'Aug 30', status: 'Watch', detail: 'Good standing, 990 status, insurance, conflicts, financial packet, and board certification.' },
    ],
  },
  'governance-vault': {
    section: 'Governance · controlled evidence', title: 'Governance vault', tone: 'rose', valueLabel: 'Version', ownerLabel: 'Custodian', dueLabel: 'Review', description: 'Current governing documents, policies, contracts, audit files, minutes, chapter agreements, and restricted-fund evidence.',
    metrics: [{ label: 'Controlled documents', value: '184', note: '23 high-consequence' }, { label: 'Reviews due', value: '6', note: 'Within 90 days' }, { label: 'Missing evidence', value: '3', note: 'Linked to compliance queue' }, { label: 'Access reviews', value: '100%', note: 'Quarterly complete' }],
    records: [
      { id: 'DOC-001', name: 'Articles + bylaws', secondary: 'Governing document', value: 'v7.2', owner: 'Board Secretary', due: 'Jan 2027', status: 'Current', detail: 'Executed governing version, amendment history, approvals, and controlled distribution.' },
      { id: 'DOC-028', name: 'Chapter affiliation agreement', secondary: 'Network standard', value: '2026.1', owner: 'Network + legal', due: 'Dec 2026', status: 'Current', detail: 'Financial reporting, brand, insurance, governance, data exchange, and remediation obligations.' },
      { id: 'DOC-054', name: 'Indirect cost methodology', secondary: 'Finance policy', value: 'Draft 3', owner: 'Finance', due: 'Aug 15', status: 'Review', detail: 'Loaded labor, shared personnel, equipment, facilities, and indirect recovery treatment.' },
      { id: 'DOC-073', name: '2025 audit + management letter', secondary: 'Audit evidence', value: 'Final', owner: 'Finance Committee', due: 'Closed', status: 'Current', detail: 'Financial statements, representation letter, findings, recommendations, and remediation owners.' },
    ],
  },
  'communications-inbox': {
    section: 'Communications · shared commitments', title: 'Stakeholder inbox', tone: 'indigo', valueLabel: 'Context', ownerLabel: 'Assigned to', dueLabel: 'Response due', description: 'Route client, chapter, funder, member, and Board messages into owned work without letting commitments disappear in personal inboxes.',
    metrics: [{ label: 'Needs response', value: '11', note: 'Three finance-dependent' }, { label: 'Chapter requests', value: '6', note: 'Two settlement questions' }, { label: 'Client approvals', value: '4', note: '$252K billing impact' }, { label: 'Median response', value: '7h', note: 'Inside 1-day standard' }],
    records: [
      { id: 'MSG-778', name: 'High Desert County', secondary: 'Client acceptance', value: '$178K', owner: 'Project lead', due: 'Today', status: 'Action', detail: 'Obtain milestone acceptance so Finance can issue the design invoice.' },
      { id: 'MSG-781', name: 'Blue Ridge Trail Coalition', secondary: 'Chapter reporting', value: 'Packet', owner: 'Network Finance', due: 'Jul 31', status: 'Assigned', detail: 'Clarify restricted-cash roll-forward and complete the monthly packet.' },
      { id: 'MSG-786', name: 'Outdoor Access Foundation', secondary: 'Funder report', value: 'Narrative', owner: 'Programs', due: 'Aug 15', status: 'Drafting', detail: 'Program outcomes must reconcile to allowable-cost and grant burn reporting.' },
      { id: 'MSG-790', name: 'Finance Committee Chair', secondary: 'Board request', value: 'Forecast', owner: 'Finance', due: 'Friday', status: 'Ready', detail: 'Provide scenario bridge and the assumptions behind the 13-week cash trough.' },
    ],
  },
  'communications-templates': {
    section: 'Communications · controlled templates', title: 'Message templates', tone: 'indigo', valueLabel: 'Usage', ownerLabel: 'Template owner', dueLabel: 'Review', description: 'Approved templates for invoices, collections, chapter packets, grant reports, campaigns, Board packets, and decision follow-up.',
    metrics: [{ label: 'Approved templates', value: '28', note: 'Seven finance-controlled' }, { label: 'Used this month', value: '146', note: 'Across five stakeholder groups' }, { label: 'Reviews due', value: '4', note: 'Language or owner update' }, { label: 'Unapproved drafts', value: '2', note: 'Blocked from send' }],
    records: [
      { id: 'TPL-014', name: 'Project milestone invoice', secondary: 'Client finance', value: '42 sends', owner: 'Finance', due: 'Oct 2026', status: 'Approved', detail: 'Milestone, acceptance evidence, amount due, payment method, and project contact.' },
      { id: 'TPL-021', name: 'Chapter exception notice', secondary: 'Network compliance', value: '18 sends', owner: 'Network Finance', due: 'Sep 2026', status: 'Approved', detail: 'Plain-language exception, required correction, deadline, support, and escalation path.' },
      { id: 'TPL-026', name: 'Grant report request', secondary: 'Funder stewardship', value: '11 sends', owner: 'Development', due: 'Aug 2026', status: 'Review due', detail: 'Narrative owner, outcomes, financial period, restrictions, evidence, and internal due date.' },
      { id: 'TPL-031', name: 'Board decision follow-up', secondary: 'Governance', value: '9 sends', owner: 'Board Secretary', due: 'Jan 2027', status: 'Approved', detail: 'Decision, rationale, owner, milestone, due date, and next reporting point.' },
    ],
  },
  'platform-systems': {
    section: 'Platform · systems map', title: 'Systems + integrations', tone: 'violet', valueLabel: 'Data domain', ownerLabel: 'System owner', dueLabel: 'Sync', description: 'A governed integration map across finance, CRM, membership, project delivery, payroll, expenses, banking, and chapter submissions.',
    metrics: [{ label: 'Core systems', value: '8', note: 'Six integration contracts' }, { label: 'Automated flows', value: '14', note: 'Human approval retained' }, { label: 'Mapping coverage', value: '89%', note: 'Chapter exceptions remain' }, { label: 'Failed syncs', value: '2', note: 'Both isolated in staging' }],
    records: [
      { id: 'SYS-01', name: 'Accounting platform', secondary: 'General ledger + subledgers', value: 'Finance', owner: 'Finance', due: 'Daily', status: 'System of record', detail: 'Accounts, transactions, restrictions, entities, close, reporting, and audit evidence.' },
      { id: 'SYS-02', name: 'Project delivery platform', secondary: 'Monday.com / successor', value: 'Projects', owner: 'Trail Solutions', due: 'Weekly', status: 'Integrated', detail: 'Scope, phase, hours, commitments, milestone, EAC, client acceptance, and billing trigger.' },
      { id: 'SYS-03', name: 'CRM + membership', secondary: 'Constituents + chapters', value: 'Relationships', owner: 'Development', due: 'Daily', status: 'Upgrade', detail: 'Members, donors, funders, chapters, campaigns, commitments, attribution, and stewardship.' },
      { id: 'SYS-04', name: 'PEO + payroll', secondary: 'Worker + payroll source', value: 'People', owner: 'People Ops', due: 'Biweekly', status: 'Integrated', detail: 'Worker identity, gross pay, taxes, benefits, classifications, and labor allocation control total.' },
    ],
  },
  'platform-health': {
    section: 'Platform · observability', title: 'System health + exceptions', tone: 'violet', valueLabel: 'Availability', ownerLabel: 'Technical owner', dueLabel: 'Last check', description: 'Observe system availability, integration latency, data quality, failed syncs, access reviews, and incident follow-through.',
    metrics: [{ label: 'Systems healthy', value: '7 / 8', note: 'One degraded integration' }, { label: 'Data-quality rules', value: '32', note: 'Seven exceptions open' }, { label: 'Sync latency', value: '14m', note: 'Inside 30-minute target' }, { label: 'Access exceptions', value: '0', note: 'Quarterly review current' }],
    records: [
      { id: 'HLT-01', name: 'Membership → finance sync', secondary: 'Chapter attribution', value: '99.4%', owner: 'Platform', due: '4 min ago', status: 'Healthy', detail: 'Processor control total, member identity, chapter attribution, fee, and settlement staging.' },
      { id: 'HLT-02', name: 'Project EAC freshness', secondary: 'Management data quality', value: '82%', owner: 'Trail Solutions', due: 'Today', status: 'Degraded', detail: 'Three active projects have estimates older than the weekly policy.' },
      { id: 'HLT-03', name: 'PEO payroll import', secondary: 'Labor allocation', value: '100%', owner: 'Finance + People', due: 'Jul 19', status: 'Ready', detail: 'Control total received; missing project-time exceptions remain before posting.' },
      { id: 'HLT-04', name: 'Chapter packet staging', secondary: 'Network reporting', value: '87%', owner: 'Network Finance', due: 'Jul 31', status: 'Watch', detail: 'Late packet and two canonical mapping exceptions isolated from consolidation.' },
    ],
  },
  'platform-federated-data': {
    section: 'Platform / federated data governance', title: 'Federated data governance', tone: 'violet', valueLabel: 'Data domain', ownerLabel: 'Accountable owner', dueLabel: 'Control cadence', description: 'Define how IMBA National and local organizations share member, donor, volunteer, advocacy, event, finance, and community data with consent, ownership, quality, and automatic rollups.',
    metrics: [{ label: 'Local organizations', value: '200+', note: 'Public current-state scale' }, { label: 'Growth design', value: '600', note: 'Three-year target in public RFI' }, { label: 'Canonical domains', value: '11', note: 'Shared definitions and IDs' }, { label: 'Open data decisions', value: '8', note: 'Consent, ownership, retention' }],
    records: [
      { id: 'FDG-01', name: 'Community identity and hierarchy', secondary: 'Community / organization / people', value: 'Identity', owner: 'Community Programs', due: 'Continuous', status: 'Design', detail: 'One community may include municipalities, land managers, local organizations, advocates, funders, and IMBA owners without duplicating the community record.' },
      { id: 'FDG-02', name: 'Local membership rollup', secondary: 'Member lifecycle and attribution', value: 'Membership', owner: 'Membership + Platform', due: 'Daily', status: 'Control build', detail: 'Source organization, consent, person identity, status, payment, local attribution, benefits, fee, and national rollup reconcile automatically.' },
      { id: 'FDG-03', name: 'Advocacy audience permissions', secondary: 'Geography, issue, and consent', value: 'Engagement', owner: 'Government Affairs', due: 'Per campaign', status: 'Policy review', detail: 'Campaign eligibility, geographic targeting, message purpose, consent, local access, suppression, and outcome retention are governed.' },
      { id: 'FDG-04', name: 'Local organization data agreement', secondary: 'Sharing and service entitlement', value: 'Governance', owner: 'Legal + IMBA Local', due: 'Onboarding + annual', status: 'Action', detail: 'Agreement defines controller roles, permitted use, access, support, security, retention, exit handling, and national reporting rights.' },
    ],
  },
  'system-runbooks': {
    section: 'System · continuity', title: 'Runbooks', tone: 'slate', valueLabel: 'Coverage', ownerLabel: 'Process owner', dueLabel: 'Tested', description: 'Institution-owned procedures for close, billing, grants, chapter settlements, audit, payroll, incidents, and knowledge transfer.',
    metrics: [{ label: 'Core runbooks', value: '18', note: 'Ten finance-controlled' }, { label: 'Two-deep coverage', value: '72%', note: 'Four backup gaps' }, { label: 'Tests due', value: '3', note: 'This quarter' }, { label: 'Knowledge risks', value: '2', note: 'Single-person dependencies' }],
    records: [
      { id: 'RB-001', name: 'Monthly close', secondary: 'Finance', value: '92%', owner: 'Finance Director', due: 'Monthly', status: 'Current', detail: 'Calendar, control totals, reconciliations, review, certification, reporting, and reopen protocol.' },
      { id: 'RB-007', name: 'Chapter settlement cycle', secondary: 'Network Finance', value: '78%', owner: 'Finance', due: 'Jul 2026', status: 'Test due', detail: 'Membership attribution, processor reconciliation, exceptions, approval, payable, and chapter statement.' },
      { id: 'RB-011', name: 'Grant reimbursement package', secondary: 'Restricted funds', value: '88%', owner: 'Grant Finance', due: 'Aug 2026', status: 'Current', detail: 'Allowable-cost extraction, payroll support, invoice evidence, review, submission, receivable, and collection.' },
      { id: 'RB-016', name: 'Project billing trigger', secondary: 'Trail Solutions', value: '64%', owner: 'Finance + PM', due: 'Now', status: 'Action', detail: 'Milestone acceptance, progress calculation, change orders, invoice approval, send, and collection owner.' },
    ],
  },
  'system-activity': {
    section: 'System · append-only log', title: 'Activity + decision trail', tone: 'slate', valueLabel: 'Event', ownerLabel: 'Actor', dueLabel: 'Time', description: 'A searchable record of approvals, data imports, exceptions, certifications, scenario decisions, and controlled document changes.',
    metrics: [{ label: 'Events today', value: '86', note: '12 management-relevant' }, { label: 'Approvals', value: '9', note: 'One decision hold' }, { label: 'Data exceptions', value: '7', note: 'No uncontrolled postings' }, { label: 'Retention', value: '7 yrs', note: 'Policy-driven by record type' }],
    records: [
      { id: 'EVT-8801', name: 'Chapter packet rejected to exception queue', secondary: 'Data validation', value: 'Exception', owner: 'IMBA-OS', due: '8:42 AM', status: 'Assigned', detail: 'High Desert chapter account mapping failed on two restricted-fund lines; no records posted.' },
      { id: 'EVT-8813', name: 'Equipment invoice placed on decision hold', secondary: 'Accounts payable', value: '$185K', owner: 'Finance', due: '9:16 AM', status: 'Awaiting Kent', detail: 'Payment staged but blocked pending confirmation of the second construction start.' },
      { id: 'EVT-8820', name: 'Project EAC certified', secondary: 'Great Lakes Buildout', value: '$1.13M', owner: 'Construction PM', due: '10:05 AM', status: 'Certified', detail: 'Updated equipment and closeout reserve included; portfolio forecast refreshed.' },
      { id: 'EVT-8834', name: 'Scenario decision recorded', secondary: 'Design capacity', value: 'Contract bench', owner: 'Kent', due: '11:32 AM', status: 'Approved', detail: 'Contract bench approved; permanent hire remains gated on $750K executed design backlog.' },
    ],
  },
};

const toneClasses: Record<Tone, { border: string; text: string; button: string; tint: string }> = {
  amber: { border: 'border-amber-300/20', text: 'text-amber-800 dark:text-amber-100', button: 'bg-amber-300', tint: 'bg-amber-300/[0.04]' },
  rose: { border: 'border-rose-300/20', text: 'text-rose-700 dark:text-rose-100', button: 'bg-rose-300', tint: 'bg-rose-300/[0.04]' },
  indigo: { border: 'border-indigo-300/20', text: 'text-indigo-700 dark:text-indigo-100', button: 'bg-indigo-300', tint: 'bg-indigo-300/[0.04]' },
  violet: { border: 'border-violet-300/20', text: 'text-violet-700 dark:text-violet-100', button: 'bg-violet-300', tint: 'bg-violet-300/[0.04]' },
  slate: { border: 'border-slate-300/20', text: 'text-slate-700 dark:text-slate-100', button: 'bg-slate-300', tint: 'bg-slate-300/[0.04]' },
};

export function ImbaEnterpriseWorkspace({ view }: { view: ImbaEnterpriseView }) {
  const config = configs[view];
  const tone = toneClasses[config.tone];
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(config.records[0].id);
  const [action, setAction] = useState('');
  const records = useMemo(() => config.records.filter((record) => `${record.name} ${record.secondary} ${record.status}`.toLowerCase().includes(query.toLowerCase())), [config.records, query]);
  const selected = config.records.find((record) => record.id === selectedId) ?? config.records[0];
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{config.metrics.map((metric) => <div key={metric.label} className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">{metric.label}</p><p className={`mt-3 font-mono text-2xl font-semibold ${tone.text}`}>{metric.value}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{metric.note}</p></div>)}</div><div className="grid gap-5 xl:grid-cols-12"><section className="rounded-[22px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] xl:col-span-8"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Operating register</p><h3 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{config.title} queue</h3></div><label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="w-40 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Record</th><th className="px-3 py-3">{config.valueLabel}</th><th className="px-3 py-3">{config.ownerLabel}</th><th className="px-3 py-3">{config.dueLabel}</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} onClick={() => { setSelectedId(record.id); setAction(''); }} className={`cursor-pointer border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.025)] ${selected.id === record.id ? tone.tint : ''}`}><td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{record.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{record.id} · {record.secondary}</p></td><td className={`px-3 py-3.5 font-mono text-xs font-semibold ${tone.text}`}>{record.value}</td><td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{record.owner}</td><td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{record.due}</td><td className="px-5 py-3.5"><span className="rounded-full border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.035)] px-2 py-1 text-[11px] font-black uppercase text-[rgb(var(--text))]">{record.status}</span></td></tr>)}</tbody></table></div></section><section className="rounded-[22px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] xl:col-span-4"><div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Selected · {selected.id}</p><h3 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{selected.name}</h3></div><div className="space-y-4 p-5"><p className="text-xs leading-6 text-[rgb(var(--text-2))]">{selected.detail}</p><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-3"><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Owner</p><p className="mt-1 text-[11px] font-semibold text-[rgb(var(--text))]">{selected.owner}</p></div><div className="rounded-xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-3"><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Status</p><p className={`mt-1 text-[11px] font-semibold ${tone.text}`}>{selected.status}</p></div></div><div className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4"><div className="flex items-center gap-2"><Database className={`h-3.5 w-3.5 ${tone.text}`} /><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Control posture</p></div><div className="mt-3 space-y-2">{['Owner and next action are explicit', 'Financial or compliance consequence is linked', 'Evidence and changes retain an audit trail'].map((item) => <div key={item} className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]"><ShieldCheck className="h-3.5 w-3.5 text-[rgb(var(--sa-soft))]" />{item}</div>)}</div></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setAction('Owner notified and action recorded.')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))] ${tone.button}`}><Send className="h-3.5 w-3.5" /> Assign</button><button type="button" onClick={() => setAction('Controlled export prepared with watermark.')} className="flex items-center justify-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] px-3 py-3 text-[11px] font-black uppercase text-[rgb(var(--text))]"><Download className="h-3.5 w-3.5" /> Export</button></div>{action ? <p className="flex items-center gap-2 text-[11px] text-[rgb(var(--sa-soft))]"><Check className="h-3.5 w-3.5" />{action}</p> : null}</div></section></div></div>;
}
