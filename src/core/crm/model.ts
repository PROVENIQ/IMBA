import type { Brand } from "../primitives/brand";
import type {
  ExternalIdentityId,
  HouseholdId,
  OrganizationId,
  PersonId,
  RelationshipId,
  UuidV4,
} from "../primitives/identity";

export type ContactPointId = Brand<string, "ContactPointId">;
export type AddressId = Brand<string, "AddressId">;
export type ConsentId = Brand<string, "ConsentId">;
export type SuppressionId = Brand<string, "SuppressionId">;
export type SourceAttributionId = Brand<string, "SourceAttributionId">;
export type LabelId = Brand<string, "LabelId">;
export type EngagementCodeId = Brand<string, "EngagementCodeId">;
export type CustomFieldDefinitionId = Brand<string, "CustomFieldDefinitionId">;

export interface TenantRecord {
  readonly organizationId: OrganizationId;
}

export interface Person extends TenantRecord {
  readonly personId: PersonId;
  readonly piiReference: string;
  readonly status: "ACTIVE" | "INACTIVE" | "DECEASED" | "MERGED";
}

export interface Household extends TenantRecord {
  readonly householdId: HouseholdId;
  readonly displayNameReference: string;
}

export interface ConstituentOrganization extends TenantRecord {
  readonly constituentOrganizationId: Brand<string, "ConstituentOrganizationId">;
  readonly nameReference: string;
}

export interface Relationship extends TenantRecord {
  readonly relationshipId: RelationshipId;
  readonly fromEntityId: UuidV4;
  readonly toEntityId: UuidV4;
  readonly relationshipType: string;
  readonly status: "ACTIVE" | "ENDED";
}

export interface ContactPoint extends TenantRecord {
  readonly contactPointId: ContactPointId;
  readonly ownerId: UuidV4;
  readonly kind: "EMAIL" | "PHONE";
  readonly piiReference: string;
  readonly isPrimary: boolean;
}

export interface Address extends TenantRecord {
  readonly addressId: AddressId;
  readonly ownerId: UuidV4;
  readonly piiReference: string;
  readonly kind: "HOME" | "WORK" | "MAILING" | "OTHER";
}

export interface CommunicationConsent extends TenantRecord {
  readonly consentId: ConsentId;
  readonly personId: PersonId;
  readonly channel: "EMAIL" | "SMS" | "PHONE" | "MAIL";
  readonly status: "OPTED_IN" | "OPTED_OUT" | "UNKNOWN";
  readonly evidenceReference: string;
}

export interface Suppression extends TenantRecord {
  readonly suppressionId: SuppressionId;
  readonly personId: PersonId;
  readonly channel: "ALL" | "EMAIL" | "SMS" | "PHONE" | "MAIL";
  readonly reason: string;
  readonly evidenceReference: string;
}

export interface ExternalIdentity extends TenantRecord {
  readonly externalIdentityId: ExternalIdentityId;
  readonly entityId: UuidV4;
  readonly sourceSystem: string;
  readonly externalId: string;
}

export interface SourceAttribution extends TenantRecord {
  readonly sourceAttributionId: SourceAttributionId;
  readonly entityId: UuidV4;
  readonly sourceSystem: string;
  readonly sourceCode: string;
  readonly evidenceReference: string;
}

export interface Label extends TenantRecord {
  readonly labelId: LabelId;
  readonly name: string;
  readonly description: string;
}

export interface EngagementCode extends TenantRecord {
  readonly engagementCodeId: EngagementCodeId;
  readonly name: string;
  readonly actionOrInterest: "ACTION" | "INTEREST" | "INVOLVEMENT";
}

export interface SegmentDefinition extends TenantRecord {
  readonly segmentId: Brand<string, "SegmentId">;
  readonly name: string;
  readonly criteriaVersion: number;
  readonly criteria: Readonly<Record<string, unknown>>;
}

export interface CustomFieldDefinition extends TenantRecord {
  readonly customFieldDefinitionId: CustomFieldDefinitionId;
  readonly name: string;
  readonly dataType: "BOOLEAN" | "TEXT" | "DATE" | "NUMBER" | "MONEY" | "SELECTION";
  readonly allowedValues?: readonly string[];
}

export interface CustomFieldValue extends TenantRecord {
  readonly definitionId: CustomFieldDefinitionId;
  readonly entityId: UuidV4;
  readonly value: string | number | boolean;
}
