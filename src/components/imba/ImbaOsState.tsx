'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ConnectorKey = 'qbo' | 'adp';
export type ConnectorMode = 'Demo' | 'Sandbox' | 'Production';
export type SyncStatus = 'draft' | 'awaiting-approval' | 'queued' | 'synced' | 'error';

export interface ConnectorState {
  name: string;
  mode: ConnectorMode;
  status: 'configured' | 'not-configured';
  lastSync: string;
  syncHealth: 'healthy' | 'watch' | 'offline';
  domains: string[];
}

export interface ImbaMapping {
  id: string;
  system: ConnectorKey;
  domain: string;
  imbaValue: string;
  externalValue: string;
  status: 'mapped' | 'review' | 'missing';
}

export interface ImbaSyncJob {
  id: string;
  system: ConnectorKey;
  action: 'create' | 'update' | 'import';
  recordType: string;
  recordId: string;
  summary: string;
  status: SyncStatus;
  createdAt: string;
  approvedBy?: string;
  error?: string;
}

export interface ImbaAuditEvent {
  id: string;
  action: string;
  record: string;
  actor: string;
  at: string;
  detail: string;
}

interface ImbaOsStore {
  version: 1;
  connectors: Record<ConnectorKey, ConnectorState>;
  mappings: ImbaMapping[];
  syncJobs: ImbaSyncJob[];
  auditEvents: ImbaAuditEvent[];
  recordEdits: Record<string, Record<string, string | number | boolean>>;
}

interface QueueSyncInput {
  system: ConnectorKey;
  action: ImbaSyncJob['action'];
  recordType: string;
  recordId: string;
  summary: string;
  requiresApproval?: boolean;
}

interface UpdateRecordOptions {
  actor?: string;
  detail?: string;
  queue?: QueueSyncInput;
}

interface ImbaOsContextValue extends ImbaOsStore {
  hydrated: boolean;
  getEditedRecord: <T extends object>(domain: string, id: string, base: T) => T;
  updateRecord: (domain: string, id: string, patch: Record<string, string | number | boolean>, options?: UpdateRecordOptions) => void;
  queueSync: (input: QueueSyncInput) => string;
  approveSync: (id: string, approver?: string) => void;
  runSync: (id: string) => void;
  retrySync: (id: string) => void;
  updateMapping: (id: string, patch: Partial<Pick<ImbaMapping, 'imbaValue' | 'externalValue' | 'status'>>) => void;
  setConnectorMode: (system: ConnectorKey, mode: ConnectorMode) => void;
  syncConnectorNow: (system: ConnectorKey) => void;
  addAuditEvent: (event: Omit<ImbaAuditEvent, 'id' | 'at'>) => void;
  resetDemo: () => void;
}

const storageKey = 'imba-os-control-plane-v1';

