import type { DebtResult, ProjectStats, ResourceRequirement } from "../../types/game";

const NO_DEBT: DebtResult = {
  hasDebt: false,
  missingBudget: false,
  missingTime: false,
  missingQuality: false,
  missingRiskCap: false,
};

export function resolveRequirementDebt(
  project: ProjectStats,
  requirements?: ResourceRequirement,
): DebtResult {
  if (!requirements) {
    return NO_DEBT;
  }

  const missingBudget =
    requirements.budget != null && project.budget < requirements.budget;
  const missingTime = requirements.time != null && project.time < requirements.time;
  const missingQuality =
    requirements.minQuality != null && project.quality < requirements.minQuality;
  const missingRiskCap =
    requirements.maxRisk != null && project.risk > requirements.maxRisk;

  return {
    hasDebt: missingBudget || missingTime || missingQuality || missingRiskCap,
    missingBudget,
    missingTime,
    missingQuality,
    missingRiskCap,
  };
}
