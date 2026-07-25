export const EVERYACTION_CHANGED_ENTITY_RESOURCES = [
  "ActivistCodes",
  "ContactHistory",
  "Contacts",
  "ContactsActivistCodes",
  "ContactsOnlineForms",
  "ContactsSurveyResponses",
  "ContributionAdjustments",
  "Contributions",
  "EventTicketTransactionsGuests",
  "RecurringContributions",
] as const;

export type EveryActionChangedEntityResource =
  (typeof EVERYACTION_CHANGED_ENTITY_RESOURCES)[number];

export interface EveryActionChangedEntityJob {
  exportJobId: number;
  jobStatus:
    | "Requested"
    | "Pending"
    | "InProcess"
    | "Complete"
    | "Error"
    | "Rejected"
    | string;
  dateExpired?: string;
  files?: readonly { downloadUrl: string; recordCount?: number }[];
}

export interface EveryActionContact {
  vanId: number;
  firstName?: string;
  lastName?: string;
  emails?: readonly { email: string; isPreferred?: boolean }[];
  phones?: readonly { phoneNumber: string; isPreferred?: boolean }[];
}

export function parseChangedEntityJob(value: unknown): EveryActionChangedEntityJob {
  if (!value || typeof value !== "object") throw new TypeError("Invalid EveryAction job response");
  const record = value as Record<string, unknown>;
  if (typeof record.exportJobId !== "number" || typeof record.jobStatus !== "string") {
    throw new TypeError("EveryAction job response is missing exportJobId or jobStatus");
  }
  const files = Array.isArray(record.files)
    ? record.files.map((file) => {
        if (!file || typeof file !== "object" || typeof (file as Record<string, unknown>).downloadUrl !== "string") {
          throw new TypeError("EveryAction job response contains an invalid file");
        }
        return file as { downloadUrl: string; recordCount?: number };
      })
    : undefined;
  return {
    exportJobId: record.exportJobId,
    jobStatus: record.jobStatus,
    dateExpired: typeof record.dateExpired === "string" ? record.dateExpired : undefined,
    files,
  };
}
