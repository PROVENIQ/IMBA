/**
 * IMBA-OS connector registry.
 *
 * IMBA-OS is the system of engagement; each connector below is a system of
 * record it draws from or writes to. Every entry is a planned connection in
 * this prototype; no production credential or external account is present.
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
    key: 'plaid',
    name: 'Plaid (bank feed)',
    category: 'Banking & cash',
    systemOfRecordFor: 'Bank and savings account balances',
    status: 'planned',
    flows: 'Authorize once (read-only) · refresh balances and cleared transactions daily · reconcile bank cash to the GL. IMBA-OS cannot initiate transfers or payments.',
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
    key: 'expensify',
    name: 'Expensify',
    category: 'Employee spend',
    systemOfRecordFor: 'Card spend, receipts & reimbursements',
    status: 'planned',
    flows: 'Import card transactions + receipts · code to project/grant/account · reconcile to card statement · post to the GL and reimburse',
  },
  {
    key: 'slack',
    name: 'Slack',
    category: 'Collaboration',
    systemOfRecordFor: 'Channels, threads, mentions, and reactions',
    status: 'planned',
    flows: 'Receive authorized events · map threads to records · post alerts and owned-action links',
  },
  {
    key: 'teams',
    name: 'Microsoft Teams',
    category: 'Collaboration',
    systemOfRecordFor: 'Channels, chats, meetings, and messages',
    status: 'planned',
    flows: 'Receive authorized events · map meeting context · post cards, alerts, and record links',
  },
  {
    key: 'notion',
    name: 'Notion',
    category: 'Knowledge',
    systemOfRecordFor: 'Pages, databases, owners, and versions',
    status: 'planned',
    flows: 'Sync governed page references · retain source links · create review work from changes',
  },
  {
    key: 'microsoft-365',
    name: 'Microsoft 365',
    category: 'Email + knowledge',
    systemOfRecordFor: 'Outlook mail, SharePoint files, and document versions',
    status: 'planned',
    flows: 'Route authorized messages · link governed files · retain versions and permission boundaries',
  },
  {
    key: 'google-workspace',
    name: 'Google Workspace',
    category: 'Email + knowledge',
    systemOfRecordFor: 'Gmail threads and Drive files',
    status: 'planned',
    flows: 'Route authorized messages · link files and versions · turn commitments into owned work',
  },
];

export const connectorByKey = (key: string): Connector | undefined =>
  connectors.find((connector) => connector.key === key);
