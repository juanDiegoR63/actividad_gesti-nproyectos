# README Técnico - PMBOK Turn Battle

## 1. Resumen técnico

Este repositorio implementa un simulador táctico por turnos de gestión de proyectos.
La aplicación está construida sobre React + Vite, con estado global en Zustand y un motor de combate que modela recursos de proyecto (presupuesto, tiempo, calidad, riesgo, avance).

El runtime activo actual es el flujo **turn-based**:
- `menu`
- `creation`
- `battle`
- `results`

## 2. Stack y dependencias

- Runtime UI: React 18
- Bundler: Vite 5
- Estado global: Zustand 5
- Tipado: TypeScript (con componentes JS/JSX y TS/TSX coexistiendo)
- Animación/UI: Framer Motion
- Render 2D adicional: PixiJS
- Audio: síntesis Web Audio (sin assets binarios de audio)
- Validación de datos disponible: Zod

Dependencias declaradas en `package.json`:
- `react`, `react-dom`
- `zustand`
- `pixi.js`
- `framer-motion`
- `howler`
- `zod`

## 3. Estructura técnica principal

- `src/core/store/gameStore.ts`: estado de partida, transiciones de pantalla, turno y resolución de acciones
- `src/core/engine/*.ts`: reglas de negocio del combate
- `src/data/actions.ts`: catálogo de acciones disponibles
- `src/data/phases/*.ts`: definición de encuentros por fase
- `src/types/game.ts`: contrato de dominio (tipos)
- `src/screens/*`: pantallas del flujo de juego
- `src/components/battle/*`: viewport de combate
- `src/core/services/audioService.js`: música/SFX por síntesis

## 4. Flujo de ejecución

1. `main.jsx` monta `App`.
2. `App.jsx` decide la pantalla según `currentScreen` en Zustand.
3. `TurnSetupScreen` llama `startRun(payload)`.
4. `gameStore` hidrata encuentro inicial, genera enemigos y fija el turno inicial.
5. En batalla:
   - jugador ejecuta `pickAction(actionId, targetEnemyId)`
   - motor aplica decisión (`resolveDecision`)
   - si corresponde, motor enemigo ejecuta `resolveEnemyTurn`
6. Al finalizar encuentro, `advanceEncounter()` o cierre de run.
7. En resultados, se calcula `finalScore` con `computeFinalScore`.

## 5. Modelo de dominio

### 5.1 Recursos de proyecto

`ProjectStats` modela:
- `budget`
- `time`
- `quality`
- `risk`
- `progress`

y sus máximos (`max*`) para clamp de reglas.

### 5.2 Equipo

`TeamMember` modela:
- rol original y rol asignado (`role`, `assignedRole`)
- energía, estrés y estado operativo
- salario por fase
- cosmética del personaje

### 5.3 Enemigos e intención

Cada `EnemyUnit` mantiene:
- HP, amenaza
- intención telegrafiada (`EnemyIntent`)
- tags e identidad de tipo (`stakeholder`, `boss`, etc.)

### 5.4 Decisiones

`DecisionOption` define:
- actor permitido
- requisitos de recurso (`requirements`)
- efectos base (`baseEffects`)
- efectos por deuda (`debtEffects`)
- escalado por rol (`roleScaling`)

## 6. Reglas de negocio destacadas

- Todos los recursos y stats se acotan por `clamp`.
- Si faltan requisitos de acción, se activa deuda de ejecución.
- La deuda aplica penalizaciones en proyecto/equipo.
- Existe suerte probabilística (`rollLuck`) condicionada por riesgo y estrés medio.
- El enemigo selecciona intención dinámica por contexto (riesgo, calidad, tiempo, HP boss).
- Derrota si: presupuesto o tiempo llegan a 0, riesgo al máximo o no hay cobertura operativa de roles.

## 7. Fragmentos completos de código

A continuación se incluyen fragmentos completos reales del repositorio.

### 7.1 Enrutado de pantallas principal (`src/App.jsx`)

