import { ROLES, ETIQUETAS } from "../constants/Roles";

export const eventoFase = (fase) => {
  return baseDatos.eventos.filter((e) => e.fase === fase);
};

export const deciderOpcionAutomatica = (opciones, rolId) => {
  const prob = Math.random();
  const rolDef = {
    director: { sesgo: ETIQUETAS.EQUILIBRADA, backup: ETIQUETAS.AGRESIVA },
    planificacion: { sesgo: ETIQUETAS.CONTROL, backup: ETIQUETAS.CONSERVADORA },
    calidad: { sesgo: ETIQUETAS.CALIDAD, backup: ETIQUETAS.STAKEHOLDERS },
  };

  const sesgoPrincipal = rolDef[rolId].sesgo;
  const sesgoSecundario = rolDef[rolId].backup;

  if (prob < 0.5) {
    const opts = opciones.filter(
      (o) => o.etiquetas && o.etiquetas.includes(sesgoPrincipal),
    );
    if (opts.length > 0) return opts[Math.floor(Math.random() * opts.length)];
  } else if (prob < 0.8) {
    const opts = opciones.filter(
      (o) => o.etiquetas && o.etiquetas.includes(sesgoSecundario),
    );
    if (opts.length > 0) return opts[Math.floor(Math.random() * opts.length)];
  }

  return opciones[Math.floor(Math.random() * opciones.length)];
};

