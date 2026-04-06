import type { PhaseDefinition } from "../../types/game";

export const phase2: PhaseDefinition = {
  id: "phase-2",
  title: "Fase 2: Planificacion",
  theme: "dependencias, baseline y contratos criticos",
  introNarrative:
    "La visibilidad aumenta y cada desvio queda expuesto. Debes ordenar dependencias, contratos y aprobaciones antes de que el plan se vuelva inmanejable.",
  encounters: [
    {
      id: "phase2-enc1",
      phaseId: "phase-2",
      title: "Dependencias Sin Duenio",
      subtitle:
        "Las integraciones clave dependen de terceros sin responsable claro. Cada area interpreta prioridades de forma distinta y el backlog se distorsiona.",
      isBoss: false,
      background: "planning_room",
      musicKey: "phase1_normal",
      introText:
        "La planificacion se traba por acuerdos incompletos con proveedores y cambios de prioridad internos. Debes recuperar trazabilidad y orden de ejecucion.",
      completionText:
        "Se asignan responsables y ventanas de validacion para proteger el baseline.",
      enemies: [
        {
          id: "coordinador-proveedores",
          name: "Coordinador de Proveedores",
          type: "organization",
          hp: 82,
          threat: 8,
          tags: ["supplier", "procurement", "compliance", "gatekeeper"],
          intents: ["vendor_failure", "approval_freeze", "delay"],
        },
        {
          id: "analista-prioridades",
          name: "Analista de Prioridades",
          type: "department",
          hp: 76,
          threat: 7,
          tags: ["misalignment", "pressure", "scope"],
          intents: ["misalignment", "stakeholder_noise", "shadow_scope"],
        },
      ],
      actionPoolId: [
        "negotiate_scope",
        "replan_schedule",
        "apply_contingency",
        "document_exception",
        "hold_position",
      ],
    },
    {
      id: "phase2-boss",
      phaseId: "phase-2",
      title: "Junta de Planificacion",
      subtitle:
        "Boss de fase: la junta exige cerrar baseline, contratos y riesgos en una sola sesion, sin tolerancia para incertidumbre residual.",
      isBoss: true,
      background: "planning_boardroom",
      musicKey: "phase1_boss",
      introText:
        "Toda deuda de definicion acumulada vuelve en forma de bloqueos formales. Debes defender alcance, reservas y criterios de aprobacion.",
      completionText:
        "La linea base queda aprobada con compromisos verificables y reservas controladas.",
      enemies: [
        {
          id: "junta-planificacion",
          name: "Junta de Planificacion",
          type: "boss",
          hp: 175,
          threat: 14,
          tags: ["scope", "approval", "politics", "pressure"],
          intents: ["approval_freeze", "compliance_gate", "shadow_scope", "risk_spike"],
        },
        {
          id: "gestor-contratos",
          name: "Gestor de Contratos",
          type: "organization",
          hp: 95,
          threat: 10,
          tags: ["vendor", "supplier", "compliance", "support"],
          intents: ["vendor_failure", "audit_ping", "passive_penalty"],
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
      ],
      bossRules: {
        thresholds: [
          {
            hpRatio: 0.7,
            intent: "compliance_gate",
            logText: "La junta exige respaldo documental completo antes de continuar.",
          },
          {
            hpRatio: 0.4,
            intent: "approval_freeze",
            logText: "Se congela el baseline hasta responder observaciones criticas.",
          },
          {
            hpRatio: 0.15,
            intent: "passive_penalty",
            logText: "La junta penaliza indecision y fuerza compromisos inmediatos.",
          },
        ],
      },
    },
  ],
};
