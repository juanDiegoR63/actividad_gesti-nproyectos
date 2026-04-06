import { useGameStore } from "../src/core/store/gameStore";
import type {
  CharacterRole,
  DecisionOption,
  LogEntry,
  ProjectStats,
  ResourceRequirement,
  StartRunPayload,
  TurnToken,
} from "../src/types/game";

type Strategy =
  | "safe"
  | "aggressive"
  | "adaptive"
  | "passive"
  | "random"
  | "reckless_all"
  | "reckless_quality";

type RunResult = {
  strategy: Strategy;
  won: boolean;
  reason: string;
  turns: number;
  rounds: number;
  encounterIndex: number;
  debtWarnings: number;
  chainWarnings: number;
  passiveWarnings: number;
  disciplineWarnings: number;
  dismissals: number;
  outMembers: number;
  finalRisk: number;
  finalProgress: number;
  finalBudget: number;
  finalTime: number;
};

type Aggregate = {
  strategy: Strategy;
  runs: number;
  wins: number;
  winRate: number;
  avgTurns: number;
  avgRounds: number;
  avgDebtWarnings: number;
  avgChainWarnings: number;
  avgPassiveWarnings: number;
  avgDisciplineWarnings: number;
  avgDismissals: number;
  avgOutMembers: number;
  avgFinalRisk: number;
  avgFinalProgress: number;
  avgFinalBudget: number;
  avgFinalTime: number;
  defeatReasons: Record<string, number>;
};

const DEFAULT_PAYLOAD: StartRunPayload = {
  teamName: "BalanceBot",
  members: {
    director: "Director",
    planning: "Planning",
    quality: "Calidad",
  },
};

const ROLE_ORDER: CharacterRole[] = ["director", "planning", "quality"];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isRecklessOption(option: DecisionOption): boolean {
  return option.tags.includes("reckless");
}

function isDebt(project: ProjectStats, requirements?: ResourceRequirement): boolean {
  if (!requirements) {
    return false;
  }

  return (
    (requirements.budget != null && project.budget < requirements.budget) ||
    (requirements.time != null && project.time < requirements.time) ||
    (requirements.minQuality != null && project.quality < requirements.minQuality) ||
    (requirements.maxRisk != null && project.risk > requirements.maxRisk)
  );
}

function chooseTargetEnemyId(): string | undefined {
  const state = useGameStore.getState();
  const alive = state.enemies.filter((enemy) => enemy.hp > 0);
  const selected = [...alive].sort((a, b) => b.threat - a.threat)[0];
  return selected?.id;
}

