/**
 * IMBA-OS connector registry.
 *
 * IMBA-OS is the system of engagement; each connector below is a system of
 * record it draws from or writes to. Only Bill.com participates in the AP flow
 * today (as a stub); the rest are seeded so the Connected Systems hub and the
 * report `Connect GL` / `Connect PM` seams have a single source of truth.
 */

export type ConnectorStatus = 'connected' | 'planned' | 'action-needed';

export type Connector = {
  key: string;
  name: string;
  category: string;
  systemOfRecordFor: string;
  status: ConnectorStatus;
  flows: string;
};

export const connectors: Connector[] = [
  {
    key: 'billcom',
    name: 'Bill.com',
    category: 'Accounts payable',
    systemOfRecordFor: 'Bill payment & vendor disbursement',
    status: 'planned',
    flows: 'Push approved bills → execute payment · receive payment status webhooks',
  },
  {
    key: 'gl',
    name: 'Accounting / GL',
    category: 'General ledger',
    systemOfRecordFor: 'Financial statements & chart of accounts',
    status: 'planned',
    flows: 'Sync chart of accounts · post AP journal entries · pull actuals',
  },
  {
    key: 'crm',
    name: 'Donor CRM',
    category: 'Fundraising',
    systemOfRecordFor: 'Contributions, grants & restrictions',
    status: 'planned',
    flows: 'Sync gifts, pledges, and donor-restriction detail',
  },
  {
    key: 'monday',
    name: 'Monday.com',
    category: 'Work management',
    systemOfRecordFor: 'Trail Solutions project delivery',
    status: 'planned',
    flows: 'Sync project tasks, phase status, and crew capacity',
  },
  {
    key: 'workday',
    name: 'Workday',
    category: 'HCM & payroll',
    systemOfRecordFor: 'People, payroll & cost centers',
    status: 'planned',
    flows: 'Sync employees, roles, labor cost, and approval limits',
  },
  {
    key: 'expense',
    name: 'Expense & cards',
    category: 'Employee spend',
    systemOfRecordFor: 'Card transactions & reimbursements',
    status: 'planned',
    flows: 'Sync receipts and card spend into coding & approvals',
  },
];

export const connectorByKey = (key: string): Connector | undefined =>
  connectors.find((connector) => connector.key === key);
