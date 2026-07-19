export const imbaBudgetRows = [
  { line: 'Trail Solutions revenue', engine: 'Program services', budget: 4_420_000, actual: 2_165_000, ytdBudget: 2_210_000, forecast: 4_180_000 },
  { line: 'Membership contributions', engine: 'Philanthropy', budget: 1_180_000, actual: 642_000, ytdBudget: 590_000, forecast: 1_265_000 },
  { line: 'Grants and major gifts', engine: 'Philanthropy', budget: 2_050_000, actual: 905_000, ytdBudget: 1_025_000, forecast: 1_920_000 },
  { line: 'Trail Solutions delivery', engine: 'Program services', budget: 3_660_000, actual: 1_890_000, ytdBudget: 1_830_000, forecast: 3_790_000 },
  { line: 'Chapters and programs', engine: 'Mission investment', budget: 1_940_000, actual: 968_000, ytdBudget: 970_000, forecast: 1_910_000 },
  { line: 'Advocacy and conservation', engine: 'Mission investment', budget: 410_000, actual: 236_000, ytdBudget: 205_000, forecast: 438_000 },
  { line: 'Management and general', engine: 'Shared services', budget: 910_000, actual: 492_000, ytdBudget: 455_000, forecast: 952_000 },
  { line: 'Fundraising', engine: 'Shared services', budget: 735_000, actual: 346_000, ytdBudget: 367_500, forecast: 716_000 },
];

export const imbaGrants = [
  { id: 'G-2417', funder: 'Outdoor Access Foundation', program: 'Community Trail Planning', award: 620_000, spent: 408_000, remaining: 212_000, nextDeadline: 'Aug 15', status: 'On track', restriction: 'Planning + community engagement', reimbursement: 86_000 },
  { id: 'G-2421', funder: 'Evergreen Trails Foundation', program: 'Rural Trail Connectivity', award: 1_100_000, spent: 742_000, remaining: 358_000, nextDeadline: 'Jul 31', status: 'Draw due', restriction: 'Foundation-restricted costs', reimbursement: 164_000 },
  { id: 'G-2503', funder: 'Healthy Communities Trust', program: 'Trails + Wellness', award: 375_000, spent: 119_000, remaining: 256_000, nextDeadline: 'Sep 30', status: 'On track', restriction: 'Education + evaluation', reimbursement: 0 },
  { id: 'G-2508', funder: 'Mountain Futures Fund', program: 'Design Workforce', award: 285_000, spent: 201_000, remaining: 84_000, nextDeadline: 'Aug 5', status: 'Watch', restriction: 'Design labor only', reimbursement: 58_000 },
  { id: 'G-2512', funder: 'Leading with Trails - Restricted', program: 'National Campaign', award: 840_000, spent: 332_000, remaining: 508_000, nextDeadline: 'Oct 15', status: 'On track', restriction: 'Campaign case commitments', reimbursement: 0 },
];

export const imbaReceivables = [
  { ref: 'INV-25061', customer: 'Blue Ridge Regional Collaborative', project: 'Blue Ridge Regional Plan', amount: 148_000, age: 18, due: 'Jul 28', status: 'Current' },
  { ref: 'INV-25048', customer: 'High Desert County', project: 'High Desert Trail System', amount: 212_000, age: 47, due: 'Jun 28', status: 'Follow up' },
  { ref: 'INV-25039', customer: 'Great Lakes Recreation Authority', project: 'Great Lakes Buildout', amount: 96_000, age: 64, due: 'Jun 11', status: 'Escalate' },
  { ref: 'INV-25072', customer: 'Coastal Access Network', project: 'Coastal Access Network', amount: 74_000, age: 9, due: 'Aug 6', status: 'Current' },
  { ref: 'UNBILLED', customer: 'Appalachian Regional Partnership', project: 'Appalachian Connector', amount: 210_000, age: 0, due: 'Milestone pending', status: 'Action' },
];

