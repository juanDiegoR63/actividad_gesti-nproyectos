import { create } from "zustand";
import { BALANCE } from "../config/balance";
import { resolveDecision } from "../engine/decisionResolver";
import {
  buildEnemyFromSeed,
  computeEnemyIntent,
  resolveEnemyIntent,
} from "../engine/enemyResolver";
import { resolveNarrativeIncident } from "../engine/incidentResolver";
import { computeFinalScore, type FinalScoreResult } from "../engine/scoringResolver";
import { applyCoverage, hireReplacement } from "../engine/staffingResolver";
import {
  findActingMember,
  getNextTurnToken,
  getStartingTurnToken,
} from "../engine/turnEngine";
import { actionById } from "../../data/actions";
import {
  cloneCosmetic,
  DEFAULT_ROLE_COSMETICS,
} from "../../data/characterCosmetics";
import { phases } from "../../data/phases";
import { getScenarioById, pickRandomScenario } from "../../data/scenarios";
import type {
  BattleStatus,
  CharacterRole,
  DecisionOption,
  DecisionEffects,
  EnemyIntentContext,
  EnemyVisual,
  EnemySeed,
  EnemyUnit,
  EncounterDefinition,
  LogEntry,
  NarrativeIncident,
  ProjectScenario,
  ProjectStats,
  ProjectResourceKey,
  RunScreen,
  StartRunPayload,
  StaffingCrisisEvent,
  StaffingCrisisSource,
  StaffingDismissalRecord,
  TeamMember,
  LuckEventPolarity,
  TurnToken,
} from "../../types/game";

const ROLE_ORDER: CharacterRole[] = ["director", "planning", "quality"];
type BaseDismissalTracker = Record<CharacterRole, boolean>;

const ROLE_LABELS: Record<CharacterRole, string> = {
  director: "Director",
  planning: "Planning",
  quality: "Calidad",
};

const DISMISSAL_CAUSE_LABELS: Record<StaffingDismissalRecord["cause"], string> = {
  energy_collapse: "agotamiento energetico",
  stress_resignation: "renuncia por estres excesivo",
  disciplinary_exit: "sancion disciplinaria",
  incident_impact: "impacto de incidente",
  unknown: "causa operativa",
};

const DEFAULT_NAMES: Record<CharacterRole, string> = {
  director: "Director",
  planning: "Planning",
  quality: "Calidad",
};

const ENEMY_ADJECTIVES = ["Adaptativo", "Ofensivo", "Preciso", "Tenaz"];
const BOSS_ADJECTIVES = ["Veterano", "Dominante", "Temible", "Estratega"];
const ENEMY_HP_SCALE = 0.72;
const BOSS_HP_SCALE = 0.78;
const THREAT_SCALE = 0.9;
const RECKLESS_ACTION_IDS = [
  "improvise_scope",
  "skip_dependency_review",
  "bypass_quality_gate",
];

const ENEMY_VISUAL_PRESETS: EnemyVisual[] = [
  {
    bodyColor: 0x7f1d1d,
    headColor: 0xe7b88b,
    accentColor: 0xfb7185,
    eyeColor: 0x111827,
    mark: "scar",
  },
  {
    bodyColor: 0x0f766e,
    headColor: 0xf2c59d,
    accentColor: 0x2dd4bf,
    eyeColor: 0x0f172a,
    mark: "visor",
  },
  {
    bodyColor: 0x334155,
    headColor: 0xf5d0a9,
    accentColor: 0x94a3b8,
    eyeColor: 0x111827,
    mark: "visor",
  },
  {
    bodyColor: 0x365314,
    headColor: 0xe7b88b,
    accentColor: 0xa3e635,
    eyeColor: 0x1f2937,
    mark: "scar",
  },
  {
    bodyColor: 0x1d4ed8,
    headColor: 0xf2c59d,
    accentColor: 0x93c5fd,
    eyeColor: 0x0f172a,
    mark: "mask",
  },
  {
    bodyColor: 0x9f1239,
    headColor: 0xf5d0a9,
    accentColor: 0xf97316,
    eyeColor: 0x111827,
    mark: "visor",
  },
];

const BOSS_VISUAL_PRESETS: EnemyVisual[] = [
  {
    bodyColor: 0x7c2d12,
    headColor: 0xe7b88b,
    accentColor: 0xf59e0b,
    eyeColor: 0xfee2e2,
    mark: "horns",
  },
  {
    bodyColor: 0x4c0519,
    headColor: 0xd9a070,
    accentColor: 0xf97316,
    eyeColor: 0xfee2e2,
    mark: "mask",
  },
  {
    bodyColor: 0x1e1b4b,
    headColor: 0xe7b88b,
    accentColor: 0xc4b5fd,
    eyeColor: 0xe2e8f0,
    mark: "horns",
  },
  {
    bodyColor: 0x134e4a,
    headColor: 0xf2c59d,
    accentColor: 0x2dd4bf,
    eyeColor: 0xe2e8f0,
    mark: "scar",
  },
  {
    bodyColor: 0x7f1d1d,
    headColor: 0xf2c59d,
    accentColor: 0xfb923c,
    eyeColor: 0xfee2e2,
    mark: "visor",
  },
];

const TOTAL_ENCOUNTERS = phases.reduce((acc, phase) => acc + phase.encounters.length, 0);
const ENCOUNTER_PROGRESS_REWARD = Math.max(5, Math.round(100 / Math.max(1, TOTAL_ENCOUNTERS)));

const ENEMY_SEED_POOL: EnemySeed[] = phases.flatMap((phase) =>
  phase.encounters.flatMap((encounter) =>
    encounter.enemies.filter((seed) => seed.type !== "boss"),
  ),
);

const BOSS_SEED_POOL: EnemySeed[] = phases.flatMap((phase) =>
  phase.encounters.flatMap((encounter) => encounter.enemies.filter((seed) => seed.type === "boss")),
);

