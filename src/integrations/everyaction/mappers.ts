import type { ExternalIdentity, Person } from "@/core/crm/model";
import type {
  ExternalIdentityId,
  OrganizationId,
  PersonId,
  UuidV4,
} from "@/core/primitives/identity";
import type { EveryActionContact } from "@/integrations/everyaction/dtos";

export interface CanonicalContactImport {
  person: Person;
  externalIdentity: ExternalIdentity;
  preferredEmailReference?: string;
  preferredPhoneReference?: string;
}

export function mapEveryActionContact(input: {
  dto: EveryActionContact;
  organizationId: OrganizationId;
  personId: PersonId;
  externalIdentityId: ExternalIdentityId;
  piiReference: string;
  preferredEmailReference?: string;
  preferredPhoneReference?: string;
}): CanonicalContactImport {
  if (!Number.isSafeInteger(input.dto.vanId) || input.dto.vanId <= 0) {
    throw new TypeError("EveryAction contact vanId must be a positive integer");
  }
  return Object.freeze({
    person: Object.freeze({
      personId: input.personId,
      organizationId: input.organizationId,
      piiReference: input.piiReference,
      status: "ACTIVE",
    }),
    externalIdentity: Object.freeze({
      externalIdentityId: input.externalIdentityId,
      organizationId: input.organizationId,
      entityId: input.personId as unknown as UuidV4,
      sourceSystem: "EVERYACTION",
      externalId: String(input.dto.vanId),
    }),
    preferredEmailReference: input.preferredEmailReference,
    preferredPhoneReference: input.preferredPhoneReference,
  });
}
