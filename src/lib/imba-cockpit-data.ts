export type ImbaScenarioKey = 'base' | 'conservative' | 'expansion';

export type ImbaProjectStatus = 'healthy' | 'watch' | 'at-risk';

export interface ImbaScenario {
  label: string;
  description: string;
  deployableCash: number;
  runwayMonths: number;
  forecastResult: number;
  backlog: number;
  weightedPipeline: number;
  yearEndCash: number;
  cashSeries: number[];
}

export interface ImbaProject {
  name: string;
  region: string;
  phase: string;
  completion: number;
  contractValue: number;
  forecastCost: number;
  contribution: number;
  billed: number;
  status: ImbaProjectStatus;
  signal: string;
}

export interface ImbaDecision {
  id: string;
  urgency: 'Now' | 'This month' | 'Monitor';
  title: string;
  context: string;
  recommendation: string;
  financialEffect: string;
  owner: string;
  due: string;
}

export const imbaScenarios: Record<ImbaScenarioKey, ImbaScenario> = {
  base: {
    label: 'Base plan',
    description: 'Contracted work lands on schedule; current hiring plan holds.',
    deployableCash: 1_740_000,
    runwayMonths: 6.8,
    forecastResult: -320_000,
    backlog: 4_820_000,
    weightedPipeline: 2_940_000,
    yearEndCash: 1_910_000,
    cashSeries: [2.42, 2.31, 2.18, 2.08, 1.94, 1.82, 1.71, 1.66, 1.72, 1.78, 1.84, 1.88, 1.91],
  },
  conservative: {
    label: 'Conservative',
    description: 'Two starts slip and collections extend by roughly 30 days.',
    deployableCash: 1_510_000,
    runwayMonths: 5.5,
    forecastResult: -610_000,
    backlog: 4_260_000,
    weightedPipeline: 2_210_000,
    yearEndCash: 1_420_000,
    cashSeries: [2.42, 2.27, 2.09, 1.91, 1.72, 1.55, 1.39, 1.28, 1.25, 1.29, 1.34, 1.38, 1.42],
  },
  expansion: {
    label: 'Expansion',
    description: 'Priority pipeline converts and delivery capacity is added in stages.',
    deployableCash: 1_890_000,
    runwayMonths: 7.6,
    forecastResult: 140_000,
    backlog: 5_730_000,
    weightedPipeline: 3_680_000,
    yearEndCash: 2_360_000,
    cashSeries: [2.42, 2.34, 2.26, 2.19, 2.12, 2.07, 2.03, 2.06, 2.12, 2.19, 2.27, 2.31, 2.36],
  },
};

export const publicBaseline = [
  { label: '2024 revenue', value: '$7.20M', detail: '56.5% program services' },
  { label: '2024 net result', value: '+$190K', detail: 'Filed Form 990' },
  { label: '2024 net assets', value: '$3.75M', detail: '$584K donor restricted' },
  { label: '2025 investment year', value: '−$779K', detail: 'Management annual report' },
];

export const imbaProjects: ImbaProject[] = [
  {
    name: 'Blue Ridge Regional Plan',
    region: 'Southeast',
    phase: 'Planning',
    completion: 68,
    contractValue: 620_000,
    forecastCost: 498_000,
    contribution: 19.7,
    billed: 71,
    status: 'healthy',
    signal: 'Billing is pacing delivery.',
  },
  {
    name: 'High Desert Trail System',
    region: 'Mountain West',
    phase: 'Design',
    completion: 44,
    contractValue: 890_000,
    forecastCost: 782_000,
    contribution: 12.1,
    billed: 39,
    status: 'watch',
    signal: 'Shared design hours are running 9% above plan.',
  },
  {
    name: 'Great Lakes Buildout',
    region: 'Midwest',
    phase: 'Construction',
    completion: 79,
    contractValue: 1_240_000,
    forecastCost: 1_134_000,
    contribution: 8.5,
    billed: 83,
    status: 'at-risk',
    signal: 'Equipment and closeout reserve need a decision.',
  },
  {
    name: 'Coastal Access Network',
    region: 'West',
    phase: 'Feasibility',
    completion: 31,
    contractValue: 410_000,
    forecastCost: 322_000,
    contribution: 21.5,
    billed: 34,
    status: 'healthy',
    signal: 'Scope and staffing remain aligned.',
  },
  {
    name: 'Appalachian Connector',
    region: 'Mid-Atlantic',
    phase: 'Fieldwork',
    completion: 56,
    contractValue: 735_000,
    forecastCost: 655_000,
    contribution: 10.9,
    billed: 47,
    status: 'watch',
    signal: 'Unbilled fieldwork is above the 30-day threshold.',
  },
];

export const imbaDecisions: ImbaDecision[] = [
  {
    id: 'equipment-release',
    urgency: 'Now',
    title: 'Release the next equipment tranche?',
    context: 'The purchase supports two likely construction starts, but only one is fully contracted today.',
    recommendation: 'Stage the order: authorize the long-lead items now and gate the balance on executed backlog.',
    financialEffect: 'Protects ~$185K of downside cash while preserving the August start window.',
    owner: 'Kent + Trail Solutions',
    due: 'Friday',
  },
  {
    id: 'design-capacity',
    urgency: 'This month',
    title: 'Add design capacity before the pipeline converts?',
    context: 'Current designers are modeled at 91% utilization in the base plan and 104% in expansion.',
    recommendation: 'Approve a contract bench now; trigger a permanent hire only at $750K of executed design backlog.',
    financialEffect: 'Adds $42K near-term flexibility and avoids ~$120K of premature annualized cost.',
    owner: 'Kent + People Ops',
    due: 'July review',
  },
  {
    id: 'billing-reset',
    urgency: 'Now',
    title: 'Reset billing milestones on three active projects?',
    context: 'Work performed is moving ahead of invoices, increasing the 13-week cash trough.',
    recommendation: 'Move to monthly progress billing with explicit client acceptance checkpoints.',
    financialEffect: 'Pulls an estimated $210K into the next 45 days without changing contract value.',
    owner: 'Finance + Project leads',
    due: 'Next 10 days',
  },
];

export const capacityRows = [
  { discipline: 'Planning', base: 82, expansion: 94, available: '1.4 FTE' },
  { discipline: 'Design', base: 91, expansion: 104, available: '0.6 FTE' },
  { discipline: 'Construction', base: 76, expansion: 89, available: '2.2 FTE' },
  { discipline: 'Project management', base: 87, expansion: 98, available: '0.9 FTE' },
];

export const liquidityConstraints = [
  { label: 'Gross cash', value: 3_220_000, tone: 'gross' },
  { label: 'Donor restrictions', value: -584_000, tone: 'constraint' },
  { label: 'Due to chapters', value: -318_000, tone: 'constraint' },
  { label: 'Deferred project revenue', value: -212_000, tone: 'constraint' },
  { label: 'Completion reserve', value: -366_000, tone: 'constraint' },
] as const;
