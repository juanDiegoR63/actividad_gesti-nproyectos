import { BALANCE } from "../config/balance";
import {
  FACE_STYLE_OPTIONS,
  GENDER_OPTIONS,
  getHairOptionsByGender,
  getPantsStyleOptionsByGender,
  getShirtStyleOptionsByGender,
  PANTS_COLOR_OPTIONS,
  SHIRT_COLOR_OPTIONS,
  SHOE_STYLE_OPTIONS,
  SKIN_TONE_OPTIONS,
} from "../../data/characterCosmetics";
import type {
  CharacterCosmetic,
  CharacterRole,
  Gender,
  ProjectStats,
  TeamMember,
} from "../../types/game";

const roleNames: Record<CharacterRole, string> = {
  director: "Director",
  planning: "Planificacion",
  quality: "Calidad",
};

const HISPANIC_FIRST_NAMES: Record<Gender, string[]> = {
  male: [
    "Mateo",
    "Santiago",
    "Diego",
    "Javier",
    "Andres",
    "Tomas",
    "Nicolas",
    "Bruno",
    "Adrian",
    "Emilio",
  ],
  female: [
    "Valeria",
    "Camila",
    "Daniela",
    "Lucia",
    "Carla",
    "Mariana",
    "Sofia",
    "Elena",
    "Paula",
    "Renata",
  ],
};

const HISPANIC_LAST_NAMES = [
  "Gonzalez",
  "Rodriguez",
  "Fernandez",
  "Lopez",
  "Martinez",
  "Perez",
  "Torres",
  "Herrera",
  "Castro",
  "Vargas",
  "Mendoza",
  "Navarro",
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomItem<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? items[0];
}

function createRandomCosmetic(): CharacterCosmetic {
  const gender = randomItem(GENDER_OPTIONS).value;
  const hairStyle = randomItem(getHairOptionsByGender(gender)).value;
  const shirtStyle = randomItem(getShirtStyleOptionsByGender(gender)).value;
  const pantsStyle = randomItem(getPantsStyleOptionsByGender(gender)).value;

  return {
    gender,
    hairStyle,
    skinTone: randomItem(SKIN_TONE_OPTIONS).value,
    shirtStyle,
    shirtColor: randomItem(SHIRT_COLOR_OPTIONS).value,
    pantsStyle,
    pantsColor: randomItem(PANTS_COLOR_OPTIONS).value,
    shoeStyle: randomItem(SHOE_STYLE_OPTIONS).value,
    faceStyle: randomItem(FACE_STYLE_OPTIONS).value,
  };
}

function createRandomHispanicName(gender: Gender, sequence: number): string {
  const firstName = randomItem(HISPANIC_FIRST_NAMES[gender]);
  const lastName = randomItem(HISPANIC_LAST_NAMES);
  const suffix = sequence > 1 ? ` ${sequence}` : "";
  return `${firstName} ${lastName}${suffix}`;
}

export function applyCoverage(
  team: TeamMember[],
  substituteId: string,
  missingRole: CharacterRole,
): TeamMember[] {
  return team.map((member) => {
    if (member.id !== substituteId) {
      return member;
    }

    return {
      ...member,
      assignedRole: missingRole,
      stress: clamp(
        member.stress + BALANCE.staffing.coverStressPenalty,
        0,
        member.maxStress,
      ),
      status: "covering_other_role",
    };
  });
}

export function createReplacement(role: CharacterRole, sequence = 1): TeamMember {
  const salary = BALANCE.team.salaryByRole[role];
  const cosmetic = createRandomCosmetic();

  return {
    id: `hire-${role}-${sequence}`,
    name: createRandomHispanicName(cosmetic.gender, sequence),
    role,
    isBaseMember: false,
    assignedRole: role,
    cosmetic,
    energy: Math.round(BALANCE.team.maxEnergy * 0.58),
    maxEnergy: BALANCE.team.maxEnergy,
    stress: 34,
    maxStress: BALANCE.team.maxStress,
    salary,
    status: "active",
    recklessDecisionCount: 0,
    decisionDebtCount: 0,
    disciplinaryStrikes: 0,
  };
}

export function hireReplacement(
  team: TeamMember[],
  project: ProjectStats,
  role: CharacterRole,
): {
  team: TeamMember[];
  project: ProjectStats;
  logText: string;
} {
  const sequence = team.filter((member) => member.role === role).length + 1;
  const replacement = createReplacement(role, sequence);

  const costByPercent = Math.round(project.budget * BALANCE.staffing.hireBudgetPercent);
  const salaryBase = BALANCE.team.salaryByRole[role];
  const budgetCost = Math.max(costByPercent, Math.round(salaryBase * 1.5));

  const rawBudget = clamp(project.budget - budgetCost, 0, project.maxBudget);
  const rawTime = clamp(project.time - BALANCE.staffing.hireTimePenalty, 0, project.maxTime);

  const updatedProject: ProjectStats = {
    ...project,
    budget: rawBudget,
    time: rawTime,
    risk: clamp(project.risk + BALANCE.staffing.hireRiskPenalty, 0, project.maxRisk),
    quality: clamp(
      project.quality - BALANCE.staffing.hireQualityPenalty,
      0,
      project.maxQuality,
    ),
  };

  let replaced = false;
  const updatedTeam: TeamMember[] = team.map((member) => {
    if (member.role === role && member.status === "out") {
      replaced = true;
      return {
        ...replacement,
        id: member.id,
      };
    }

    if (
      member.status === "covering_other_role" &&
      member.assignedRole === role &&
      member.role !== role
    ) {
      return {
        ...member,
        assignedRole: member.role,
        status: "active",
      };
    }

    return member;
  });

  return {
    project: updatedProject,
    team: updatedTeam,
    logText: replaced
      ? `Evento de contratacion: ${replacement.name} ingresa como ${roleNames[role]}. Impacto: presupuesto -${budgetCost}, tiempo -${BALANCE.staffing.hireTimePenalty}, riesgo +${BALANCE.staffing.hireRiskPenalty}, calidad -${BALANCE.staffing.hireQualityPenalty}.`
      : `Evento de contratacion: no se encontro una vacante activa para ${roleNames[role]}.`,
  };
}
