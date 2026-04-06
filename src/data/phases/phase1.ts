import type { PhaseDefinition } from "../../types/game";

export const phase1: PhaseDefinition = {
  id: "phase-1",
  title: "Fase 1: Inicio",
  theme: "charter, stakeholders y alcance inicial",
  introNarrative:
    "El proyecto abre con presion politica y expectativas cruzadas. Debes ordenar el inicio antes de que se vuelva caotico.",
  encounters: [
    {
      id: "phase1-enc1",
      phaseId: "phase-1",
      title: "Kickoff Tenso",
      subtitle: "Un stakeholder hostil intenta imponer cambios prematuros.",
      isBoss: false,
      background: "kickoff_room",
      musicKey: "phase1_normal",
      introText:
        "La reunion de arranque se vuelve agresiva. El equipo debe recuperar control.",
      completionText: "El alcance base queda protegido para avanzar al siguiente frente.",
      enemies: [
        {
          id: "stakeholder-hostil",
          name: "Stakeholder Hostil",
          type: "stakeholder",
          hp: 70,
          threat: 8,
          tags: ["scope", "pressure"],
          intents: ["scope_pressure", "stakeholder_noise", "delay"],
        },
      ],
      actionPoolId: [
        "negotiate_scope",
        "accept_conditioned_change",
        "replan_schedule",
        "reinforce_quality",
        "hold_position",
      ],
    },
    {
      id: "phase1-enc2",
      phaseId: "phase-1",
      title: "Sponsor Ambiguo",
      subtitle: "La ambiguedad del sponsor eleva riesgo y retrabajo.",
      isBoss: false,
      background: "stakeholder_hall",
      musicKey: "phase1_normal",
      introText:
        "Las prioridades cambian sin aviso y se disparan decisiones reactivas.",
      completionText:
        "El equipo consigue cerrar compromisos minimos para sostener la fase.",
      enemies: [
        {
          id: "sponsor-ambiguo",
          name: "Sponsor Ambiguo",
          type: "stakeholder",
          hp: 80,
          threat: 10,
          tags: ["scope", "alignment"],
          intents: ["stakeholder_noise", "risk_spike", "delay"],
        },
      ],
      actionPoolId: [
        "escalate_committee",
        "negotiate_scope",
        "apply_contingency",
        "block_defective_release",
        "document_exception",
        "hold_position",
      ],
    },
    {
      id: "phase1-boss",
      phaseId: "phase-1",
      title: "Comite de Stakeholders",
      subtitle: "Boss de fase: presion institucional por compromiso prematuro.",
      isBoss: true,
      background: "boardroom_boss",
      musicKey: "phase1_boss",
      introText:
        "El comite exige definiciones rapidas. Cada error amplifica costo politico y riesgo.",
      completionText:
        "Se logra una linea base defendible y la fase de inicio queda completada.",
      enemies: [
        {
          id: "comite-stakeholders",
          name: "Comite de Stakeholders",
          type: "boss",
          hp: 160,
          threat: 14,
          tags: ["scope", "approval", "politics"],
          intents: ["scope_pressure", "compliance_gate", "risk_spike", "delay"],
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
            hpRatio: 0.7,
            intent: "delay",
            logText: "El comite entra en modo presion de plazo.",
          },
          {
            hpRatio: 0.4,
            intent: "scope_pressure",
            logText: "Se activan cambios de alcance de ultimo momento.",
          },
          {
            hpRatio: 0.15,
            intent: "compliance_gate",
            logText: "Exigen cierre politico inmediato con evidencia formal.",
          },
        ],
      },
    },
  ],
};
