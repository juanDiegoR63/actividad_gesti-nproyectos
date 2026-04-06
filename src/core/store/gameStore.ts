import { create } from "zustand";
import { BALANCE } from "../config/balance";
import { resolveDecision } from "../engine/decisionResolver";
import {
  buildEnemyFromSeed,
  computeEnemyIntent,
  resolveEnemyIntent,
} from "../engine/enemyResolver";
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
import type {
  BattleStatus,
  CharacterRole,
  DecisionOption,
  EnemyVisual,
  EnemySeed,
  EnemyUnit,
  EncounterDefinition,
  LogEntry,
  ProjectStats,
  RunScreen,
  StartRunPayload,
  TeamMember,
  LuckEventPolarity,
  TurnToken,
} from "../../types/game";

const ROLE_ORDER: CharacterRole[] = ["director", "planning", "quality"];

const DEFAULT_NAMES: Record<CharacterRole, string> = {
  director: "Director",
  planning: "Planning",
  quality: "Calidad",
};

const ENEMY_ADJECTIVES = ["Adaptativo", "Ofensivo", "Preciso", "Tenaz"];
const BOSS_ADJECTIVES = ["Veterano", "Dominante", "Temible", "Estratega"];

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

const ENEMY_SEED_POOL: EnemySeed[] = phases.flatMap((phase) =>
  phase.encounters.flatMap((encounter) =>
    encounter.enemies.filter((seed) => seed.type !== "boss"),
  ),
);

const BOSS_SEED_POOL: EnemySeed[] = phases.flatMap((phase) =>
  phase.encounters.flatMap((encounter) => encounter.enemies.filter((seed) => seed.type === "boss")),
);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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

  const hp = randomizeValue(picked.hp, isBossSlot ? 0.14 : 0.24, isBossSlot ? 120 : 45);
  const threat = randomizeValue(
    picked.threat,
    isBossSlot ? 0.2 : 0.32,
    isBossSlot ? 9 : 4,
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
      assignedRole: role,
      cosmetic,
      energy: BALANCE.team.energyStart,
      maxEnergy: BALANCE.team.maxEnergy,
      stress: BALANCE.team.stressStart,
      maxStress: BALANCE.team.maxStress,
      salary: BALANCE.team.salaryByRole[role],
      status: "active",
    };
  });
}

function applyPhaseSalary(project: ProjectStats, team: TeamMember[]): ProjectStats {
  const phaseCost = team.reduce((acc, member) => acc + member.salary, 0);
  return {
    ...project,
    budget: clamp(project.budget - phaseCost, 0, project.maxBudget),
  };
}

function hydrateEncounter(encounter: EncounterDefinition, project: ProjectStats): EnemyUnit[] {
  return encounter.enemies.map((seed, index) => {
    const randomizedSeed = getRandomizedEnemySeed(seed, encounter, index);
    const base = buildEnemyFromSeed(randomizedSeed);
    const visual = getRandomEnemyVisual(base.type === "boss");

    return {
      ...base,
      visual,
      intent: computeEnemyIntent(base, project),
    };
  });
}

function getEncounter(phaseIndex: number, encounterIndex: number): EncounterDefinition | null {
  const phase = phases[phaseIndex];
  if (!phase) {
    return null;
  }

  return phase.encounters[encounterIndex] ?? null;
}

function getAvailableActions(
  token: TurnToken,
  encounter: EncounterDefinition | null,
): DecisionOption[] {
  if (!encounter || token === "enemy") {
    return [];
  }

  return encounter.actionPoolId
    .map((id) => actionById[id])
    .filter(
      (option): option is DecisionOption =>
        Boolean(option) && (option.actorRole === "any" || option.actorRole === token),
    )
    .slice(0, BALANCE.combat.maxActionsPerTurn);
}

