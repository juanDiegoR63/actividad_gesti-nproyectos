import type { DecisionOption } from "../types/game";

export const actionCatalog: DecisionOption[] = [
  {
    id: "negotiate_scope",
    actorRole: "director",
    title: "Negociar alcance",
    summary: "Reduce ruido de stakeholders y mantiene direccion.",
    description:
      "Alinea expectativas con el sponsor para reducir presion de cambios tempranos.",
    tags: ["scope", "stakeholder", "negotiation"],
    glossaryKeys: ["scope", "stakeholder"],
    requirements: { time: 1 },
    baseEffects: {
      project: { time: -1, risk: -2, progress: 4 },
      targetEnemy: { hp: -12, threat: -2 },
      actor: { stress: 2 },
    },
    debtEffects: {
      project: { risk: 8, quality: -5 },
      actor: { stress: 9 },
    },
    roleScaling: { director: 1.15, planning: 1, quality: 1 },
    luckProfile: "normal",
    targetMode: "single",
    narrativeResult: "La presion de alcance cae, pero el equipo gasta capacidad politica.",
  },
  {
    id: "escalate_committee",
    actorRole: "director",
    title: "Escalar al comite",
    summary: "Fuerza una definicion institucional mas rapida.",
    description:
      "Eleva el conflicto a nivel comite para destrabar una decision clave.",
    tags: ["scope", "integration", "stakeholder"],
    glossaryKeys: ["scope", "stakeholder"],
    requirements: { budget: 4, time: 2 },
    baseEffects: {
      project: { budget: -1, time: -2, risk: -2, quality: 1, progress: 4 },
      targetEnemy: { hp: -15, threat: -2 },
      actor: { stress: 6 },
    },
    debtEffects: {
      project: { risk: 10, quality: -5 },
      actor: { stress: 12 },
    },
    roleScaling: { director: 1.15, planning: 1, quality: 1 },
    luckProfile: "high",
    targetMode: "single",
    narrativeResult: "El bloqueo cae, pero la maniobra consume tiempo politico y operativo.",
  },
  {
    id: "accept_conditioned_change",
    actorRole: "director",
    title: "Aceptar cambio condicionado",
    summary: "Concede alcance con limites para sostener avance.",
    description:
      "Acepta cambio acotado para preservar relacion con stakeholders criticos.",
    tags: ["scope", "stakeholder"],
    glossaryKeys: ["scope", "stakeholder"],
    requirements: { minQuality: 55 },
    baseEffects: {
      project: { quality: -2, risk: 6, progress: 10 },
      targetEnemy: { hp: -10, threat: -1 },
      actor: { stress: 4 },
    },
    debtEffects: {
      project: { risk: 10, quality: -5, progress: -4 },
    },
    roleScaling: { director: 1.12, planning: 1, quality: 1 },
    luckProfile: "high",
    targetMode: "single",
    narrativeResult: "El proyecto avanza, pero se incrementa deuda de control.",
  },
  {
    id: "executive_war_room",
    actorRole: "director",
    title: "War room ejecutivo",
    summary: "Orquesta respuesta transversal para estabilizar varios frentes a la vez.",
    description:
      "Convoca liderazgo clave para coordinar decisiones simultaneas de alcance, riesgo y alineacion.",
    tags: ["integration", "scope", "control", "multi_target"],
    glossaryKeys: ["scope", "risk", "stakeholder"],
    requirements: { budget: 8, time: 2 },
    baseEffects: {
      project: { budget: -2, time: -1, risk: -3, progress: 4 },
      allEnemies: { hp: -8, threat: -2 },
      actor: { stress: 9 },
    },
    debtEffects: {
      project: { risk: 12, quality: -6, progress: -3 },
      actor: { stress: 11 },
    },
    roleScaling: { director: 1.18, planning: 1, quality: 1 },
    luckProfile: "high",
    targetMode: "all",
    narrativeResult:
      "Se reduce la presion multi-frente, pero la coordinacion ejecutiva consume capacidad critica.",
  },
  {
    id: "replan_schedule",
    actorRole: "planning",
    title: "Replanificar cronograma",
    summary: "Reordena tareas para proteger hitos.",
    description:
      "Ajusta secuencia y dependencias para reducir desviaciones de tiempo.",
    tags: ["schedule", "control"],
    glossaryKeys: ["schedule"],
    requirements: { time: 1 },
    baseEffects: {
      project: { time: -1, budget: -1, risk: -5, progress: 2 },
      targetEnemy: { hp: -9, threat: -2 },
      actor: { stress: 5 },
    },
    debtEffects: {
      project: { risk: 10 },
      actor: { stress: 12 },
    },
    roleScaling: { director: 1, planning: 1.15, quality: 1 },
    luckProfile: "normal",
    targetMode: "single",
    narrativeResult: "Se recupera orden del plan, sacrificando algo de margen.",
  },
  {
    id: "apply_contingency",
    actorRole: "planning",
    title: "Aplicar contingencia",
    summary: "Usa reserva para mitigar impacto mayor.",
    description:
      "Activa respuesta financiera para contener una desviacion critica.",
    tags: ["risk", "contingency", "cost"],
    glossaryKeys: ["risk", "contingency"],
    requirements: { budget: 6 },
    baseEffects: {
      project: { budget: -5, risk: -9, quality: 2, progress: 1 },
      targetEnemy: { hp: -8, threat: -3 },
      actor: { stress: 3 },
    },
    debtEffects: {
      project: { risk: 8, quality: -5 },
    },
    roleScaling: { director: 1, planning: 1.2, quality: 1 },
    luckProfile: "low",
    targetMode: "single",
    narrativeResult: "La crisis se contiene con costo financiero visible.",
  },
  {
    id: "defer_deliverable",
    actorRole: "planning",
    title: "Postergar entregable",
    summary: "Gana aire inmediato a costa de valor percibido.",
    description:
      "Retrasa un entregable para evitar colapso operativo durante el sprint.",
    tags: ["schedule", "scope", "risk"],
    glossaryKeys: ["schedule", "scope"],
    requirements: { maxRisk: 80 },
    baseEffects: {
      project: { time: 2, quality: -4, risk: 4, progress: -3 },
      targetEnemy: { hp: -5, threat: -1 },
      actor: { stress: -1 },
    },
    debtEffects: {
      project: { risk: 10 },
    },
    roleScaling: { director: 1, planning: 1.1, quality: 1 },
    luckProfile: "normal",
    targetMode: "single",
    narrativeResult: "El equipo respira, pero el valor comprometido se resiente.",
  },
  {
    id: "reinforce_quality",
    actorRole: "quality",
    title: "Aumentar control de calidad",
    summary: "Refuerza criterios para reducir retrabajo futuro.",
    description:
      "Incrementa validaciones antes de liberar entregables a stakeholders.",
    tags: ["quality", "risk", "control"],
    glossaryKeys: ["quality", "risk"],
    requirements: { time: 1, budget: 2 },
    baseEffects: {
      project: { time: -1, budget: -1, quality: 9, risk: -6, progress: -1 },
      targetEnemy: { hp: -11, threat: -2 },
      actor: { stress: 5 },
    },
    debtEffects: {
      project: { risk: 8, progress: -4 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1.2 },
    luckProfile: "low",
    targetMode: "single",
    narrativeResult: "Sube la robustez del proyecto y baja exposicion operacional.",
  },
  {
    id: "block_defective_release",
    actorRole: "quality",
    title: "Bloquear entrega defectuosa",
    summary: "Evita dano reputacional a cambio de presion de plazo.",
    description:
      "Detiene un release con alto riesgo para evitar una falla mayor.",
    tags: ["quality", "stakeholder", "risk"],
    glossaryKeys: ["quality", "risk"],
    requirements: { minQuality: 45 },
    baseEffects: {
      project: { time: -2, quality: 7, risk: -7, progress: -2 },
      targetEnemy: { hp: -13, threat: -2 },
      actor: { stress: 6 },
    },
    debtEffects: {
      project: { risk: 10, quality: -5 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1.18 },
    luckProfile: "normal",
    targetMode: "single",
    narrativeResult: "Se evita una falla grave, pero el cronograma sufre.",
  },
  {
    id: "document_exception",
    actorRole: "quality",
    title: "Documentar excepcion",
    summary: "Formaliza desvio y mantiene trazabilidad.",
    description:
      "Registra una excepcion aprobada para proteger auditoria futura.",
    tags: ["quality", "lessons", "compliance"],
    glossaryKeys: ["quality", "lessons"],
    requirements: { time: 1 },
    baseEffects: {
      project: { time: -1, quality: 2, risk: -2, progress: 0 },
      targetEnemy: { hp: -7, threat: -1 },
      actor: { stress: -1 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1.1 },
    luckProfile: "low",
    targetMode: "single",
    narrativeResult: "La gobernanza mejora y baja incertidumbre de control.",
  },
  {
    id: "mass_quality_sweep",
    actorRole: "quality",
    title: "Barrido de calidad masivo",
    summary: "Ataca defectos sistemicos en paralelo sobre todos los frentes abiertos.",
    description:
      "Refuerza criterios de aceptacion y auditoria cruzada para recortar riesgo en multiples amenazas.",
    tags: ["quality", "risk", "control", "multi_target"],
    glossaryKeys: ["quality", "risk", "lessons"],
    requirements: { budget: 5, time: 2, minQuality: 40 },
    baseEffects: {
      project: { budget: -1, time: -1, quality: 4, risk: -4, progress: 2 },
      allEnemies: { hp: -6, threat: -2 },
      actor: { stress: 8 },
    },
    debtEffects: {
      project: { risk: 10, quality: -4, progress: -3 },
      actor: { stress: 10 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1.18 },
    luckProfile: "normal",
    targetMode: "all",
    narrativeResult:
      "El frente de calidad se fortalece en conjunto, aunque el equipo paga el costo operativo inmediato.",
  },
  {
    id: "improvise_scope",
    actorRole: "director",
    title: "Improvisar alcance en reunion",
    summary: "Promete entregables sin analisis para calmar presion inmediata.",
    description:
      "Acepta compromisos no evaluados para salir de la reunion sin conflicto inmediato.",
    tags: ["reckless", "scope", "anti_pattern"],
    glossaryKeys: ["scope", "risk"],
    baseEffects: {
      project: { progress: 4, risk: 13, quality: -6, budget: -3, time: -2 },
      targetEnemy: { hp: -4, threat: 2 },
      actor: { stress: -2 },
    },
    debtEffects: {
      project: { risk: 8, quality: -4, progress: -3 },
      actor: { stress: 8 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1 },
    luckProfile: "high",
    targetMode: "single",
    narrativeResult: "Se gana aire politico hoy, pero se dispara deuda de alcance y control.",
  },
  {
    id: "skip_dependency_review",
    actorRole: "planning",
    title: "Saltar revision de dependencias",
    summary: "Acelera tareas ignorando impactos cruzados.",
    description:
      "Omite verificaciones de dependencias para aparentar avance rapido en el plan.",
    tags: ["reckless", "schedule", "anti_pattern"],
    glossaryKeys: ["schedule", "risk"],
    baseEffects: {
      project: { progress: 5, risk: 12, quality: -5, time: -3, budget: -2 },
      targetEnemy: { hp: -3, threat: 2 },
      actor: { stress: -1 },
    },
    debtEffects: {
      project: { risk: 7, time: -2, progress: -4 },
      actor: { stress: 8 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1 },
    luckProfile: "high",
    targetMode: "single",
    narrativeResult: "El cronograma parece mejorar, pero crecen cuellos de botella ocultos.",
  },
  {
    id: "bypass_quality_gate",
    actorRole: "quality",
    title: "Bypass de gate de calidad",
    summary: "Libera entregables defectuosos para mostrar velocidad.",
    description:
      "Desactiva validaciones minimas para acelerar salida y evitar discusiones tecnicas.",
    tags: ["reckless", "quality", "anti_pattern"],
    glossaryKeys: ["quality", "risk"],
    baseEffects: {
      project: { progress: 7, quality: -15, risk: 16, time: -2, budget: -1 },
      targetEnemy: { hp: -5, threat: 3 },
      actor: { stress: -3 },
    },
    debtEffects: {
      project: { risk: 10, quality: -7, progress: -5 },
      actor: { stress: 10 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1 },
    luckProfile: "high",
    targetMode: "single",
    narrativeResult:
      "Se reporta avance inmediato, pero el release queda expuesto a fallas graves.",
  },
  {
    id: "hold_position",
    actorRole: "any",
    title: "Esperar / Mantener posicion",
    summary: "Recupera foco, pero consume ventana de tiempo.",
    description:
      "Toma una pausa tactica para bajar estres y leer mejor la intencion enemiga.",
    tags: ["recovery", "schedule"],
    glossaryKeys: ["schedule", "risk"],
    requirements: { time: 1 },
    baseEffects: {
      project: { time: -1, risk: 1 },
      actor: { stress: -6 },
      targetEnemy: { threat: -1 },
    },
    roleScaling: { director: 1, planning: 1, quality: 1 },
    luckProfile: "low",
    targetMode: "self",
    narrativeResult: "El equipo se recompone, pero cede una porcion de iniciativa.",
  },
];

export const actionById = actionCatalog.reduce<Record<string, DecisionOption>>(
  (acc, option) => {
    acc[option.id] = option;
    return acc;
  },
  {},
);
