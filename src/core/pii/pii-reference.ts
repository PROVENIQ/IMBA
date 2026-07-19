import type { PiiContextId } from "../primitives/identity";
import type { JsonObject, JsonValue } from "../primitives/json";

export interface EncryptedPiiReference {
  readonly piiContextId: PiiContextId;
  readonly field: string;
  readonly purpose: string;
}

const FORBIDDEN_PLAINTEXT_KEYS = new Set([
  "address",
  "birthdate",
  "dateofbirth",
  "dob",
  "email",
  "emailaddress",
  "firstname",
  "fullname",
  "lastname",
  "phone",
  "phonenumber",
  "postaladdress",
  "ssn",
  "taxid",
]);

export function assertNoPlaintextPii(payload: JsonObject): void {
  inspect(payload, "payload");
}

function inspect(value: JsonValue, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((child, index) => inspect(child, `${path}[${index}]`));
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.replace(/[^a-z]/gi, "").toLowerCase();
    if (FORBIDDEN_PLAINTEXT_KEYS.has(normalizedKey)) {
      throw new TypeError(
        `${path}.${key} may not contain searchable plaintext PII; use an encrypted PII reference`,
      );
    }
    inspect(child, `${path}.${key}`);
  }
}