function createSystemLog(text: string, turnNumber: number, category: LogEntry["category"]): LogEntry {
  return {
    id: `system-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    turnNumber,
    actorName: "Sistema",
    actorType: "system",
    text,
    category,
    timestamp: Date.now(),
  };
}

function isDefeat(project: ProjectStats, team: TeamMember[]): boolean {
  const hasActiveAssignedRoles = ROLE_ORDER.every((role) =>
    team.some((member) => member.assignedRole === role && member.status !== "out"),
  );

  const noActiveMembers = team.every((member) => member.status === "out");

  return (
    project.budget <= 0 ||
    project.time <= 0 ||
    project.risk >= project.maxRisk ||
    noActiveMembers ||
    !hasActiveAssignedRoles
  );
}

function getGameOverReason(project: ProjectStats, team: TeamMember[]): string {
  if (project.budget <= 0) return "Presupuesto agotado";
  if (project.time <= 0) return "Tiempo agotado";
  if (project.risk >= project.maxRisk) return "Riesgo fuera de control";
  if (team.every((member) => member.status === "out")) return "Equipo sin capacidad operativa";
  return "No hay cobertura para todos los roles";
}

function isVictory(enemies: EnemyUnit[]): boolean {
  return enemies.length > 0 && enemies.every((enemy) => enemy.hp <= 0);
}

function getVacantRoles(team: TeamMember[]): CharacterRole[] {
  return ROLE_ORDER.filter(
    (role) => !team.some((member) => member.assignedRole === role && member.status !== "out"),
  );
}

type GameStore = {
  currentScreen: RunScreen;
  teamName: string;
  phaseIndex: number;
  encounterIndex: number;
  turnNumber: number;
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
  vacantRoles: CharacterRole[];
  finalScore: FinalScoreResult | null;
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
  turnNumber: 1,
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
  vacantRoles: [],
  finalScore: null,

  goToCreation: () => {
    set({ currentScreen: "creation" });
  },

  backToMenu: () => {
    set({ currentScreen: "menu" });
  },

  startRun: (payload) => {
    const firstEncounter = getEncounter(0, 0);
    const initialTeam = createInitialTeam(payload);
    const initialProject = applyPhaseSalary(createInitialProject(), initialTeam);

    if (!firstEncounter) {
      return;
    }

    const initialEnemies = hydrateEncounter(firstEncounter, initialProject);
    const firstTurn = getStartingTurnToken(initialTeam);

    set({
      currentScreen: "battle",
      teamName: payload.teamName.trim() || "Equipo",
      phaseIndex: 0,
      encounterIndex: 0,
      turnNumber: 1,
      battleStatus: "active",
      project: initialProject,
      team: initialTeam,
      enemies: initialEnemies,
      currentEncounter: firstEncounter,
      activeTurnToken: firstTurn,
      availableActions: getAvailableActions(firstTurn, firstEncounter),
      combatLog: [
        createSystemLog(
          `Comienza ${firstEncounter.title}. ${firstEncounter.introText}`,
          1,
          "phase",
        ),
      ],
      lastLuckLabel: null,
      lastLuckPolarity: null,
      gameOverReason: null,
      vacantRoles: [],
      finalScore: null,
    });
  },

  pickAction: (actionId, targetEnemyId) => {
    const state = get();

    if (state.currentScreen !== "battle" || state.battleStatus !== "active") {
      return;
    }

    if (state.activeTurnToken === "enemy" || !state.currentEncounter) {
      return;
    }

    const actor = findActingMember(state.team, state.activeTurnToken);
    if (!actor) {
      return;
    }

    const action = actionById[actionId];
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

    const enemiesWithIntent = resolution.enemies.map((enemy) =>
      enemy.hp > 0 ? { ...enemy, intent: computeEnemyIntent(enemy, resolution.project) } : enemy,
    );

    const defeat = isDefeat(resolution.project, resolution.team);
    const victory = isVictory(enemiesWithIntent);

    if (defeat) {
      set({
        project: resolution.project,
        team: resolution.team,
        enemies: enemiesWithIntent,
        combatLog: [...state.combatLog, resolution.logEntry],
        battleStatus: "defeat",
        currentScreen: "results",
        gameOverReason: getGameOverReason(resolution.project, resolution.team),
        finalScore: computeFinalScore(resolution.project, resolution.team),
        lastLuckLabel: resolution.luckEvent?.label ?? null,
        lastLuckPolarity: resolution.luckEvent?.polarity ?? null,
      });
      return;
    }

    if (victory) {
      set({
        project: resolution.project,
        team: resolution.team,
        enemies: enemiesWithIntent,
        combatLog: [
          ...state.combatLog,
          resolution.logEntry,
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
        vacantRoles: getVacantRoles(resolution.team),
      });
      return;
    }

    const nextToken = getNextTurnToken(state.activeTurnToken, resolution.team);

    set({
      project: resolution.project,
      team: resolution.team,
      enemies: enemiesWithIntent,
      combatLog: [...state.combatLog, resolution.logEntry],
      activeTurnToken: nextToken,
      availableActions: getAvailableActions(nextToken, state.currentEncounter),
      turnNumber: state.turnNumber + 1,
      lastLuckLabel: resolution.luckEvent?.label ?? null,
      lastLuckPolarity: resolution.luckEvent?.polarity ?? null,
      vacantRoles: getVacantRoles(resolution.team),
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

    const attacker = state.enemies
      .filter((enemy) => enemy.hp > 0)
      .sort((a, b) => b.threat - a.threat)[0];

    if (!attacker) {
      set({
        battleStatus: "victory",
        availableActions: [],
      });
      return;
    }

    const resolved = resolveEnemyIntent(state.project, state.team, attacker);
    const enemiesWithIntent = state.enemies.map((enemy) =>
      enemy.hp > 0 ? { ...enemy, intent: computeEnemyIntent(enemy, resolved.project) } : enemy,
    );

    const logEntry: LogEntry = {
      id: `enemy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      turnNumber: state.turnNumber,
      actorName: attacker.name,
      actorType: "enemy",
      text: resolved.logText,
      category: "damage",
      timestamp: Date.now(),
    };

    const defeat = isDefeat(resolved.project, resolved.team);

    if (defeat) {
      set({
        project: resolved.project,
        team: resolved.team,
        enemies: enemiesWithIntent,
        combatLog: [...state.combatLog, logEntry],
        battleStatus: "defeat",
        currentScreen: "results",
        gameOverReason: getGameOverReason(resolved.project, resolved.team),
        finalScore: computeFinalScore(resolved.project, resolved.team),
      });
      return;
    }

    const nextToken = getNextTurnToken("enemy", resolved.team);

    set({
      project: resolved.project,
      team: resolved.team,
      enemies: enemiesWithIntent,
      combatLog: [...state.combatLog, logEntry],
      activeTurnToken: nextToken,
      availableActions: getAvailableActions(nextToken, state.currentEncounter),
      turnNumber: state.turnNumber + 1,
      vacantRoles: getVacantRoles(resolved.team),
    });
  },

  advanceEncounter: () => {
    const state = get();

    if (state.currentScreen !== "battle") {
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

    const projectedProgress = {
      ...state.project,
      progress: clamp(state.project.progress + 20, 0, state.project.maxProgress),
    };

    const nextEncounter = getEncounter(state.phaseIndex, state.encounterIndex + 1);

    if (!nextEncounter) {
      set({
        currentScreen: "results",
        finalScore: computeFinalScore(projectedProgress, state.team),
        project: projectedProgress,
        battleStatus: "idle",
      });
      return;
    }

    const hydratedEnemies = hydrateEncounter(nextEncounter, projectedProgress);
    const nextToken = getStartingTurnToken(state.team);

    set({
      encounterIndex: state.encounterIndex + 1,
      currentEncounter: nextEncounter,
      project: projectedProgress,
      enemies: hydratedEnemies,
      battleStatus: "active",
      activeTurnToken: nextToken,
      availableActions: getAvailableActions(nextToken, nextEncounter),
      combatLog: [
        ...state.combatLog,
        createSystemLog(
          `Nuevo encuentro: ${nextEncounter.title}. ${nextEncounter.introText}`,
          state.turnNumber,
          "phase",
        ),
      ],
      vacantRoles: getVacantRoles(state.team),
    });
  },

  applyCoverageChoice: (substituteId, missingRole) => {
    const state = get();
    const updatedTeam = applyCoverage(state.team, substituteId, missingRole);

    set({
      team: updatedTeam,
      vacantRoles: getVacantRoles(updatedTeam),
      combatLog: [
        ...state.combatLog,
        createSystemLog(
          `Suplencia aplicada: ${missingRole} queda cubierto internamente.`,
          state.turnNumber,
          "status",
        ),
      ],
    });
  },

  hireReplacementForRole: (role) => {
    const state = get();
    const hired = hireReplacement(state.team, state.project, role);

    set({
      team: hired.team,
      project: hired.project,
      vacantRoles: getVacantRoles(hired.team),
      combatLog: [
        ...state.combatLog,
        createSystemLog(hired.logText, state.turnNumber, "status"),
      ],
    });
  },

  resetRun: () => {
    set({
      currentScreen: "menu",
      teamName: "",
      phaseIndex: 0,
      encounterIndex: 0,
      turnNumber: 1,
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
      vacantRoles: [],
      finalScore: null,
    });
  },
}));
