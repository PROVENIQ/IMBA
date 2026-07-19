import type {
  AccountingPacketId,
  CausationId,
  ChapterId,
  CorrelationId,
  EventId,
  OrganizationId,
} from "../primitives/identity";
import type { JsonObject } from "../primitives/json";
import type { CurrencyCode, Money } from "../primitives/money";
import { assertApprovedPolicy, type ApprovedPolicyReference } from "../policies/policy-contract";

export type AccountingSide = "DEBIT" | "CREDIT";
export type AccountingApprovalStatus =
  | "PROPOSED"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "RELEASED"
  | "POSTED"
  | "REVERSED";

export interface AccountingLine {
  readonly lineNumber: number;
  readonly accountReference: string;
  readonly side: AccountingSide;
  readonly amount: Money;
  readonly memo?: string;
  readonly dimensions: JsonObject;
}

export interface AccountingPacket {
  readonly accountingPacketId: AccountingPacketId;
  readonly sourceEventIds: readonly EventId[];
  readonly organizationId: OrganizationId;
  readonly chapterId?: ChapterId;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly policy: ApprovedPolicyReference;
  readonly effectiveDate: string;
  readonly currency: CurrencyCode;
  readonly lines: readonly AccountingLine[];
  readonly restrictionDimensions: JsonObject;
  readonly chapterDimensions: JsonObject;
  readonly reversalOfPacketId?: AccountingPacketId;
  readonly approvalStatus: AccountingApprovalStatus;
  readonly qboPostingReference?: string;
}

export function validateAccountingPacket(packet: AccountingPacket): AccountingPacket {
  assertApprovedPolicy(packet.policy);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.effectiveDate)) {
    throw new TypeError("effectiveDate must be YYYY-MM-DD");
  }

  if (packet.sourceEventIds.length === 0) {
    throw new TypeError("accounting packet requires at least one source event");
  }

  if (new Set(packet.sourceEventIds).size !== packet.sourceEventIds.length) {
    throw new TypeError("source event IDs must be unique");
  }

  if (packet.lines.length < 2) {
    throw new TypeError("accounting packet requires at least two lines");
  }

  let debits = BigInt(0);
  let credits = BigInt(0);
  const lineNumbers = new Set<number>();

  for (const line of packet.lines) {
    if (!Number.isSafeInteger(line.lineNumber) || line.lineNumber <= 0) {
      throw new TypeError("lineNumber must be a positive integer");
    }
    if (lineNumbers.has(line.lineNumber)) {
      throw new TypeError(`duplicate accounting line number ${line.lineNumber}`);
    }
    lineNumbers.add(line.lineNumber);

    if (!line.accountReference.trim()) {
      throw new TypeError("accountReference is required");
    }
    if (line.amount.currency !== packet.currency) {
      throw new TypeError("all accounting lines must use the packet currency");
    }
    if (line.amount.minorUnits <= BigInt(0)) {
      throw new TypeError("accounting line amount must be positive");
    }

    if (line.side === "DEBIT") debits += line.amount.minorUnits;
    else if (line.side === "CREDIT") credits += line.amount.minorUnits;
    else throw new TypeError("accounting line side must be DEBIT or CREDIT");
  }

  if (debits !== credits) {
    throw new TypeError(
      `accounting packet is not balanced: debits ${debits}, credits ${credits}`,
    );
  }

  if (
    packet.reversalOfPacketId &&
    packet.reversalOfPacketId === packet.accountingPacketId
  ) {
    throw new TypeError("an accounting packet cannot reverse itself");
  }

  if (packet.approvalStatus === "POSTED" && !packet.qboPostingReference?.trim()) {
    throw new TypeError("posted packets require a QBO posting reference");
  }

  return Object.freeze({
    ...packet,
    sourceEventIds: Object.freeze([...packet.sourceEventIds]),
    lines: Object.freeze(packet.lines.map((line) => Object.freeze({ ...line }))),
  });
}
