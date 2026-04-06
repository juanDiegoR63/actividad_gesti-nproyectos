export type GlossaryEntry = {
  key: string;
  label: string;
  shortDefinition: string;
  longDefinition?: string;
  relatedKeys?: string[];
};

export const glossaryEntries: GlossaryEntry[] = [
  {
    key: "scope",
    label: "Alcance",
    shortDefinition: "Conjunto de entregables y trabajo requerido para cumplir el proyecto.",
  },
  {
    key: "schedule",
    label: "Cronograma",
    shortDefinition: "Secuencia y duracion de actividades para completar objetivos.",
  },
  {
    key: "risk",
    label: "Riesgo",
    shortDefinition: "Probabilidad e impacto de eventos inciertos sobre el proyecto.",
  },
  {
    key: "quality",
    label: "Calidad",
    shortDefinition: "Grado en que los entregables cumplen requisitos acordados.",
  },
  {
    key: "stakeholder",
    label: "Stakeholder",
    shortDefinition: "Persona o grupo que puede afectar o ser afectado por el proyecto.",
  },
  {
    key: "contingency",
    label: "Contingencia",
    shortDefinition: "Reserva prevista para responder a riesgos identificados.",
  },
  {
    key: "lessons",
    label: "Lecciones aprendidas",
    shortDefinition: "Conocimiento documentado para mejorar desempeno futuro.",
  },
];

export const glossaryByKey = glossaryEntries.reduce<Record<string, GlossaryEntry>>(
  (acc, entry) => {
    acc[entry.key] = entry;
    return acc;
  },
  {},
);