export const baseDatos = {
  fases: [
    { id: 0, titulo: "Configuración", clave: "config" },
    { id: 1, titulo: "Fase 1: Inicio", clave: "inicio" },
    { id: 2, titulo: "Fase 2: Planificación", clave: "planificacion" },
    { id: 3, titulo: "Fase 3: Ejecución", clave: "ejecucion" },
    { id: 4, titulo: "Fase 4: Monitoreo y Control", clave: "monitoreo" },
    { id: 5, titulo: "Fase 5: Cierre", clave: "cierre" },
  ],
  eventos: [
    {
      id: "i1",
      fase: "inicio",
      rol: "director",
      titulo: "Definir el objetivo principal del proyecto:",
      descripcion: "Definir el objetivo principal del proyecto:",
      opciones: [
        {
          texto: "Priorizar rapidez para salir al mercado",
          etiquetas: [
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: -10,
            riesgo: 10,
            satisfaccion: 5,
          },
        },
        {
          texto: "Priorizar calidad integral y adopción",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: -5000,
            calidad: 20,
            riesgo: -5,
            satisfaccion: 10,
          },
        },
        {
          texto: "Mantener estricto apego al presupuesto",
          etiquetas: ["orientada_a_control", "conservadora", "agresiva"],
          impactos: {
            tiempo: 0,
            presupuesto: 5000,
            calidad: -10,
            riesgo: 5,
            satisfaccion: -5,
          },
        },
      ],
    },
    {
      id: "i2",
      fase: "inicio",
      rol: "planificacion",
      titulo: "Identificar stakeholders prioritarios:",
      descripcion: "Identificar stakeholders prioritarios:",
      opciones: [
        {
          texto: "Foco en el patrocinador y reporte",
          etiquetas: [
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 0,
            riesgo: 10,
            satisfaccion: 10,
          },
        },
        {
          texto: "Foco en los usuarios finales e involucremiento",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: -2000,
            calidad: 15,
            riesgo: -10,
            satisfaccion: 15,
          },
        },
      ],
    },
    {
      id: "i3",
      fase: "inicio",
      rol: "calidad",
      titulo: "Seleccionar criterio de éxito:",
      descripcion: "Seleccionar criterio de éxito:",
      opciones: [
        {
          texto: "Cumplir fechas y presupuesto exacto (Predictivo)",
          etiquetas: ["equilibrada"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 0,
            riesgo: 0,
            satisfaccion: 0,
          },
        },
        {
          texto: "Valor entregado y adopción (Ágil)",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 0,
            presupuesto: -5000,
            calidad: 10,
            riesgo: -5,
            satisfaccion: 10,
          },
        },
      ],
    },
    {
      id: "i4",
      fase: "inicio",
      rol: "director",
      titulo: "Validar alcance inicial:",
      descripcion: "Validar alcance inicial:",
      opciones: [
        {
          texto: "Alcance estricto y firmado",
          etiquetas: ["orientada_a_control", "conservadora"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 0,
            riesgo: -15,
            satisfaccion: -5,
          },
        },
        {
          texto: "Alcance flexible con backlog",
          etiquetas: [
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: 0,
            calidad: 10,
            riesgo: 15,
            satisfaccion: 5,
          },
        },
      ],
    },
    {
      id: "i5",
      fase: "inicio",
      rol: "planificacion",
      titulo: "Designar enfoque de trabajo del equipo:",
      descripcion: "Designar enfoque de trabajo del equipo:",
      opciones: [
        {
          texto: "Formación de equipo interno",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -2,
            presupuesto: 10000,
            calidad: 5,
            riesgo: 10,
            satisfaccion: 5,
          },
        },
        {
          texto: "Contratar consultoría externa rápida",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 1,
            presupuesto: -20000,
            calidad: 10,
            riesgo: -10,
            satisfaccion: 10,
          },
        },
      ],
    },
    {
      id: "p1",
      fase: "planificacion",
      rol: "director",
      titulo: "Priorización del alcance:",
      descripcion: "Priorización del alcance:",
      opciones: [
        {
          texto: "Desarrollar todas las features solicitadas",
          etiquetas: [
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: -10000,
            calidad: 10,
            riesgo: 20,
            satisfaccion: 10,
          },
        },
        {
          texto: "Desarrollar un Producto Mínimo Viable (MVP)",
          etiquetas: ["orientada_a_control", "conservadora"],
          impactos: {
            tiempo: 2,
            presupuesto: 10000,
            calidad: -10,
            riesgo: -20,
            satisfaccion: -10,
          },
        },
      ],
    },
    {
      id: "p2",
      fase: "planificacion",
      rol: "planificacion",
      titulo: "Estrategia de respuestas a riesgos (retraso proveedor):",
      descripcion: "Estrategia de respuestas a riesgos (retraso proveedor):",
      opciones: [
        {
          texto: "Aceptar el riesgo (no hacer nada)",
          etiquetas: ["agresiva"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 0,
            riesgo: 15,
            satisfaccion: 0,
          },
        },
        {
          texto: "Mitigar (pagar póliza/urgencia)",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 0,
            presupuesto: -15000,
            calidad: 0,
            riesgo: -25,
            satisfaccion: 5,
          },
        },
      ],
    },
    {
      id: "p3",
      fase: "planificacion",
      rol: "calidad",
      titulo: "Estrategia de comunicación:",
      descripcion: "Estrategia de comunicación:",
      opciones: [
        {
          texto: "Reportes semanales en PDF",
          etiquetas: ["agresiva"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 0,
            riesgo: 5,
            satisfaccion: -5,
          },
        },
        {
          texto: "Dashboard en tiempo real interactivo",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: -5000,
            calidad: 5,
            riesgo: -10,
            satisfaccion: 20,
          },
        },
      ],
    },
    {
      id: "p4",
      fase: "planificacion",
      rol: "director",
      titulo: "Asignación de presupuesto (Reservas):",
      descripcion: "Asignación de presupuesto (Reservas):",
      opciones: [
        {
          texto: "No guardar reserva, invertir todo",
          etiquetas: [
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 15,
            riesgo: 30,
            satisfaccion: 10,
          },
        },
        {
          texto: "Guardar 15% como reserva de contingencia",
          etiquetas: ["orientada_a_control", "conservadora"],
          impactos: {
            tiempo: 0,
            presupuesto: -15000,
            calidad: -5,
            riesgo: -15,
            satisfaccion: 0,
          },
        },
      ],
    },
    {
      id: "p5",
      fase: "planificacion",
      rol: "planificacion",
      titulo: "Secuencia de actividades:",
      descripcion: "Secuencia de actividades:",
      opciones: [
        {
          texto: "Actividades en paralelo (Fast-tracking)",
          etiquetas: ["agresiva"],
          impactos: {
            tiempo: 2,
            presupuesto: -5000,
            calidad: -15,
            riesgo: 25,
            satisfaccion: 0,
          },
        },
        {
          texto: "Secuencia estricta y segura",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -2,
            presupuesto: 0,
            calidad: 10,
            riesgo: -10,
            satisfaccion: 5,
          },
        },
      ],
    },
    {
      id: "e1",
      fase: "ejecucion",
      rol: "planificacion",
      titulo: "Proveedor logístico declara fuerza mayor",
      descripcion:
        "El proveedor principal notifica posible retraso crítico de 4 semanas debido a problemas logísticos mundiales y aduanas.",
      opciones: [
        {
          texto:
            "Compresión de cronograma (Crashing): Inyectar dinero masivo para acelerar internamente y no perder tiempo.",
          etiquetas: ["agresiva", "orientada_a_tiempo"],
          impactos: {
            tiempo: 0,
            presupuesto: -25000,
            calidad: -5,
            riesgo: 15,
            satisfaccion: 0,
          },
        },
        {
          texto:
            "Ejecución rápida (Fast Tracking): Solapar fuertemente actividades que eran secuenciales, asumiendo grandes riesgos técnicos.",
          etiquetas: [
            "agresiva",
            "orientada_a_tiempo",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 2,
            presupuesto: 0,
            calidad: -15,
            riesgo: 35,
            satisfaccion: -5,
          },
        },
        {
          texto:
            "Aceptar el retraso estructural, actualizar línea base y gestionar el impacto a través del Comité (CCB).",
          etiquetas: ["conservadora", "orientada_a_control", "burocratica"],
          impactos: {
            tiempo: -4,
            presupuesto: -2000,
            calidad: 5,
            riesgo: -10,
            satisfaccion: -25,
          },
        },
      ],
    },
    {
      id: "e2",
      fase: "ejecucion",
      rol: "calidad",
      titulo: "Descubrimiento de 'Gold Plating' en el sistema",
      descripcion:
        "El equipo técnico añadió 'por iniciativa propia' elementos estéticos extra no solicitados. Un bug en ellos ahora bloquea todo el testeo.",
      opciones: [
        {
          texto:
            "Remover de cuajo la mejora y aplicar reproche estricto para ajustar a la Línea Base.",
          etiquetas: ["conservadora", "orientada_a_control", "estricta"],
          impactos: {
            tiempo: -1,
            presupuesto: 0,
            calidad: 0,
            riesgo: -15,
            satisfaccion: -10,
          },
        },
        {
          texto:
            "Apostar por la mejora (a los usuarios les gustará): dedicar horas extra en reparar el bug y mantener el añadido.",
          etiquetas: ["agresiva", "orientada_a_stakeholders"],
          impactos: {
            tiempo: -2,
            presupuesto: -10000,
            calidad: 15,
            riesgo: 25,
            satisfaccion: 20,
          },
        },
        {
          texto:
            "Frenar desarrollo, documentar el impacto y pedir al Sponsor o CCB una decisión oficial sobre qué hacer.",
          etiquetas: ["equilibrada", "burocratica"],
          impactos: {
            tiempo: -3,
            presupuesto: -2000,
            calidad: 5,
            riesgo: -5,
            satisfaccion: -5,
          },
        },
      ],
    },
    {
      id: "e3",
      fase: "ejecucion",
      rol: "director",
      titulo: "Exigencia Directiva: Adición Urgente al Alcance",
      descripcion:
        "El Patrocinador Ejecutivo exige incorporar una nueva métrica gerencial y su interfaz en mitad de las pruebas, saltándose los procesos.",
      opciones: [
        {
          texto:
            "Decir NO e insistir en los marcos PMBOK y el grave impacto en la estabilidad actual de pruebas.",
          etiquetas: ["conservadora", "estricta", "orientada_a_control"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 10,
            riesgo: -15,
            satisfaccion: -35,
          },
        },
        {
          texto:
            "Tomarlo como Solicitud Formal, detener pruebas y exigir aprobación oficial del Comité (CCB).",
          etiquetas: ["equilibrada", "orientada_a_calidad", "burocratica"],
          impactos: {
            tiempo: -2,
            presupuesto: -3000,
            calidad: 5,
            riesgo: 5,
            satisfaccion: -15,
          },
        },
        {
          texto:
            "¡El jefe es el jefe! Modificar y aplicar en caliente por orden directa, arriesgando componentes ya estables.",
          etiquetas: ["agresiva", "reactiva", "orientada_a_stakeholders"],
          impactos: {
            tiempo: -2,
            presupuesto: -20000,
            calidad: -25,
            riesgo: 40,
            satisfaccion: 25,
          },
        },
      ],
    },
    {
      id: "e4",
      fase: "ejecucion",
      rol: "director",
      titulo: "Conflicto Grave de Intereses en Equipo Técnico",
      descripcion:
        "Pausa total en operaciones: Dos líderes técnicos se acusan de saboteo arquitectónico por diferencias irreconciliables. Tienen al equipo dividido.",
      opciones: [
        {
          texto:
            "Forzar imposición directiva: Tomar la decisión del diseño unilateralmente y exigir cumplimiento (Forcing).",
          etiquetas: ["agresiva", "reaccional", "orientada_a_tiempo"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: -15,
            riesgo: 20,
            satisfaccion: -25,
          },
        },
        {
          texto:
            "Resolución PMBOK (Problem Solving/Colaborar): Negociar en formato Taller hasta desenredar o lograr un compromiso técnico.",
          etiquetas: [
            "conservadora",
            "equilibrada",
            "orientada_a_calidad",
            "negociadora",
          ],
          impactos: {
            tiempo: -3,
            presupuesto: -5000,
            calidad: 25,
            riesgo: -20,
            satisfaccion: 15,
          },
        },
        {
          texto:
            "Acomodar (Smoothing): Minimizar el conflicto, buscar puntos en común e ir avanzando de forma paralela en lo que estén de acuerdo.",
          etiquetas: ["equilibrada", "reactiva"],
          impactos: {
            tiempo: -1,
            presupuesto: 0,
            calidad: -5,
            riesgo: 30,
            satisfaccion: 5,
          },
        },
      ],
    },
    {
      id: "e5",
      fase: "ejecucion",
      rol: "planificacion",
      titulo: "Auditoría de Valor Ganado: CPI en 0.81",
      descripcion:
        "Los indicadores de EVM muestran rojos severos. El proyecto está gastando un 19% más de dinero del planificado para el avance físico real obtenido.",
      opciones: [
        {
          texto:
            "Drenar severamente la Reserva de Gestión inyectando subcontratos emergentes y horas extras para recomponer plazos.",
          etiquetas: ["agresiva", "reactiva", "orientada_a_tiempo"],
          impactos: {
            tiempo: 1,
            presupuesto: -35000,
            calidad: -10,
            riesgo: 25,
            satisfaccion: -5,
          },
        },
        {
          texto:
            "Optimización quirúrgica y rescate: Recortar drásticamente características opcionales y rebajar la calidad a lo mínimo aceptable legalmente.",
          etiquetas: ["conservadora", "orientada_a_control"],
          impactos: {
            tiempo: 0,
            presupuesto: 15000,
            calidad: -30,
            riesgo: 10,
            satisfaccion: -35,
          },
        },
        {
          texto:
            "Rebaselinización (PMBOK): Frenar el proyecto, aceptar la pérdida, recalcular el presupuesto estimado de término (EAC) y solicitar fondos adicionales.",
          etiquetas: ["equilibrada", "burocratica", "orientada_a_stakeholders"],
          impactos: {
            tiempo: -3,
            presupuesto: 35000,
            calidad: 5,
            riesgo: -10,
            satisfaccion: -25,
          },
        },
      ],
    },
    {
      id: "e6",
      fase: "ejecucion",
      rol: "calidad",
      titulo: "Fuerte Resistencia al Cambio en el Usuario Piloto",
      descripcion:
        "Los Stakeholders operativos finales expresan que la interfaz es enrevesada y que no piensan adoptar el sistema nuevo.",
      opciones: [
        {
          texto:
            "Apurar entrega ignorando quejas; la interfaz cumple todos los criterios definidos originalmente en la matriz de requisitos.",
          etiquetas: ["agresiva", "estricta", "orientada_a_control"],
          impactos: {
            tiempo: 1,
            presupuesto: 0,
            calidad: -15,
            riesgo: 35,
            satisfaccion: -40,
          },
        },
        {
          texto:
            "Sacrificar las fechas e invertir en un plan profundo de UX, Adopción y Gestión del Cambio Organizacional.",
          etiquetas: [
            "conservadora",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -4,
            presupuesto: -20000,
            calidad: 35,
            riesgo: -20,
            satisfaccion: 25,
          },
        },
        {
          texto:
            "Plan de Choque formativo: Charlas interactivas inmediatas e incentivos, inyectando horas soporte, sin frenar todo.",
          etiquetas: ["equilibrada", "negociadora"],
          impactos: {
            tiempo: -2,
            presupuesto: -8000,
            calidad: 15,
            riesgo: 5,
            satisfaccion: 10,
          },
        },
      ],
    },
    {
      id: "c1",
      fase: "monitoreo",
      rol: "director",
      titulo: "Acción sobre el Desempeño General:",
      descripcion: "Acción sobre el Desempeño General:",
      opciones: [
        {
          texto: "Replanificar cronograma formalmente",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: -2000,
            calidad: 5,
            riesgo: -15,
            satisfaccion: -5,
          },
        },
        {
          texto: "Mantener curso actual apostando a mejora natural",
          etiquetas: ["agresiva"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: -10,
            riesgo: 15,
            satisfaccion: -10,
          },
        },
      ],
    },
    {
      id: "c2",
      fase: "monitoreo",
      rol: "planificacion",
      titulo: "Acción sobre Presupuesto:",
      descripcion: "Acción sobre Presupuesto:",
      opciones: [
        {
          texto: "Solicitar fondo de reserva al patrocinador",
          etiquetas: ["orientada_a_control", "conservadora"],
          impactos: {
            tiempo: 0,
            presupuesto: 25000,
            calidad: 0,
            riesgo: -10,
            satisfaccion: -20,
          },
        },
        {
          texto: "Congelar contrataciones y optimizar",
          etiquetas: [
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: -15,
            riesgo: 10,
            satisfaccion: 5,
          },
        },
      ],
    },
    {
      id: "c3",
      fase: "monitoreo",
      rol: "calidad",
      titulo: "Acción sobre Calidad:",
      descripcion: "Acción sobre Calidad:",
      opciones: [
        {
          texto: "Auditoría externa profunda",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: -8000,
            calidad: 20,
            riesgo: -20,
            satisfaccion: 10,
          },
        },
        {
          texto: "Autoevaluación superficial",
          etiquetas: ["agresiva"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: -5,
            riesgo: 5,
            satisfaccion: 0,
          },
        },
      ],
    },
    {
      id: "c4",
      fase: "monitoreo",
      rol: "director",
      titulo: "Comunicación en crisis:",
      descripcion: "Comunicación en crisis:",
      opciones: [
        {
          texto: "Transparencia total y reuniones diarias de estado",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -1,
            presupuesto: 0,
            calidad: 10,
            riesgo: -15,
            satisfaccion: 15,
          },
        },
        {
          texto: "Ocultar desviaciones menores y proteger al equipo",
          etiquetas: ["agresiva"],
          impactos: {
            tiempo: 0,
            presupuesto: 0,
            calidad: 0,
            riesgo: 25,
            satisfaccion: -15,
          },
        },
      ],
    },
    {
      id: "c5",
      fase: "monitoreo",
      rol: "planificacion",
      titulo: "Afrontar la etapa final:",
      descripcion: "Afrontar la etapa final:",
      opciones: [
        {
          texto: "Congelamiento total de alcance (Cerrar grifo)",
          etiquetas: [
            "orientada_a_control",
            "conservadora",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: 1,
            presupuesto: 0,
            calidad: 5,
            riesgo: -20,
            satisfaccion: -5,
          },
        },
        {
          texto: "Permitir últimos cambios solicitados (Flexibilidad)",
          etiquetas: [
            "agresiva",
            "orientada_a_calidad",
            "orientada_a_stakeholders",
          ],
          impactos: {
            tiempo: -2,
            presupuesto: -10000,
            calidad: -10,
            riesgo: 20,
            satisfaccion: 20,
          },
        },
      ],
    },
  ],
};
