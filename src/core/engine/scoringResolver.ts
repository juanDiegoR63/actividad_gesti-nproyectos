import type { ProjectStats, TeamMember } from "../../types/game";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export type FinalScoreResult = {
  score: number;
  rank: string;
  breakdown: {
    budgetHealth: number;
    timeHealth: number;
    qualityHealth: number;
    riskControl: number;
    progressCompletion: number;
    teamStability: number;
  };
};

function getRank(score: number): string {
  if (score < 40) {
    return "Colapso operativo";
  }

  if (score < 60) {
    return "Cierre defectuoso";
  }

  if (score < 75) {
    return "Cumplimiento parcial";
  }

  if (score < 90) {
    return "Ejecucion solida";
  }

  return "Gestion ejemplar";
}

export function computeFinalScore(
  project: ProjectStats,
  team: TeamMember[],
): FinalScoreResult {
  const budgetHealth = clamp((project.budget / project.maxBudget) * 100, 0, 100);
  const timeHealth = clamp((project.time / project.maxTime) * 100, 0, 100);
  const qualityHealth = clamp((project.quality / project.maxQuality) * 100, 0, 100);
  const riskControl = clamp(
    ((project.maxRisk - project.risk) / project.maxRisk) * 100,
    0,
    100,
  );
  const progressCompletion = clamp(
    (project.progress / project.maxProgress) * 100,
    0,
    100,
  );

  const activeCount = team.filter((member) => member.status !== "out").length;
  const teamStability = clamp((activeCount / team.length) * 100, 0, 100);

  const weighted =
    budgetHealth * 0.25 +
    timeHealth * 0.2 +
    qualityHealth * 0.2 +
    riskControl * 0.15 +
    progressCompletion * 0.1 +
    teamStability * 0.1;

  const score = Math.round(weighted);
  const rank = getRank(score);

  return {
    score,
    rank,
    breakdown: {
      budgetHealth,
      timeHealth,
      qualityHealth,
      riskControl,
      progressCompletion,
      teamStability,
    },
  };
}
