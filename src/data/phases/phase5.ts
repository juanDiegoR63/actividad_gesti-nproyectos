import type { PhaseDefinition } from "../../types/game";

export const phase5: PhaseDefinition = {
  id: "phase-5",
  title: "Fase 5: Cierre",
  theme: "handover, aceptacion y lecciones aprendidas",
  introNarrative:
    "Llegar al final no garantiza exito. Debes cerrar frentes abiertos, transferir operacion y sostener la calidad bajo presion final.",
  encounters: [
    {
      id: "phase5-enc1",
      phaseId: "phase-5",
      title: "Transicion Operativa",
      subtitle:
        "Operaciones exige soporte extendido y auditoria de cierre antes de aceptar la transferencia del servicio.",
      isBoss: false,
      background: "handover_room",
      musicKey: "phase1_normal",
      introText:
        "El handover puede erosionar rapidamente tiempo y calidad si no se gobiernan expectativas de soporte.",
      completionText:
        "Se aprueba una transicion controlada con criterios claros de aceptacion.",
      enemies: [
        {
          id: "lider-operaciones",
          name: "Lider de Operaciones",
          type: "department",
          hp: 98,
          threat: 10,
          tags: ["handover", "quality", "pressure"],
          intents: ["quality_attack", "misalignment", "delay", "critical_defect"],
        },
        {
          id: "auditor-cierre",
          name: "Auditor de Cierre",
          type: "organization",
          hp: 100,
          threat: 10,
          tags: ["audit", "compliance", "gatekeeper"],
          intents: ["audit_ping", "compliance_gate", "approval_freeze", "critical_defect"],
        },
      ],
      actionPoolId: [
        "executive_war_room",
        "replan_schedule",
        "apply_contingency",
        "reinforce_quality",
        "block_defective_release",
        "document_exception",
        "mass_quality_sweep",
      ],
    },
    {
      id: "phase5-boss",
      phaseId: "phase-5",
      title: "Consejo de Cierre",
      subtitle:
        "Boss final: el consejo exige resultados, KPIs finales y transferencia completa sin margen para retrabajo.",
      isBoss: true,
      background: "closing_board",
      musicKey: "phase1_boss",
      introText:
        "Es el examen final del proyecto. Cualquier deuda abierta puede convertirse en bloqueo institucional definitivo.",
      completionText:
        "El proyecto se cierra con aceptacion formal y transferencia operativa exitosa.",
      enemies: [
        {
          id: "consejo-cierre",
          name: "Consejo de Cierre",
          type: "boss",
          hp: 225,
          threat: 18,
          tags: ["approval", "politics", "scope", "pressure"],
          intents: [
            "approval_freeze",
            "shadow_scope",
            "scope_pressure",
            "risk_spike",
            "staff_loss",
            "passive_penalty",
            "critical_defect",
            "funding_cut",
            "multi_front_escalation",
          ],
        },
        {
          id: "auditor-final",
          name: "Auditor Final",
          type: "organization",
          hp: 112,
          threat: 12,
          tags: ["audit", "compliance", "support"],
          intents: [
            "compliance_gate",
            "audit_ping",
            "passive_penalty",
            "critical_defect",
            "funding_cut",
          ],
        },
      ],
      actionPoolId: [
        "escalate_committee",
        "executive_war_room",
        "negotiate_scope",
        "accept_conditioned_change",
        "replan_schedule",
        "apply_contingency",
        "reinforce_quality",
        "block_defective_release",
        "mass_quality_sweep",
      ],
      bossRules: {
        thresholds: [
          {
            hpRatio: 0.72,
            intent: "approval_freeze",
            logText: "El consejo congela la aceptacion final hasta cerrar todas las observaciones.",
          },
          {
            hpRatio: 0.45,
            intent: "shadow_scope",
            logText: "Aparecen exigencias de ultimo momento fuera de alcance aprobado.",
          },
          {
            hpRatio: 0.18,
            intent: "passive_penalty",
            logText: "El consejo impone cierre forzado con penalidad por indecision.",
          },
        ],
      },
    },
  ],
};