export const imbaPayables = [
  { ref: 'BILL-8842', vendor: 'Trail Equipment Cooperative', category: 'Equipment', amount: 185_000, due: 'Jul 24', approval: 'Kent', status: 'Decision hold' },
  { ref: 'BILL-8871', vendor: 'Western Field Services', category: 'Subcontractor', amount: 82_500, due: 'Jul 29', approval: 'Project lead', status: 'Ready' },
  { ref: 'PEO-0715', vendor: 'PEO payroll settlement', category: 'Payroll', amount: 246_000, due: 'Jul 19', approval: 'Finance', status: 'Scheduled' },
  { ref: 'BILL-8890', vendor: 'Technology implementation partner', category: 'Technology', amount: 68_000, due: 'Aug 2', approval: 'Milestone owner', status: 'Evidence due' },
  { ref: 'CHAPTERS', vendor: 'Member organization settlements', category: 'Chapter obligation', amount: 318_000, due: 'Monthly cycle', approval: 'Finance', status: 'Ring-fenced' },
];

export const imbaReports = [
  { name: 'CEO Monthly Financial Brief', category: 'Executive', cadence: 'Monthly', audience: 'Kent + leadership', status: 'Prototype live', description: 'What changed, why it matters, forecast, and decisions.' },
  { name: 'Statement of Activities', category: 'Financial statements', cadence: 'Monthly', audience: 'Finance + Board', status: 'Designed', description: 'Current period and YTD by restriction and line of business.' },
  { name: 'Statement of Financial Position', category: 'Financial statements', cadence: 'Monthly', audience: 'Finance + Board', status: 'Designed', description: 'Assets, liabilities, and net assets with deployability bridge.' },
  { name: 'Statement of Cash Flows', category: 'Financial statements', cadence: 'Monthly', audience: 'Finance + Board', status: 'Designed', description: 'Operating, investing, and financing activity with deployable-cash bridge.' },
  { name: 'Trail Solutions Portfolio Margin', category: 'Project accounting', cadence: 'Monthly', audience: 'Kent + Trail Solutions', status: 'Prototype live', description: 'Budget, actual, commitments, EAC, contribution, and billing.' },
  { name: 'Grant Burn + Deadline Report', category: 'Restricted funds', cadence: 'Biweekly', audience: 'Finance + program owners', status: 'Prototype live', description: 'Award, allowable spend, draws, balance, deadlines, and risks.' },
  { name: 'Budget vs Actual by Engine', category: 'Planning', cadence: 'Monthly', audience: 'Leadership + Board', status: 'Prototype live', description: 'Philanthropy, membership, Trail Solutions, and shared services.' },
  { name: 'Functional Expense Report', category: 'Compliance', cadence: 'Quarterly', audience: 'Finance + auditors', status: 'Prototype live', description: 'Filed program lines plus a management allocation model for M&G and fundraising support costs.' },
  { name: 'Form 990 Workpapers', category: 'Compliance', cadence: 'Annual', audience: 'Finance + auditors', status: 'Designed', description: 'Reconciled book-to-990 mapping, functional allocation, and schedules supporting the annual Form 990 filing.' },
  { name: 'Single-Audit Readiness Check', category: 'Compliance', cadence: 'On threshold', audience: 'Finance + Audit Committee', status: 'Not currently triggered', description: 'Forward-looking only: IMBA had no federal award expenditures in 2024, so no Uniform Guidance (Single) Audit is required. Monitors the $1,000,000 threshold and 15% de minimis indirect rate if federal funding begins.' },
  { name: 'Internal Controls & Fiscal Policy Register', category: 'Governance', cadence: 'Continuous', audience: 'Finance + Audit Committee', status: 'Designed', description: 'Documented internal controls, approval thresholds, segregation of duties, and fiscal policies mapped to risk and to the append-only audit trail.' },
  { name: '13-Week Cash Forecast', category: 'Treasury', cadence: 'Weekly', audience: 'Kent + Finance', status: 'Prototype live', description: 'Collections, disbursements, restrictions, and minimum cash.' },
];

