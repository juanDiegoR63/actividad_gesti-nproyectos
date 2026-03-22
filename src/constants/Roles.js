export const ROLES = {
  DIRECTOR: "director",
  PLANIFICACION: "planificacion",
  CALIDAD: "calidad",
};

export const ROLES_DEF = {
  [ROLES.DIRECTOR]: {
    nombre: "Director del Proyecto",
    descripcion:
      "Integra al equipo y toma decisiones críticas para que el proyecto avance.",
    sesgo: "avance", // Prioriza continuidad
    probabilidades: {
      principal: 0.5,
      neutra: 0.3,
      mediocre: 0.15,
      opuesta: 0.05,
    },
  },
  [ROLES.PLANIFICACION]: {
    nombre: "Responsable de Planificación y Control",
    descripcion:
      "Protege el presupuesto, vigila el cronograma y mitiga riesgos operativos.",
    sesgo: "control", // Prioriza costo, tiempo y reducción de riesgo
    probabilidades: {
      principal: 0.5,
      neutra: 0.3,
      mediocre: 0.15,
      opuesta: 0.05,
    },
  },
  [ROLES.CALIDAD]: {
    nombre: "Responsable de Interesados y Calidad",
    descripcion:
      "Asegura la satisfacción del cliente, la adopción y la calidad técnica.",
    sesgo: "calidad_valor", // Prioriza la aceptación y calidad
    probabilidades: {
      principal: 0.5,
      neutra: 0.3,
      mediocre: 0.15,
      opuesta: 0.05,
    },
  },
};

export const ETIQUETAS = {
  CONSERVADORA: "conservadora",
  AGRESIVA: "agresiva",
  CALIDAD: "orientada_a_calidad",
  CONTROL: "orientada_a_control",
  EQUILIBRADA: "equilibrada",
  STAKEHOLDERS: "orientada_a_stakeholders",
  RIESGO: "arriesgada",
};

export const METRICAS_INICIALES = {
  tiempoRestante: 12,
  presupuestoRestante: 150000,
  calidadProyecto: 100,
  riesgoProyecto: 20,
  satisfaccionStakeholders: 80,
  avanceProyecto: 0,
};
