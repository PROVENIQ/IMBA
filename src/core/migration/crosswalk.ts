import type { FieldMapping } from "@/core/migration/model";
import type { ActorId, FieldMappingId, OrganizationId } from "@/core/primitives/identity";
import type { JsonObject } from "@/core/primitives/json";

export class VersionedCrosswalk {
  private readonly mappings: FieldMapping[] = [];

  propose(
    input: Omit<FieldMapping, "version" | "status" | "occurredAt" | "ingestedAt" | "recordedAt">,
    timestamps: { occurredAt: string; ingestedAt: string; recordedAt: string },
  ): FieldMapping {
    const prior = this.forField(
      input.organizationId,
      input.sourceSystem,
      input.sourceEntity,
      input.sourceField,
    );
    const mapping: FieldMapping = Object.freeze({
      ...input,
      version: (prior.at(-1)?.version ?? 0) + 1,
      status: "PROPOSED",
      ...timestamps,
      supersedesVersion: prior.at(-1)?.version,
    });
    this.mappings.push(mapping);
    return mapping;
  }

  approve(
    organizationId: OrganizationId,
    id: FieldMappingId,
    actorId: ActorId,
    now: string,
  ): FieldMapping {
    const index = this.mappings.findIndex(
      (item) => item.organizationId === organizationId && item.id === id && item.status === "PROPOSED",
    );
    if (index < 0) throw new Error("Draft field mapping not found for organization");

    const current = this.mappings[index];
    this.mappings.forEach((item, itemIndex) => {
      if (
        item.organizationId === organizationId &&
        item.sourceSystem === current.sourceSystem &&
        item.sourceEntity === current.sourceEntity &&
        item.sourceField === current.sourceField &&
        item.status === "APPROVED"
      ) {
        this.mappings[itemIndex] = Object.freeze({ ...item, status: "SUPERSEDED" });
      }
    });

    const approved = Object.freeze({
      ...current,
      status: "APPROVED" as const,
      approvedAt: now,
      approvedBy: actorId,
    });
    this.mappings[index] = approved;
    return approved;
  }

  apply(mapping: FieldMapping, record: Readonly<JsonObject>): unknown {
    const value = record[mapping.sourceField];
    switch (mapping.transformRule.kind) {
      case "COPY":
        return value;
      case "TRIM":
        return typeof value === "string" ? value.trim() : value;
      case "UPPERCASE":
        return typeof value === "string" ? value.toUpperCase() : value;
      case "LOWERCASE":
        return typeof value === "string" ? value.toLowerCase() : value;
      case "CONSTANT":
        return mapping.transformRule.options?.value;
      case "LOOKUP": {
        const lookup = mapping.transformRule.options?.values;
        return lookup && typeof lookup === "object" && !Array.isArray(lookup)
          ? lookup[String(value)]
          : undefined;
      }
    }
  }

  list(organizationId: OrganizationId): readonly FieldMapping[] {
    return this.mappings.filter((item) => item.organizationId === organizationId);
  }

  private forField(
    organizationId: OrganizationId,
    sourceSystem: FieldMapping["sourceSystem"],
    sourceEntity: string,
    sourceField: string,
  ): FieldMapping[] {
    return this.mappings.filter(
      (item) =>
        item.organizationId === organizationId &&
        item.sourceSystem === sourceSystem &&
        item.sourceEntity === sourceEntity &&
        item.sourceField === sourceField,
    );
  }
}
