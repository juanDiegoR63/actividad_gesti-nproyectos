import type {
  EnemyIntent,
  EnemyIntentContext,
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
    expectedEffects: { budget: -2, risk: 2 },
    telegraphLevel: "clear",
  },
  delay: {
    type: "delay",
    label: "Demora operativa",
    previewText: "Intentara retrasar cronograma.",
    expectedEffects: { time: -1, risk: 2 },
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
    expectedEffects: { budget: -2, quality: -2, risk: 2 },
    telegraphLevel: "partial",
  },
  stakeholder_noise: {
    type: "stakeholder_noise",
    label: "Ruido politico",
    previewText: "Generara prioridades conflictivas.",
    expectedEffects: { risk: 3, progress: -1 },
    telegraphLevel: "clear",
  },
  approval_freeze: {
    type: "approval_freeze",
    label: "Congelamiento de aprobaciones",
    previewText: "Detendra validaciones hasta recibir evidencia adicional.",
    expectedEffects: { progress: -4, time: -1, risk: 1 },
    telegraphLevel: "partial",
  },
  vendor_failure: {
    type: "vendor_failure",
    label: "Fallo de proveedor",
    previewText: "Generara retrazo y sobrecosto por incumplimientos externos.",
    expectedEffects: { budget: -2, time: -2, risk: 3 },
    telegraphLevel: "clear",
  },
  staff_loss: {
    type: "staff_loss",
    label: "Perdida de capacidad",
    previewText: "Forzara salida temporal de conocimiento critico del equipo.",
    expectedEffects: { quality: -2, progress: -2, risk: 3 },
    telegraphLevel: "partial",
  },
  misalignment: {
    type: "misalignment",
    label: "Desalineacion transversal",
    previewText: "Abrira brechas entre decisiones de negocio y ejecucion.",
    expectedEffects: { risk: 4, progress: -2 },
    telegraphLevel: "clear",
  },
  audit_ping: {
    type: "audit_ping",
    label: "Ping de auditoria",
    previewText: "Exigira trazabilidad inmediata y frenara flujo operativo.",
    expectedEffects: { time: -1, progress: -2, risk: 2 },
    telegraphLevel: "partial",
  },
  shadow_scope: {
    type: "shadow_scope",
    label: "Alcance en sombra",
    previewText: "Introducira trabajo no autorizado fuera del control formal.",
    expectedEffects: { risk: 6, progress: -3, budget: -1 },
    telegraphLevel: "partial",
  },
  passive_penalty: {
    type: "passive_penalty",
    label: "Castigo por pasividad",
    previewText: "Escalara por inaccion y convertira silencio en costo real.",
    expectedEffects: { time: -1, risk: 5, progress: -2 },
    telegraphLevel: "clear",
  },
};

