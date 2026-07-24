export type FinanceIntegrationView =
  | 'reconciliation'
  | 'campaign'
  | 'data-quality';

export type ReconciliationStatus = 'Matched' | 'Variance' | 'Pending';

export interface ReconciliationBatch {
  id: string;
  date: string;
  crmTotal: number;
  qboTotal: number;
  status: ReconciliationStatus;
  detail?: string;
  nextStep?: string;
}

export const reconciliationBatches: ReconciliationBatch[] = [
  { id: 'EA-260701-A', date: 'Jul 1', crmTotal: 18_500, qboTotal: 18_500, status: 'Matched' },
  { id: 'EA-260702-B', date: 'Jul 2', crmTotal: 12_200, qboTotal: 12_200, status: 'Matched' },
  {
    id: 'EA-260703-A',
    date: 'Jul 3',
    crmTotal: 24_950,
    qboTotal: 23_700,
    status: 'Variance',
    detail: "Fund code mismatch: CRM shows 'Leading with Trails' / QBO shows 'Unrestricted'.",
    nextStep: 'Review the $1,250 corporate match and post the corrected QBO class.',
  },
  { id: 'EA-260706-A', date: 'Jul 6', crmTotal: 8_900, qboTotal: 8_900, status: 'Matched' },
  { id: 'EA-260707-C', date: 'Jul 7', crmTotal: 31_750, qboTotal: 31_750, status: 'Matched' },
  { id: 'EA-260708-A', date: 'Jul 8', crmTotal: 16_400, qboTotal: 16_400, status: 'Matched' },
  { id: 'EA-260709-B', date: 'Jul 9', crmTotal: 11_250, qboTotal: 11_250, status: 'Matched' },
  {
    id: 'EA-260710-A',
    date: 'Jul 10',
    crmTotal: 27_500,
    qboTotal: 26_750,
    status: 'Variance',
    detail: 'Processor fee was netted against the deposit instead of recorded separately.',
    nextStep: 'Record the $750 processing fee and restore the gift deposit to its gross amount.',
  },
  { id: 'EA-260713-A', date: 'Jul 13', crmTotal: 7_450, qboTotal: 7_450, status: 'Matched' },
  { id: 'EA-260714-B', date: 'Jul 14', crmTotal: 22_100, qboTotal: 22_100, status: 'Matched' },
  { id: 'EA-260715-A', date: 'Jul 15', crmTotal: 19_800, qboTotal: 19_800, status: 'Matched' },
  { id: 'EA-260716-C', date: 'Jul 16', crmTotal: 13_600, qboTotal: 13_600, status: 'Matched' },
  { id: 'EA-260717-A', date: 'Jul 17', crmTotal: 25_500, qboTotal: 25_500, status: 'Matched' },
  { id: 'EA-260720-B', date: 'Jul 20', crmTotal: 9_200, qboTotal: 9_200, status: 'Matched' },
  {
    id: 'EA-260721-A',
    date: 'Jul 21',
    crmTotal: 14_250,
    qboTotal: 13_250,
    status: 'Pending',
    detail: 'Deposit timing: CRM batch closed 7/21; the final ACH deposit is expected 7/24.',
    nextStep: 'Keep $1,000 in the clearing account until the processor deposit posts.',
  },
  { id: 'EA-260722-C', date: 'Jul 22', crmTotal: 10_500, qboTotal: 10_500, status: 'Matched' },
  { id: 'EA-260723-A', date: 'Jul 23', crmTotal: 7_800, qboTotal: 7_800, status: 'Matched' },
  {
    id: 'EA-260724-B',
    date: 'Jul 24',
    crmTotal: 5_800,
    qboTotal: 5_550,
    status: 'Pending',
    detail: 'Same-day gifts are still in the EveryAction-to-QBO clearing window.',
    nextStep: 'Confirm the remaining $250 after the processor settlement file arrives.',
  },
];

export const reconciliationSummary = {
  crmRecorded: 287_450,
  bankDeposited: 284_200,
  variance: 3_250,
  unmatchedItems: 4,
} as const;

export const campaignBreakdown = [
  { label: 'Individual gifts', value: 6_100_000, color: 'bg-amber-300' },
  { label: 'Foundation grants', value: 4_800_000, color: 'bg-cyan-300' },
  { label: 'Corporate', value: 3_200_000, color: 'bg-purple-300' },
  { label: 'Planned gifts', value: 2_100_000, color: 'bg-emerald-300' },
] as const;

export const financeCampaignMetrics = [
  { label: 'Cash received', value: 12_800_000, tone: 'positive' },
  { label: 'Pledges receivable', value: 2_900_000, tone: 'neutral' },
  { label: 'Temporarily restricted · purpose', value: 8_400_000, tone: 'warning' },
  { label: 'Temporarily restricted · time', value: 1_700_000, tone: 'warning' },
  { label: 'Released to operations', value: 6_200_000, tone: 'positive' },
  { label: 'Deferred revenue', value: 500_000, tone: 'neutral' },
] as const;

