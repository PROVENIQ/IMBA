import type { Brand } from "./brand";

export type CurrencyCode = Brand<string, "CurrencyCode">;

export interface Money {
  readonly minorUnits: bigint;
  readonly currency: CurrencyCode;
}

export interface SerializedMoney {
  readonly minorUnits: string;
  readonly currency: string;
}

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const INTEGER_PATTERN = /^-?(0|[1-9]\d*)$/;

export function asCurrencyCode(value: string): CurrencyCode {
  if (!CURRENCY_PATTERN.test(value)) {
    throw new TypeError("currency must be a three-letter uppercase code");
  }

  return value as CurrencyCode;
}

export function money(minorUnits: bigint, currency: CurrencyCode): Money {
  return Object.freeze({ minorUnits, currency });
}

export function serializeMoney(value: Money): SerializedMoney {
  return {
    minorUnits: value.minorUnits.toString(10),
    currency: value.currency,
  };
}

export function parseMoney(value: unknown): Money {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("money must be an object");
  }

  const record = value as Record<string, unknown>;
  if (typeof record.minorUnits !== "string" || !INTEGER_PATTERN.test(record.minorUnits)) {
    throw new TypeError("minorUnits must be a base-10 integer string");
  }

  if (typeof record.currency !== "string") {
    throw new TypeError("currency is required");
  }

  return money(BigInt(record.minorUnits), asCurrencyCode(record.currency));
}

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new TypeError("implicit currency conversion is not permitted");
  }

  return money(left.minorUnits + right.minorUnits, left.currency);
}
