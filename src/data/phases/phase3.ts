import type { PhaseDefinition } from "../../types/game";

export const phase3: PhaseDefinition = {
  id: "phase-3",
  title: "Fase 3: Ejecucion",
  theme: "entrega incremental, integracion y retrabajo",
  introNarrative:
    "El trabajo entra en produccion real y la presion por mostrar avance aumenta. Debes equilibrar velocidad y control para evitar colapsar por retrabajo.",
  encounters: [
    {
      id: "phase3-enc1",
      phaseId: "phase-3",
      title: "Sprint Sobredemandado",
      subtitle:
        "Comercial agrega urgencias, tecnologia pide excepciones y el proveedor legacy retrasa interfaces clave.",
      isBoss: false,
      background: "execution_warroom",
      musicKey: "phase1_normal",
      introText:
        "La capacidad del equipo se tensiona entre promesas externas y deuda tecnica. Ceder sin criterio dispara riesgo operativo.",
      completionText:
        "Se delimita un sprint viable y se priorizan integraciones de mayor impacto.",
      enemies: [
        {
          id: "lider-tech",
          name: "Lider Tecnico Fragmentado",
          type: "department",
          hp: 90,
          threat: 9,
          tags: ["scope", "pressure", "integration"],
          intents: ["rework", "delay", "misalignment"],
        },
        {
          id: "area-comercial",
          name: "Area Comercial Impaciente",
          type: "stakeholder",
          hp: 88,
          threat: 9,
          tags: ["sponsor", "scope", "pressure"],
          intents: ["scope_pressure", "stakeholder_noise", "shadow_scope"],
        },
        {
          id: "proveedor-legacy",
          name: "Proveedor Legacy",
          type: "organization",
          hp: 82,
          threat: 8,
          tags: ["vendor", "supplier", "integration"],
          intents: ["vendor_failure", "delay", "budget_burn"],
        },
      ],
      actionPoolId: [
        "negotiate_scope",
        "accept_conditioned_change",
        "replan_schedule",
        "apply_contingency",
        "reinforce_quality",
      ],
    },
    {
      id: "phase3-boss",
      phaseId: "phase-3",
      title: "Directorio de Entrega",
      subtitle:
        "Boss de fase: direccion exige mostrar valor inmediato mientras recorta tolerancia a defectos y atrasos.",
      isBoss: true,
      background: "delivery_board",
      musicKey: "phase1_boss",
      introText:
        "La entrega intermedia define la credibilidad del proyecto. Necesitas ritmo, foco y disciplina de cambio.",
      completionText:
        "Se concreta una entrega defendible y se conserva control sobre deuda tecnica.",
      enemies: [
        {
          id: "directorio-entrega",
          name: "Directorio de Entrega",
          type: "boss",
          hp: 190,
          threat: 15,
          tags: ["approval", "politics", "scope", "pressure"],
          intents: ["scope_pressure", "approval_freeze", "quality_attack", "staff_loss"],
        },
        {
          id: "oficina-control",
          name: "Oficina de Control",
          type: "organization",
          hp: 102,
          threat: 11,
          tags: ["compliance", "gatekeeper", "support"],
          intents: ["compliance_gate", "audit_ping", "passive_penalty"],
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
        "hold_position",
      ],
      bossRules: {
        thresholds: [
          {
            hpRatio: 0.72,
            intent: "quality_attack",
            logText: "El directorio redobla exigencia sobre defectos en produccion.",
          },
          {
            hpRatio: 0.45,
            intent: "scope_pressure",
            logText: "Se agregan compromisos de alcance sin ampliar recursos.",
          },
          {
            hpRatio: 0.18,
            intent: "staff_loss",
            logText: "La fatiga operativa impacta directamente en la capacidad del equipo.",
          },
        ],
      },
    },
  ],
};
