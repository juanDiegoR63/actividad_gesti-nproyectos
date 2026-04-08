import { BALANCE } from "../config/balance";
import { rollLuck } from "./luckResolver";
import { resolveRequirementDebt } from "./requirementResolver";
import type {
  DecisionEffects,
  DecisionOption,
  EnemyUnit,
  LogEntry,
  ProjectStats,
  ProjectResourceKey,
  ResolutionResult,
  TeamMember,
} from "../../types/game";

const PROJECT_KEYS: ProjectResourceKey[] = [
  "budget",
  "time",
  "quality",
  "risk",
  "progress",
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function scaleProjectPenalty(key: ProjectResourceKey, value: number): number {
  const multiplier = BALANCE.combat.penaltySeverityMultiplier;

  if (value === 0) {
    return value;
  }

  if (key === "risk" && value > 0) {
    return round2(value * multiplier);
  }

  if (["budget", "time", "quality", "progress"].includes(key) && value < 0) {
    return round2(value * multiplier);
  }

  return value;
}

function scaleStressPenalty(value: number): number {
  if (value <= 0) {
    return value;
  }

  return round2(value * BALANCE.combat.penaltySeverityMultiplier);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scaleProjectDelta(
  delta: Partial<Record<ProjectResourceKey, number>> | undefined,
  multiplier: number,
): Partial<Record<ProjectResourceKey, number>> {
  if (!delta) {
    return {};
  }

  return PROJECT_KEYS.reduce<Partial<Record<ProjectResourceKey, number>>>(
    (acc, key) => {
      const value = delta[key];
      if (value == null) {
        return acc;
      }

      acc[key] = Math.round(value * multiplier * 100) / 100;
      return acc;
    },
    {},
  );
}

function applyProjectDelta(
  project: ProjectStats,
  delta: Partial<Record<ProjectResourceKey, number>>,
): ProjectStats {
  return {
    ...project,
    budget: clamp(project.budget + (delta.budget ?? 0), 0, project.maxBudget),
    time: clamp(project.time + (delta.time ?? 0), 0, project.maxTime),
    quality: clamp(project.quality + (delta.quality ?? 0), 0, project.maxQuality),
    risk: clamp(project.risk + (delta.risk ?? 0), 0, project.maxRisk),
    progress: clamp(project.progress + (delta.progress ?? 0), 0, project.maxProgress),
  };
}

function applyActorDelta(
  team: TeamMember[],
  actorId: string,
  delta?: Partial<{ energy: number; stress: number }>,
): TeamMember[] {
  if (!delta) {
    return team;
  }

  return team.map((member) => {
    if (member.id !== actorId) {
      return member;
    }

    const nextEnergy = clamp(
      member.energy + (delta.energy ?? 0),
      0,
      member.maxEnergy,
    );
    const nextStress = clamp(
      member.stress + (delta.stress ?? 0),
      0,
      member.maxStress,
    );

    return {
      ...member,
      energy: nextEnergy,
      stress: nextStress,
      status: nextEnergy <= 0 ? "out" : member.status,
    };
  });
}

function applyEnemyDelta(
  enemies: EnemyUnit[],
  effects: DecisionEffects,
  targetEnemyId: string,
  multiplier: number,
): { enemies: EnemyUnit[]; enemiesKilled: number } {
  const hasTargetEffects = Boolean(effects.targetEnemy);
  const hasAllEnemyEffects = Boolean(effects.allEnemies);

  if (!hasTargetEffects && !hasAllEnemyEffects) {
    return { enemies, enemiesKilled: 0 };
  }

  let enemiesKilled = 0;

  const updatedEnemies = enemies.map((enemy) => {
    const shouldApplyTarget = enemy.id === targetEnemyId && hasTargetEffects;

    let hpDelta = 0;
    let threatDelta = 0;

    if (shouldApplyTarget) {
      hpDelta += (effects.targetEnemy?.hp ?? 0) * multiplier * 5; // 5x damage multiplier
      threatDelta += (effects.targetEnemy?.threat ?? 0) * multiplier;
    }

    if (hasAllEnemyEffects) {
      hpDelta += (effects.allEnemies?.hp ?? 0) * 5; // 5x damage multiplier for AOE
      threatDelta += effects.allEnemies?.threat ?? 0;
    }

    // Calculate new HP with instant kill if damage exceeds max HP
    const newHp = enemy.hp + hpDelta;
    const shouldInstantKill = hpDelta < 0 && Math.abs(hpDelta) >= enemy.hp;
    const finalHp = shouldInstantKill ? 0 : clamp(newHp, 0, enemy.maxHp);

    // Count if enemy was killed (had HP before and now has 0)
    if (enemy.hp > 0 && finalHp <= 0) {
      enemiesKilled++;
    }

    return {
      ...enemy,
      hp: finalHp,
      threat: clamp(enemy.threat + threatDelta, 0, 99),
    };
  });

  return { enemies: updatedEnemies, enemiesKilled };
}

function applyDebtPenalty(
  project: ProjectStats,
  team: TeamMember[],
  actorId: string,
  debt: ReturnType<typeof resolveRequirementDebt>,
): {
  project: ProjectStats;
  team: TeamMember[];
  incidentLabel: string | null;
} {
  let nextProject = project;
  let nextTeam = team;
  let incidentLabel: string | null = null;

  const debtPenalty = BALANCE.combat.debtPenalty;

  if (debt.missingBudget) {
    nextProject = applyProjectDelta(nextProject, {
      risk: scaleProjectPenalty("risk", debtPenalty.missingBudget.risk),
      quality: scaleProjectPenalty("quality", debtPenalty.missingBudget.quality),
    });
  }

  if (debt.missingTime) {
    nextProject = applyProjectDelta(nextProject, {
      risk: scaleProjectPenalty("risk", debtPenalty.missingTime.risk),
    });
    nextTeam = applyActorDelta(nextTeam, actorId, {
      stress: scaleStressPenalty(debtPenalty.missingTime.actorStress),
    });
  }

  if (debt.missingQuality) {
    nextProject = applyProjectDelta(nextProject, {
      progress: scaleProjectPenalty("progress", debtPenalty.missingQuality.progress),
      risk: scaleProjectPenalty("risk", debtPenalty.missingQuality.risk),
    });
  }

  if (debt.missingRiskCap) {
    nextProject = applyProjectDelta(nextProject, {
      risk: scaleProjectPenalty("risk", debtPenalty.missingRiskCap.risk),
    });

    if (Math.random() < debtPenalty.missingRiskCap.incidentChance) {
      nextProject = applyProjectDelta(nextProject, {
        time: scaleProjectPenalty("time", debtPenalty.riskCapIncident.time),
        quality: scaleProjectPenalty("quality", debtPenalty.riskCapIncident.quality),
      });
      incidentLabel =
        "Incidente por riesgo fuera de tope: estalla un frente y se compromete calidad/tiempo";
    }
  }

  return {
    project: nextProject,
    team: nextTeam,
    incidentLabel,
  };
}

function getEffectiveMultiplier(actor: TeamMember, option: DecisionOption): number {
  const roleMultiplier = option.roleScaling?.[actor.assignedRole] ?? 1;
  const stressMultiplier = getStressMultiplier(actor.stress);

  const coverageMultiplier =
    actor.status === "covering_other_role" && actor.assignedRole !== actor.role
      ? BALANCE.staffing.coverEfficiencyMultiplier
      : 1;

  return roleMultiplier * stressMultiplier * coverageMultiplier;
}

function getStressMultiplier(stress: number): number {
  if (stress >= 85) {
    return 0.8;
  }

  if (stress >= 70) {
    return 0.9;
  }

  return 1;
}

function getNarrativeSeverity(
  debt: ReturnType<typeof resolveRequirementDebt>,
  luckEvent: ResolutionResult["luckEvent"],
): LogEntry["narrativeSeverity"] {
  if (debt.hasDebt) {
    if (debt.missingRiskCap || debt.missingTime) {
      return "high";
    }

    return "medium";
  }

  if (luckEvent?.polarity === "negative") {
    return "medium";
  }

  return "low";
}

function buildResolutionLog(input: {
  actorName: string;
  actionTitle: string;
  actionNarrative: string;
  glossaryKeys: string[];
  turnNumber: number;
  debt: ReturnType<typeof resolveRequirementDebt>;
  luckEvent: ResolutionResult["luckEvent"];
  incidentLabel: string | null;
}): { logEntry: LogEntry; narrativeSeverity: LogEntry["narrativeSeverity"] } {
  const debtTags: string[] = [];
  if (input.debt.missingBudget) debtTags.push("presupuesto");
  if (input.debt.missingTime) debtTags.push("tiempo");
  if (input.debt.missingQuality) debtTags.push("calidad");
  if (input.debt.missingRiskCap) debtTags.push("tope de riesgo");

  const narrativeSeverity = getNarrativeSeverity(input.debt, input.luckEvent);

  const explanationDetails: string[] = [];
  if (debtTags.length > 0) {
    explanationDetails.push(`Requisitos incumplidos: ${debtTags.join(", ")}.`);
  }
  if (input.incidentLabel) {
    explanationDetails.push(input.incidentLabel);
  }
  if (input.luckEvent) {
    explanationDetails.push(`Suerte: ${input.luckEvent.label}.`);
  }

  const debtText = debtTags.length > 0 ? ` Deuda activada: ${debtTags.join(", ")}.` : "";
  const incidentText = input.incidentLabel ? ` ${input.incidentLabel}.` : "";
  const luckText = input.luckEvent ? ` Suerte: ${input.luckEvent.label}.` : "";

  return {
    narrativeSeverity,
    logEntry: {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      turnNumber: input.turnNumber,
      actorName: input.actorName,
      actorType: "ally",
      text: `${input.actorName} uso ${input.actionTitle}. ${input.actionNarrative}${debtText}${incidentText}${luckText}`,
      glossaryKeys: input.glossaryKeys,
      category: input.debt.hasDebt ? "warning" : "action",
      narrativeSeverity,
      explanationPayload:
        explanationDetails.length > 0
          ? {
              title: "Impacto de la decision",
              details: explanationDetails,
            }
          : undefined,
      timestamp: Date.now(),
    },
  };
}

export function resolveDecision(input: {
  project: ProjectStats;
  team: TeamMember[];
  enemies: EnemyUnit[];
  actorId: string;
  action: DecisionOption;
  targetEnemyId: string;
  turnNumber: number;
}): ResolutionResult {
  const actor = input.team.find((member) => member.id === input.actorId);

  if (!actor || actor.status === "out") {
    throw new Error("Actor invalido para resolver accion.");
  }

  const debt = resolveRequirementDebt(input.project, input.action.requirements);
  const multiplier = getEffectiveMultiplier(actor, input.action);
  let incidentLabel: string | null = null;

  let project = applyProjectDelta(
    input.project,
    scaleProjectDelta(input.action.baseEffects.project, multiplier),
  );
  let team = applyActorDelta(input.team, actor.id, input.action.baseEffects.actor);
  
  const enemyResult = applyEnemyDelta(
    input.enemies,
    input.action.baseEffects,
    input.targetEnemyId,
    multiplier,
  );
  let enemies = enemyResult.enemies;
  let totalEnemiesKilled = enemyResult.enemiesKilled;

  // Apply stress to actor based on damage dealt to enemies (33% of effective damage)
  const baseTargetDamage = input.action.baseEffects.targetEnemy?.hp ?? 0;
  const baseAllEnemiesDamage = input.action.baseEffects.allEnemies?.hp ?? 0;
  const effectiveDamage =
    baseTargetDamage * multiplier * 5 +
    baseAllEnemiesDamage * 5;
  if (effectiveDamage < 0) {
    const stressPenalty = Math.round(Math.abs(effectiveDamage) / 3);
    team = applyActorDelta(team, actor.id, { stress: stressPenalty });
  }

  if (debt.hasDebt) {
    const debtState = applyDebtPenalty(project, team, actor.id, debt);
    project = debtState.project;
    team = debtState.team;
    incidentLabel = debtState.incidentLabel;

    if (input.action.debtEffects) {
      project = applyProjectDelta(project, input.action.debtEffects.project ?? {});
      team = applyActorDelta(team, actor.id, input.action.debtEffects.actor);
      const debtEnemyResult = applyEnemyDelta(enemies, input.action.debtEffects, input.targetEnemyId, 1);
      enemies = debtEnemyResult.enemies;
      totalEnemiesKilled += debtEnemyResult.enemiesKilled;
      
      // Apply stress for debt damage (33%)
      const debtTargetDamage = input.action.debtEffects.targetEnemy?.hp ?? 0;
      const debtAllEnemiesDamage = input.action.debtEffects.allEnemies?.hp ?? 0;
      const effectiveDebtDamage = debtTargetDamage * 5 + debtAllEnemiesDamage * 5;
      if (effectiveDebtDamage < 0) {
        const debtStressPenalty = Math.round(Math.abs(effectiveDebtDamage) / 3);
        team = applyActorDelta(team, actor.id, { stress: debtStressPenalty });
      }
    }
  }

  const luckEvent = rollLuck(project, team);
  if (luckEvent) {
    project = applyProjectDelta(project, luckEvent.effects.project ?? {});
    team = applyActorDelta(team, actor.id, luckEvent.effects.actor);
    const luckEnemyResult = applyEnemyDelta(enemies, luckEvent.effects, input.targetEnemyId, 1);
    enemies = luckEnemyResult.enemies;
    totalEnemiesKilled += luckEnemyResult.enemiesKilled;
    
    // Apply stress for luck damage (33%)
    const luckTargetDamage = luckEvent.effects.targetEnemy?.hp ?? 0;
    const luckAllEnemiesDamage = luckEvent.effects.allEnemies?.hp ?? 0;
    const effectiveLuckDamage = luckTargetDamage * 5 + luckAllEnemiesDamage * 5;
    if (effectiveLuckDamage < 0) {
      const luckStressPenalty = Math.round(Math.abs(effectiveLuckDamage) / 3);
      team = applyActorDelta(team, actor.id, { stress: luckStressPenalty });
    }
  }

  // Reduce stress by 5 for each enemy killed
  if (totalEnemiesKilled > 0) {
    team = team.map((member) => ({
      ...member,
      stress: clamp(member.stress - (5 * totalEnemiesKilled), 0, member.maxStress),
    }));
  }

  const { logEntry, narrativeSeverity } = buildResolutionLog({
    actorName: actor.name,
    actionTitle: input.action.title,
    actionNarrative: input.action.narrativeResult,
    glossaryKeys: input.action.glossaryKeys,
    turnNumber: input.turnNumber,
    debt,
    luckEvent,
    incidentLabel,
  });

  return {
    project,
    team,
    enemies,
    logEntry,
    debt,
    luckEvent,
    narrativeSeverity,
    incidentLabel,
  };
}