// Current IMBA staff (names + titles from IMBA's public staff page). Locations
// are IMBA-stated where confirmed; inferred ones are flagged "(probable)" and
// the rest "Not stated". Team + status are real; allocation and loadedCost are
// illustrative planning overlays (identity + pay are authoritative in ADP).
export const imbaEmployees = [
  { id: 'E-001', name: 'Aaron Clark', role: 'Policy Manager', team: 'Policy & Government', location: 'Colorado (probable)', type: 'Core', allocation: 82, loadedCost: 104000, status: 'Active' },
  { id: 'E-002', name: 'Ama Koenigshof', role: 'Director of Planning & Design', team: 'Planning & Design', location: 'Not stated', type: 'Core', allocation: 74, loadedCost: 149000, status: 'Active' },
  { id: 'E-003', name: 'Anthony Duncan', role: 'Director of Local Programs', team: 'Programs & Community', location: 'Tennessee', type: 'Core', allocation: 88, loadedCost: 145000, status: 'Active' },
  { id: 'E-004', name: 'Brice Shirbach', role: 'Communications Manager', team: 'Communications & Marketing', location: 'Northern Delaware', type: 'Core', allocation: 69, loadedCost: 110000, status: 'Active' },
  { id: 'E-005', name: 'Cale Mason', role: 'Trail Specialist', team: 'Trail Field', location: 'Not stated', type: 'Core', allocation: 91, loadedCost: 82000, status: 'Active' },
  { id: 'E-006', name: 'Chris Orr', role: 'Community Engagement Specialist', team: 'Programs & Community', location: 'Eastern Sierra, CA (probable)', type: 'Core', allocation: 77, loadedCost: 87000, status: 'Active' },
  { id: 'E-007', name: 'Coleman Haskell', role: 'Trail Specialist', team: 'Trail Field', location: 'Northern Maine (probable)', type: 'Core', allocation: 85, loadedCost: 83000, status: 'Active' },
  { id: 'E-008', name: 'Cory Callahan', role: 'Trail Care Specialist', team: 'Trail Field', location: 'Not stated', type: 'Core', allocation: 63, loadedCost: 88000, status: 'Active' },
  { id: 'E-009', name: 'David Wiens', role: 'Executive Director', team: 'Executive', location: 'Not stated', type: 'Leadership', allocation: 72, loadedCost: 195000, status: 'Active' },
  { id: 'E-010', name: 'Eleanor Blick', role: 'Director of Communications', team: 'Communications & Marketing', location: 'Not stated', type: 'Core', allocation: 90, loadedCost: 144000, status: 'Active' },
  { id: 'E-011', name: 'Forrest Town', role: 'Staff Planner', team: 'Planning & Design', location: 'Not stated', type: 'Core', allocation: 66, loadedCost: 85000, status: 'Active' },
  { id: 'E-012', name: 'Geoff Chain', role: 'Project Manager and Planner', team: 'Planning & Design', location: 'Prescott, Arizona', type: 'Core', allocation: 79, loadedCost: 105000, status: 'Active' },
  { id: 'E-013', name: 'George Chevalier', role: 'Promotions Manager', team: 'Communications & Marketing', location: 'Western New Jersey', type: 'Core', allocation: 86, loadedCost: 110000, status: 'Active' },
  { id: 'E-014', name: 'Harrison Dixon', role: 'Trail Builder', team: 'Trail Field', location: 'Not stated', type: 'Core', allocation: 71, loadedCost: 82000, status: 'Active' },
  { id: 'E-015', name: 'Heather Alessandro', role: 'Director of Talent and Culture', team: 'People & Culture', location: 'Greater Cincinnati', type: 'Core', allocation: 68, loadedCost: 151000, status: 'Active' },
  { id: 'E-016', name: 'Heather Bonewitz', role: 'Member Services Manager', team: 'Programs & Community', location: 'Boulder area, Colorado', type: 'Core', allocation: 80, loadedCost: 107000, status: 'Active' },
  { id: 'E-017', name: 'Jenine Estlick', role: 'Planner', team: 'Planning & Design', location: 'Park City, Utah (probable)', type: 'Core', allocation: 64, loadedCost: 88000, status: 'Active' },
  { id: 'E-018', name: 'Jess Didion', role: 'Signage and Design', team: 'Planning & Design', location: 'Not stated', type: 'Core', allocation: 83, loadedCost: 84000, status: 'Active' },
  { id: 'E-019', name: 'Jillian Olson', role: 'Community Progress Manager', team: 'Programs & Community', location: 'Driftless, Wisconsin (probable)', type: 'Core', allocation: 76, loadedCost: 104000, status: 'Active' },
  { id: 'E-020', name: 'Joanna Fetherolf', role: 'Education Manager', team: 'Programs & Community', location: 'Fort Collins, Colorado', type: 'Core', allocation: 89, loadedCost: 109000, status: 'Active' },
  { id: 'E-021', name: 'Joe Vadeboncoeur', role: 'Vice President', team: 'Executive', location: 'Boulder, Colorado', type: 'Leadership', allocation: 70, loadedCost: 192000, status: 'Active' },
  { id: 'E-022', name: 'Joey Klein', role: 'Trail Care Specialist', team: 'Trail Field', location: 'Not stated', type: 'Core', allocation: 87, loadedCost: 86000, status: 'Active' },
  { id: 'E-023', name: 'Josh Olson', role: 'Director of Construction and Operations', team: 'Construction & Ops', location: 'Colorado (probable)', type: 'Core', allocation: 62, loadedCost: 146000, status: 'Active' },
  { id: 'E-024', name: 'Kate Noelke', role: 'Agreements and Grants Manager', team: 'Development & Grants', location: 'Salida, Colorado', type: 'Core', allocation: 75, loadedCost: 111000, status: 'Active' },
  { id: 'E-025', name: 'Kent McNeill', role: 'CEO', team: 'Executive', location: 'Nebraska', type: 'Leadership', allocation: 81, loadedCost: 194000, status: 'Active' },
  { id: 'E-026', name: 'Lea Wehrle-Garsh', role: 'Digital Projects Manager', team: 'Communications & Marketing', location: 'Salt Lake City, Utah', type: 'Core', allocation: 67, loadedCost: 112000, status: 'Active' },
  { id: 'E-027', name: 'Liz Chrisman', role: 'Content Marketing Manager', team: 'Communications & Marketing', location: 'Not stated', type: 'Core', allocation: 84, loadedCost: 108000, status: 'Active' },
  { id: 'E-028', name: 'Liz Grades', role: 'Project Manager and Planner', team: 'Planning & Design', location: 'Adirondacks, New York', type: 'Core', allocation: 73, loadedCost: 104000, status: 'Active' },
  { id: 'E-029', name: 'Marty Caivano', role: 'Community Engagement & Programs Manager', team: 'Programs & Community', location: 'Not stated', type: 'Core', allocation: 92, loadedCost: 109000, status: 'Active' },
  { id: 'E-030', name: 'Matt Brabender', role: 'Staff Planner', team: 'Planning & Design', location: 'Vermont (probable)', type: 'Core', allocation: 65, loadedCost: 81000, status: 'Active' },
  { id: 'E-031', name: 'Matthew Podraza', role: 'Trail Builder', team: 'Trail Field', location: 'Vermont (probable)', type: 'Core', allocation: 78, loadedCost: 86000, status: 'Active' },
  { id: 'E-032', name: 'Patrick Kell', role: 'Senior Partnerships Manager', team: 'Development & Grants', location: 'Prescott, Arizona', type: 'Core', allocation: 88, loadedCost: 106000, status: 'Active' },
  { id: 'E-033', name: 'Roxanne Marianito', role: 'Navajo Nation Coordinator', team: 'Programs & Community', location: 'Window Rock, Arizona', type: 'Core', allocation: 61, loadedCost: 87000, status: 'Active' },
  { id: 'E-034', name: 'Stephen Mullins', role: 'Trail Specialist', team: 'Trail Field', location: 'Not stated', type: 'Core', allocation: 86, loadedCost: 83000, status: 'Active' },
  { id: 'E-035', name: 'Tara Alcantara', role: 'Local Engagement Manager', team: 'Programs & Community', location: 'Tucson, Arizona', type: 'Core', allocation: 74, loadedCost: 112000, status: 'Active' },
  { id: 'E-036', name: 'Tim Halbaken', role: 'Project Manager and Planner', team: 'Planning & Design', location: 'Western Slope, Colorado', type: 'Core', allocation: 80, loadedCost: 108000, status: 'Active' },
  { id: 'E-037', name: 'Todd Keller', role: 'Director of Government Affairs', team: 'Policy & Government', location: 'Washington, D.C.', type: 'Core', allocation: 69, loadedCost: 144000, status: 'Active' },
  { id: 'E-038', name: 'Tylor Brackett', role: 'Trail Specialist', team: 'Trail Field', location: 'Missouri (probable)', type: 'Core', allocation: 90, loadedCost: 85000, status: 'Active' },
  { id: 'E-039', name: 'Zachary Davis', role: 'Trail Specialist', team: 'Trail Field', location: 'New Mexico', type: 'Core', allocation: 72, loadedCost: 81000, status: 'Active' },
];