function scoreAction(option: DecisionOption, strategy: Strategy): number {
  const state = useGameStore.getState();
  const debt = isDebt(state.project, option.requirements);
  const activeToken = state.activeTurnToken;

  if (strategy === "reckless_all") {
    return isRecklessOption(option) ? 20_000 : -10_000;
  }

  if (strategy === "reckless_quality" && activeToken === "quality") {
    return isRecklessOption(option) ? 20_000 : -10_000;
  }

  const effectiveStrategy = strategy === "reckless_quality" ? "safe" : strategy;
  const p = option.baseEffects.project ?? {};
  const e = option.baseEffects.targetEnemy ?? {};
  const a = option.baseEffects.actor ?? {};

  if (isRecklessOption(option) && effectiveStrategy !== "random") {
    return -20_000;
  }

  if (effectiveStrategy === "passive") {
    return option.id === "hold_position" ? 10_000 : -10_000;
  }

  if (effectiveStrategy === "random") {
    return Math.random() * 1000 - (debt ? 25 : 0);
  }

  if (effectiveStrategy === "aggressive") {
    let score = 0;
    score += (p.progress ?? 0) * 6;
    score += -(p.risk ?? 0) * 3;
    score += (e.hp ?? 0) * -2;
    score += (e.threat ?? 0) * -1;
    score += (p.time ?? 0) * 1.5;
    score += (p.budget ?? 0) * 1;
    score += (a.stress ?? 0) * -0.3;
    if (debt) score -= 40;
    return score;
  }

  if (effectiveStrategy === "adaptive") {
    const { project } = state;
    const highRisk = project.risk >= 55;
    const lowBudget = project.budget <= 22;
    const lowTime = project.time <= 20;

    let score = 0;
    score += (e.hp ?? 0) * -2.2;
    score += (e.threat ?? 0) * -1.8;
    score += (p.progress ?? 0) * 3.2;
    score += -(p.risk ?? 0) * (highRisk ? 6 : 3.5);
    score += (p.quality ?? 0) * (highRisk ? 2.2 : 1.2);
    score += (p.time ?? 0) * (lowTime ? 0.3 : 1.4);
    score += (p.budget ?? 0) * (lowBudget ? 4.5 : 1.5);
    score += (a.stress ?? 0) * -0.5;

    if (option.id === "hold_position") {
      score -= 45;
    }

    if (debt) {
      score -= 120;
    }

    return score;
  }

  let score = 0;
  score += -(p.risk ?? 0) * 5;
  score += (p.quality ?? 0) * 2.5;
  score += (p.progress ?? 0) * 2;
  score += (e.threat ?? 0) * -2;
  score += (p.time ?? 0) * 1;
  score += (p.budget ?? 0) * 0.8;
  score += (a.stress ?? 0) * -0.5;
  if (debt) score -= 90;
  return score;
}

