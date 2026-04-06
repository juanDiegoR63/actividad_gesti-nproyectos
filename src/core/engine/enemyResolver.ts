import type {
  EnemyIntent,
  EnemyIntentType,
  EnemySeed,
  EnemyUnit,
  ProjectStats,
  TeamMember,
} from "../../types/game";

const INTENT_LIBRARY: Record<EnemyIntentType, EnemyIntent> = {
  scope_pressure: {
    type: "scope_pressure",
    label: "Presion de alcance",
    previewText: "Intentara imponer cambios sin cerrar linea base.",
    expectedEffects: { risk: 5, progress: -2 },
    telegraphLevel: "clear",
  },
  budget_burn: {
    type: "budget_burn",
    label: "Consumo de presupuesto",
    previewText: "Forzara costos extra para resolver urgencias.",
    expectedEffects: { budget: -4, risk: 2 },
    telegraphLevel: "clear",
  },
  delay: {
    type: "delay",
    label: "Demora operativa",
    previewText: "Intentara retrasar cronograma.",
    expectedEffects: { time: -2, risk: 2 },
    telegraphLevel: "clear",
  },
  quality_attack: {
    type: "quality_attack",
    label: "Ataque a calidad",
    previewText: "Presionara para aceptar entregables inseguros.",
    expectedEffects: { quality: -4, risk: 3 },
    telegraphLevel: "partial",
  },
  risk_spike: {
    type: "risk_spike",
    label: "Escalada de riesgo",
    previewText: "Elevara incertidumbre con cambios abruptos.",
    expectedEffects: { risk: 7 },
    telegraphLevel: "clear",
  },
  compliance_gate: {
    type: "compliance_gate",
    label: "Puerta de cumplimiento",
    previewText: "Pedira evidencia formal antes de avanzar.",
    expectedEffects: { progress: -3, time: -1 },
    telegraphLevel: "partial",
  },
  rework: {
    type: "rework",
    label: "Retrabajo",
    previewText: "Forzara rehacer entregables ya aprobados.",
    expectedEffects: { budget: -3, quality: -2, risk: 2 },
    telegraphLevel: "partial",
  },
  stakeholder_noise: {
    type: "stakeholder_noise",
    label: "Ruido politico",
    previewText: "Generara prioridades conflictivas.",
    expectedEffects: { risk: 3, progress: -1 },
    telegraphLevel: "clear",
  },
};

export function buildEnemyFromSeed(seed: EnemySeed): EnemyUnit {
  return {
    id: seed.id,
    name: seed.name,
    type: seed.type,
    hp: seed.hp,
    maxHp: seed.hp,
    threat: seed.threat,
    tags: seed.tags,
    intent: INTENT_LIBRARY[seed.intents[0]] ?? null,
  };
}

function pickIntentType(enemy: EnemyUnit, project: ProjectStats): EnemyIntentType {
  if (enemy.type === "boss") {
    return pickBossIntentType(enemy, project);
  }

  if (project.risk > 60) {
    return "risk_spike";
  }

  if (project.quality < 50) {
    return "quality_attack";
  }

  if (project.time < 35) {
    return "delay";
  }

  return "stakeholder_noise";
}

function pickBossIntentType(enemy: EnemyUnit, project: ProjectStats): EnemyIntentType {
  const hpRatio = enemy.hp / enemy.maxHp;

  if (hpRatio <= 0.2) {
    return "compliance_gate";
  }

  if (hpRatio <= 0.45) {
    return project.risk > 55 ? "risk_spike" : "scope_pressure";
  }

  if (hpRatio <= 0.75) {
    return project.time < 40 ? "delay" : "scope_pressure";
  }

  return "scope_pressure";
}

export function computeEnemyIntent(
  enemy: EnemyUnit,
  project: ProjectStats,
): EnemyIntent {
  return INTENT_LIBRARY[pickIntentType(enemy, project)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveEnemyIntent(
  project: ProjectStats,
  team: TeamMember[],
  enemy: EnemyUnit,
): {
  project: ProjectStats;
  team: TeamMember[];
  logText: string;
} {
  const intent = enemy.intent ?? INTENT_LIBRARY.scope_pressure;

  const updatedProject: ProjectStats = {
    ...project,
    budget: clamp(project.budget + (intent.expectedEffects.budget ?? 0), 0, project.maxBudget),
    time: clamp(project.time + (intent.expectedEffects.time ?? 0), 0, project.maxTime),
    quality: clamp(
      project.quality + (intent.expectedEffects.quality ?? 0),
      0,
      project.maxQuality,
    ),
    risk: clamp(project.risk + (intent.expectedEffects.risk ?? 0), 0, project.maxRisk),
    progress: clamp(
      project.progress + (intent.expectedEffects.progress ?? 0),
      0,
      project.maxProgress,
    ),
  };

  const activeMembers = team.filter((member) => member.status !== "out");
  const sortedByStress = [...activeMembers].sort((a, b) => b.stress - a.stress);
  const target = sortedByStress[0];

  const updatedTeam = team.map((member) => {
    if (!target || member.id !== target.id) {
      return member;
    }

    const nextStress = clamp(member.stress + 8, 0, member.maxStress);
    const nextEnergy = clamp(member.energy - 6, 0, member.maxEnergy);

    return {
      ...member,
      stress: nextStress,
      energy: nextEnergy,
      status: nextEnergy <= 0 ? "out" : member.status,
    };
  });

  return {
    project: updatedProject,
    team: updatedTeam,
    logText: `${enemy.name} ejecuta ${intent.label}. ${intent.previewText}`,
  };
}
