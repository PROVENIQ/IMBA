import { describe, expect, it } from "vitest";

import { validateAccountingPacket, type AccountingPacket } from "../../src/core/accounting/accounting-packet";
import {
  asAccountingPacketId,
  asCorrelationId,
  asEventId,
  asOrganizationId,
} from "../../src/core/primitives/identity";
import {
  addMoney,
  asCurrencyCode,
  money,
  parseMoney,
  serializeMoney,
} from "../../src/core/primitives/money";

const usd = asCurrencyCode("USD");

function packet(): AccountingPacket {
  return {
    accountingPacketId: asAccountingPacketId(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ),
    sourceEventIds: [asEventId("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")],
    organizationId: asOrganizationId(
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ),
    correlationId: asCorrelationId(
      "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    ),
    policy: {
      policyId: "policy-awaiting-imba-approval",
      policyVersion: 1,
      effectiveDate: "2026-07-19",
    },
    effectiveDate: "2026-07-19",
    currency: usd,
    lines: [
      {
        lineNumber: 1,
        accountReference: "unmapped-debit",
        side: "DEBIT",
        amount: money(BigInt(1250), usd),
        dimensions: {},
      },
      {
        lineNumber: 2,
        accountReference: "unmapped-credit",
        side: "CREDIT",
        amount: money(BigInt(1250), usd),
        dimensions: {},
      },
    ],
    restrictionDimensions: {},
    chapterDimensions: {},
    approvalStatus: "PROPOSED",
  };
}

describe("money", () => {
  it("serializes bigint minor units as a decimal string", () => {
    const original = money(BigInt("900719925474099312345"), usd);
    const serialized = serializeMoney(original);

    expect(serialized).toEqual({
      minorUnits: "900719925474099312345",
      currency: "USD",
    });
    expect(parseMoney(serialized)).toEqual(original);
  });

  it("rejects numbers, fractional strings, currency-less money, and implicit FX", () => {
    expect(() => parseMoney({ minorUnits: 12.5, currency: "USD" })).toThrow(
      "integer string",
    );
    expect(() => parseMoney({ minorUnits: "12.5", currency: "USD" })).toThrow(
      "integer string",
    );
    expect(() => parseMoney({ minorUnits: "1250" })).toThrow("currency is required");
    expect(() =>
      addMoney(money(BigInt(1), usd), money(BigInt(1), asCurrencyCode("CAD"))),
    ).toThrow("implicit currency conversion");
  });
});

describe("accounting packet", () => {
  it("accepts balanced integer-minor-unit lines with policy and source evidence", () => {
    expect(validateAccountingPacket(packet()).lines).toHaveLength(2);
  });

  it("rejects an unbalanced packet", () => {
    const unbalanced = packet();
    const changed: AccountingPacket = {
      ...unbalanced,
      lines: [
        unbalanced.lines[0],
        {
          ...unbalanced.lines[1],
          amount: money(BigInt(1249), usd),
        },
      ],
    };

    expect(() => validateAccountingPacket(changed)).toThrow("not balanced");
  });

  it("requires a QBO reference before a packet may be marked posted", () => {
    expect(() =>
      validateAccountingPacket({ ...packet(), approvalStatus: "POSTED" }),
    ).toThrow("QBO posting reference");
  });
});