const BUDGET_PRESSURE_TAGS = new Set([
  "supplier",
  "vendor",
  "provider",
  "sponsor",
  "compliance",
  "audit",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function scaleProjectPenaltyByKey(key: ProjectResourceKey, value: number): number {
  const multiplier = BALANCE.combat.penaltySeverityMultiplier;

  if (multiplier === 1 || value === 0) {
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

function scalePositivePenalty(value: number): number {
  if (value <= 0) {
    return value;
  }

  return round2(value * BALANCE.combat.penaltySeverityMultiplier);
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

function applyStressToToken(team: TeamMember[], token: TurnToken, stressDelta: number): TeamMember[] {
  if (token === "enemy" || stressDelta === 0) {
    return team;
  }

  return team.map((member) => {
    if (member.assignedRole !== token || member.status === "out") {
      return member;
    }

    return {
      ...member,
      stress: clamp(member.stress + stressDelta, 0, member.maxStress),
    };
  });
}

function buildEnemyIntentContext(input: {
  encounter: EncounterDefinition | null;
  phaseIndex: number;
  roundNumber: number;
  passiveCount: number;
  chainApplied: boolean;
}): EnemyIntentContext {
  return {
    encounterId: input.encounter?.id,
    phaseIndex: input.phaseIndex,
    roundNumber: input.roundNumber,
    passiveCount: input.passiveCount,
    debtChainCount: input.chainApplied ? 1 : 0,
  };
}

function hasStrongIntent(enemies: EnemyUnit[]): boolean {
  const pressureRules = BALANCE.combat.encounterPressure;

  return enemies.some((enemy) => {
    if (enemy.hp <= 0 || !enemy.intent) {
      return false;
    }

    const riskHit = enemy.intent.expectedEffects.risk ?? 0;
    const timeHit = enemy.intent.expectedEffects.time ?? 0;

    return (
      riskHit >= pressureRules.strongIntentRiskThreshold ||
      timeHit <= pressureRules.strongIntentTimeThreshold ||
      enemy.intent.type === "shadow_scope" ||
      enemy.intent.type === "passive_penalty" ||
      enemy.intent.type === "vendor_failure" ||
      enemy.intent.type === "critical_defect" ||
      enemy.intent.type === "funding_cut" ||
      enemy.intent.type === "multi_front_escalation"
    );
  });
}

function hasBudgetPressureEnemies(enemies: EnemyUnit[]): boolean {
  return enemies.some(
    (enemy) =>
      enemy.hp > 0 && enemy.tags.some((tag) => BUDGET_PRESSURE_TAGS.has(tag)),
  );
}

function randomItem<T>(items: T[], fallback: T): T {
  if (!items.length) {
    return fallback;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? fallback;
}

function randomizeValue(base: number, variance: number, minValue: number): number {
  const offset = (Math.random() * 2 - 1) * variance;
  const randomized = Math.round(base * (1 + offset));
  return Math.max(minValue, randomized);
}

function applyStressResignations(team: TeamMember[]): TeamMember[] {
  return team.map((member) => {
    if (member.status === "out") {
      return member;
    }

    if (member.stress < member.maxStress) {
      return member;
    }

    return {
      ...member,
      status: "out",
    };
  });
}

function getRandomEnemyVisual(isBoss: boolean): EnemyVisual {
  const presets = isBoss ? BOSS_VISUAL_PRESETS : ENEMY_VISUAL_PRESETS;
  return randomItem(presets, presets[0]);
}

function getNaturalEnemyPool(seed: EnemySeed, isBossSlot: boolean): EnemySeed[] {
  const basePool = isBossSlot ? BOSS_SEED_POOL : ENEMY_SEED_POOL;
  const sameType = basePool.filter((candidate) => candidate.type === seed.type);
  const sameTagFamily = sameType.filter((candidate) =>
    candidate.tags.some((tag) => seed.tags.includes(tag)),
  );

  if (sameTagFamily.length >= 2) {
    return sameTagFamily;
  }

  if (sameType.length >= 2) {
    return sameType;
  }

  return basePool;
}

function getRandomizedEnemySeed(
  seed: EnemySeed,
  encounter: EncounterDefinition,
  index: number,
): EnemySeed {
  const isBossSlot = encounter.isBoss || seed.type === "boss";
  const pool = getNaturalEnemyPool(seed, isBossSlot);
  const picked = randomItem(pool, seed);

  const hpBase = Math.round(picked.hp * (isBossSlot ? BOSS_HP_SCALE : ENEMY_HP_SCALE));
  const hp = randomizeValue(hpBase, isBossSlot ? 0.09 : 0.15, isBossSlot ? 90 : 34);
  const threat = randomizeValue(
    Math.max(1, Math.round(picked.threat * THREAT_SCALE)),
    isBossSlot ? 0.12 : 0.2,
    isBossSlot ? 8 : 3,
  );
  const adjective = randomItem(
    isBossSlot ? BOSS_ADJECTIVES : ENEMY_ADJECTIVES,
    "Variable",
  );

  return {
    ...picked,
    id: `${encounter.id}-${index}-${picked.id}-${Math.floor(Math.random() * 10000)}`,
    name: `${picked.name} ${adjective}`,
    hp,
    threat,
    tags: [...picked.tags],
    intents: [...picked.intents],
  };
}

function createInitialProject(): ProjectStats {
  return {
    budget: BALANCE.project.budgetStart,
    maxBudget: BALANCE.project.maxBudget,
    time: BALANCE.project.timeStart,
    maxTime: BALANCE.project.maxTime,
    quality: BALANCE.project.qualityStart,
    maxQuality: BALANCE.project.maxQuality,
    risk: BALANCE.project.riskStart,
    maxRisk: BALANCE.project.maxRisk,
    progress: BALANCE.project.progressStart,
    maxProgress: BALANCE.project.maxProgress,
  };
}

function createInitialTeam(payload?: StartRunPayload): TeamMember[] {
  return ROLE_ORDER.map((role) => {
    const cosmetic = payload?.cosmetics?.[role]
      ? cloneCosmetic(payload.cosmetics[role])
      : cloneCosmetic(DEFAULT_ROLE_COSMETICS[role]);

    return {
      id: `member-${role}`,
      name: payload?.members[role]?.trim() || DEFAULT_NAMES[role],
      role,
      isBaseMember: true,
      assignedRole: role,
      cosmetic,
      energy: BALANCE.team.energyStart,
      maxEnergy: BALANCE.team.maxEnergy,
      stress: BALANCE.team.stressStart,
      maxStress: BALANCE.team.maxStress,
      salary: BALANCE.team.salaryByRole[role],
      status: "active",
      recklessDecisionCount: 0,
      decisionDebtCount: 0,
      disciplinaryStrikes: 0,
    };
  });
}

function createInitialBaseDismissalTracker(): BaseDismissalTracker {
  return {
    director: false,
    planning: false,
    quality: false,
  };
}

function markBaseDismissals(
  previousTeam: TeamMember[],
  nextTeam: TeamMember[],
  tracker: BaseDismissalTracker,
): BaseDismissalTracker {
  const previousById = new Map(previousTeam.map((member) => [member.id, member]));
  const nextTracker: BaseDismissalTracker = { ...tracker };

  for (const member of nextTeam) {
    const previous = previousById.get(member.id);
    if (!previous || previous.status === "out" || member.status !== "out") {
      continue;
    }

    if (!previous.isBaseMember) {
      continue;
    }

    nextTracker[previous.role] = true;
  }

  return nextTracker;
}

function allBaseMembersDismissedAtLeastOnce(tracker: BaseDismissalTracker): boolean {
  return ROLE_ORDER.every((role) => tracker[role]);
}

function applyPhaseSalary(project: ProjectStats, team: TeamMember[]): ProjectStats {
  const phaseCost = team.reduce((acc, member) => acc + member.salary, 0);
  return {
    ...project,
    budget: clamp(project.budget - phaseCost, 0, project.maxBudget),
  };
}

function applyEncounterCompletionReward(
  project: ProjectStats,
  encounter: EncounterDefinition | null,
): ProjectStats {
  const reward = encounter?.isBoss
    ? {
        budget: 20,
        time: 14,
        quality: 4,
        risk: -4,
        progress: ENCOUNTER_PROGRESS_REWARD,
      }
    : {
        budget: 12,
        time: 8,
        quality: 2,
        risk: -2,
        progress: ENCOUNTER_PROGRESS_REWARD,
      };

  return applyProjectDelta(project, reward);
}

function hydrateEncounter(
  encounter: EncounterDefinition,
  project: ProjectStats,
  context: EnemyIntentContext = {},
): EnemyUnit[] {
  return encounter.enemies.map((seed, index) => {
    const randomizedSeed = getRandomizedEnemySeed(seed, encounter, index);
    const base = buildEnemyFromSeed(randomizedSeed);
    const visual = getRandomEnemyVisual(base.type === "boss");

    return {
      ...base,
      visual,
      intent: computeEnemyIntent(base, project, context),
    };
  });
}

function getScenarioPhaseOverride(
  scenario: ProjectScenario | null,
  phaseId?: string,
) {
  if (!scenario || !phaseId) {
    return null;
  }

  return scenario.phaseOverrides?.[phaseId] ?? null;
}

function getPhaseTitle(phaseIndex: number, scenario: ProjectScenario | null): string {
  const phase = phases[phaseIndex];
  if (!phase) {
    return `Fase ${phaseIndex + 1}`;
  }

  return getScenarioPhaseOverride(scenario, phase.id)?.title ?? phase.title;
}

function getPhaseIntroNarrative(phaseIndex: number, scenario: ProjectScenario | null): string {
  const phase = phases[phaseIndex];
  if (!phase) {
    return "";
  }

  return getScenarioPhaseOverride(scenario, phase.id)?.introNarrative ?? phase.introNarrative;
}

function getEncounter(
  phaseIndex: number,
  encounterIndex: number,
  scenario: ProjectScenario | null,
): EncounterDefinition | null {
  const phase = phases[phaseIndex];
  if (!phase) {
    return null;
  }

  const baseEncounter = phase.encounters[encounterIndex] ?? null;
  if (!baseEncounter) {
    return null;
  }

  const encounterOverride = getScenarioPhaseOverride(scenario, phase.id)?.encounterOverrides?.[
    baseEncounter.id
  ];

  if (!encounterOverride) {
    return baseEncounter;
  }

  return {
    ...baseEncounter,
    ...encounterOverride,
  };
}

function getAvailableActions(
  token: TurnToken,
  encounter: EncounterDefinition | null,
  scenario: ProjectScenario | null,
): DecisionOption[] {
  if (!encounter || token === "enemy") {
    return [];
  }

  const actionOverrides = getScenarioPhaseOverride(scenario, encounter.phaseId)?.actionOverrides ?? {};

  const actionIds = [
    ...new Set(["hold_position", ...encounter.actionPoolId, ...RECKLESS_ACTION_IDS]),
  ];

  const options = actionIds
    .map((id) => {
      const option = actionById[id];
      if (!option) {
        return null;
      }

      const override = actionOverrides[id];
      if (!override) {
        return option;
      }

      return {
        ...option,
        ...override,
      };
    })
    .filter(
      (option): option is DecisionOption =>
        Boolean(option) && (option.actorRole === "any" || option.actorRole === token),
    );

  const recklessOption = options.find((option) => option.tags.includes("reckless")) ?? null;
  const regularOptions = options
    .filter((option) => !option.tags.includes("reckless"))
    .slice(0, BALANCE.combat.maxActionsPerTurn - (recklessOption ? 1 : 0));

  const finalOptions = recklessOption
    ? [...regularOptions, recklessOption]
    : regularOptions.slice(0, BALANCE.combat.maxActionsPerTurn);

  if (finalOptions.length) {
    return finalOptions;
  }

  const fallback = actionById.hold_position;
  if (!fallback) {
    return [];
  }

  const override = actionOverrides.hold_position;
  return [{ ...fallback, ...override }];
}

function applyIncidentActorDelta(
  team: TeamMember[],
  token: TurnToken,
  actorDelta?: DecisionEffects["actor"],
): TeamMember[] {
  if (!actorDelta || token === "enemy") {
    return team;
  }

  return team.map((member) => {
    if (member.assignedRole !== token || member.status === "out") {
      return member;
    }

    const energyDelta = actorDelta.energy ?? 0;
    const stressDelta = actorDelta.stress ?? 0;

    return {
      ...member,
      energy: clamp(member.energy + energyDelta, 0, member.maxEnergy),
      stress: clamp(member.stress + stressDelta, 0, member.maxStress),
      status: member.energy + energyDelta <= 0 ? "out" : member.status,
    };
  });
}

function applyIncidentEnemyDelta(
  enemies: EnemyUnit[],
  effects: DecisionEffects,
): EnemyUnit[] {
  if (!effects.targetEnemy && !effects.allEnemies) {
    return enemies;
  }

  const targetEnemyId = [...enemies]
    .filter((enemy) => enemy.hp > 0)
    .sort((a, b) => b.threat - a.threat)[0]?.id;

  return enemies.map((enemy) => {
    let hpDelta = 0;
    let threatDelta = 0;

    if (effects.targetEnemy && enemy.id === targetEnemyId) {
      hpDelta += effects.targetEnemy.hp ?? 0;
      threatDelta += effects.targetEnemy.threat ?? 0;
    }

    if (effects.allEnemies) {
      hpDelta += effects.allEnemies.hp ?? 0;
      threatDelta += effects.allEnemies.threat ?? 0;
    }

    return {
      ...enemy,
      hp: clamp(enemy.hp + hpDelta, 0, enemy.maxHp),
      threat: clamp(enemy.threat + threatDelta, 0, 99),
    };
  });
}

function summarizeIncidentEffects(effects: DecisionEffects): string[] {
  const details: string[] = [];

  if (effects.project) {
    const projectEntries = Object.entries(effects.project)
      .filter(([, value]) => value != null && value !== 0)
      .map(([key, value]) => `${key} ${value > 0 ? "+" : ""}${value}`);

    if (projectEntries.length) {
      details.push(`Proyecto: ${projectEntries.join(", ")}.`);
    }
  }

  if (effects.actor) {
    const actorEntries = Object.entries(effects.actor)
      .filter(([, value]) => value != null && value !== 0)
      .map(([key, value]) => `${key} ${value > 0 ? "+" : ""}${value}`);

    if (actorEntries.length) {
      details.push(`Actor: ${actorEntries.join(", ")}.`);
    }
  }

  if (effects.targetEnemy || effects.allEnemies) {
    details.push("Incidente con impacto directo sobre amenazas activas.");
  }

  return details;
}

function resolveScenarioIncidentState(input: {
  scenario: ProjectScenario | null;
  project: ProjectStats;
  team: TeamMember[];
  enemies: EnemyUnit[];
  encounter: EncounterDefinition | null;
  activeTurnToken: TurnToken;
  turnNumber: number;
  passiveUsesInEncounter: number;
  debtActionsThisRound: number;
  chainPenaltyAppliedInRound: boolean;
  bossClock: number;
  lastIncidentTurn: number | null;
}): {
  project: ProjectStats;
  team: TeamMember[];
  enemies: EnemyUnit[];
  logs: LogEntry[];
  incident: NarrativeIncident | null;
  lastIncidentTurn: number | null;
} {
  const incident = resolveNarrativeIncident({
    scenario: input.scenario,
    context: {
      project: input.project,
      passiveUsesInEncounter: input.passiveUsesInEncounter,
      debtActionsThisRound: input.debtActionsThisRound,
      chainPenaltyAppliedInRound: input.chainPenaltyAppliedInRound,
      bossClock: input.bossClock,
      isBossEncounter: input.encounter?.isBoss ?? false,
      turnNumber: input.turnNumber,
      lastIncidentTurn: input.lastIncidentTurn,
    },
  });

  if (!incident) {
    return {
      project: input.project,
      team: input.team,
      enemies: input.enemies,
      logs: [],
      incident: null,
      lastIncidentTurn: input.lastIncidentTurn,
    };
  }

  const project = applyProjectDelta(input.project, incident.effects.project ?? {});
  const team = applyIncidentActorDelta(input.team, input.activeTurnToken, incident.effects.actor);
  const enemies = applyIncidentEnemyDelta(input.enemies, incident.effects);
  const log = createSystemLog(
    `Incidente: ${incident.title}. ${incident.text}`,
    input.turnNumber,
    "warning",
    incident.severity,
    summarizeIncidentEffects(incident.effects),
  );

  return {
    project,
    team,
    enemies,
    logs: [log],
    incident,
    lastIncidentTurn: input.turnNumber,
  };
}

function createSystemLog(
  text: string,
  turnNumber: number,
  category: LogEntry["category"],
  narrativeSeverity: LogEntry["narrativeSeverity"] = "medium",
  details: string[] = [],
): LogEntry {
  return {
    id: `system-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    turnNumber,
    actorName: "Sistema",
    actorType: "system",
    text,
    category,
    narrativeSeverity,
    explanationPayload:
      details.length > 0
        ? {
            title: "Contexto",
            details,
          }
        : undefined,
    timestamp: Date.now(),
  };
}

type ActionPenaltyState = {
  project: ProjectStats;
  passiveUsesInEncounter: number;
  debtActionsThisRound: number;
  chainPenaltyAppliedInRound: boolean;
  enemyMomentum: number;
  logs: LogEntry[];
};

function applyActionPenaltyState(input: {
  actionId: string;
  debtTriggered: boolean;
  turnNumber: number;
  project: ProjectStats;
  passiveUsesInEncounter: number;
  debtActionsThisRound: number;
  chainPenaltyAppliedInRound: boolean;
  enemyMomentum: number;
}): ActionPenaltyState {
  let project = input.project;
  let passiveUsesInEncounter = input.passiveUsesInEncounter;
  let debtActionsThisRound = input.debtActionsThisRound;
  let chainPenaltyAppliedInRound = input.chainPenaltyAppliedInRound;
  let enemyMomentum = input.enemyMomentum;

  const logs: LogEntry[] = [];

  if (input.actionId === "hold_position") {
    passiveUsesInEncounter += 1;

    if (passiveUsesInEncounter === 1) {
      logs.push(
        createSystemLog(
          "Pausa tactica valida: baja estres, pero no genera avance directo.",
          input.turnNumber,
          "status",
          "low",
          ["Primer uso de pasividad en el encuentro."],
        ),
      );
    } else if (passiveUsesInEncounter === 2) {
      project = applyProjectDelta(project, {
        progress: scaleProjectPenaltyByKey(
          "progress",
          BALANCE.combat.passivePenalty.secondUseProject.progress,
        ),
        risk: scaleProjectPenaltyByKey(
          "risk",
          BALANCE.combat.passivePenalty.secondUseProject.risk,
        ),
      });
      logs.push(
        createSystemLog(
          "Segunda pasividad: el proyecto pierde traccion y aumenta riesgo.",
          input.turnNumber,
          "warning",
          "medium",
          ["Penalidad por repetir hold_position en el mismo encuentro."],
        ),
      );
    } else {
      project = applyProjectDelta(project, {
        time: scaleProjectPenaltyByKey(
          "time",
          BALANCE.combat.passivePenalty.thirdUseProject.time,
        ),
      });
      enemyMomentum = clamp(
        enemyMomentum + scalePositivePenalty(BALANCE.combat.passivePenalty.thirdUseMomentumGain),
        0,
        BALANCE.combat.enemyMomentum.maxStacks,
      );
      logs.push(
        createSystemLog(
          "Tercera pasividad: se pierde tiempo critico y sube la inercia enemiga.",
          input.turnNumber,
          "warning",
          "high",
          ["Penalidad severa por indecision repetida."],
        ),
      );
    }
  }

  if (input.debtTriggered) {
    debtActionsThisRound += 1;
  }

  if (
    !chainPenaltyAppliedInRound &&
    debtActionsThisRound >= BALANCE.combat.debtChainPenalty.triggerCount
  ) {
    project = applyProjectDelta(project, {
      budget: scaleProjectPenaltyByKey(
        "budget",
        BALANCE.combat.debtChainPenalty.project.budget,
      ),
      time: scaleProjectPenaltyByKey(
        "time",
        BALANCE.combat.debtChainPenalty.project.time,
      ),
      risk: scaleProjectPenaltyByKey(
        "risk",
        BALANCE.combat.debtChainPenalty.project.risk,
      ),
    });
    chainPenaltyAppliedInRound = true;
    logs.push(
      createSystemLog(
        "Espiral de deuda: dos decisiones en deuda en la ronda activan penalidad en cadena.",
        input.turnNumber,
        "warning",
        "high",
        ["Cadena de deuda: tiempo -1, presupuesto -2, riesgo +5."],
      ),
    );
  }

  return {
    project,
    passiveUsesInEncounter,
    debtActionsThisRound,
    chainPenaltyAppliedInRound,
    enemyMomentum,
    logs,
  };
}

function applyDisciplinaryConsequences(input: {
  team: TeamMember[];
  actorId: string;
  action: DecisionOption;
  project: ProjectStats;
  debtTriggered: boolean;
  turnNumber: number;
}): { team: TeamMember[]; logs: LogEntry[] } {
  const isRecklessAction = input.action.tags.includes("reckless");
  const previousById = new Map(input.team.map((member) => [member.id, member]));

  let team = input.team.map((member) => {
    if (member.status === "out") {
      return member;
    }

    const isActor = member.id === input.actorId;
    const recklessIncrement = isActor && isRecklessAction ? 1 : 0;
    const debtIncrement = isActor && input.debtTriggered ? 1 : 0;

    let recklessDecisionCount = member.recklessDecisionCount + recklessIncrement;
    let decisionDebtCount = member.decisionDebtCount + debtIncrement;
    let disciplinaryStrikes = member.disciplinaryStrikes;
    let stress = member.stress;
    let energy = member.energy;

    if (recklessIncrement) {
      stress = clamp(stress + 8, 0, member.maxStress);
      energy = clamp(energy - 5, 0, member.maxEnergy);
    }

    if (
      disciplinaryStrikes === 0 &&
      (recklessDecisionCount >= 2 || decisionDebtCount >= 3)
    ) {
      disciplinaryStrikes = 1;
      stress = clamp(stress + 8, 0, member.maxStress);
    }

    return {
      ...member,
      recklessDecisionCount,
      decisionDebtCount,
      disciplinaryStrikes,
      stress,
      energy,
      status: energy <= 0 ? "out" : member.status,
    };
  });

  const crisisAccountability = input.project.risk >= 82 || input.project.quality <= 30;
  if (crisisAccountability) {
    team = team.map((member) => {
      if (member.status === "out") {
        return member;
      }

      if (member.recklessDecisionCount < 2 && member.decisionDebtCount < 3) {
        return member;
      }

      const nextStrikes = Math.min(2, member.disciplinaryStrikes + 1);

      return {
        ...member,
        disciplinaryStrikes: nextStrikes,
        stress: clamp(member.stress + 6, 0, member.maxStress),
        status: member.energy <= 0 ? "out" : member.status,
      };
    });
  }

  team = applyStressResignations(team);

  const logs: LogEntry[] = [];

  if (isRecklessAction) {
    logs.push(
      createSystemLog(
        `Decision temeraria detectada: ${input.action.title}. Se abre evaluacion de desempeno.`,
        input.turnNumber,
        "warning",
        "high",
      ),
    );
  }

  if (crisisAccountability) {
    logs.push(
      createSystemLog(
        "Revision ejecutiva por crisis: se endurecen sanciones por decisiones deficientes acumuladas.",
        input.turnNumber,
        "warning",
        "high",
      ),
    );
  }

  for (const member of team) {
    const previous = previousById.get(member.id);
    if (!previous) {
      continue;
    }

    const stressDelta = Math.round((member.stress - previous.stress) * 10) / 10;
    const energyDelta = Math.round((member.energy - previous.energy) * 10) / 10;

    if (stressDelta > 0 || energyDelta < 0) {
      logs.push(
        createSystemLog(
          `${member.name} muestra desgaste operativo: estres +${Math.max(0, stressDelta)}, energia ${energyDelta}.`,
          input.turnNumber,
          "warning",
          "medium",
          [
            `Marcadores: temerarias ${member.recklessDecisionCount}, deuda ${member.decisionDebtCount}, sanciones ${member.disciplinaryStrikes}.`,
          ],
        ),
      );
    }

    const reachedPreDismissalWindow =
      previous.status !== "out" &&
      member.status !== "out" &&
      ((previous.recklessDecisionCount < 3 && member.recklessDecisionCount >= 3) ||
        (previous.decisionDebtCount < 4 && member.decisionDebtCount >= 4));

    if (reachedPreDismissalWindow) {
      logs.push(
        createSystemLog(
          `Alerta de RRHH: ${member.name} acumula desgaste critico por decisiones de alto impacto.`,
          input.turnNumber,
          "warning",
          "high",
          [
            `Umbrales de riesgo alcanzados (temerarias ${member.recklessDecisionCount}, deuda ${member.decisionDebtCount}).`,
          ],
        ),
      );
    }

    if (previous.disciplinaryStrikes === 0 && member.disciplinaryStrikes === 1) {
      logs.push(
        createSystemLog(
          `${member.name} queda bajo advertencia formal por decisiones de alto impacto negativo.`,
          input.turnNumber,
          "warning",
          "medium",
        ),
      );
    }

    if (previous.status !== "out" && member.status === "out") {
      const cause = inferDismissalCause(previous, member);
      const dismissalText =
        cause === "stress_resignation"
          ? `${member.name} ha renunciado por demasiado estres.`
          : `${member.name} ha sido despedido por ${DISMISSAL_CAUSE_LABELS[cause]}.`;
      logs.push(
        createSystemLog(
          dismissalText,
          input.turnNumber,
          "warning",
          "high",
          ["El rol queda vacante hasta que se aplique cobertura interna o contratacion externa."],
        ),
      );
    }
  }

  return {
    team,
    logs,
  };
}

function refreshEnemyIntents(input: {
  enemies: EnemyUnit[];
  project: ProjectStats;
  encounter: EncounterDefinition | null;
  phaseIndex: number;
  roundNumber: number;
  passiveCount: number;
  chainApplied: boolean;
}): EnemyUnit[] {
  const context = buildEnemyIntentContext({
    encounter: input.encounter,
    phaseIndex: input.phaseIndex,
    roundNumber: input.roundNumber,
    passiveCount: input.passiveCount,
    chainApplied: input.chainApplied,
  });

  return input.enemies.map((enemy) =>
    enemy.hp > 0
      ? {
          ...enemy,
          intent: computeEnemyIntent(enemy, input.project, context),
        }
      : enemy,
  );
}

function applyEnemyMomentumPressure(
  project: ProjectStats,
  enemyMomentum: number,
  turnNumber: number,
): { project: ProjectStats; logs: LogEntry[] } {
  if (enemyMomentum <= 0) {
    return { project, logs: [] };
  }

  const momentumRisk = scaleProjectPenaltyByKey(
    "risk",
    enemyMomentum * BALANCE.combat.enemyMomentum.riskPerStack,
  );
  const nextProject = applyProjectDelta(project, { risk: momentumRisk });

  return {
    project: nextProject,
    logs: [
      createSystemLog(
        `La inercia enemiga aumenta la presion general (+${momentumRisk} riesgo).`,
        turnNumber,
        "warning",
        "medium",
        ["Momentum acumulado por pasividad en el encuentro."],
      ),
    ],
  };
}

function resolveEnemyAttackWave(input: {
  enemies: EnemyUnit[];
  project: ProjectStats;
  team: TeamMember[];
  encounter: EncounterDefinition | null;
  phaseIndex: number;
  roundNumber: number;
  passiveCount: number;
  chainApplied: boolean;
  turnNumber: number;
}): { project: ProjectStats; team: TeamMember[]; logs: LogEntry[]; defeated: boolean } {
  let project = input.project;
  let team = input.team;
  const logs: LogEntry[] = [];

  for (const baseAttacker of input.enemies) {
    const attacker = {
      ...baseAttacker,
      intent: computeEnemyIntent(
        baseAttacker,
        project,
        buildEnemyIntentContext({
          encounter: input.encounter,
          phaseIndex: input.phaseIndex,
          roundNumber: input.roundNumber,
          passiveCount: input.passiveCount,
          chainApplied: input.chainApplied,
        }),
      ),
    };

    const resolved = resolveEnemyIntent(project, team, attacker);
    project = resolved.project;
    team = resolved.team;

    logs.push({
      id: `enemy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      turnNumber: input.turnNumber,
      actorName: attacker.name,
      actorType: "enemy",
      text: resolved.logText,
      category: "damage",
      narrativeSeverity:
        attacker.intent?.type === "passive_penalty" || attacker.intent?.type === "shadow_scope"
          ? "high"
          : "medium",
      timestamp: Date.now(),
    });

    if (project.budget <= 0) {
      return {
        project,
        team,
        logs,
        defeated: true,
      };
    }
  }

  return {
    project,
    team,
    logs,
    defeated: false,
  };
}

function applyCompositionAndBossPressure(input: {
  project: ProjectStats;
  enemies: EnemyUnit[];
  encounter: EncounterDefinition | null;
  bossClock: number;
  turnNumber: number;
}): { project: ProjectStats; bossClock: number; logs: LogEntry[] } {
  let project = input.project;
  let bossClock = input.encounter?.isBoss ? input.bossClock : 0;
  const logs: LogEntry[] = [];

  const hasGatekeeper = input.enemies.some(
    (enemy) => enemy.tags.includes("gatekeeper") || enemy.tags.includes("compliance"),
  );
  const hasPressure = input.enemies.some(
    (enemy) => enemy.tags.includes("pressure") || enemy.tags.includes("scope"),
  );

  if (hasGatekeeper && hasPressure) {
    project = applyProjectDelta(project, {
      progress: scaleProjectPenaltyByKey("progress", -2),
      time: scaleProjectPenaltyByKey("time", -1),
    });
    logs.push(
      createSystemLog(
        "Sinergia enemiga: gatekeeper + presion bloquean avance adicional.",
        input.turnNumber,
        "warning",
        "high",
        ["Penalidad de composicion: progreso -2 y tiempo -1."],
      ),
    );
  }

  if (input.encounter?.isBoss) {
    bossClock += 1;

    if (bossClock >= BALANCE.combat.bossClock.roundsToCrisis) {
      project = applyProjectDelta(project, {
        time: scaleProjectPenaltyByKey("time", BALANCE.combat.bossClock.crisisProject.time),
        progress: scaleProjectPenaltyByKey(
          "progress",
          BALANCE.combat.bossClock.crisisProject.progress,
        ),
        risk: scaleProjectPenaltyByKey("risk", BALANCE.combat.bossClock.crisisProject.risk),
      });
      logs.push(
        createSystemLog(
          "Crisis de bossClock: el comite fuerza cierre politico con riesgo abierto.",
          input.turnNumber,
          "warning",
          "high",
          ["El jefe activa reloj de fracaso por falta de respuesta sostenida."],
        ),
      );
      bossClock = 0;
    }
  }

  return {
    project,
    bossClock,
    logs,
  };
}

function applyEncounterPressure(
  project: ProjectStats,
  enemies: EnemyUnit[],
  turnNumber: number,
): { project: ProjectStats; logs: LogEntry[] } {
  const pressureRules = BALANCE.combat.encounterPressure;
  const pressureDelta = {
    time: scaleProjectPenaltyByKey("time", -pressureRules.timePerRound),
    budget: hasBudgetPressureEnemies(enemies)
      ? scaleProjectPenaltyByKey("budget", -pressureRules.budgetIfProcurementActive)
      : 0,
    risk: enemies.length >= 2
      ? scaleProjectPenaltyByKey("risk", pressureRules.riskIfMultipleEnemies)
      : 0,
  };

  const nextProject = applyProjectDelta(project, pressureDelta);
  const pressureDetails: string[] = [];

  if (pressureDelta.time) {
    pressureDetails.push(`Presion de encuentro: tiempo ${pressureDelta.time}.`);
  }

  if (pressureDelta.budget) {
    pressureDetails.push(
      `Hay actor sponsor/proveedor/compliance activo: presupuesto ${pressureDelta.budget}.`,
    );
  }
  if (pressureDelta.risk) {
    pressureDetails.push(`Dos o mas enemigos vivos: riesgo +${pressureDelta.risk}.`);
  }

  if (!pressureDetails.length) {
    pressureDetails.push("La presion de encuentro no genero penalidad economica en esta ronda.");
  }

  return {
    project: nextProject,
    logs: [
      createSystemLog(
        "La ronda consume capacidad operativa incluso con buena ejecucion.",
        turnNumber,
        "status",
        "medium",
        pressureDetails,
      ),
    ],
  };
}

function applyStrongIntentEntryStress(input: {
  team: TeamMember[];
  nextToken: TurnToken;
  enemies: EnemyUnit[];
  turnNumber: number;
}): { team: TeamMember[]; logs: LogEntry[] } {
  const pressureRules = BALANCE.combat.encounterPressure;

    if (input.nextToken === "enemy" || !hasStrongIntent(input.enemies)) {
    return {
      team: input.team,
      logs: [],
    };
  }

    const stressedTeam = applyStressToToken(
    input.team,
    input.nextToken,
    scalePositivePenalty(pressureRules.stressOnStrongIntent),
  );
  const nextActor = findActingMember(stressedTeam, input.nextToken);

  if (!nextActor) {
    return {
      team: stressedTeam,
      logs: [],
    };
  }

  return {
    team: stressedTeam,
    logs: [
      createSystemLog(
        `${nextActor.name} inicia la ronda bajo intencion fuerte no mitigada (+2 estres).`,
        input.turnNumber,
        "warning",
        "medium",
        ["Castigo por entrar a turno con amenaza fuerte activa."],
      ),
    ],
  };
}

function inferDismissalCause(previous: TeamMember, next: TeamMember): StaffingDismissalRecord["cause"] {
  if (next.stress >= next.maxStress && previous.stress < previous.maxStress) {
    return "stress_resignation";
  }

  if (next.energy <= 0 && previous.energy > 0) {
    return "energy_collapse";
  }

  return "unknown";
}

function describeDismissal(record: StaffingDismissalRecord): string {
  if (record.cause === "stress_resignation") {
    return `${record.memberName} ha renunciado por demasiado estres`;
  }

  return `${record.memberName} ha sido despedido por ${DISMISSAL_CAUSE_LABELS[record.cause]}`;
}

function getFreshDismissals(previousTeam: TeamMember[], nextTeam: TeamMember[]): StaffingDismissalRecord[] {
  const previousById = new Map(previousTeam.map((member) => [member.id, member]));

  return nextTeam
    .map((member) => {
      const previous = previousById.get(member.id);
      if (!previous || previous.status === "out" || member.status !== "out") {
        return null;
      }

      return {
        memberId: member.id,
        memberName: member.name,
        role: member.role,
        assignedRole: previous.assignedRole,
        cause: inferDismissalCause(previous, member),
      } satisfies StaffingDismissalRecord;
    })
    .filter((record): record is StaffingDismissalRecord => Boolean(record));
}

function uniqueDismissalRecords(records: StaffingDismissalRecord[]): StaffingDismissalRecord[] {
  const byId = new Map<string, StaffingDismissalRecord>();
  for (const record of records) {
    byId.set(record.memberId, record);
  }

  return [...byId.values()];
}

function buildStaffingCrisisEvent(input: {
  team: TeamMember[];
  turnNumber: number;
  source: StaffingCrisisSource;
  freshDismissals: StaffingDismissalRecord[];
  existing: StaffingCrisisEvent | null;
}): StaffingCrisisEvent | null {
  const vacantRoles = getVacantRoles(input.team);
  if (!vacantRoles.length) {
    return null;
  }

  const mergedDismissals = uniqueDismissalRecords([
    ...(input.existing?.dismissedMembers ?? []),
    ...input.freshDismissals,
  ]);

  const roleText = vacantRoles.map((role) => ROLE_LABELS[role]).join(", ");
  const dismissedSummary = mergedDismissals.map((record) => describeDismissal(record)).join(". ");

  const summary = dismissedSummary
    ? `Evento de personal: ${dismissedSummary}. Vacantes: ${roleText}.`
    : `Evento de personal: vacantes detectadas en ${roleText}.`;

  return {
    id:
      input.existing?.id ??
      `staffing-crisis-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    turnNumber: input.turnNumber,
    source:
      input.existing && input.existing.source !== input.source
        ? "mixed"
        : input.existing?.source ?? input.source,
    severity: "high",
    vacantRoles,
    dismissedMembers: mergedDismissals,
    summary,
  };
}

function buildStaffingCrisisDetails(event: StaffingCrisisEvent): string[] {
  const details: string[] = [];

  if (event.dismissedMembers.length) {
    details.push(
      `Desvinculados: ${event.dismissedMembers.map((record) => describeDismissal(record)).join("; ")}.`,
    );
  }

  details.push(
    `Opciones: suplencia interna (estres +${BALANCE.staffing.coverStressPenalty}) o contratacion externa (presupuesto -${Math.round(BALANCE.staffing.hireBudgetPercent * 100)}% min., tiempo -${BALANCE.staffing.hireTimePenalty}, riesgo +${BALANCE.staffing.hireRiskPenalty}, calidad -${BALANCE.staffing.hireQualityPenalty}).`,
  );

  return details;
}

function hasRoleCoverage(team: TeamMember[]): boolean {
  return ROLE_ORDER.every((role) =>
    team.some((member) => member.assignedRole === role && member.status !== "out"),
  );
}

function isHardDefeat(project: ProjectStats, baseDismissedByRole: BaseDismissalTracker): boolean {
  return project.budget <= 0 || allBaseMembersDismissedAtLeastOnce(baseDismissedByRole);
}

function getGameOverReason(project: ProjectStats, baseDismissedByRole: BaseDismissalTracker): string {
  if (project.budget <= 0) return "Presupuesto agotado";
  if (allBaseMembersDismissedAtLeastOnce(baseDismissedByRole)) {
    return "Todos los personajes base quedaron fuera al menos una vez";
  }
  return "Operacion sin continuidad";
}

function isVictory(enemies: EnemyUnit[]): boolean {
  return enemies.length > 0 && enemies.every((enemy) => enemy.hp <= 0);
}

function getVacantRoles(team: TeamMember[]): CharacterRole[] {
  return ROLE_ORDER.filter(
    (role) => !team.some((member) => member.assignedRole === role && member.status !== "out"),
  );
}

function formatSignedValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

type GameStore = {
  currentScreen: RunScreen;
  teamName: string;
  phaseIndex: number;
  encounterIndex: number;
  currentScenario: ProjectScenario | null;
  latestIncident: NarrativeIncident | null;
  lastIncidentTurn: number | null;
  turnNumber: number;
  roundNumber: number;
  activeTurnToken: TurnToken;
  battleStatus: BattleStatus;
  project: ProjectStats;
  team: TeamMember[];
  enemies: EnemyUnit[];
  currentEncounter: EncounterDefinition | null;
  availableActions: DecisionOption[];
  combatLog: LogEntry[];
  lastLuckLabel: string | null;
  lastLuckPolarity: LuckEventPolarity | null;
  gameOverReason: string | null;
  baseDismissedByRole: BaseDismissalTracker;
  vacantRoles: CharacterRole[];
  activeStaffingCrisis: StaffingCrisisEvent | null;
  finalScore: FinalScoreResult | null;
  debtActionsThisRound: number;
  chainPenaltyAppliedInRound: boolean;
  passiveUsesInEncounter: number;
  enemyMomentum: number;
  bossClock: number;
  goToCreation: () => void;
  backToMenu: () => void;
  startRun: (payload: StartRunPayload) => void;
  pickAction: (actionId: string, targetEnemyId?: string) => void;
  resolveEnemyTurn: () => void;
  advanceEncounter: () => void;
  applyCoverageChoice: (substituteId: string, missingRole: CharacterRole) => void;
  hireReplacementForRole: (role: CharacterRole) => void;
  resetRun: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  currentScreen: "menu",
  teamName: "",
  phaseIndex: 0,
  encounterIndex: 0,
  currentScenario: null,
  latestIncident: null,
  lastIncidentTurn: null,
  turnNumber: 1,
  roundNumber: 1,
  activeTurnToken: "director",
  battleStatus: "idle",
  project: createInitialProject(),
  team: [],
  enemies: [],
  currentEncounter: null,
  availableActions: [],
  combatLog: [],
  lastLuckLabel: null,
  lastLuckPolarity: null,
  gameOverReason: null,
  baseDismissedByRole: createInitialBaseDismissalTracker(),
  vacantRoles: [],
  activeStaffingCrisis: null,
  finalScore: null,
  debtActionsThisRound: 0,
  chainPenaltyAppliedInRound: false,
  passiveUsesInEncounter: 0,
  enemyMomentum: 0,
  bossClock: 0,

  goToCreation: () => {
    set({ currentScreen: "creation" });
  },

  backToMenu: () => {
    set({ currentScreen: "menu" });
  },

  startRun: (payload) => {
    const scenario = getScenarioById(payload.scenarioId) ?? pickRandomScenario();
    const firstEncounter = getEncounter(0, 0, scenario);
    const initialTeam = createInitialTeam(payload);
    const initialProject = applyPhaseSalary(createInitialProject(), initialTeam);

    if (!firstEncounter) {
      return;
    }

    const initialEnemies = hydrateEncounter(
      firstEncounter,
      initialProject,
      buildEnemyIntentContext({
        encounter: firstEncounter,
        phaseIndex: 0,
        roundNumber: 1,
        passiveCount: 0,
        chainApplied: false,
      }),
    );
    const firstTurn = getStartingTurnToken(initialTeam);

    set({
      currentScreen: "battle",
      teamName: payload.teamName.trim() || "Equipo",
      phaseIndex: 0,
      encounterIndex: 0,
      currentScenario: scenario,
      latestIncident: null,
      lastIncidentTurn: null,
      turnNumber: 1,
      roundNumber: 1,
      battleStatus: "active",
      project: initialProject,
      team: initialTeam,
      enemies: initialEnemies,
      currentEncounter: firstEncounter,
      activeTurnToken: firstTurn,
      availableActions: getAvailableActions(firstTurn, firstEncounter, scenario),
      combatLog: [
        createSystemLog(
          `Escenario asignado: ${scenario.name}. ${scenario.summary}`,
          1,
          "phase",
          "medium",
        ),
        createSystemLog(
          `${getPhaseTitle(0, scenario)}. ${getPhaseIntroNarrative(0, scenario)}`,
          1,
          "phase",
          "medium",
        ),
        createSystemLog(
          `Comienza ${firstEncounter.title}. ${firstEncounter.introText}`,
          1,
          "phase",
        ),
      ],
      lastLuckLabel: null,
      lastLuckPolarity: null,
      gameOverReason: null,
      baseDismissedByRole: createInitialBaseDismissalTracker(),
      vacantRoles: [],
      activeStaffingCrisis: null,
      finalScore: null,
      debtActionsThisRound: 0,
      chainPenaltyAppliedInRound: false,
      passiveUsesInEncounter: 0,
      enemyMomentum: 0,
      bossClock: 0,
    });
  },

  pickAction: (actionId, targetEnemyId) => {
    const state = get();

    if (state.currentScreen !== "battle" || state.battleStatus !== "active") {
      return;
    }

    if (state.activeStaffingCrisis) {
      return;
    }

    if (state.activeTurnToken === "enemy" || !state.currentEncounter) {
      return;
    }

    const actor = findActingMember(state.team, state.activeTurnToken);
    if (!actor) {
      return;
    }

    const action =
      state.availableActions.find((option) => option.id === actionId) ?? actionById[actionId];
    if (!action) {
      return;
    }

    if (action.actorRole !== "any" && action.actorRole !== state.activeTurnToken) {
      return;
    }

    const primaryTarget =
      targetEnemyId ?? state.enemies.find((enemy) => enemy.hp > 0)?.id ?? state.enemies[0]?.id;

    if (!primaryTarget) {
      return;
    }

    const resolution = resolveDecision({
      project: state.project,
      team: state.team,
      enemies: state.enemies,
      actorId: actor.id,
      action,
      targetEnemyId: primaryTarget,
      turnNumber: state.turnNumber,
    });

    const penaltyState = applyActionPenaltyState({
      actionId: action.id,
      debtTriggered: resolution.debt.hasDebt,
      turnNumber: state.turnNumber,
      project: resolution.project,
      passiveUsesInEncounter: state.passiveUsesInEncounter,
      debtActionsThisRound: state.debtActionsThisRound,
      chainPenaltyAppliedInRound: state.chainPenaltyAppliedInRound,
      enemyMomentum: state.enemyMomentum,
    });

    const team = resolution.team;
    const passiveUsesInEncounter = penaltyState.passiveUsesInEncounter;
    const debtActionsThisRound = penaltyState.debtActionsThisRound;
    const chainPenaltyAppliedInRound = penaltyState.chainPenaltyAppliedInRound;
    const enemyMomentum = penaltyState.enemyMomentum;

    const incidentState = resolveScenarioIncidentState({
      scenario: state.currentScenario,
      project: penaltyState.project,
      team,
      enemies: resolution.enemies,
      encounter: state.currentEncounter,
      activeTurnToken: state.activeTurnToken,
      turnNumber: state.turnNumber,
      passiveUsesInEncounter,
      debtActionsThisRound,
      chainPenaltyAppliedInRound,
      bossClock: state.bossClock,
      lastIncidentTurn: state.lastIncidentTurn,
    });

    const project = incidentState.project;
    const incidentTeam = incidentState.team;

    const disciplineState = applyDisciplinaryConsequences({
      team: incidentTeam,
      actorId: actor.id,
      action,
      project,
      debtTriggered: resolution.debt.hasDebt,
      turnNumber: state.turnNumber,
    });

    const disciplinedTeam = applyStressResignations(disciplineState.team);

    const enemiesWithIntent = refreshEnemyIntents({
      enemies: incidentState.enemies,
      project,
      encounter: state.currentEncounter,
      phaseIndex: state.phaseIndex,
      roundNumber: state.roundNumber,
      passiveCount: passiveUsesInEncounter,
      chainApplied: chainPenaltyAppliedInRound,
    });

    const updatedCombatLog = [
      ...state.combatLog,
      resolution.logEntry,
      ...penaltyState.logs,
      ...incidentState.logs,
      ...disciplineState.logs,
    ];

    const freshDismissals = getFreshDismissals(state.team, disciplinedTeam);
    const baseDismissedByRole = markBaseDismissals(
      state.team,
      disciplinedTeam,
      state.baseDismissedByRole,
    );
    const staffingCrisis = buildStaffingCrisisEvent({
      team: disciplinedTeam,
      turnNumber: state.turnNumber,
      source: "ally_turn",
      freshDismissals,
      existing: state.activeStaffingCrisis,
    });

    const staffingCrisisLog = staffingCrisis
      ? createSystemLog(
          staffingCrisis.summary,
          state.turnNumber,
          "warning",
          "high",
          buildStaffingCrisisDetails(staffingCrisis),
        )
      : null;

    const updatedCombatLogWithCrisis = staffingCrisisLog
      ? [...updatedCombatLog, staffingCrisisLog]
      : updatedCombatLog;

    const roleVacancies = getVacantRoles(disciplinedTeam);

    const defeat = isHardDefeat(project, baseDismissedByRole);
    const victory = isVictory(enemiesWithIntent);

    if (defeat) {
      set({
        project,
        team: disciplinedTeam,
        enemies: enemiesWithIntent,
        combatLog: updatedCombatLogWithCrisis,
        battleStatus: "defeat",
        currentScreen: "results",
        gameOverReason: getGameOverReason(project, baseDismissedByRole),
        finalScore: computeFinalScore(project, disciplinedTeam),
        lastLuckLabel: resolution.luckEvent?.label ?? null,
        lastLuckPolarity: resolution.luckEvent?.polarity ?? null,
        baseDismissedByRole,
        activeStaffingCrisis: null,
        vacantRoles: roleVacancies,
        latestIncident: incidentState.incident ?? state.latestIncident,
        lastIncidentTurn: incidentState.lastIncidentTurn,
        debtActionsThisRound,
        chainPenaltyAppliedInRound,
        passiveUsesInEncounter,
        enemyMomentum,
      });
      return;
    }

    if (victory) {
      set({
        project,
        team: disciplinedTeam,
        enemies: enemiesWithIntent,
        combatLog: [
          ...updatedCombatLogWithCrisis,
          createSystemLog(
            state.currentEncounter.completionText,
            state.turnNumber,
            "phase",
          ),
        ],
        battleStatus: "victory",
        activeTurnToken: state.activeTurnToken,
        availableActions: [],
        lastLuckLabel: resolution.luckEvent?.label ?? null,
        lastLuckPolarity: resolution.luckEvent?.polarity ?? null,
        baseDismissedByRole,
        vacantRoles: roleVacancies,
        activeStaffingCrisis: staffingCrisis,
        latestIncident: incidentState.incident ?? state.latestIncident,
        lastIncidentTurn: incidentState.lastIncidentTurn,
        debtActionsThisRound,
        chainPenaltyAppliedInRound,
        passiveUsesInEncounter,
        enemyMomentum,
      });
      return;
    }

    const nextToken = getNextTurnToken(state.activeTurnToken, disciplinedTeam);

    if (staffingCrisis) {
      set({
        project,
        team: disciplinedTeam,
        enemies: enemiesWithIntent,
        combatLog: updatedCombatLogWithCrisis,
        activeTurnToken: nextToken,
        availableActions: [],
        turnNumber: state.turnNumber + 1,
        lastLuckLabel: resolution.luckEvent?.label ?? null,
        lastLuckPolarity: resolution.luckEvent?.polarity ?? null,
        baseDismissedByRole,
        vacantRoles: roleVacancies,
        activeStaffingCrisis: staffingCrisis,
        latestIncident: incidentState.incident ?? state.latestIncident,
        lastIncidentTurn: incidentState.lastIncidentTurn,
        debtActionsThisRound,
        chainPenaltyAppliedInRound,
        passiveUsesInEncounter,
        enemyMomentum,
      });
      return;
    }

    set({
      project,
      team: disciplinedTeam,
      enemies: enemiesWithIntent,
      combatLog: updatedCombatLog,
      activeTurnToken: nextToken,
      availableActions: getAvailableActions(nextToken, state.currentEncounter, state.currentScenario),
      turnNumber: state.turnNumber + 1,
      lastLuckLabel: resolution.luckEvent?.label ?? null,
      lastLuckPolarity: resolution.luckEvent?.polarity ?? null,
      baseDismissedByRole,
      vacantRoles: roleVacancies,
      activeStaffingCrisis: null,
      latestIncident: incidentState.incident ?? state.latestIncident,
      lastIncidentTurn: incidentState.lastIncidentTurn,
      debtActionsThisRound,
      chainPenaltyAppliedInRound,
      passiveUsesInEncounter,
      enemyMomentum,
    });
  },

  resolveEnemyTurn: () => {
    const state = get();

    if (
      state.currentScreen !== "battle" ||
      state.battleStatus !== "active" ||
      state.activeTurnToken !== "enemy"
    ) {
      return;
    }

    if (state.activeStaffingCrisis) {
      return;
    }

    const aliveEnemies = state.enemies
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => b.threat - a.threat);

    if (!aliveEnemies.length) {
      set({
        battleStatus: "victory",
        availableActions: [],
        activeStaffingCrisis: null,
      });
      return;
    }

    const momentumState = applyEnemyMomentumPressure(
      state.project,
      state.enemyMomentum,
      state.turnNumber,
    );

    const waveState = resolveEnemyAttackWave({
      enemies: aliveEnemies,
      project: momentumState.project,
      team: state.team,
      encounter: state.currentEncounter,
      phaseIndex: state.phaseIndex,
      roundNumber: state.roundNumber,
      passiveCount: state.passiveUsesInEncounter,
      chainApplied: state.chainPenaltyAppliedInRound,
      turnNumber: state.turnNumber,
    });

    const preSystemLogs = [...momentumState.logs, ...waveState.logs];
    const baseDismissedAfterWave = markBaseDismissals(
      state.team,
      waveState.team,
      state.baseDismissedByRole,
    );

    if (waveState.defeated) {
      set({
        project: waveState.project,
        team: waveState.team,
        enemies: state.enemies,
        combatLog: [...state.combatLog, ...preSystemLogs],
        battleStatus: "defeat",
        currentScreen: "results",
        gameOverReason: getGameOverReason(waveState.project, baseDismissedAfterWave),
        finalScore: computeFinalScore(waveState.project, waveState.team),
        baseDismissedByRole: baseDismissedAfterWave,
        activeStaffingCrisis: null,
        vacantRoles: getVacantRoles(waveState.team),
      });
      return;
    }

    const compositionState = applyCompositionAndBossPressure({
      project: waveState.project,
      enemies: aliveEnemies,
      encounter: state.currentEncounter,
      bossClock: state.bossClock,
      turnNumber: state.turnNumber,
    });

    const pressureState = applyEncounterPressure(
      compositionState.project,
      aliveEnemies,
      state.turnNumber,
    );

    const incidentState = resolveScenarioIncidentState({
      scenario: state.currentScenario,
      project: pressureState.project,
      team: waveState.team,
      enemies: state.enemies,
      encounter: state.currentEncounter,
      activeTurnToken: "enemy",
      turnNumber: state.turnNumber,
      passiveUsesInEncounter: state.passiveUsesInEncounter,
      debtActionsThisRound: state.debtActionsThisRound,
      chainPenaltyAppliedInRound: state.chainPenaltyAppliedInRound,
      bossClock: compositionState.bossClock,
      lastIncidentTurn: state.lastIncidentTurn,
    });

    const postSystemLogs = [
      ...preSystemLogs,
      ...compositionState.logs,
      ...pressureState.logs,
      ...incidentState.logs,
    ];

    const nextRoundNumber = state.roundNumber + 1;

    const enemiesWithIntent = refreshEnemyIntents({
      enemies: incidentState.enemies,
      project: incidentState.project,
      encounter: state.currentEncounter,
      phaseIndex: state.phaseIndex,
      roundNumber: nextRoundNumber,
      passiveCount: state.passiveUsesInEncounter,
      chainApplied: state.chainPenaltyAppliedInRound,
    });

    const nextToken = getNextTurnToken("enemy", incidentState.team);
    const stressState = applyStrongIntentEntryStress({
      team: incidentState.team,
      nextToken,
      enemies: enemiesWithIntent,
      turnNumber: state.turnNumber,
    });
    const stabilizedTeam = applyStressResignations(stressState.team);
    const nextTurnToken = getNextTurnToken("enemy", stabilizedTeam);

    const finalLogs = [...postSystemLogs, ...stressState.logs];

    const freshDismissals = uniqueDismissalRecords([
      ...getFreshDismissals(state.team, waveState.team),
      ...getFreshDismissals(waveState.team, stabilizedTeam),
    ]);
    const baseDismissedByRole = markBaseDismissals(
      waveState.team,
      stabilizedTeam,
      baseDismissedAfterWave,
    );
    const staffingCrisis = buildStaffingCrisisEvent({
      team: stabilizedTeam,
      turnNumber: state.turnNumber,
      source: "enemy_turn",
      freshDismissals,
      existing: state.activeStaffingCrisis,
    });

    const staffingCrisisLog = staffingCrisis
      ? createSystemLog(
          staffingCrisis.summary,
          state.turnNumber,
          "warning",
          "high",
          buildStaffingCrisisDetails(staffingCrisis),
        )
      : null;

    const finalLogsWithCrisis = staffingCrisisLog
      ? [...finalLogs, staffingCrisisLog]
      : finalLogs;

    const roleVacancies = getVacantRoles(stabilizedTeam);

    if (isHardDefeat(incidentState.project, baseDismissedByRole)) {
      set({
        project: incidentState.project,
        team: stabilizedTeam,
        enemies: enemiesWithIntent,
        combatLog: [...state.combatLog, ...finalLogsWithCrisis],
        battleStatus: "defeat",
        currentScreen: "results",
        gameOverReason: getGameOverReason(incidentState.project, baseDismissedByRole),
        finalScore: computeFinalScore(incidentState.project, stabilizedTeam),
        baseDismissedByRole,
        latestIncident: incidentState.incident ?? state.latestIncident,
        lastIncidentTurn: incidentState.lastIncidentTurn,
        activeStaffingCrisis: null,
        vacantRoles: roleVacancies,
      });
      return;
    }

    if (staffingCrisis) {
      set({
        project: incidentState.project,
        team: stabilizedTeam,
        enemies: enemiesWithIntent,
        combatLog: [...state.combatLog, ...finalLogsWithCrisis],
        activeTurnToken: nextTurnToken,
        availableActions: [],
        turnNumber: state.turnNumber + 1,
        roundNumber: nextRoundNumber,
        baseDismissedByRole,
        vacantRoles: roleVacancies,
        activeStaffingCrisis: staffingCrisis,
        latestIncident: incidentState.incident ?? state.latestIncident,
        lastIncidentTurn: incidentState.lastIncidentTurn,
        debtActionsThisRound: 0,
        chainPenaltyAppliedInRound: false,
        bossClock: compositionState.bossClock,
      });
      return;
    }

    set({
      project: incidentState.project,
      team: stabilizedTeam,
      enemies: enemiesWithIntent,
      combatLog: [...state.combatLog, ...finalLogsWithCrisis],
      activeTurnToken: nextTurnToken,
      availableActions: getAvailableActions(nextTurnToken, state.currentEncounter, state.currentScenario),
      turnNumber: state.turnNumber + 1,
      roundNumber: nextRoundNumber,
      baseDismissedByRole,
      vacantRoles: roleVacancies,
      activeStaffingCrisis: null,
      latestIncident: incidentState.incident ?? state.latestIncident,
      lastIncidentTurn: incidentState.lastIncidentTurn,
      debtActionsThisRound: 0,
      chainPenaltyAppliedInRound: false,
      bossClock: compositionState.bossClock,
    });
  },

  advanceEncounter: () => {
    const state = get();

    if (state.currentScreen !== "battle") {
      return;
    }

    if (state.activeStaffingCrisis) {
      return;
    }

    if (state.battleStatus === "defeat") {
      set({
        currentScreen: "results",
      });
      return;
    }

    if (state.battleStatus !== "victory") {
      return;
    }

    const projectedProgress = applyEncounterCompletionReward(
      state.project,
      state.currentEncounter,
    );

    let nextPhaseIndex = state.phaseIndex;
    let nextEncounterIndex = state.encounterIndex + 1;
    let phaseTransition = false;

    const currentPhase = phases[state.phaseIndex];
    if (!currentPhase || nextEncounterIndex >= currentPhase.encounters.length) {
      nextPhaseIndex += 1;
      nextEncounterIndex = 0;
      phaseTransition = true;
    }

    const nextEncounter = getEncounter(nextPhaseIndex, nextEncounterIndex, state.currentScenario);

    if (!nextEncounter) {
      set({
        currentScreen: "results",
        finalScore: computeFinalScore(projectedProgress, state.team),
        project: projectedProgress,
        battleStatus: "idle",
      });
      return;
    }

    const encounterProject = phaseTransition
      ? applyPhaseSalary(projectedProgress, state.team)
      : projectedProgress;

    const hydratedEnemies = hydrateEncounter(
      nextEncounter,
      encounterProject,
      buildEnemyIntentContext({
        encounter: nextEncounter,
        phaseIndex: nextPhaseIndex,
        roundNumber: 1,
        passiveCount: 0,
        chainApplied: false,
      }),
    );
    const nextToken = getStartingTurnToken(state.team);

    const phaseTransitionLogs = phaseTransition
      ? [
          createSystemLog(
            `Nivel ${state.phaseIndex + 1} superado.`,
            state.turnNumber,
            "phase",
            "medium",
          ),
          createSystemLog(
            `Inicio de nivel ${nextPhaseIndex + 1}: ${getPhaseTitle(nextPhaseIndex, state.currentScenario)}. ${getPhaseIntroNarrative(
              nextPhaseIndex,
              state.currentScenario,
            )}`,
            state.turnNumber,
            "phase",
            "medium",
          ),
        ]
      : [];

    const transitionLogs: LogEntry[] = [
      ...phaseTransitionLogs,
      createSystemLog(
        `Nuevo encuentro: ${nextEncounter.title}. ${nextEncounter.introText}`,
        state.turnNumber,
        "phase",
      ),
    ];

    set({
      phaseIndex: nextPhaseIndex,
      encounterIndex: nextEncounterIndex,
      currentEncounter: nextEncounter,
      project: encounterProject,
      roundNumber: 1,
      enemies: hydratedEnemies,
      battleStatus: "active",
      activeTurnToken: nextToken,
      availableActions: getAvailableActions(nextToken, nextEncounter, state.currentScenario),
      combatLog: [
        ...state.combatLog,
        ...transitionLogs,
      ],
      vacantRoles: getVacantRoles(state.team),
      activeStaffingCrisis: null,
      debtActionsThisRound: 0,
      chainPenaltyAppliedInRound: false,
      passiveUsesInEncounter: 0,
      enemyMomentum: 0,
      bossClock: 0,
    });
  },

  applyCoverageChoice: (substituteId, missingRole) => {
    const state = get();
    const currentVacancies = state.activeStaffingCrisis?.vacantRoles ?? state.vacantRoles;
    if (!currentVacancies.includes(missingRole)) {
      return;
    }

    const substitute = state.team.find((member) => member.id === substituteId);

    if (!substitute || substitute.status === "out" || substitute.assignedRole === missingRole) {
      return;
    }

    const coveredTeam = applyCoverage(state.team, substituteId, missingRole);
    const updatedTeam = applyStressResignations(coveredTeam);
    const freshDismissals = getFreshDismissals(state.team, updatedTeam);
    const baseDismissedByRole = markBaseDismissals(
      state.team,
      updatedTeam,
      state.baseDismissedByRole,
    );
    const nextVacantRoles = getVacantRoles(updatedTeam);
    const nextCrisis = buildStaffingCrisisEvent({
      team: updatedTeam,
      turnNumber: state.turnNumber,
      source: state.activeStaffingCrisis?.source ?? "mixed",
      freshDismissals,
      existing: state.activeStaffingCrisis,
    });

    const logs: LogEntry[] = [
      createSystemLog(
        `Evento de cobertura: ${substitute.name} asume temporalmente el rol ${ROLE_LABELS[missingRole]}.`,
        state.turnNumber,
        "status",
        "high",
        [
          `Cobertura aplicada con penalidad de estres +${BALANCE.staffing.coverStressPenalty} y eficiencia reducida en decisiones.`,
        ],
      ),
    ];

    if (state.activeStaffingCrisis && !nextCrisis) {
      logs.push(
        createSystemLog(
          "Evento de personal resuelto: la continuidad operativa del equipo fue restablecida.",
          state.turnNumber,
          "status",
          "medium",
        ),
      );
    }

    if (isHardDefeat(state.project, baseDismissedByRole)) {
      set({
        team: updatedTeam,
        project: state.project,
        enemies: state.enemies,
        combatLog: [...state.combatLog, ...logs],
        battleStatus: "defeat",
        currentScreen: "results",
        gameOverReason: getGameOverReason(state.project, baseDismissedByRole),
        finalScore: computeFinalScore(state.project, updatedTeam),
        baseDismissedByRole,
        vacantRoles: nextVacantRoles,
        activeStaffingCrisis: null,
      });
      return;
    }

    set({
      team: updatedTeam,
      baseDismissedByRole,
      vacantRoles: nextVacantRoles,
      activeStaffingCrisis: nextCrisis,
      availableActions:
        state.battleStatus === "active" && !nextCrisis
          ? getAvailableActions(state.activeTurnToken, state.currentEncounter, state.currentScenario)
          : [],
      combatLog: [...state.combatLog, ...logs],
    });
  },

  hireReplacementForRole: (role) => {
    const state = get();
    const currentVacancies = state.activeStaffingCrisis?.vacantRoles ?? state.vacantRoles;
    if (!currentVacancies.includes(role)) {
      return;
    }

    const hired = hireReplacement(state.team, state.project, role);
    const nextVacantRoles = getVacantRoles(hired.team);
    const nextCrisis = buildStaffingCrisisEvent({
      team: hired.team,
      turnNumber: state.turnNumber,
      source: state.activeStaffingCrisis?.source ?? "mixed",
      freshDismissals: [],
      existing: state.activeStaffingCrisis,
    });

    const budgetDelta = hired.project.budget - state.project.budget;
    const timeDelta = hired.project.time - state.project.time;
    const riskDelta = hired.project.risk - state.project.risk;
    const qualityDelta = hired.project.quality - state.project.quality;

    const logs: LogEntry[] = [
      createSystemLog(
        hired.logText,
        state.turnNumber,
        "warning",
        "high",
        [
          `Proyecto tras contratacion: presupuesto ${formatSignedValue(budgetDelta)}, tiempo ${formatSignedValue(timeDelta)}, riesgo ${formatSignedValue(riskDelta)}, calidad ${formatSignedValue(qualityDelta)}.`,
        ],
      ),
    ];

    if (state.activeStaffingCrisis && !nextCrisis) {
      logs.push(
        createSystemLog(
          "Evento de personal resuelto: los roles criticos vuelven a tener cobertura.",
          state.turnNumber,
          "status",
          "medium",
        ),
      );
    }

    if (isHardDefeat(hired.project, state.baseDismissedByRole)) {
      set({
        team: hired.team,
        project: hired.project,
        enemies: state.enemies,
        combatLog: [...state.combatLog, ...logs],
        battleStatus: "defeat",
        currentScreen: "results",
        gameOverReason: getGameOverReason(hired.project, state.baseDismissedByRole),
        finalScore: computeFinalScore(hired.project, hired.team),
        baseDismissedByRole: state.baseDismissedByRole,
        vacantRoles: nextVacantRoles,
        activeStaffingCrisis: null,
      });
      return;
    }

    set({
      team: hired.team,
      project: hired.project,
      baseDismissedByRole: state.baseDismissedByRole,
      vacantRoles: nextVacantRoles,
      activeStaffingCrisis: nextCrisis,
      availableActions:
        state.battleStatus === "active" && !nextCrisis
          ? getAvailableActions(state.activeTurnToken, state.currentEncounter, state.currentScenario)
          : [],
      combatLog: [...state.combatLog, ...logs],
    });
  },

  resetRun: () => {
    set({
      currentScreen: "menu",
      teamName: "",
      phaseIndex: 0,
      encounterIndex: 0,
      currentScenario: null,
      latestIncident: null,
      lastIncidentTurn: null,
      turnNumber: 1,
      roundNumber: 1,
      activeTurnToken: "director",
      battleStatus: "idle",
      project: createInitialProject(),
      team: [],
      enemies: [],
      currentEncounter: null,
      availableActions: [],
      combatLog: [],
      lastLuckLabel: null,
      lastLuckPolarity: null,
      gameOverReason: null,
      baseDismissedByRole: createInitialBaseDismissalTracker(),
      vacantRoles: [],
      activeStaffingCrisis: null,
      finalScore: null,
      debtActionsThisRound: 0,
      chainPenaltyAppliedInRound: false,
      passiveUsesInEncounter: 0,
      enemyMomentum: 0,
      bossClock: 0,
    });
  },
}));
