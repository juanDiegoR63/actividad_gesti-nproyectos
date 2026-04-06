import { BALANCE } from "../config/balance";
import type { LuckEvent, ProjectStats, TeamMember } from "../../types/game";

const positiveLuckEvents: LuckEvent[] = [
  {
    id: "luck-positive-sponsor",
    polarity: "positive",
    label: "Apoyo del sponsor",
    description: "Se destraba apoyo ejecutivo inesperado.",
    effects: { project: { budget: 3, risk: -3, progress: 3 } },
    weight: 3,
  },
  {
    id: "luck-positive-qa",
    polarity: "positive",
    label: "Hallazgo temprano de QA",
    description: "Se detecta una falla antes de impactar al cliente.",
    effects: { project: { quality: 4, risk: -4 } },
    weight: 2,
  },
  {
    id: "luck-positive-velocity",
    polarity: "positive",
    label: "Recuperacion de velocidad",
    description: "El equipo recupera ritmo operativo.",
    effects: { project: { time: 2, progress: 2 } },
    weight: 2,
  },
];

const negativeLuckEvents: LuckEvent[] = [
  {
    id: "luck-negative-provider",
    polarity: "negative",
    label: "Proveedor bloqueado",
    description: "Un proveedor critico retrasa entrega comprometida.",
    effects: { project: { time: -2, risk: 4 }, actor: { stress: 4 } },
    weight: 3,
  },
  {
    id: "luck-negative-rework",
    polarity: "negative",
    label: "Retrabajo inesperado",
    description: "Aparece retrabajo fuera de alcance planificado.",
    effects: { project: { budget: -3, quality: -2, risk: 3 } },
    weight: 3,
  },
  {
    id: "luck-negative-audit",
    polarity: "negative",
    label: "Auditoria con observaciones",
    description: "Se exige evidencia adicional con urgencia.",
    effects: { project: { time: -2, risk: 5 } },
    weight: 2,
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function weightedPick(events: LuckEvent[], rng: () => number): LuckEvent {
  const totalWeight = events.reduce((acc, event) => acc + event.weight, 0);
  let cursor = rng() * totalWeight;

  for (const event of events) {
    cursor -= event.weight;
    if (cursor <= 0) {
      return event;
    }
  }

  return events[events.length - 1];
}

function getAverageStress(team: TeamMember[]): number {
  const active = team.filter((member) => member.status !== "out");
  if (active.length === 0) {
    return 100;
  }

  const total = active.reduce((acc, member) => acc + member.stress, 0);
  return total / active.length;
}

function shouldUseNegativePool(project: ProjectStats, rng: () => number): boolean {
  if (project.risk > 60) {
    return rng() < 0.7;
  }

  if (project.risk >= 30) {
    return rng() < 0.5;
  }

  if (project.risk < 30 && project.quality > 70) {
    return rng() < 0.3;
  }

  return rng() < 0.5;
}

export function rollLuck(
  project: ProjectStats,
  team: TeamMember[],
  rng: () => number = Math.random,
): LuckEvent | null {
  const avgStress = getAverageStress(team);
  const chanceWithRisk =
    BALANCE.luck.baseChance +
    clamp((project.risk - 40) * BALANCE.luck.riskInfluence, 0, 0.03);
  const chanceWithStress =
    chanceWithRisk + clamp((avgStress - 50) * BALANCE.luck.stressInfluence, 0, 0.02);
  const finalChance = clamp(
    chanceWithStress,
    BALANCE.luck.baseChance,
    BALANCE.luck.maxChance,
  );

  if (rng() > finalChance) {
    return null;
  }

  const useNegative = shouldUseNegativePool(project, rng);
  const pool = useNegative ? negativeLuckEvents : positiveLuckEvents;
  return weightedPick(pool, rng);
}