export const imbaOnboarding = [
  { person: 'Finance Director', role: 'Finance leadership', start: 'Target: August', progress: 35, owner: 'Talent & Culture', blockers: 'Final selection + system access' },
  { person: 'Seasonal Field Technician', role: 'Construction', start: 'Jul 29', progress: 72, owner: 'Construction & Ops', blockers: 'Equipment certification' },
  { person: 'Contract Design Partner', role: 'Design bench', start: 'On demand', progress: 58, owner: 'Planning & Design', blockers: 'Rate card + MSA' },
];

export const imbaCompliance = [
  { item: 'PEO payroll reconciliation', scope: 'All staff', due: 'Every payroll', status: 'Ready', owner: 'Finance + People' },
  { item: 'I-9 / work authorization evidence', scope: '2 seasonal hires', due: 'Within 3 days', status: 'Action', owner: 'People Ops' },
  { item: 'Contractor W-9 and agreement', scope: 'Design bench', due: 'Before assignment', status: 'Watch', owner: 'People Ops' },
  { item: 'Workers compensation classification', scope: 'Field teams', due: 'Quarterly review', status: 'Ready', owner: 'PEO' },
  { item: 'Equipment and safety attestations', scope: 'Construction crews', due: 'Before deployment', status: 'Action', owner: 'Trail Solutions' },
];