```jsx
import { useEffect } from "react";
import { useGameStore } from "./core/store/gameStore";
import { TurnMenuScreen } from "./screens/TurnMenuScreen";
import { TurnSetupScreen } from "./screens/TurnSetupScreen";
import { TurnBattleScreen } from "./screens/TurnBattleScreen";
import { TurnEndScreen } from "./screens/TurnEndScreen";
import { audioService } from "./core/services/audioService";

function App() {
  const currentScreen = useGameStore((state) => state.currentScreen);

  useEffect(() => {
    const unlockAudio = () => {
      void audioService.unlock();
    };

    globalThis.addEventListener("pointerdown", unlockAudio, { once: true });
    globalThis.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      globalThis.removeEventListener("pointerdown", unlockAudio);
      globalThis.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  if (currentScreen === "menu") {
    return <TurnMenuScreen />;
  }

  if (currentScreen === "creation") {
    return <TurnSetupScreen />;
  }

  if (currentScreen === "results") {
    return <TurnEndScreen />;
  }

  return <TurnBattleScreen />;
}

export default App;
```

### 7.2 Motor de orden de turnos (`src/core/engine/turnEngine.ts`)

```ts
import type { TeamMember, TurnToken } from "../../types/game";

export const TURN_SEQUENCE: TurnToken[] = [
  "director",
  "planning",
  "quality",
  "enemy",
];

export function findActingMember(team: TeamMember[], token: TurnToken): TeamMember | null {
  if (token === "enemy") {
    return null;
  }

  return (
    team.find(
      (member) => member.assignedRole === token && member.status !== "out",
    ) ?? null
  );
}

function isTokenAvailable(team: TeamMember[], token: TurnToken): boolean {
  if (token === "enemy") {
    return true;
  }

  return team.some(
    (member) => member.assignedRole === token && member.status !== "out",
  );
}

export function getStartingTurnToken(team: TeamMember[]): TurnToken {
  return (
    TURN_SEQUENCE.find((token) => isTokenAvailable(team, token) && token !== "enemy") ??
    "enemy"
  );
}

export function getNextTurnToken(
  currentToken: TurnToken,
  team: TeamMember[],
): TurnToken {
  const currentIndex = TURN_SEQUENCE.indexOf(currentToken);

  for (let offset = 1; offset <= TURN_SEQUENCE.length; offset += 1) {
    const candidate = TURN_SEQUENCE[(currentIndex + offset) % TURN_SEQUENCE.length];
    if (isTokenAvailable(team, candidate)) {
      return candidate;
    }
  }

  return "enemy";
}
```

### 7.3 Resolver de decisiones de jugador (`src/core/engine/decisionResolver.ts`)