const TEAM_PRESSURE_BY_INTENT: Record<EnemyIntentType, { stress: number; energyLoss: number }> = {
  scope_pressure: { stress: 3, energyLoss: 1 },
  budget_burn: { stress: 3, energyLoss: 1 },
  delay: { stress: 4, energyLoss: 1 },
  quality_attack: { stress: 4, energyLoss: 1 },
  risk_spike: { stress: 5, energyLoss: 1 },
  compliance_gate: { stress: 4, energyLoss: 1 },
  rework: { stress: 4, energyLoss: 1 },
  stakeholder_noise: { stress: 3, energyLoss: 1 },
  approval_freeze: { stress: 5, energyLoss: 1 },
  vendor_failure: { stress: 5, energyLoss: 2 },
  staff_loss: { stress: 6, energyLoss: 2 },
  misalignment: { stress: 4, energyLoss: 1 },
  audit_ping: { stress: 4, energyLoss: 1 },
  shadow_scope: { stress: 5, energyLoss: 2 },
  passive_penalty: { stress: 6, energyLoss: 2 },
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

function hasAnyTag(enemy: EnemyUnit, tags: string[]): boolean {
  return tags.some((tag) => enemy.tags.includes(tag));
}

function pickContextDrivenIntent(
  enemy: EnemyUnit,
  project: ProjectStats,
  context: EnemyIntentContext,
): EnemyIntentType | null {
  const passiveCount = context.passiveCount ?? 0;
  const debtChainCount = context.debtChainCount ?? 0;
  const roundNumber = context.roundNumber ?? 1;

  if (passiveCount >= 3 && hasAnyTag(enemy, ["pressure", "stakeholder", "sponsor"])) {
    return "passive_penalty";
  }

  if (debtChainCount >= 1 && hasAnyTag(enemy, ["scope", "pressure", "sponsor"])) {
    return "shadow_scope";
  }

  if (hasAnyTag(enemy, ["supplier", "vendor", "provider"])) {
    return project.time < 60 ? "vendor_failure" : "budget_burn";
  }

  if (hasAnyTag(enemy, ["compliance", "audit", "gatekeeper"])) {
    return project.progress > 35 ? "approval_freeze" : "audit_ping";
  }

  if (roundNumber >= 3 && hasAnyTag(enemy, ["support", "institutional"]) && project.risk > 45) {
    return "misalignment";
  }

  return null;
}

function pickThresholdDrivenIntent(enemy: EnemyUnit, project: ProjectStats): EnemyIntentType {
  if (project.risk > 70) {
    return "risk_spike";
  }

  if (project.quality < 50) {
    return "quality_attack";
  }

  if (project.time < 35) {
    return "delay";
  }

  if (project.progress > 65 && hasAnyTag(enemy, ["scope", "pressure"])) {
    return "shadow_scope";
  }

  return hasAnyTag(enemy, ["pressure", "scope"]) ? "scope_pressure" : "stakeholder_noise";
}

function pickIntentType(
  enemy: EnemyUnit,
  project: ProjectStats,
  context: EnemyIntentContext,
): EnemyIntentType {
  if (enemy.type === "boss") {
    return pickBossIntentType(enemy, project, context);
  }

  const contextIntent = pickContextDrivenIntent(enemy, project, context);
  if (contextIntent) {
    return contextIntent;
  }

  return pickThresholdDrivenIntent(enemy, project);
}

function pickBossIntentType(
  enemy: EnemyUnit,
  project: ProjectStats,
  context: EnemyIntentContext,
): EnemyIntentType {
  const hpRatio = enemy.hp / enemy.maxHp;
  const passiveCount = context.passiveCount ?? 0;
  const debtChainCount = context.debtChainCount ?? 0;
  const roundNumber = context.roundNumber ?? 1;

  if (passiveCount >= 3) {
    return "passive_penalty";
  }

  if (debtChainCount >= 1 && hpRatio > 0.25) {
    return "shadow_scope";
  }

  if (hpRatio <= 0.18) {
    return project.risk > 70 ? "shadow_scope" : "compliance_gate";
  }

  if (hpRatio <= 0.4) {
    return project.risk > 55 ? "risk_spike" : "scope_pressure";
  }

  if (hpRatio <= 0.7) {
    return project.time < 40 ? "delay" : "approval_freeze";
  }

  if (roundNumber >= 4 && project.progress > 40) {
    return "approval_freeze";
  }

  return "scope_pressure";
}

export function computeEnemyIntent(
  enemy: EnemyUnit,
  project: ProjectStats,
  context: EnemyIntentContext = {},
): EnemyIntent {
  return INTENT_LIBRARY[pickIntentType(enemy, project, context)];
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
  const teamPressure = TEAM_PRESSURE_BY_INTENT[intent.type] ?? TEAM_PRESSURE_BY_INTENT.scope_pressure;

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
    if (member.id !== target?.id) {
      return member;
    }

    const nextStress = clamp(member.stress + teamPressure.stress, 0, member.maxStress);
    const nextEnergy = clamp(member.energy - teamPressure.energyLoss, 0, member.maxEnergy);

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