export const imbaOpenRoles = [
  { title: 'Director of Finance', team: 'Finance', trigger: 'Approved role', stage: 'Interview', annualCost: 148_000, backlogGate: 'N/A' },
  { title: 'Trail Designer', team: 'Trail Solutions', trigger: '$750K executed design backlog', stage: 'Gate not met', annualCost: 128_000, backlogGate: '$620K / $750K' },
  { title: 'Seasonal Construction Technician', team: 'Trail Solutions', trigger: 'Signed construction start', stage: 'Ready to open', annualCost: 76_000, backlogGate: 'Met' },
];

export const imbaChapters = [
  { id: 'CH-041', name: 'Front Range MTB Alliance', region: 'Mountain West', members: 1840, settlement: 48_600, reporting: 'Current', coaMap: 'Mapped', compliance: 96, nextDue: 'Aug 10' },
  { id: 'CH-067', name: 'Blue Ridge Trail Coalition', region: 'Southeast', members: 1260, settlement: 32_400, reporting: 'Action', coaMap: 'Mapped', compliance: 82, nextDue: 'Jul 31' },
  { id: 'CH-083', name: 'Great Lakes Riders Network', region: 'Midwest', members: 980, settlement: 27_800, reporting: 'Current', coaMap: 'Exception', compliance: 88, nextDue: 'Aug 15' },
  { id: 'CH-104', name: 'High Desert Trail Association', region: 'Mountain West', members: 720, settlement: 18_900, reporting: 'Late', coaMap: 'Pending', compliance: 68, nextDue: 'Jul 22' },
  { id: 'CH-119', name: 'Coastal Access MTB', region: 'West', members: 540, settlement: 14_200, reporting: 'Current', coaMap: 'Mapped', compliance: 100, nextDue: 'Sep 1' },
  { id: 'CH-132', name: 'Appalachian Singletrack Partners', region: 'Mid-Atlantic', members: 610, settlement: 16_700, reporting: 'Onboarding', coaMap: 'In progress', compliance: 74, nextDue: 'Aug 5' },
];

