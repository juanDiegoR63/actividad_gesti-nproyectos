import type { PhaseDefinition } from "../../types/game";

export const phase1: PhaseDefinition = {
  id: "phase-1",
  title: "Fase 1: Inicio",
  theme: "charter, stakeholders y alcance inicial",
  introNarrative:
    "El proyecto arranca con expectativas altas y objetivos ambiguos. Debes traducir pedidos politicos a decisiones medibles antes de que se dispare el retrabajo.",
  encounters: [
    {
      id: "phase1-enc1",
      phaseId: "phase-1",
      title: "Kickoff Tenso",
      subtitle:
        "Un stakeholder exige tres cambios fuera de plan: reportes semanales extra, una integracion no presupuestada y adelantar la demo sin mover alcance ni fechas.",
      isBoss: false,
      background: "kickoff_room",
      musicKey: "phase1_normal",
      introText:
        "La reunion de arranque pasa de alineacion a presion comercial. Si aceptas cambios sin analisis de impacto, sube riesgo y se consume tiempo de forma reactiva.",
      completionText:
        "Se define un alcance minimo viable con criterios de entrada y salida para evaluar futuros pedidos.",
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
      subtitle:
        "El sponsor cambia prioridades en cada reunion: pide tablero diario, nuevos KPI y aprobaciones rapidas sin aclarar responsables ni dependencias.",
      isBoss: false,
      background: "stakeholder_hall",
      musicKey: "phase1_normal",
      introText:
        "Aparecen instrucciones contradictorias entre area usuaria y direccion. Debes convertir ambiguedad en acuerdos trazables para evitar retrabajo.",
      completionText:
        "Quedan acordadas reglas de cambio, responsables de aprobacion y ventanas de revision para sostener la fase.",
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
      subtitle:
        "Boss de fase: el comite exige firmar entregables parciales, recortar QA y aceptar alcance adicional antes de cerrar la linea base.",
      isBoss: true,
      background: "boardroom_boss",
      musicKey: "phase1_boss",
      introText:
        "Cada decision tiene costo politico. Necesitas defender evidencia minima, riesgos y criterios de aceptacion antes de comprometer fecha y presupuesto.",
      completionText:
        "Se aprueba una linea base defendible con alcance acotado, hitos medibles y control de cambios formal.",
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
            logText: "El comite exige comprimir cronograma sin reducir alcance comprometido.",
          },
          {
            hpRatio: 0.4,
            intent: "scope_pressure",
            logText: "Aparecen cambios de ultimo momento sin analisis de impacto.",
          },
          {
            hpRatio: 0.15,
            intent: "compliance_gate",
            logText: "Piden cierre politico inmediato con riesgos abiertos y evidencia incompleta.",
          },
        ],
      },
    },
  ],
};
