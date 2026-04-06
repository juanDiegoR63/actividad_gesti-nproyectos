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
        "Se define un alcance minimo viable y se ordenan canales para evitar cambios en sombra.",
      enemies: [
        {
          id: "stakeholder-hostil",
          name: "Stakeholder Hostil",
          type: "stakeholder",
          hp: 62,
          threat: 7,
          tags: ["scope", "pressure", "sponsor"],
          intents: ["scope_pressure", "misalignment", "delay"],
        },
        {
          id: "area-usuaria-ansiosa",
          name: "Area Usuaria Ansiosa",
          type: "department",
          hp: 52,
          threat: 5,
          tags: ["pressure", "misalignment", "scope"],
          intents: ["misalignment", "stakeholder_noise", "shadow_scope"],
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
          hp: 74,
          threat: 8,
          tags: ["scope", "alignment", "sponsor", "pressure"],
          intents: ["misalignment", "risk_spike", "shadow_scope"],
        },
        {
          id: "pmo-formalista",
          name: "PMO Formalista",
          type: "organization",
          hp: 62,
          threat: 7,
          tags: ["compliance", "gatekeeper", "audit", "institutional"],
          intents: ["approval_freeze", "audit_ping", "compliance_gate"],
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
        "Se aprueba una linea base defendible tras resistir bloqueo institucional y presion politica simultanea.",
      enemies: [
        {
          id: "comite-stakeholders",
          name: "Comite de Stakeholders",
          type: "boss",
          hp: 150,
          threat: 13,
          tags: ["scope", "approval", "politics", "pressure"],
          intents: ["scope_pressure", "shadow_scope", "risk_spike", "approval_freeze"],
        },
        {
          id: "secretario-aprobaciones",
          name: "Secretario de Aprobaciones",
          type: "organization",
          hp: 88,
          threat: 9,
          tags: ["support", "compliance", "gatekeeper", "approval"],
          intents: ["approval_freeze", "audit_ping", "passive_penalty"],
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
            intent: "approval_freeze",
            logText: "El comite congela aprobaciones y exige evidencia adicional inmediata.",
          },
          {
            hpRatio: 0.4,
            intent: "shadow_scope",
            logText: "Aparecen cambios de ultimo momento fuera del proceso formal.",
          },
          {
            hpRatio: 0.15,
            intent: "passive_penalty",
            logText: "El comite fuerza cierre politico inmediato con riesgo abierto y penalidad por indecision.",
          },
        ],
      },
    },
  ],
};
