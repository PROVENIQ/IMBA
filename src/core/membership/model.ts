import type { Brand } from "../primitives/brand";
import type {
  ChapterId,
  OrganizationId,
  PersonId,
} from "../primitives/identity";

export type MembershipId = Brand<string, "MembershipId">;

export interface MembershipTerm {
  readonly startsOn: string;
  readonly endsOn?: string;
}

export type MembershipStatus =
  | "PROSPECTIVE"
  | "ACTIVE"
  | "GRACE"
  | "LAPSED"
  | "CANCELLED";

export interface Membership {
  readonly membershipId: MembershipId;
  readonly organizationId: OrganizationId;
  readonly personId: PersonId;
  readonly term: MembershipTerm;
  readonly status: MembershipStatus;
  readonly level: string;
}

export interface ChapterAffiliation {
  readonly organizationId: OrganizationId;
  readonly personId: PersonId;
  readonly chapterId: ChapterId;
  readonly role: "MEMBER" | "VOLUNTEER" | "LEADER" | "STAFF";
  readonly status: "ACTIVE" | "ENDED";
}

export interface MembershipBenefit {
  readonly benefitId: Brand<string, "MembershipBenefitId">;
  readonly organizationId: OrganizationId;
  readonly membershipId: MembershipId;
  readonly name: string;
  readonly status: "AVAILABLE" | "USED" | "EXPIRED";
}

export interface Renewal {
  readonly renewalId: Brand<string, "RenewalId">;
  readonly organizationId: OrganizationId;
  readonly membershipId: MembershipId;
  readonly renewedTerm: MembershipTerm;
}

export interface MembershipAdjustment {
  readonly adjustmentId: Brand<string, "MembershipAdjustmentId">;
  readonly organizationId: OrganizationId;
  readonly membershipId: MembershipId;
  readonly reason: string;
  readonly evidenceReference: string;
}
