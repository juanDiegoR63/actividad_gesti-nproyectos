import type { PhaseDefinition } from "../../types/game";

export const phase4: PhaseDefinition = {
  id: "phase-4",
  title: "Fase 4: Monitoreo y Control",
  theme: "kpi, auditoria y contencion de desvio",
  introNarrative:
    "Con el proyecto expuesto, los desbalances se vuelven visibles para toda la organizacion. Debes contener desvios sin perder la narrativa de avance.",
  encounters: [
    {
      id: "phase4-enc1",
      phaseId: "phase-4",
      title: "Desvio de KPI",
      subtitle:
        "Los indicadores no cierran y la mesa de metricas exige explicaciones inmediatas en cada ciclo.",
      isBoss: false,
      background: "control_center",
      musicKey: "phase1_normal",
      introText:
        "El foco pasa de producir a demostrar control. Una mala lectura de metricas puede disparar decisiones defensivas costosas.",
      completionText:
        "Se reestablece una lectura comun de KPIs y criterios de aceptacion.",
      enemies: [
        {
          id: "mesa-metricas",
          name: "Mesa de Metricas",
          type: "organization",
          hp: 96,
          threat: 10,
          tags: ["audit", "compliance", "pressure"],
          intents: ["audit_ping", "misalignment", "risk_spike", "critical_defect"],
        },
        {
          id: "sponsor-impaciente",
          name: "Sponsor Impaciente",
          type: "stakeholder",
          hp: 92,
          threat: 10,
          tags: ["sponsor", "pressure", "scope"],
          intents: ["scope_pressure", "approval_freeze", "stakeholder_noise", "funding_cut"],
        },
      ],
      actionPoolId: [
        "executive_war_room",
        "negotiate_scope",
        "replan_schedule",
        "apply_contingency",
        "reinforce_quality",
        "document_exception",
        "mass_quality_sweep",
      ],
    },
    {
      id: "phase4-boss",
      phaseId: "phase-4",
      title: "Comite de Control Ejecutivo",
      subtitle:
        "Boss de fase: el comite impone auditorias cruzadas y amenaza con recortar alcance si no reduces riesgo de inmediato.",
      isBoss: true,
      background: "executive_committee",
      musicKey: "phase1_boss",
      introText:
        "El proyecto entra en su examen mas duro. Debes demostrar control real bajo escrutinio permanente.",
      completionText:
        "Se supera el control ejecutivo con indicadores estabilizados y riesgo contenido.",
      enemies: [
        {
          id: "comite-control-ejecutivo",
          name: "Comite de Control Ejecutivo",
          type: "boss",
          hp: 205,
          threat: 16,
          tags: ["approval", "audit", "politics", "pressure"],
          intents: [
            "approval_freeze",
            "compliance_gate",
            "risk_spike",
            "shadow_scope",
            "passive_penalty",
            "critical_defect",
            "funding_cut",
            "multi_front_escalation",
          ],
        },
        {
          id: "oficina-riesgos",
          name: "Oficina de Riesgos",
          type: "organization",
          hp: 108,
          threat: 11,
          tags: ["risk", "support", "compliance"],
          intents: ["risk_spike", "audit_ping", "passive_penalty", "critical_defect"],
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
            hpRatio: 0.7,
            intent: "compliance_gate",
            logText: "El comite exige auditoria completa antes de autorizar siguiente hito.",
          },
          {
            hpRatio: 0.42,
            intent: "risk_spike",
            logText: "Se abren observaciones de alto impacto sobre riesgo residual.",
          },
          {
            hpRatio: 0.16,
            intent: "passive_penalty",
            logText: "El comite sanciona demora de respuesta y penaliza indecision.",
          },
        ],
      },
    },
  ],
};