```ts
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
): EnemyUnit[] {
  const hasTargetEffects = Boolean(effects.targetEnemy);
  const hasAllEnemyEffects = Boolean(effects.allEnemies);

  if (!hasTargetEffects && !hasAllEnemyEffects) {
    return enemies;
  }

  return enemies.map((enemy) => {
    const shouldApplyTarget = enemy.id === targetEnemyId && hasTargetEffects;

    let hpDelta = 0;
    let threatDelta = 0;

    if (shouldApplyTarget) {
      hpDelta += (effects.targetEnemy?.hp ?? 0) * multiplier;
      threatDelta += (effects.targetEnemy?.threat ?? 0) * multiplier;
    }

    if (hasAllEnemyEffects) {
      hpDelta += effects.allEnemies?.hp ?? 0;
      threatDelta += effects.allEnemies?.threat ?? 0;
    }

    return {
      ...enemy,
      hp: clamp(enemy.hp + hpDelta, 0, enemy.maxHp),
      threat: clamp(enemy.threat + threatDelta, 0, 99),
    };
  });
}

function applyDebtPenalty(
  project: ProjectStats,
  team: TeamMember[],
  actorId: string,
  debt: ReturnType<typeof resolveRequirementDebt>,
): {
  project: ProjectStats;
  team: TeamMember[];
} {
  let nextProject = project;
  let nextTeam = team;

  if (debt.missingBudget) {
    nextProject = applyProjectDelta(nextProject, { risk: 6, quality: -4 });
  }

  if (debt.missingTime) {
    nextProject = applyProjectDelta(nextProject, { risk: 8 });
    nextTeam = applyActorDelta(nextTeam, actorId, { stress: 10 });
  }

  if (debt.missingQuality) {
    nextProject = applyProjectDelta(nextProject, { progress: -5, risk: 2 });
  }

  if (debt.missingRiskCap) {
    nextProject = applyProjectDelta(nextProject, { risk: 5 });
  }

  return {
    project: nextProject,
    team: nextTeam,
  };
}

function getEffectiveMultiplier(actor: TeamMember, option: DecisionOption): number {
  const roleMultiplier = option.roleScaling?.[actor.assignedRole] ?? 1;

  const stressMultiplier = actor.stress >= 85 ? 0.8 : actor.stress >= 70 ? 0.9 : 1;

  const coverageMultiplier =
    actor.status === "covering_other_role" && actor.assignedRole !== actor.role
      ? BALANCE.staffing.coverEfficiencyMultiplier
      : 1;

  return roleMultiplier * stressMultiplier * coverageMultiplier;
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

  let project = applyProjectDelta(
    input.project,
    scaleProjectDelta(input.action.baseEffects.project, multiplier),
  );
  let team = applyActorDelta(input.team, actor.id, input.action.baseEffects.actor);
  let enemies = applyEnemyDelta(
    input.enemies,
    input.action.baseEffects,
    input.targetEnemyId,
    multiplier,
  );

  if (debt.hasDebt) {
    const debtState = applyDebtPenalty(project, team, actor.id, debt);
    project = debtState.project;
    team = debtState.team;

    if (input.action.debtEffects) {
      project = applyProjectDelta(project, input.action.debtEffects.project ?? {});
      team = applyActorDelta(team, actor.id, input.action.debtEffects.actor);
      enemies = applyEnemyDelta(enemies, input.action.debtEffects, input.targetEnemyId, 1);
    }
  }

  const luckEvent = rollLuck(project, team);
  if (luckEvent) {
    project = applyProjectDelta(project, luckEvent.effects.project ?? {});
    team = applyActorDelta(team, actor.id, luckEvent.effects.actor);
    enemies = applyEnemyDelta(enemies, luckEvent.effects, input.targetEnemyId, 1);
  }

  const debtTags: string[] = [];
  if (debt.missingBudget) debtTags.push("presupuesto");
  if (debt.missingTime) debtTags.push("tiempo");
  if (debt.missingQuality) debtTags.push("calidad");
  if (debt.missingRiskCap) debtTags.push("tope de riesgo");

  const debtText = debtTags.length > 0 ? ` Deuda activada: ${debtTags.join(", ")}.` : "";
  const luckText = luckEvent ? ` Suerte: ${luckEvent.label}.` : "";

  const logEntry: LogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    turnNumber: input.turnNumber,
    actorName: actor.name,
    actorType: "ally",
    text: `${actor.name} uso ${input.action.title}. ${input.action.narrativeResult}${debtText}${luckText}`,
    glossaryKeys: input.action.glossaryKeys,
    category: debt.hasDebt ? "warning" : "action",
    timestamp: Date.now(),
  };

  return {
    project,
    team,
    enemies,
    logEntry,
    debt,
    luckEvent,
  };
}
```

### 7.4 IA enemiga e intención (`src/core/engine/enemyResolver.ts`)

```ts
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
```

### 7.5 Scoring final de run (`src/core/engine/scoringResolver.ts`)

```ts
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
```

### 7.6 Definición completa de la fase vertical slice (`src/data/phases/phase1.ts`)

