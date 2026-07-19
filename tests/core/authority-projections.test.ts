import { describe, expect, it } from "vitest";

import { CommandRegistry } from "../../src/core/commands/command-registry";
import { validateOfflineAuthority } from "../../src/core/offline/authority";
import {
  asCommandId,
  asCorrelationId,
} from "../../src/core/primitives/identity";
import { advanceCheckpoint } from "../../src/core/projections/projection-model";
import { validateProviderInboundDecision } from "../../src/core/providers/inbound-policy";

describe("validated command boundary", () => {
  const command = {
    commandId: asCommandId("11111111-1111-4111-8111-111111111111"),
    commandType: "RecordArchitectureFixture",
    schemaVersion: 1,
    correlationId: asCorrelationId("22222222-2222-4222-8222-222222222222"),
    requestedAt: "2026-07-19T12:00:00.000Z",
    payload: { fixtureName: "phase-zero" },
  } as const;

  it("accepts only registered, schema-validated commands", () => {
    const registry = new CommandRegistry();
    registry.register({
      commandType: "RecordArchitectureFixture",
      schemaVersion: 1,
      validate: (payload) => {
        if (typeof payload.fixtureName !== "string") {
          throw new TypeError("fixtureName is required");
        }
      },
    });

    expect(registry.validate(command)).toEqual(command);
    expect(() =>
      registry.validate({ ...command, commandType: "ArbitraryCommand" }),
    ).toThrow("unrecognized command type");
    expect(() => registry.validate({ ...command, schemaVersion: 2 })).toThrow(
      "unsupported",
    );
  });
});

describe("delegated offline authority", () => {
  it("does not allow provisional authority without a central policy", () => {
    expect(() =>
      validateOfflineAuthority({ status: "PROVISIONAL_AUTHORITY_EXERCISED" }),
    ).toThrow("centrally approved policy");
  });

  it("allows recording a local fact without claiming central acceptance", () => {
    expect(validateOfflineAuthority({ status: "LOCAL_FACT_RECORDED" })).toEqual({
      status: "LOCAL_FACT_RECORDED",
    });
  });
});

describe("projection checkpoints", () => {
  it("advance by ledger position and reject regression", () => {
    const checkpoint = {
      projectionName: "reporting",
      projectionVersion: 1,
      lastLedgerPosition: BigInt(10),
      eventCount: BigInt(10),
    };

    const advanced = advanceCheckpoint(checkpoint, BigInt(11));
    expect(advanced.lastLedgerPosition).toBe(BigInt(11));
    expect(advanced.eventCount).toBe(BigInt(11));
    expect(() => advanceCheckpoint(advanced, BigInt(11))).toThrow("monotonically");
  });
});

describe("provider inbound evidence", () => {
  it("retains source evidence and a versioned policy outcome", () => {
    const decision = validateProviderInboundDecision({
      provider: "provider-fixture",
      providerEventId: "evt_123",
      source: "webhook",
      evidenceReference: "evidence://provider-fixture/evt_123",
      receivedAt: "2026-07-19T12:00:00.000Z",
      policy: {
        policyId: "provider-fixture-policy",
        policyVersion: 1,
        effectiveDate: "2026-07-19",
      },
      outcome: "REQUIRE_REVIEW",
      explanationCode: "SOURCE_CONFLICT",
      resultingEventIds: [],
    });

    expect(decision.outcome).toBe("REQUIRE_REVIEW");
    expect(decision.evidenceReference).toContain("evt_123");
  });
});