export type QualitySeverity = 'Critical' | 'Warning' | 'Info';
export type QualityStatus = 'Open' | 'Resolved';

export interface QualityFlag {
  id: string;
  date: string;
  donor: string;
  amount: number;
  flagType:
    | 'Missing fund designation'
    | 'Restriction code mismatch'
    | 'No campaign attribution'
    | 'Duplicate contact suspected'
    | 'Batch total discrepancy'
    | 'Missing acknowledgment trigger';
  severity: QualitySeverity;
  status: QualityStatus;
  current: string;
  expected: string;
  suggestedFix: string;
}

export const qualityFlags: QualityFlag[] = [
  {
    id: 'DQ-260724-01',
    date: 'Jul 24',
    donor: 'Patagonia Action Works',
    amount: 25_000,
    flagType: 'Restriction code mismatch',
    severity: 'Critical',
    status: 'Open',
    current: "Fund: Unrestricted; donor note: 'Trail access work in the Southwest.'",
    expected: 'Purpose restriction linked to the Southwest Access program fund.',
    suggestedFix: 'Confirm the award letter, then change the fund and restriction code before export.',
  },
  {
    id: 'DQ-260723-02',
    date: 'Jul 23',
    donor: 'Morgan Ellis',
    amount: 1_500,
    flagType: 'Missing fund designation',
    severity: 'Critical',
    status: 'Open',
    current: 'Fund field is blank; the integration would default the gift to unrestricted.',
    expected: 'A valid fund designation selected from the controlled EveryAction list.',
    suggestedFix: 'Review the gift memo and assign Leading with Trails or confirm unrestricted intent.',
  },
  {
    id: 'DQ-260722-03',
    date: 'Jul 22',
    donor: 'Summit Ridge Foundation',
    amount: 50_000,
    flagType: 'Restriction code mismatch',
    severity: 'Critical',
    status: 'Open',
    current: 'CRM entry is unrestricted, while the agreement funds youth trail education.',
    expected: 'Purpose restriction: Youth Trail Education.',
    suggestedFix: 'Attach the grant agreement and apply the youth-education restriction code.',
  },
  {
    id: 'DQ-260721-04',
    date: 'Jul 21',
    donor: 'Alex Kim',
    amount: 500,
    flagType: 'No campaign attribution',
    severity: 'Warning',
    status: 'Open',
    current: 'General annual giving; no campaign source or appeal code.',
    expected: 'Leading with Trails attribution based on the donation page and appeal window.',
    suggestedFix: 'Apply the campaign and July digital appeal codes after confirming source URL.',
  },
  {
    id: 'DQ-260720-05',
    date: 'Jul 20',
    donor: 'Taylor & Jordan Reed',
    amount: 750,
    flagType: 'Duplicate contact suspected',
    severity: 'Warning',
    status: 'Open',
    current: 'New household created with the same surname, street address, and email domain.',
    expected: 'Gift linked to constituent record EA-10482.',
    suggestedFix: 'Review the two records and merge after preserving household relationships and history.',
  },
  {
    id: 'DQ-260719-06',
    date: 'Jul 19',
    donor: 'Online Giving Batch 0719',
    amount: 8_925,
    flagType: 'Batch total discrepancy',
    severity: 'Warning',
    status: 'Open',
    current: 'EveryAction batch total is $8,925; processor settlement total is $8,875.',
    expected: 'The gross gift total and separate $50 processor fee should reconcile.',
    suggestedFix: 'Post the fee separately and document the gross-to-net settlement bridge.',
  },
  {
    id: 'DQ-260718-07',
    date: 'Jul 18',
    donor: 'Casey Morales',
    amount: 300,
    flagType: 'Missing acknowledgment trigger',
    severity: 'Info',
    status: 'Resolved',
    current: 'Gift exceeded $250 but no acknowledgment workflow was created.',
    expected: 'Tax acknowledgment task generated on the gift date.',
    suggestedFix: 'Resolved: acknowledgment was queued and the trigger rule was reapplied.',
  },
  {
    id: 'DQ-260717-08',
    date: 'Jul 17',
    donor: 'Peakline Outdoor Co.',
    amount: 10_000,
    flagType: 'No campaign attribution',
    severity: 'Warning',
    status: 'Open',
    current: 'Corporate gift coded to general sponsorship.',
    expected: 'Leading with Trails · Corporate campaign attribution.',
    suggestedFix: 'Confirm the sponsorship schedule and link the gift to the campaign record.',
  },
  {
    id: 'DQ-260716-09',
    date: 'Jul 16',
    donor: 'Jamie Nguyen',
    amount: 275,
    flagType: 'Missing acknowledgment trigger',
    severity: 'Info',
    status: 'Open',
    current: 'No acknowledgment letter or receipt follow-up exists.',
    expected: 'Acknowledgment workflow active for gifts of $250 or more.',
    suggestedFix: 'Generate the letter and verify that the household is not opted out of mail.',
  },
  {
    id: 'DQ-260715-10',
    date: 'Jul 15',
    donor: 'Riley Thompson',
    amount: 1_000,
    flagType: 'Duplicate contact suspected',
    severity: 'Warning',
    status: 'Resolved',
    current: 'A second record was created after an email address change.',
    expected: 'Gift and new email retained on the original constituent record.',
    suggestedFix: 'Resolved: records were merged and the email was marked current.',
  },
  {
    id: 'DQ-260714-11',
    date: 'Jul 14',
    donor: 'Online Giving Batch 0714',
    amount: 12_450,
    flagType: 'Batch total discrepancy',
    severity: 'Warning',
    status: 'Open',
    current: 'Batch is $125 above the payment processor control total.',
    expected: 'EveryAction and processor gross totals agree before the batch closes.',
    suggestedFix: 'Locate the likely duplicated $125 gift and hold the batch from GL export.',
  },
  {
    id: 'DQ-260713-12',
    date: 'Jul 13',
    donor: 'Avery Brooks',
    amount: 450,
    flagType: 'No campaign attribution',
    severity: 'Warning',
    status: 'Resolved',
    current: 'Gift arrived through the campaign landing page without an appeal code.',
    expected: 'Leading with Trails · Summer Appeal attribution.',
    suggestedFix: 'Resolved: campaign and appeal were applied from the source URL.',
  },
  {
    id: 'DQ-260712-13',
    date: 'Jul 12',
    donor: 'Canyon Creek Bikes',
    amount: 5_000,
    flagType: 'No campaign attribution',
    severity: 'Warning',
    status: 'Open',
    current: 'Corporate gift has a partnership code but no campaign.',
    expected: 'Both Corporate Partnerships and Leading with Trails attached.',
    suggestedFix: 'Add the campaign without replacing the partnership attribution.',
  },
  {
    id: 'DQ-260711-14',
    date: 'Jul 11',
    donor: 'Samira Patel',
    amount: 600,
    flagType: 'Duplicate contact suspected',
    severity: 'Warning',
    status: 'Open',
    current: 'New record matches an existing mobile number and postal address.',
    expected: 'Gift linked to constituent record EA-08314.',
    suggestedFix: 'Confirm identity, then merge while retaining the preferred name.',
  },
  {
    id: 'DQ-260710-15',
    date: 'Jul 10',
    donor: 'Chris Walker',
    amount: 350,
    flagType: 'Missing acknowledgment trigger',
    severity: 'Info',
    status: 'Open',
    current: 'Receipt emailed, but the formal acknowledgment task is absent.',
    expected: 'Receipt plus tax acknowledgment for gifts over $250.',
    suggestedFix: 'Queue the acknowledgment and inspect the suppressed automation event.',
  },
  {
    id: 'DQ-260709-16',
    date: 'Jul 9',
    donor: 'Online Giving Batch 0709',
    amount: 6_780,
    flagType: 'Batch total discrepancy',
    severity: 'Warning',
    status: 'Resolved',
    current: 'Settlement was $30 lower than the CRM batch.',
    expected: 'Gross gifts separated from processor fees.',
    suggestedFix: 'Resolved: $30 fee was reclassified and the control total now agrees.',
  },
  {
    id: 'DQ-260708-17',
    date: 'Jul 8',
    donor: 'Devon Lee',
    amount: 2_500,
    flagType: 'No campaign attribution',
    severity: 'Warning',
    status: 'Open',
    current: 'Gift designation is correct, but campaign is blank.',
    expected: 'Leading with Trails campaign linked alongside the designated fund.',
    suggestedFix: 'Apply campaign attribution; do not change the donor-designated fund.',
  },
  {
    id: 'DQ-260707-18',
    date: 'Jul 7',
    donor: 'Jordan Wells',
    amount: 260,
    flagType: 'Missing acknowledgment trigger',
    severity: 'Info',
    status: 'Resolved',
    current: 'Acknowledgment task failed during import.',
    expected: 'Acknowledgment queued within one business day.',
    suggestedFix: 'Resolved: task was recreated and assigned to Donor Services.',
  },
];

export const qualitySummary = {
  entriesThisMonth: 342,
  clean: 318,
  cleanRate: 93,
  flagged: 24,
  flaggedRate: 7,
  critical: 3,
} as const;
