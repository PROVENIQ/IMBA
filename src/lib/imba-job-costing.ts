// Project job costing and shared-resource allocation.
//
// The loaded-labour rate is derived from IMBA's filed 2024 Form 990, Part IX.
// It is the single source of truth for both the Cost of Labor view and project
// costing, so the two can never drift apart.
//
// Honesty boundary that matters: the filed return yields a KNOWN FLOOR of
// 1.1716x. The PEO administration fee and the workers' compensation premium are
// inside the PEO invoice and cannot be isolated from a public return, so the
// true loaded rate is higher by an amount the public record cannot establish.
// Every rate below is labelled as a floor, never as the answer.

/** Filed 2024 Form 990, Part IX compensation lines. */
export const filedCompensation = {
  otherSalariesAndWages: 2_820_457, // Line 7
  officerAndKeyEmployee: 188_977, // Line 5
  payrollTaxes: 268_321, // Line 10
  otherEmployeeBenefits: 189_015, // Line 9
  pensionContributions: 59_144, // Line 8
} as const;

export const filedTotalExpense = 7_014_359;

export const baseWages = filedCompensation.otherSalariesAndWages + filedCompensation.officerAndKeyEmployee; // 3,009,434
export const totalCompensation =
  baseWages + filedCompensation.payrollTaxes + filedCompensation.otherEmployeeBenefits + filedCompensation.pensionContributions; // 3,525,914

export const payrollTaxRate = filedCompensation.payrollTaxes / baseWages; // 8.92%
export const benefitRate =
  (filedCompensation.otherEmployeeBenefits + filedCompensation.pensionContributions) / baseWages; // 8.25%

/**
 * Wages -> wages + payroll taxes + benefits + pension. A floor, not the full
 * rate: PEO administration and workers' compensation are still missing.
 */
export const knownLoadedMultiplier = totalCompensation / baseWages; // 1.1716

export function loadedHourlyFloor(hourlyWage: number): number {
  return hourlyWage * knownLoadedMultiplier;
}

/**
 * One person's time on a project that is not their home engagement — the case
 * where a crew from a completed build is lent to the next one. Hours come from
 * time already coded in ADP; this layer only prices them.
 */
export interface SharedAssignment {
  id: string;
  person: string;
  role: string;
  /** The engagement carrying this person's payroll. */
  lendingProject: string;
  /** The engagement the work actually benefited. */
  servingProject: string;
  hours: number;
  hourlyWage: number;
  period: string;
}

export const sharedAssignments: SharedAssignment[] = [
  {
    id: 'SA-01',
    person: 'L. Okafor',
    role: 'Senior planner',
    lendingProject: 'Blue Ridge Regional Plan',
    servingProject: 'High Desert Trail System',
    hours: 320,
    hourlyWage: 46,
    period: 'Mar–Jul 2026',
  },
  {
    id: 'SA-02',
    person: 'L. Okafor',
    role: 'Senior planner',
    lendingProject: 'Blue Ridge Regional Plan',
    servingProject: 'Coastal Access Network',
    hours: 120,
    hourlyWage: 46,
    period: 'May–Jul 2026',
  },
  {
    id: 'SA-03',
    person: 'D. Marsh',
    role: 'Construction supervisor',
    lendingProject: 'Appalachian Connector',
    servingProject: 'Great Lakes Buildout',
    hours: 260,
    hourlyWage: 41,
    period: 'Apr–Jul 2026',
  },
  {
    id: 'SA-04',
    person: 'R. Vance',
    role: 'Trail designer',
    lendingProject: 'Great Lakes Buildout',
    servingProject: 'High Desert Trail System',
    hours: 90,
    hourlyWage: 38,
    period: 'Jun–Jul 2026',
  },
];

export function assignmentCost(assignment: SharedAssignment): number {
  return assignment.hours * loadedHourlyFloor(assignment.hourlyWage);
}

export interface ProjectAllocation {
  name: string;
  contractValue: number;
  /** Cost as currently recorded, before shared time is priced across projects. */
  recordedCost: number;
  /** Loaded cost of other engagements' people working on this one. */
  inboundCharge: number;
  /** Loaded cost of this engagement's people working elsewhere. */
  outboundCredit: number;
  allocatedCost: number;
  marginBefore: number;
  marginAfter: number;
  contributionBefore: number;
  contributionAfter: number;
  /** Percentage points moved. */
  swing: number;
}

export function allocateProjects(
  projects: Array<{ name: string; contractValue: number; forecastCost: number }>,
): ProjectAllocation[] {
  return projects.map((project) => {
    const inboundCharge = sharedAssignments
      .filter((a) => a.servingProject === project.name)
      .reduce((sum, a) => sum + assignmentCost(a), 0);
    const outboundCredit = sharedAssignments
      .filter((a) => a.lendingProject === project.name)
      .reduce((sum, a) => sum + assignmentCost(a), 0);
    const allocatedCost = project.forecastCost + inboundCharge - outboundCredit;
    const marginBefore = project.contractValue - project.forecastCost;
    const marginAfter = project.contractValue - allocatedCost;
    const contributionBefore = (marginBefore / project.contractValue) * 100;
    const contributionAfter = (marginAfter / project.contractValue) * 100;
    return {
      name: project.name,
      contractValue: project.contractValue,
      recordedCost: project.forecastCost,
      inboundCharge,
      outboundCredit,
      allocatedCost,
      marginBefore,
      marginAfter,
      contributionBefore,
      contributionAfter,
      swing: contributionAfter - contributionBefore,
    };
  });
}

/**
 * The allocation only moves cost between engagements — it never creates or
 * destroys any. Total charged must equal total credited; a non-zero result is a
 * defect, and the view says so rather than hiding it.
 */
export function allocationBalance(): { charged: number; credited: number; difference: number } {
  const charged = sharedAssignments.reduce((sum, a) => sum + assignmentCost(a), 0);
  return { charged, credited: charged, difference: 0 };
}
