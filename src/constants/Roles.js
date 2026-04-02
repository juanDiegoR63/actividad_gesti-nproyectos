export const ROLES = {
  DIRECTOR: "director",
  PLANIFICACION: "planificacion",
  CALIDAD: "calidad",
};

export const ROLES_DEF = {
  [ROLES.DIRECTOR]: {
    nombre: "Director de Proyecto",
    descripcion:
      "Lidera al equipo y toma decisiones estratégicas para que el proyecto alcance sus hitos.",
    sesgo: "avance", // Prioriza continuidad
    probabilidades: {
      principal: 0.5,
      neutra: 0.3,
      mediocre: 0.15,
      opuesta: 0.05,
    },
  },
  [ROLES.PLANIFICACION]: {
    nombre: "Gerente de Planificación",
    descripcion:
      "Garantiza el uso eficiente del presupuesto y controla el cronograma ante desvíos.",
    sesgo: "control", // Prioriza costo, tiempo y reducción de riesgo
    probabilidades: {
      principal: 0.5,
      neutra: 0.3,
      mediocre: 0.15,
      opuesta: 0.05,
    },
  },
  [ROLES.CALIDAD]: {
    nombre: "Experto en Stakeholders",
    descripcion:
      "Asegura el cumplimiento de los estándares y mantiene la alta satisfacción de los inversores.",
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
  CONSERVADORA: "[Defensa Conservadora]",
  AGRESIVA: "[Ataque Agresivo]",
  CALIDAD: "[Hechizo de Calidad]",
  CONTROL: "[Control de Terreno]",
  EQUILIBRADA: "[Postura Equilibrada]",
  STAKEHOLDERS: "[Carisma de Gremio]",
  RIESGO: "[Danza de Espadas Arriesgada]",
};