export const imbaProjectTasks = [
  { id: 'T-1042', title: 'Approve revised fieldwork scope', project: 'Appalachian Connector', owner: 'Project lead', due: 'Jul 19', column: 'Decision', finance: '$42K change order' },
  { id: 'T-1048', title: 'Client acceptance for design milestone', project: 'High Desert Trail System', owner: 'Design director', due: 'Jul 22', column: 'In progress', finance: '$178K billing trigger' },
  { id: 'T-1051', title: 'Refresh equipment estimate to complete', project: 'Great Lakes Buildout', owner: 'Construction PM', due: 'Jul 18', column: 'Decision', finance: '$96K exposure' },
  { id: 'T-1057', title: 'Complete public engagement summary', project: 'Blue Ridge Regional Plan', owner: 'Planner', due: 'Jul 26', column: 'In progress', finance: 'Grant deliverable' },
  { id: 'T-1060', title: 'Issue July progress invoice', project: 'Coastal Access Network', owner: 'Finance', due: 'Jul 31', column: 'Ready', finance: '$74K invoice' },
  { id: 'T-1036', title: 'Execute subcontractor amendment', project: 'Great Lakes Buildout', owner: 'Finance + PM', due: 'Jul 17', column: 'Complete', finance: '$82.5K commitment' },
];

export const imbaDataFlows = [
  { source: 'CRM / membership', event: 'Member payment + chapter attribution', destination: 'Finance staging', frequency: 'Daily', control: 'Processor total + exception queue', status: 'Designed' },
  { source: 'Chapter reporting packet', event: 'Local revenue, expense, cash, restrictions', destination: 'Network ledger', frequency: 'Monthly', control: 'Canonical COA mapping + certification', status: 'Prototype' },
  { source: 'Monday.com / project system', event: 'Hours, milestones, commitments, EAC', destination: 'Project subledger', frequency: 'Weekly', control: 'Project + phase required', status: 'Prototype' },
  { source: 'PEO / payroll', event: 'Gross pay, taxes, benefits, worker data', destination: 'Labor allocation', frequency: 'Each payroll', control: 'Headcount and control-total reconciliation', status: 'Designed' },
  { source: 'Expensify / cards', event: 'Employee and field costs', destination: 'Accounts payable', frequency: 'Daily', control: 'Receipt + project/funder tags', status: 'Designed' },
  { source: 'Bank + payment processors', event: 'Cash inflows and outflows', destination: 'General ledger', frequency: 'Daily', control: 'Bank rules + monthly reconciliation', status: 'Designed' },
];
