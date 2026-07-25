import type { ValidationResult, ValidationRule } from "@/core/migration/model";
import type { JsonObject } from "@/core/primitives/json";

export function validateRecord(
  record: Readonly<JsonObject>,
  rules: readonly ValidationRule[],
): ValidationResult[] {
  return rules.map((rule) => {
    let passed = false;
    try {
      passed = rule.validate(record);
    } catch {
      passed = false;
    }
    return {
      ruleCode: rule.code,
      severity: rule.severity,
      passed,
      field: rule.field,
      message: passed ? `${rule.code} passed` : rule.description,
    };
  });
}

export const constituentValidationRules: readonly ValidationRule[] = [
  {
    code: "SOURCE_ID_REQUIRED",
    description: "A stable source record identifier is required.",
    severity: "ERROR",
    field: "sourceId",
    validate: (record) => typeof record.sourceId === "string" && record.sourceId.trim().length > 0,
  },
  {
    code: "NAME_REQUIRED",
    description: "At least one constituent name is required.",
    severity: "ERROR",
    validate: (record) =>
      [record.firstName, record.lastName, record.organizationName].some(
        (value) => typeof value === "string" && value.trim().length > 0,
      ),
  },
  {
    code: "EMAIL_FORMAT",
    description: "Email must use a plausible address format when supplied.",
    severity: "WARNING",
    field: "email",
    validate: (record) =>
      record.email === undefined ||
      (typeof record.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)),
  },
];