function timestamp(): string {
  return new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function identifier(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const initialState: ImbaOsStore = {
  version: 1,
  connectors: {
    qbo: {
      name: 'QuickBooks Online', mode: 'Demo', status: 'configured', lastSync: 'Demo snapshot · Jul 16, 4:42 PM', syncHealth: 'healthy',
      domains: ['Chart of accounts', 'Customers + vendors', 'Invoices + payments', 'Bills + bill payments', 'Bank balances', 'Financial reports'],
    },
    adp: {
      name: 'ADP Workforce Now', mode: 'Demo', status: 'configured', lastSync: 'Demo snapshot · Jul 16, 4:30 PM', syncHealth: 'watch',
      domains: ['Workers', 'Departments + cost numbers', 'Pay data input', 'Timecards', 'PTO + schedules', 'Payroll results'],
    },
  },
  mappings: [
    { id: 'MAP-QB-01', system: 'qbo', domain: 'Project', imbaValue: 'Great Lakes Buildout', externalValue: 'Customer/Project · GLRA: Buildout', status: 'mapped' },
    { id: 'MAP-QB-02', system: 'qbo', domain: 'Project', imbaValue: 'High Desert Trail System', externalValue: 'Customer/Project · HD County: Design', status: 'mapped' },
    { id: 'MAP-QB-03', system: 'qbo', domain: 'Account', imbaValue: 'Direct project labor', externalValue: '5100 · Project Labor', status: 'mapped' },
    { id: 'MAP-QB-04', system: 'qbo', domain: 'Chapter', imbaValue: 'High Desert Trail Association', externalValue: 'Class · CH-104', status: 'review' },
    { id: 'MAP-ADP-01', system: 'adp', domain: 'Cost number', imbaValue: 'Trail Planning', externalValue: 'ADP Cost 410-PLN', status: 'mapped' },
    { id: 'MAP-ADP-02', system: 'adp', domain: 'Cost number', imbaValue: 'Trail Design', externalValue: 'ADP Cost 420-DSN', status: 'mapped' },
    { id: 'MAP-ADP-03', system: 'adp', domain: 'Earning code', imbaValue: 'Regular project hours', externalValue: 'REG-PROJ', status: 'mapped' },
    { id: 'MAP-ADP-04', system: 'adp', domain: 'Grant', imbaValue: 'Evergreen Trails Foundation', externalValue: 'Allocation code required', status: 'missing' },
  ],
  syncJobs: [
    { id: 'SYNC-1048', system: 'qbo', action: 'create', recordType: 'Invoice', recordId: 'INV-DRAFT-18', summary: 'High Desert design milestone · $178K', status: 'awaiting-approval', createdAt: 'Jul 16, 3:14 PM' },
    { id: 'SYNC-1051', system: 'adp', action: 'update', recordType: 'Time batch', recordId: 'TIME-0719', summary: 'Approved project hours · pay period Jul 6–19', status: 'queued', createdAt: 'Jul 16, 3:26 PM', approvedBy: 'Project leads' },
    { id: 'SYNC-1057', system: 'qbo', action: 'import', recordType: 'Bill', recordId: 'QBO-BILL-8890', summary: 'Technology milestone bill · $68K', status: 'error', createdAt: 'Jul 16, 3:51 PM', error: 'Missing IMBA project/funder mapping' },
    { id: 'SYNC-1060', system: 'qbo', action: 'import', recordType: 'Payment', recordId: 'QBO-PMT-2871', summary: 'Blue Ridge progress payment · $148K', status: 'synced', createdAt: 'Jul 16, 4:02 PM', approvedBy: 'QBO webhook' },
  ],
  auditEvents: [
    { id: 'AUD-8813', action: 'Approval requested', record: 'Invoice INV-DRAFT-18', actor: 'Finance', at: 'Jul 16, 3:14 PM', detail: 'Queued QBO invoice creation after client milestone acceptance.' },
    { id: 'AUD-8820', action: 'Time batch approved', record: 'TIME-0719', actor: 'Project leads', at: 'Jul 16, 3:26 PM', detail: 'Project and grant allocations certified before ADP submission.' },
    { id: 'AUD-8834', action: 'Sync exception', record: 'QBO-BILL-8890', actor: 'IMBA-OS', at: 'Jul 16, 3:51 PM', detail: 'Transaction held in staging; no posting occurred.' },
  ],
  recordEdits: {},
};

const ImbaOsContext = createContext<ImbaOsContextValue | undefined>(undefined);

export function ImbaOsStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImbaOsStore>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ImbaOsStore;
          if (parsed.version === 1) setState(parsed);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [hydrated, state]);

  const value = useMemo<ImbaOsContextValue>(() => {
    const addAuditEvent = (event: Omit<ImbaAuditEvent, 'id' | 'at'>) => {
      setState((current) => ({ ...current, auditEvents: [{ ...event, id: identifier('AUD'), at: timestamp() }, ...current.auditEvents].slice(0, 100) }));
    };

    const queueSync = (input: QueueSyncInput): string => {
      const id = identifier('SYNC');
      const job: ImbaSyncJob = {
        id, system: input.system, action: input.action, recordType: input.recordType, recordId: input.recordId,
        summary: input.summary, status: input.requiresApproval === false ? 'queued' : 'awaiting-approval', createdAt: timestamp(),
      };
      setState((current) => ({
        ...current,
        syncJobs: [job, ...current.syncJobs],
        auditEvents: [{ id: identifier('AUD'), action: input.requiresApproval === false ? 'Sync queued' : 'Approval requested', record: `${input.recordType} ${input.recordId}`, actor: 'IMBA-OS user', at: timestamp(), detail: input.summary }, ...current.auditEvents].slice(0, 100),
      }));
      return id;
    };

    return {
      ...state,
      hydrated,
      getEditedRecord: <T extends object>(domain: string, id: string, base: T): T => ({ ...base, ...(state.recordEdits[`${domain}:${id}`] ?? {}) }),
      updateRecord: (domain, id, patch, options) => {
        const recordKey = `${domain}:${id}`;
        const queuedJob = options?.queue ? {
          id: identifier('SYNC'), system: options.queue.system, action: options.queue.action, recordType: options.queue.recordType,
          recordId: options.queue.recordId, summary: options.queue.summary,
          status: options.queue.requiresApproval === false ? 'queued' as const : 'awaiting-approval' as const, createdAt: timestamp(),
        } : undefined;
        setState((current) => ({
          ...current,
          recordEdits: { ...current.recordEdits, [recordKey]: { ...(current.recordEdits[recordKey] ?? {}), ...patch } },
          syncJobs: queuedJob ? [queuedJob, ...current.syncJobs] : current.syncJobs,
          auditEvents: [{ id: identifier('AUD'), action: 'Record updated', record: recordKey, actor: options?.actor ?? 'IMBA-OS user', at: timestamp(), detail: options?.detail ?? `Updated ${Object.keys(patch).join(', ')}` }, ...current.auditEvents].slice(0, 100),
        }));
      },
      queueSync,
      approveSync: (id, approver = 'Finance approver') => setState((current) => ({
        ...current,
        syncJobs: current.syncJobs.map((job) => job.id === id ? { ...job, status: 'queued', approvedBy: approver, error: undefined } : job),
        auditEvents: [{ id: identifier('AUD'), action: 'Sync approved', record: id, actor: approver, at: timestamp(), detail: 'Approved job moved to the outbound connector queue.' }, ...current.auditEvents].slice(0, 100),
      })),
      runSync: (id) => setState((current) => {
        const job = current.syncJobs.find((item) => item.id === id);
        if (!job) return current;
        return {
          ...current,
          syncJobs: current.syncJobs.map((item) => item.id === id ? { ...item, status: 'synced', error: undefined } : item),
          connectors: { ...current.connectors, [job.system]: { ...current.connectors[job.system], lastSync: `Demo sync · ${timestamp()}`, syncHealth: 'healthy' } },
          auditEvents: [{ id: identifier('AUD'), action: 'Demo sync completed', record: `${job.recordType} ${job.recordId}`, actor: `${job.system.toUpperCase()} connector`, at: timestamp(), detail: job.summary }, ...current.auditEvents].slice(0, 100),
        };
      }),
      retrySync: (id) => setState((current) => ({
        ...current,
        syncJobs: current.syncJobs.map((job) => job.id === id ? { ...job, status: 'queued', error: undefined } : job),
        auditEvents: [{ id: identifier('AUD'), action: 'Sync retry queued', record: id, actor: 'IMBA-OS user', at: timestamp(), detail: 'Exception returned to the outbound queue after review.' }, ...current.auditEvents].slice(0, 100),
      })),
      updateMapping: (id, patch) => setState((current) => ({
        ...current,
        mappings: current.mappings.map((mapping) => mapping.id === id ? { ...mapping, ...patch } : mapping),
        auditEvents: [{ id: identifier('AUD'), action: 'Mapping updated', record: id, actor: 'Integration administrator', at: timestamp(), detail: `Changed ${Object.keys(patch).join(', ')}` }, ...current.auditEvents].slice(0, 100),
      })),
      setConnectorMode: (system, mode) => setState((current) => ({
        ...current,
        connectors: { ...current.connectors, [system]: { ...current.connectors[system], mode, status: mode === 'Demo' ? 'configured' : 'not-configured', syncHealth: mode === 'Demo' ? 'healthy' : 'offline', lastSync: mode === 'Demo' ? `Demo snapshot · ${timestamp()}` : 'OAuth credentials required' } },
        auditEvents: [{ id: identifier('AUD'), action: 'Connector mode changed', record: system.toUpperCase(), actor: 'Integration administrator', at: timestamp(), detail: `Mode set to ${mode}.` }, ...current.auditEvents].slice(0, 100),
      })),
      syncConnectorNow: (system) => setState((current) => ({
        ...current,
        connectors: { ...current.connectors, [system]: { ...current.connectors[system], lastSync: `Demo sync · ${timestamp()}`, syncHealth: 'healthy' } },
        auditEvents: [{ id: identifier('AUD'), action: 'Connector refresh completed', record: system.toUpperCase(), actor: 'IMBA-OS', at: timestamp(), detail: 'Demo source snapshot refreshed and reconciliation controls passed.' }, ...current.auditEvents].slice(0, 100),
      })),
      addAuditEvent,
      resetDemo: () => {
        setState(initialState);
        window.localStorage.removeItem(storageKey);
      },
    };
  }, [hydrated, state]);

  return <ImbaOsContext.Provider value={value}>{children}</ImbaOsContext.Provider>;
}

export function useImbaOsState(): ImbaOsContextValue {
  const context = useContext(ImbaOsContext);
  if (!context) throw new Error('useImbaOsState must be used within ImbaOsStateProvider');
  return context;
}
