import type { ProjectScenario } from "../../types/game";

export const scenarioCatalog: ProjectScenario[] = [
  {
    id: "health-regional",
    name: "Hospital Regional",
    sector: "health",
    summary:
      "Migracion de sistemas clinicos con auditoria regulatoria estricta y alta sensibilidad operativa.",
    difficultyModifier: 1.05,
    phaseOverrides: {
      "phase-2": {
        title: "Fase 2: Planificacion Clinica",
        introNarrative:
          "Las dependencias incluyen laboratorio, farmacia y urgencias. La ventana de error es minima por impacto en continuidad asistencial.",
        encounterOverrides: {
          "phase2-boss": {
            title: "Comite Clinico-Regulatorio",
            subtitle:
              "La direccion medica y regulatoria exige baseline trazable por paciente y servicio critico.",
          },
        },
        actionOverrides: {
          reinforce_quality: {
            title: "Protocolizar control de calidad",
            summary: "Reduce riesgo clinico y evita retrabajo con impacto asistencial.",
            narrativeResult:
              "Se refuerzan protocolos clinicos y cae la probabilidad de incidentes criticos.",
          },
        },
      },
      "phase-4": {
        title: "Fase 4: Control Asistencial",
      },
    },
    incidentPool: [
      {
        id: "health-high-risk",
        title: "Escalamiento de Seguridad del Paciente",
        text: "El comite clinico abre un frente urgente y exige mitigaciones inmediatas.",
        trigger: "high_risk",
        chance: 0.56,
        severity: "high",
        effects: {
          project: { risk: 4, time: -1, quality: -1 },
        },
        tags: ["health", "safety"],
      },
      {
        id: "health-passive",
        title: "Acumulacion de Casos Pendientes",
        text: "Las decisiones postergadas generan cola operativa en servicios clinicos.",
        trigger: "repeat_passive",
        chance: 0.45,
        severity: "medium",
        effects: {
          project: { time: -1, progress: -1, risk: 2 },
        },
      },
      {
        id: "health-debt",
        title: "No Conformidad Regulatoria",
        text: "Una evidencia incompleta activa observacion regulatoria formal.",
        trigger: "debt_chain",
        chance: 0.7,
        severity: "high",
        effects: {
          project: { quality: -2, risk: 4, budget: -1 },
        },
      },
      {
        id: "health-random",
        title: "Donacion de Equipamiento",
        text: "Un sponsor habilita equipamiento adicional para absorber carga operativa.",
        trigger: "random",
        chance: 0.1,
        severity: "low",
        effects: {
          project: { budget: 2, quality: 1 },
        },
      },
    ],
  },
  {
    id: "fintech-core",
    name: "Core Bancario Digital",
    sector: "fintech",
    summary:
      "Programa de modernizacion transaccional con fuerte escrutinio de riesgo operacional y compliance.",
    difficultyModifier: 1.08,
    phaseOverrides: {
      "phase-3": {
        title: "Fase 3: Ejecucion Transaccional",
        introNarrative:
          "Cada release afecta operaciones criticas. La tolerancia a defectos en transacciones es casi nula.",
        encounterOverrides: {
          "phase3-enc2": {
            title: "Integracion de Canales Critica",
          },
          "phase3-boss": {
            title: "Comite de Riesgo Operacional",
            subtitle:
              "El comite exige evidencia de resiliencia y continuidad antes de autorizar despliegue.",
          },
        },
        actionOverrides: {
          apply_contingency: {
            title: "Activar reserva de continuidad",
            summary: "Mitiga riesgo operacional con costo financiero controlado.",
            narrativeResult:
              "Se activa contingencia de continuidad y se evita una caida de servicio mayor.",
          },
        },
      },
      "phase-5": {
        title: "Fase 5: Cierre y Certificacion",
      },
    },
    incidentPool: [
      {
        id: "fintech-high-risk",
        title: "Alerta de Riesgo Operacional",
        text: "Riesgos operativos superan umbral y se exige plan de contencion inmediato.",
        trigger: "high_risk",
        chance: 0.6,
        severity: "high",
        effects: {
          project: { risk: 5, budget: -1 },
        },
      },
      {
        id: "fintech-boss-clock",
        title: "Ventana de Mercado Cerrandose",
        text: "El directorio impone fecha de salida y reduce margen de ajuste.",
        trigger: "boss_clock",
        chance: 0.75,
        severity: "high",
        effects: {
          project: { time: -2, progress: -1, risk: 2 },
        },
      },
      {
        id: "fintech-debt",
        title: "Gap de Cumplimiento KYC",
        text: "Una decision en deuda revela incumplimientos de cumplimiento normativo.",
        trigger: "debt_chain",
        chance: 0.68,
        severity: "high",
        effects: {
          project: { quality: -2, risk: 3, progress: -1 },
        },
      },
      {
        id: "fintech-random",
        title: "Acuerdo de Integracion Favorable",
        text: "Un proveedor acelera soporte tecnico y reduce riesgo de despliegue.",
        trigger: "random",
        chance: 0.09,
        severity: "low",
        effects: {
          project: { time: 1, risk: -2 },
        },
      },
    ],
  },
  {
    id: "public-modernization",
    name: "Modernizacion Municipal",
    sector: "public",
    summary:
      "Digitalizacion de tramites con multiples dependencias institucionales y presion politica intermitente.",
    difficultyModifier: 1.02,
    phaseOverrides: {
      "phase-1": {
        title: "Fase 1: Arranque Institucional",
        introNarrative:
          "Las expectativas politicas superan la capacidad operativa inicial. La gobernanza del alcance es clave desde el primer dia.",
        actionOverrides: {
          negotiate_scope: {
            title: "Alinear alcance con gabinete",
            summary: "Reduce presion politica y acota compromisos publicos.",
            narrativeResult:
              "Se reduce el ruido politico y se protegen objetivos de alto valor ciudadano.",
          },
        },
      },
      "phase-4": {
        title: "Fase 4: Control Interinstitucional",
      },
    },
    incidentPool: [
      {
        id: "public-high-risk",
        title: "Interpelacion Institucional",
        text: "Un desvio visible genera cuestionamientos politicos y aumenta el riesgo.",
        trigger: "high_risk",
        chance: 0.52,
        severity: "medium",
        effects: {
          project: { risk: 3, progress: -1 },
        },
      },
      {
        id: "public-passive",
        title: "Mesa Tecnica Suspendida",
        text: "La demora en decidir posterga acuerdos entre areas clave.",
        trigger: "repeat_passive",
        chance: 0.42,
        severity: "medium",
        effects: {
          project: { time: -1, risk: 2 },
        },
      },
      {
        id: "public-debt",
        title: "Reclamo Formal por Entregable",
        text: "Una decision en deuda activa un reclamo administrativo.",
        trigger: "debt_chain",
        chance: 0.66,
        severity: "high",
        effects: {
          project: { budget: -1, quality: -1, risk: 3 },
        },
      },
      {
        id: "public-random",
        title: "Apoyo de Organismo Externo",
        text: "Un organismo asociado aporta asistencia metodologica al equipo.",
        trigger: "random",
        chance: 0.11,
        severity: "low",
        effects: {
          project: { quality: 2, risk: -1 },
        },
      },
    ],
  },
  {
    id: "retail-omnichannel",
    name: "Retail Omnicanal",
    sector: "retail",
    summary:
      "Transformacion comercial con picos de demanda, integraciones de stock y presion por fecha de campaña.",
    difficultyModifier: 1.04,
    phaseOverrides: {
      "phase-3": {
        title: "Fase 3: Ejecucion Comercial",
      },
      "phase-5": {
        title: "Fase 5: Cierre de Campaña",
        encounterOverrides: {
          "phase5-boss": {
            title: "Directorio de Campaña Final",
            subtitle:
              "La direccion comercial valida cierre y exige resultados de conversion con soporte post-lanzamiento.",
          },
        },
      },
    },
    incidentPool: [
      {
        id: "retail-high-risk",
        title: "Caida de Conversacion Cliente",
        text: "La experiencia omnicanal se degrada y crece el riesgo reputacional.",
        trigger: "high_risk",
        chance: 0.54,
        severity: "medium",
        effects: {
          project: { risk: 3, quality: -1 },
        },
      },
      {
        id: "retail-boss",
        title: "Pico de Demanda Inesperado",
        text: "La presion del mercado acelera decisiones y comprime el margen operativo.",
        trigger: "boss_clock",
        chance: 0.72,
        severity: "high",
        effects: {
          project: { time: -2, budget: -1, risk: 2 },
        },
      },
      {
        id: "retail-passive",
        title: "Backlog Comercial Acumulado",
        text: "La falta de respuesta abre pedidos fuera de proceso y baja foco del equipo.",
        trigger: "repeat_passive",
        chance: 0.43,
        severity: "medium",
        effects: {
          project: { progress: -1, risk: 2 },
        },
      },
      {
        id: "retail-random",
        title: "Campaña Viral Favorable",
        text: "Una reaccion positiva del mercado mejora el margen para estabilizar la entrega.",
        trigger: "random",
        chance: 0.1,
        severity: "low",
        effects: {
          project: { budget: 2, progress: 1 },
        },
      },
    ],
  },
];

export const scenarioById = scenarioCatalog.reduce<Record<string, ProjectScenario>>(
  (acc, scenario) => {
    acc[scenario.id] = scenario;
    return acc;
  },
  {},
);

export function getScenarioById(scenarioId?: string): ProjectScenario | null {
  if (!scenarioId) {
    return null;
  }

  return scenarioById[scenarioId] ?? null;
}

export function pickRandomScenario(): ProjectScenario {
  if (!scenarioCatalog.length) {
    throw new Error("No hay escenarios definidos.");
  }

  const index = Math.floor(Math.random() * scenarioCatalog.length);
  return scenarioCatalog[index] ?? scenarioCatalog[0];
}