function chooseActionIdForToken(token: TurnToken, strategy: Strategy): string | null {
  if (token === "enemy") {
    return null;
  }

  const state = useGameStore.getState();
  if (!state.availableActions.length) {
    return null;
  }

  const roleActions = state.availableActions.filter(
    (option) => option.actorRole === "any" || option.actorRole === token,
  );

  if (!roleActions.length) {
    return null;
  }

  const ranked = [...roleActions]
    .map((option) => ({ option, score: scoreAction(option, strategy) }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.option.id ?? null;
}

function tryResolveVacantRoles(): void {
  const state = useGameStore.getState();
  if (!state.vacantRoles.length) {
    return;
  }

  const usedCoverageCandidates = new Set<string>();

  for (const missingRole of state.vacantRoles) {
    const fresh = useGameStore.getState();
    const activeMembers = fresh.team.filter((member) => member.status !== "out");

    // If vacancies are too many for available staff, hire directly to avoid oscillating role swaps.
    if (activeMembers.length <= fresh.vacantRoles.length) {
      fresh.hireReplacementForRole(missingRole);
      continue;
    }

    const candidate = fresh.team.find(
      (member) =>
        member.status !== "out" &&
        member.assignedRole !== missingRole &&
        ROLE_ORDER.includes(member.assignedRole) &&
        member.assignedRole === member.role &&
        !usedCoverageCandidates.has(member.id),
    );

    if (candidate) {
      usedCoverageCandidates.add(candidate.id);
      fresh.applyCoverageChoice(candidate.id, missingRole);
      continue;
    }

    fresh.hireReplacementForRole(missingRole);
  }
}

function countWarnings(log: LogEntry[]): {
  debtWarnings: number;
  chainWarnings: number;
  passiveWarnings: number;
  disciplineWarnings: number;
  dismissals: number;
} {
  let debtWarnings = 0;
  let chainWarnings = 0;
  let passiveWarnings = 0;
  let disciplineWarnings = 0;
  let dismissals = 0;

  for (const entry of log) {
    const text = normalizeText(entry.text);
    if (text.includes("deuda activada")) {
      debtWarnings += 1;
    }
    if (text.includes("espiral de deuda") || text.includes("cadena de deuda")) {
      chainWarnings += 1;
    }
    if (text.includes("pasividad") || text.includes("indecision")) {
      passiveWarnings += 1;
    }
    if (text.includes("advertencia formal") || text.includes("evaluacion de desempeno")) {
      disciplineWarnings += 1;
    }
    if (text.includes("desvinculado")) {
      dismissals += 1;
    }
  }

  return {
    debtWarnings,
    chainWarnings,
    passiveWarnings,
    disciplineWarnings,
    dismissals,
  };
}

function runSingleSimulation(strategy: Strategy, maxSteps = 3000): RunResult {
  const store = useGameStore.getState();
  store.resetRun();
  store.startRun(DEFAULT_PAYLOAD);

  let steps = 0;

  while (steps < maxSteps) {
    steps += 1;
    const state = useGameStore.getState();

    if (state.currentScreen === "results") {
      const warnings = countWarnings(state.combatLog);

      return {
        strategy,
        won: !state.gameOverReason,
        reason: state.gameOverReason ?? "victory",
        turns: state.turnNumber,
        rounds: state.roundNumber,
        encounterIndex: state.encounterIndex,
        debtWarnings: warnings.debtWarnings,
        chainWarnings: warnings.chainWarnings,
        passiveWarnings: warnings.passiveWarnings,
        disciplineWarnings: warnings.disciplineWarnings,
        dismissals: warnings.dismissals,
        outMembers: state.team.filter((member) => member.status === "out").length,
        finalRisk: state.project.risk,
        finalProgress: state.project.progress,
        finalBudget: state.project.budget,
        finalTime: state.project.time,
      };
    }

    if (state.battleStatus === "victory") {
      tryResolveVacantRoles();
      useGameStore.getState().advanceEncounter();
      continue;
    }

    if (state.activeStaffingCrisis) {
      tryResolveVacantRoles();
      continue;
    }

    if (state.activeTurnToken === "enemy") {
      useGameStore.getState().resolveEnemyTurn();
      continue;
    }

    const actionId = chooseActionIdForToken(state.activeTurnToken, strategy);
    if (!actionId) {
      // Fallback to avoid dead loops if actions become unavailable unexpectedly.
      const fallback = state.availableActions[0]?.id;
      if (!fallback) {
        break;
      }

      useGameStore.getState().pickAction(fallback, chooseTargetEnemyId());
      continue;
    }

    useGameStore.getState().pickAction(actionId, chooseTargetEnemyId());
  }

  const stuck = useGameStore.getState();
  const warnings = countWarnings(stuck.combatLog);
  return {
    strategy,
    won: false,
    reason: "simulation_stuck",
    turns: stuck.turnNumber,
    rounds: stuck.roundNumber,
    encounterIndex: stuck.encounterIndex,
    debtWarnings: warnings.debtWarnings,
    chainWarnings: warnings.chainWarnings,
    passiveWarnings: warnings.passiveWarnings,
    disciplineWarnings: warnings.disciplineWarnings,
    dismissals: warnings.dismissals,
    outMembers: stuck.team.filter((member) => member.status === "out").length,
    finalRisk: stuck.project.risk,
    finalProgress: stuck.project.progress,
    finalBudget: stuck.project.budget,
    finalTime: stuck.project.time,
  };
}

function aggregateResults(results: RunResult[]): Aggregate[] {
  const byStrategy = new Map<Strategy, RunResult[]>();

  for (const result of results) {
    const list = byStrategy.get(result.strategy) ?? [];
    list.push(result);
    byStrategy.set(result.strategy, list);
  }

  const aggregates: Aggregate[] = [];

  for (const [strategy, list] of byStrategy.entries()) {
    const runs = list.length;
    const wins = list.filter((item) => item.won).length;
    const defeatReasons: Record<string, number> = {};

    for (const item of list) {
      if (!item.won) {
        defeatReasons[item.reason] = (defeatReasons[item.reason] ?? 0) + 1;
      }
    }

    const sum = <K extends keyof RunResult>(key: K): number =>
      list.reduce((acc, item) => acc + Number(item[key]), 0);

    aggregates.push({
      strategy,
      runs,
      wins,
      winRate: (wins / runs) * 100,
      avgTurns: sum("turns") / runs,
      avgRounds: sum("rounds") / runs,
      avgDebtWarnings: sum("debtWarnings") / runs,
      avgChainWarnings: sum("chainWarnings") / runs,
      avgPassiveWarnings: sum("passiveWarnings") / runs,
      avgDisciplineWarnings: sum("disciplineWarnings") / runs,
      avgDismissals: sum("dismissals") / runs,
      avgOutMembers: sum("outMembers") / runs,
      avgFinalRisk: sum("finalRisk") / runs,
      avgFinalProgress: sum("finalProgress") / runs,
      avgFinalBudget: sum("finalBudget") / runs,
      avgFinalTime: sum("finalTime") / runs,
      defeatReasons,
    });
  }

  return aggregates.sort((left, right) => left.strategy.localeCompare(right.strategy));
}

function printAggregate(aggregate: Aggregate): void {
  const reasons = Object.entries(aggregate.defeatReasons)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${reason}:${count}`)
    .join(", ");

  const reasonText = reasons || "-";

  console.log(`\n[${aggregate.strategy}] runs=${aggregate.runs} wins=${aggregate.wins} winRate=${aggregate.winRate.toFixed(1)}%`);
  console.log(
    ` turns=${aggregate.avgTurns.toFixed(1)} rounds=${aggregate.avgRounds.toFixed(1)} debt=${aggregate.avgDebtWarnings.toFixed(1)} chain=${aggregate.avgChainWarnings.toFixed(1)} passive=${aggregate.avgPassiveWarnings.toFixed(1)} discipline=${aggregate.avgDisciplineWarnings.toFixed(1)} dismissals=${aggregate.avgDismissals.toFixed(1)} out=${aggregate.avgOutMembers.toFixed(1)}`,
  );
  console.log(
    ` final: risk=${aggregate.avgFinalRisk.toFixed(1)} progress=${aggregate.avgFinalProgress.toFixed(1)} budget=${aggregate.avgFinalBudget.toFixed(1)} time=${aggregate.avgFinalTime.toFixed(1)}`,
  );
  console.log(` defeats: ${reasonText}`);
}

function parseRunsArg(): number {
  const raw = process.argv.find((arg: string) => arg.startsWith("--runs="));
  if (!raw) {
    return 20;
  }

  const parsed = Number(raw.replace("--runs=", ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.floor(parsed);
}

function main(): void {
  const runs = parseRunsArg();
  const strategies: Strategy[] = [
    "safe",
    "aggressive",
    "adaptive",
    "passive",
    "random",
    "reckless_all",
    "reckless_quality",
  ];
  const results: RunResult[] = [];

  console.log(`Balance smoke simulation starting. runsPerStrategy=${runs}`);

  for (const strategy of strategies) {
    for (let index = 0; index < runs; index += 1) {
      results.push(runSingleSimulation(strategy));
    }
  }

  const aggregates = aggregateResults(results);
  for (const aggregate of aggregates) {
    printAggregate(aggregate);
  }

  const safe = aggregates.find((item) => item.strategy === "safe");
  const aggressive = aggregates.find((item) => item.strategy === "aggressive");
  const adaptive = aggregates.find((item) => item.strategy === "adaptive");

  if (safe && aggressive && adaptive) {
    console.log("\nQuick sanity checks:");
    console.log(
      ` safe=${safe.winRate.toFixed(1)}% | aggressive=${aggressive.winRate.toFixed(1)}% | adaptive=${adaptive.winRate.toFixed(1)}%`,
    );
    if (adaptive.winRate < 20) {
      console.log(" -> Balance appears very hard for competent adaptive play.");
    } else if (adaptive.winRate > 80) {
      console.log(" -> Balance appears too soft for competent adaptive play.");
    } else {
      console.log(" -> Balance is in a medium challenge band for adaptive play.");
    }
  }
}

main();