```ts
import type { PhaseDefinition } from "../../types/game";

export const phase1: PhaseDefinition = {
  id: "phase-1",
  title: "Fase 1: Inicio",
  theme: "charter, stakeholders y alcance inicial",
  introNarrative:
    "El proyecto arranca con expectativas altas y objetivos ambiguos. Debes traducir pedidos politicos a decisiones medibles antes de que se dispare el retrabajo.",
  encounters: [
    {
      id: "phase1-enc1",
      phaseId: "phase-1",
      title: "Kickoff Tenso",
      subtitle:
        "Un stakeholder exige tres cambios fuera de plan: reportes semanales extra, una integracion no presupuestada y adelantar la demo sin mover alcance ni fechas.",
      isBoss: false,
      background: "kickoff_room",
      musicKey: "phase1_normal",
      introText:
        "La reunion de arranque pasa de alineacion a presion comercial. Si aceptas cambios sin analisis de impacto, sube riesgo y se consume tiempo de forma reactiva.",
      completionText:
        "Se define un alcance minimo viable con criterios de entrada y salida para evaluar futuros pedidos.",
      enemies: [
        {
          id: "stakeholder-hostil",
          name: "Stakeholder Hostil",
          type: "stakeholder",
          hp: 70,
          threat: 8,
          tags: ["scope", "pressure"],
          intents: ["scope_pressure", "stakeholder_noise", "delay"],
        },
      ],
      actionPoolId: [
        "negotiate_scope",
        "accept_conditioned_change",
        "replan_schedule",
        "reinforce_quality",
        "hold_position",
      ],
    },
    {
      id: "phase1-enc2",
      phaseId: "phase-1",
      title: "Sponsor Ambiguo",
      subtitle:
        "El sponsor cambia prioridades en cada reunion: pide tablero diario, nuevos KPI y aprobaciones rapidas sin aclarar responsables ni dependencias.",
      isBoss: false,
      background: "stakeholder_hall",
      musicKey: "phase1_normal",
      introText:
        "Aparecen instrucciones contradictorias entre area usuaria y direccion. Debes convertir ambiguedad en acuerdos trazables para evitar retrabajo.",
      completionText:
        "Quedan acordadas reglas de cambio, responsables de aprobacion y ventanas de revision para sostener la fase.",
      enemies: [
        {
          id: "sponsor-ambiguo",
          name: "Sponsor Ambiguo",
          type: "stakeholder",
          hp: 80,
          threat: 10,
          tags: ["scope", "alignment"],
          intents: ["stakeholder_noise", "risk_spike", "delay"],
        },
      ],
      actionPoolId: [
        "escalate_committee",
        "negotiate_scope",
        "apply_contingency",
        "block_defective_release",
        "document_exception",
        "hold_position",
      ],
    },
    {
      id: "phase1-boss",
      phaseId: "phase-1",
      title: "Comite de Stakeholders",
      subtitle:
        "Boss de fase: el comite exige firmar entregables parciales, recortar QA y aceptar alcance adicional antes de cerrar la linea base.",
      isBoss: true,
      background: "boardroom_boss",
      musicKey: "phase1_boss",
      introText:
        "Cada decision tiene costo politico. Necesitas defender evidencia minima, riesgos y criterios de aceptacion antes de comprometer fecha y presupuesto.",
      completionText:
        "Se aprueba una linea base defendible con alcance acotado, hitos medibles y control de cambios formal.",
      enemies: [
        {
          id: "comite-stakeholders",
          name: "Comite de Stakeholders",
          type: "boss",
          hp: 160,
          threat: 14,
          tags: ["scope", "approval", "politics"],
          intents: ["scope_pressure", "compliance_gate", "risk_spike", "delay"],
        },
      ],
      actionPoolId: [
        "escalate_committee",
        "negotiate_scope",
        "accept_conditioned_change",
        "replan_schedule",
        "apply_contingency",
        "reinforce_quality",
        "block_defective_release",
        "hold_position",
      ],
      bossRules: {
        thresholds: [
          {
            hpRatio: 0.7,
            intent: "delay",
            logText: "El comite exige comprimir cronograma sin reducir alcance comprometido.",
          },
          {
            hpRatio: 0.4,
            intent: "scope_pressure",
            logText: "Aparecen cambios de ultimo momento sin analisis de impacto.",
          },
          {
            hpRatio: 0.15,
            intent: "compliance_gate",
            logText: "Piden cierre politico inmediato con riesgos abiertos y evidencia incompleta.",
          },
        ],
      },
    },
  ],
};
```

## 8. Estado actual del contenido jugable

- Catálogo de acciones operativo para 3 roles + acción genérica, incluyendo decisiones temerarias por rol.
- Campaña completa de 5 niveles (1 por fase), con tandas por fase y tanda final boss + enemigos de soporte.
- Sistema de consecuencias disciplinarias progresivas por malas decisiones repetidas (advertencia formal y posible desvinculación).
- Música/SFX dinámica por pantalla y eventos clave.
- Sistema de resultados con score ponderado y ranking textual.

## 9. Scripts de desarrollo

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
```

## 10. Próximas extensiones técnicas sugeridas

- Introducir persistencia de run (localStorage o backend) para reanudar partidas.
- Añadir pruebas unitarias de resolvers (`decisionResolver`, `enemyResolver`, `scoringResolver`).
- Añadir pruebas automatizadas de comportamiento para estrategias temerarias (despidos progresivos por integrante y colapso total por malas decisiones globales).
- Separar explícitamente flujo legacy y flujo turn-based para evitar deuda de navegación.
