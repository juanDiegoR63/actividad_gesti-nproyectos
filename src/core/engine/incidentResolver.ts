import type {
  IncidentTriggerType,
  NarrativeIncident,
  ProjectScenario,
  ProjectStats,
} from "../../types/game";

type IncidentContext = {
  project: ProjectStats;
  passiveUsesInEncounter: number;
  debtActionsThisRound: number;
  chainPenaltyAppliedInRound: boolean;
  bossClock: number;
  isBossEncounter: boolean;
  turnNumber: number;
  lastIncidentTurn: number | null;
};

const DEFAULT_TRIGGER_CHANCE: Record<IncidentTriggerType, number> = {
  high_risk: 0.45,
  repeat_passive: 0.35,
  debt_chain: 0.55,
  boss_clock: 0.5,
  random: 0.08,
};

const INCIDENT_COOLDOWN_TURNS = 2;

function matchesTrigger(incident: NarrativeIncident, context: IncidentContext): boolean {
  switch (incident.trigger) {
    case "high_risk":
      return context.project.risk >= 62;
    case "repeat_passive":
      return context.passiveUsesInEncounter >= 2;
    case "debt_chain":
      return context.chainPenaltyAppliedInRound || context.debtActionsThisRound >= 2;
    case "boss_clock":
      return context.isBossEncounter && context.bossClock >= 2;
    case "random":
      return true;
    default:
      return false;
  }
}

function getIncidentChance(incident: NarrativeIncident): number {
  const fallbackChance = DEFAULT_TRIGGER_CHANCE[incident.trigger] ?? 0.1;
  const normalized = incident.chance ?? fallbackChance;
  return Math.max(0, Math.min(1, normalized));
}

function hasCooldownActive(context: IncidentContext): boolean {
  if (context.lastIncidentTurn == null) {
    return false;
  }

  return context.turnNumber - context.lastIncidentTurn < INCIDENT_COOLDOWN_TURNS;
}

function pickWeightedIncident(
  incidents: NarrativeIncident[],
  random: () => number,
): NarrativeIncident | null {
  if (!incidents.length) {
    return null;
  }

  const weighted = incidents.map((incident) => ({
    incident,
    weight: Math.max(0.001, getIncidentChance(incident)),
  }));

  const totalWeight = weighted.reduce((acc, entry) => acc + entry.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }

  let cursor = random() * totalWeight;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.incident;
    }
  }

  return weighted.at(-1)?.incident ?? null;
}

export function resolveNarrativeIncident(input: {
  scenario: ProjectScenario | null;
  context: IncidentContext;
  random?: () => number;
}): NarrativeIncident | null {
  const scenario = input.scenario;
  if (!scenario?.incidentPool.length) {
    return null;
  }

  if (hasCooldownActive(input.context)) {
    return null;
  }

  const random = input.random ?? Math.random;

  const triggerCandidates = scenario.incidentPool.filter((incident) =>
    matchesTrigger(incident, input.context),
  );

  if (!triggerCandidates.length) {
    return null;
  }

  const rolledCandidates = triggerCandidates.filter(
    (incident) => random() <= getIncidentChance(incident),
  );

  if (!rolledCandidates.length) {
    return null;
  }

  const sampled = pickWeightedIncident(rolledCandidates, random);
  if (!sampled) {
    return null;
  }

  return sampled;
}
