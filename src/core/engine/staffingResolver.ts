import { BALANCE } from "../config/balance";
import {
  cloneCosmetic,
  DEFAULT_ROLE_COSMETICS,
} from "../../data/characterCosmetics";
import type { CharacterRole, ProjectStats, TeamMember } from "../../types/game";

const roleNames: Record<CharacterRole, string> = {
  director: "Director",
  planning: "Planificacion",
  quality: "Calidad",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function applyCoverage(
  team: TeamMember[],
  substituteId: string,
  missingRole: CharacterRole,
): TeamMember[] {
  return team.map((member) => {
    if (member.id !== substituteId) {
      return member;
    }

    return {
      ...member,
      assignedRole: missingRole,
      stress: clamp(
        member.stress + BALANCE.staffing.coverStressPenalty,
        0,
        member.maxStress,
      ),
      status: "covering_other_role",
    };
  });
}

export function createReplacement(role: CharacterRole, sequence = 1): TeamMember {
  const salary = BALANCE.team.salaryByRole[role];
  return {
    id: `hire-${role}-${sequence}`,
    name: `Suplente ${roleNames[role]} ${sequence}`,
    role,
    assignedRole: role,
    cosmetic: cloneCosmetic(DEFAULT_ROLE_COSMETICS[role]),
    energy: Math.round(BALANCE.team.maxEnergy * 0.7),
    maxEnergy: BALANCE.team.maxEnergy,
    stress: 20,
    maxStress: BALANCE.team.maxStress,
    salary,
    status: "active",
  };
}

export function hireReplacement(
  team: TeamMember[],
  project: ProjectStats,
  role: CharacterRole,
): {
  team: TeamMember[];
  project: ProjectStats;
  logText: string;
} {
  const sequence = team.filter((member) => member.role === role).length + 1;
  const replacement = createReplacement(role, sequence);

  const costByPercent = Math.round(project.budget * BALANCE.staffing.hireBudgetPercent);
  const salaryBase = BALANCE.team.salaryByRole[role];
  const budgetCost = Math.max(costByPercent, Math.round(salaryBase * 1.5));

  const updatedProject: ProjectStats = {
    ...project,
    budget: clamp(project.budget - budgetCost, 0, project.maxBudget),
    time: clamp(
      project.time - BALANCE.staffing.hireTimePenalty,
      0,
      project.maxTime,
    ),
    risk: clamp(
      project.risk + BALANCE.staffing.hireRiskPenalty,
      0,
      project.maxRisk,
    ),
    quality: clamp(
      project.quality - BALANCE.staffing.hireQualityPenalty,
      0,
      project.maxQuality,
    ),
  };

  const updatedTeam: TeamMember[] = team.map((member): TeamMember => {
    if (member.role === role && member.status === "out") {
      return {
        ...replacement,
        id: member.id,
      } as TeamMember;
    }

    if (
      member.status === "covering_other_role" &&
      member.assignedRole === role &&
      member.role !== role
    ) {
      return {
        ...member,
        assignedRole: member.role,
        status: "active",
      } as TeamMember;
    }

    return member as TeamMember;
  });

  return {
    project: updatedProject,
    team: updatedTeam,
    logText: `Se contrata reemplazo para rol ${roleNames[role]}. Costo operacional aplicado.`,
  };
}
