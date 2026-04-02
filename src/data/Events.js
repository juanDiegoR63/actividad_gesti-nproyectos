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

  const sesgoPrincipal = rolDef[rolId]?.sesgo || ETIQUETAS.CONSERVADORA;
  const sesgoSecundario = rolDef[rolId]?.backup || ETIQUETAS.EQUILIBRADA;

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
    { id: 0, titulo: "¡Encuentro Salvaje: Configuración!", clave: "config" },
    { id: 1, titulo: "¡Encuentro Salvaje: Fase 1: Inicio!", clave: "inicio" },
    {
      id: 2,
      titulo: "¡Encuentro Salvaje: Fase 2: Planificación!",
      clave: "planificacion",
    },
    {
      id: 3,
      titulo: "¡Encuentro Salvaje: Fase 3: Ejecución!",
      clave: "ejecucion",
    },
    {
      id: 4,
      titulo: "¡Encuentro Salvaje: Fase 4: Monitoreo y Control!",
      clave: "monitoreo",
    },
    { id: 5, titulo: "¡Encuentro Salvaje: Fase 5: Cierre!", clave: "cierre" },
  ],
  eventos: [
    {
      id: "i1",
      fase: "inicio",
      rol: "director",
      titulo:
        "¡Encuentro Salvaje: ¡Un Stakeholder Salvaje ha aparecido con un alcance sorpresa!!",
      descripcion:
        "El grupo se enfrenta a un desafío: El Jefe de Ventas ha lanzado una petición fuera de lugar bloqueando el paso.",
      opciones: [
        {
          texto: "Cargar de frente y lanzar el proyecto de inmediato",
          etiquetas: [
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 0,
            hp: 0,
            ac: -10,
            falloCritico: 10,
            mp: 5,
          },
        },
        {
          texto: "Casttear Hechizo de Planificación Integral",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: -5000,
            ac: 20,
            falloCritico: -5,
            mp: 10,
          },
        },
        {
          texto: "Mantener postura defensiva estricta al presupuesto",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
          ],
          impactos: {
            ap: 0,
            hp: 5000,
            ac: -10,
            falloCritico: 5,
            mp: -5,
          },
        },
      ],
    },
    {
      id: "i2",
      fase: "inicio",
      rol: "planificacion",
      titulo: "¡Encuentro Salvaje: ¡La Caverna de los Stakeholders!!",
      descripcion:
        "El grupo se enfrenta a un desafío: Debes identificar a los aliados prioritarios para tu grupo:",
      opciones: [
        {
          texto: "Foco en el patrocinador y reporte",
          etiquetas: [
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 0,
            falloCritico: 10,
            mp: 10,
          },
        },
        {
          texto: "Foco en los usuarios finales e involucremiento",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: -2000,
            ac: 15,
            falloCritico: -10,
            mp: 15,
          },
        },
      ],
    },
    {
      id: "i3",
      fase: "inicio",
      rol: "calidad",
      titulo: "¡Encuentro Salvaje: Seleccionar criterio de éxito:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Seleccionar criterio de éxito:",
      opciones: [
        {
          texto: "Cumplir fechas y presupuesto exacto (Predictivo)",
          etiquetas: ["[Postura Equilibrada]"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 0,
            falloCritico: 0,
            mp: 0,
          },
        },
        {
          texto: "Valor entregado y adopción (Ágil)",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 0,
            hp: -5000,
            ac: 10,
            falloCritico: -5,
            mp: 10,
          },
        },
      ],
    },
    {
      id: "i4",
      fase: "inicio",
      rol: "director",
      titulo: "¡Encuentro Salvaje: Validar alcance inicial:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Validar alcance inicial:",
      opciones: [
        {
          texto: "Alcance estricto y firmado",
          etiquetas: ["[Control de Terreno]", "[Defensa Conservadora]"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 0,
            falloCritico: -15,
            mp: -5,
          },
        },
        {
          texto: "Alcance flexible con backlog",
          etiquetas: [
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: 0,
            ac: 10,
            falloCritico: 15,
            mp: 5,
          },
        },
      ],
    },
    {
      id: "i5",
      fase: "inicio",
      rol: "planificacion",
      titulo: "¡Encuentro Salvaje: Designar enfoque de trabajo del equipo:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Designar enfoque de trabajo del equipo:",
      opciones: [
        {
          texto: "Formación de equipo interno",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -2,
            hp: 10000,
            ac: 5,
            falloCritico: 10,
            mp: 5,
          },
        },
        {
          texto: "Contratar consultoría externa rápida",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 1,
            hp: -20000,
            ac: 10,
            falloCritico: -10,
            mp: 10,
          },
        },
      ],
    },
    {
      id: "p1",
      fase: "planificacion",
      rol: "director",
      titulo: "¡Encuentro Salvaje: Priorización del alcance:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Priorización del alcance:",
      opciones: [
        {
          texto: "Desarrollar todas las features solicitadas",
          etiquetas: [
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: -10000,
            ac: 10,
            falloCritico: 20,
            mp: 10,
          },
        },
        {
          texto: "Desarrollar un Producto Mínimo Viable (MVP)",
          etiquetas: ["[Control de Terreno]", "[Defensa Conservadora]"],
          impactos: {
            ap: 2,
            hp: 10000,
            ac: -10,
            falloCritico: -20,
            mp: -10,
          },
        },
      ],
    },
    {
      id: "p2",
      fase: "planificacion",
      rol: "planificacion",
      titulo:
        "¡Encuentro Salvaje: Estrategia de respuestas a riesgos (retraso proveedor):!",
      descripcion:
        "El grupo se enfrenta a un desafío: Estrategia de respuestas a riesgos (retraso proveedor):",
      opciones: [
        {
          texto: "Aceptar el riesgo (no hacer nada)",
          etiquetas: ["[Ataque Agresivo]"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 0,
            falloCritico: 15,
            mp: 0,
          },
        },
        {
          texto: "Mitigar (pagar póliza/urgencia)",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 0,
            hp: -15000,
            ac: 0,
            falloCritico: -25,
            mp: 5,
          },
        },
      ],
    },
    {
      id: "p3",
      fase: "planificacion",
      rol: "calidad",
      titulo: "¡Encuentro Salvaje: Estrategia de comunicación:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Estrategia de comunicación:",
      opciones: [
        {
          texto: "Reportes semanales en PDF",
          etiquetas: ["[Ataque Agresivo]"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 0,
            falloCritico: 5,
            mp: -5,
          },
        },
        {
          texto: "Dashboard en tiempo real interactivo",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: -5000,
            ac: 5,
            falloCritico: -10,
            mp: 20,
          },
        },
      ],
    },
    {
      id: "p4",
      fase: "planificacion",
      rol: "director",
      titulo: "¡Encuentro Salvaje: Asignación de presupuesto (Reservas):!",
      descripcion:
        "El grupo se enfrenta a un desafío: Asignación de presupuesto (Reservas):",
      opciones: [
        {
          texto: "No guardar reserva, invertir todo",
          etiquetas: [
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 15,
            falloCritico: 30,
            mp: 10,
          },
        },
        {
          texto: "Guardar 15% como reserva de contingencia",
          etiquetas: ["[Control de Terreno]", "[Defensa Conservadora]"],
          impactos: {
            ap: 0,
            hp: -15000,
            ac: -5,
            falloCritico: -15,
            mp: 0,
          },
        },
      ],
    },
    {
      id: "p5",
      fase: "planificacion",
      rol: "planificacion",
      titulo: "¡Encuentro Salvaje: Secuencia de actividades:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Secuencia de actividades:",
      opciones: [
        {
          texto: "Actividades en paralelo (Fast-tracking)",
          etiquetas: ["[Ataque Agresivo]"],
          impactos: {
            ap: 2,
            hp: -5000,
            ac: -15,
            falloCritico: 25,
            mp: 0,
          },
        },
        {
          texto: "Secuencia estricta y segura",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -2,
            hp: 0,
            ac: 10,
            falloCritico: -10,
            mp: 5,
          },
        },
      ],
    },
    {
      id: "e1",
      fase: "ejecucion",
      rol: "planificacion",
      titulo: "¡Encuentro Salvaje: Proveedor logístico declara fuerza mayor!",
      descripcion:
        "El grupo se enfrenta a un desafío: El proveedor principal notifica posible retraso crítico de 4 semanas debido a problemas logísticos mundiales y aduanas.",
      // Estructura estocástica: cada impacto tiene un valor base y opcionalmente un riesgoOculto
      estocastico: true,
      opciones: [
        {
          texto:
            "Compresión de cronograma (Crashing): Inyectar dinero masivo para acelerar internamente y no perder tiempo.",
          etiquetas: ["[Ataque Agresivo]", "orientada_a_tiempo"],
          impactos: {
            ap: { base: 0, riesgoOculto: { prob: 0.25, extra: -2 } }, // 25% de probabilidad de perder 2 semanas extra
            hp: {
              base: -25000,
              riesgoOculto: { prob: 0.3, extra: -15000 },
            }, // 30% de sobrecosto adicional
            ac: { base: -5, riesgoOculto: null },
            falloCritico: { base: 15, riesgoOculto: null },
            mp: { base: 0, riesgoOculto: null },
          },
        },
        {
          texto:
            "Ejecución rápida (Fast Tracking): Solapar fuertemente actividades que eran secuenciales, asumiendo grandes riesgos técnicos.",
          etiquetas: [
            "[Ataque Agresivo]",
            "orientada_a_tiempo",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: { base: 2, riesgoOculto: { prob: 0.4, extra: -3 } }, // 40% de probabilidad de perder 3 semanas (colisión de actividades)
            hp: {
              base: 0,
              riesgoOculto: { prob: 0.35, extra: -12000 },
            }, // 35% de costos ocultos por retrabajos
            ac: { base: -15, riesgoOculto: { prob: 0.3, extra: -10 } }, // 30% de degradación adicional de calidad
            falloCritico: { base: 35, riesgoOculto: null },
            mp: { base: -5, riesgoOculto: null },
          },
        },
        {
          texto:
            "Aceptar el retraso estructural, actualizar línea base y gestionar el impacto a través del Comité (CCB).",
          etiquetas: [
            "[Defensa Conservadora]",
            "[Control de Terreno]",
            "burocratica",
          ],
          impactos: {
            ap: { base: -4, riesgoOculto: null }, // Impacto determinístico (sin incertidumbre)
            hp: { base: -2000, riesgoOculto: null },
            ac: { base: 5, riesgoOculto: null },
            falloCritico: { base: -10, riesgoOculto: null },
            mp: {
              base: -25,
              riesgoOculto: { prob: 0.2, extra: -10 },
            }, // 20% de que stakeholders reaccionen peor
          },
        },
      ],
    },
    {
      id: "e2",
      fase: "ejecucion",
      rol: "calidad",
      titulo:
        "¡Encuentro Salvaje: Descubrimiento de 'Gold Plating' en el sistema!",
      descripcion:
        "El grupo se enfrenta a un desafío: El equipo técnico añadió 'por iniciativa propia' elementos estéticos extra no solicitados. Un bug en ellos ahora bloquea todo el testeo.",
      opciones: [
        {
          texto:
            "Remover de cuajo la mejora y aplicar reproche estricto para ajustar a la Línea Base.",
          etiquetas: [
            "[Defensa Conservadora]",
            "[Control de Terreno]",
            "estricta",
          ],
          impactos: {
            ap: -1,
            hp: 0,
            ac: 0,
            falloCritico: -15,
            mp: -10,
          },
        },
        {
          texto:
            "Apostar por la mejora (a los usuarios les gustará): dedicar horas extra en reparar el bug y mantener el añadido.",
          etiquetas: ["[Ataque Agresivo]", "[Carisma de Gremio]"],
          impactos: {
            ap: -2,
            hp: -10000,
            ac: 15,
            falloCritico: 25,
            mp: 20,
          },
        },
        {
          texto:
            "Frenar desarrollo, documentar el impacto y pedir al Sponsor o CCB una decisión oficial sobre qué hacer.",
          etiquetas: ["[Postura Equilibrada]", "burocratica"],
          impactos: {
            ap: -3,
            hp: -2000,
            ac: 5,
            falloCritico: -5,
            mp: -5,
          },
        },
      ],
    },
    {
      id: "e3",
      fase: "ejecucion",
      rol: "director",
      titulo:
        "¡Encuentro Salvaje: Exigencia Directiva: Adición Urgente al Alcance!",
      descripcion:
        "El grupo se enfrenta a un desafío: El Patrocinador Ejecutivo exige incorporar una nueva métrica gerencial y su interfaz en mitad de las pruebas, saltándose los procesos.",
      opciones: [
        {
          texto:
            "Decir NO e insistir en los marcos PMBOK y el grave impacto en la estabilidad actual de pruebas.",
          etiquetas: [
            "[Defensa Conservadora]",
            "estricta",
            "[Control de Terreno]",
          ],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 10,
            falloCritico: -15,
            mp: -35,
          },
        },
        {
          texto:
            "Tomarlo como Solicitud Formal, detener pruebas y exigir aprobación oficial del Comité (CCB).",
          etiquetas: [
            "[Postura Equilibrada]",
            "[Hechizo de Calidad]",
            "burocratica",
          ],
          impactos: {
            ap: -2,
            hp: -3000,
            ac: 5,
            falloCritico: 5,
            mp: -15,
          },
        },
        {
          texto:
            "¡El jefe es el jefe! Modificar y aplicar en caliente por orden directa, arriesgando componentes ya estables.",
          etiquetas: ["[Ataque Agresivo]", "reactiva", "[Carisma de Gremio]"],
          impactos: {
            ap: -2,
            hp: -20000,
            ac: -25,
            falloCritico: 40,
            mp: 25,
          },
        },
      ],
    },
    {
      id: "e4",
      fase: "ejecucion",
      rol: "director",
      titulo:
        "¡Encuentro Salvaje: Conflicto Grave de Intereses en Equipo Técnico!",
      descripcion:
        "El grupo se enfrenta a un desafío: Pausa total en operaciones: Dos líderes técnicos se acusan de saboteo arquitectónico por diferencias irreconciliables. Tienen al equipo dividido.",
      opciones: [
        {
          texto:
            "Forzar imposición directiva: Tomar la decisión del diseño unilateralmente y exigir cumplimiento (Forcing).",
          etiquetas: ["[Ataque Agresivo]", "reaccional", "orientada_a_tiempo"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: -15,
            falloCritico: 20,
            mp: -25,
          },
        },
        {
          texto:
            "Resolución PMBOK (Problem Solving/Colaborar): Negociar en formato Taller hasta desenredar o lograr un compromiso técnico.",
          etiquetas: [
            "[Defensa Conservadora]",
            "[Postura Equilibrada]",
            "[Hechizo de Calidad]",
            "negociadora",
          ],
          impactos: {
            ap: -3,
            hp: -5000,
            ac: 25,
            falloCritico: -20,
            mp: 15,
          },
        },
        {
          texto:
            "Acomodar (Smoothing): Minimizar el conflicto, buscar puntos en común e ir avanzando de forma paralela en lo que estén de acuerdo.",
          etiquetas: ["[Postura Equilibrada]", "reactiva"],
          impactos: {
            ap: -1,
            hp: 0,
            ac: -5,
            falloCritico: 30,
            mp: 5,
          },
        },
      ],
    },
    {
      id: "e5",
      fase: "ejecucion",
      rol: "planificacion",
      titulo: "¡Encuentro Salvaje: Auditoría de Valor Ganado: CPI en 0.81!",
      descripcion:
        "El grupo se enfrenta a un desafío: Los indicadores de EVM muestran rojos severos. El proyecto está gastando un 19% más de dinero del planificado para el avance físico real obtenido.",
      opciones: [
        {
          texto:
            "Drenar severamente la Reserva de Gestión inyectando subcontratos emergentes y horas extras para recomponer plazos.",
          etiquetas: ["[Ataque Agresivo]", "reactiva", "orientada_a_tiempo"],
          impactos: {
            ap: 1,
            hp: -35000,
            ac: -10,
            falloCritico: 25,
            mp: -5,
          },
        },
        {
          texto:
            "Optimización quirúrgica y rescate: Recortar drásticamente características opcionales y rebajar la calidad a lo mínimo aceptable legalmente.",
          etiquetas: ["[Defensa Conservadora]", "[Control de Terreno]"],
          impactos: {
            ap: 0,
            hp: 15000,
            ac: -30,
            falloCritico: 10,
            mp: -35,
          },
        },
        {
          texto:
            "Rebaselinización (PMBOK): Frenar el proyecto, aceptar la pérdida, recalcular el presupuesto estimado de término (EAC) y solicitar fondos adicionales.",
          etiquetas: [
            "[Postura Equilibrada]",
            "burocratica",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -3,
            hp: 35000,
            ac: 5,
            falloCritico: -10,
            mp: -25,
          },
        },
      ],
    },
    {
      id: "e6",
      fase: "ejecucion",
      rol: "calidad",
      titulo:
        "¡Encuentro Salvaje: Fuerte Resistencia al Cambio en el Usuario Piloto!",
      descripcion:
        "El grupo se enfrenta a un desafío: Los Stakeholders operativos finales expresan que la interfaz es enrevesada y que no piensan adoptar el sistema nuevo.",
      opciones: [
        {
          texto:
            "Apurar entrega ignorando quejas; la interfaz cumple todos los criterios definidos originalmente en la matriz de requisitos.",
          etiquetas: ["[Ataque Agresivo]", "estricta", "[Control de Terreno]"],
          impactos: {
            ap: 1,
            hp: 0,
            ac: -15,
            falloCritico: 35,
            mp: -40,
          },
        },
        {
          texto:
            "Sacrificar las fechas e invertir en un plan profundo de UX, Adopción y Gestión del Cambio Organizacional.",
          etiquetas: [
            "[Defensa Conservadora]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -4,
            hp: -20000,
            ac: 35,
            falloCritico: -20,
            mp: 25,
          },
        },
        {
          texto:
            "Plan de Choque formativo: Charlas interactivas inmediatas e incentivos, inyectando horas soporte, sin frenar todo.",
          etiquetas: ["[Postura Equilibrada]", "negociadora"],
          impactos: {
            ap: -2,
            hp: -8000,
            ac: 15,
            falloCritico: 5,
            mp: 10,
          },
        },
      ],
    },
    {
      id: "c1",
      fase: "monitoreo",
      rol: "director",
      titulo: "¡Encuentro Salvaje: Acción sobre el Desempeño General:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Acción sobre el Desempeño General:",
      opciones: [
        {
          texto: "Replanificar cronograma formalmente",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: -2000,
            ac: 5,
            falloCritico: -15,
            mp: -5,
          },
        },
        {
          texto: "Mantener curso actual apostando a mejora natural",
          etiquetas: ["[Ataque Agresivo]"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: -10,
            falloCritico: 15,
            mp: -10,
          },
        },
      ],
    },
    {
      id: "c2",
      fase: "monitoreo",
      rol: "planificacion",
      titulo: "¡Encuentro Salvaje: Acción sobre Presupuesto:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Acción sobre Presupuesto:",
      opciones: [
        {
          texto: "Solicitar fondo de reserva al patrocinador",
          etiquetas: ["[Control de Terreno]", "[Defensa Conservadora]"],
          impactos: {
            ap: 0,
            hp: 25000,
            ac: 0,
            falloCritico: -10,
            mp: -20,
          },
        },
        {
          texto: "Congelar contrataciones y optimizar",
          etiquetas: [
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 0,
            hp: 0,
            ac: -15,
            falloCritico: 10,
            mp: 5,
          },
        },
      ],
    },
    {
      id: "c3",
      fase: "monitoreo",
      rol: "calidad",
      titulo: "¡Encuentro Salvaje: Acción sobre Calidad:!",
      descripcion: "El grupo se enfrenta a un desafío: Acción sobre Calidad:",
      opciones: [
        {
          texto: "Auditoría externa profunda",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: -8000,
            ac: 20,
            falloCritico: -20,
            mp: 10,
          },
        },
        {
          texto: "Autoevaluación superficial",
          etiquetas: ["[Ataque Agresivo]"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: -5,
            falloCritico: 5,
            mp: 0,
          },
        },
      ],
    },
    {
      id: "c4",
      fase: "monitoreo",
      rol: "director",
      titulo: "¡Encuentro Salvaje: Comunicación en crisis:!",
      descripcion: "El grupo se enfrenta a un desafío: Comunicación en crisis:",
      opciones: [
        {
          texto: "Transparencia total y reuniones diarias de estado",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -1,
            hp: 0,
            ac: 10,
            falloCritico: -15,
            mp: 15,
          },
        },
        {
          texto: "Ocultar desviaciones menores y proteger al equipo",
          etiquetas: ["[Ataque Agresivo]"],
          impactos: {
            ap: 0,
            hp: 0,
            ac: 0,
            falloCritico: 25,
            mp: -15,
          },
        },
      ],
    },
    {
      id: "c5",
      fase: "monitoreo",
      rol: "planificacion",
      titulo: "¡Encuentro Salvaje: Afrontar la etapa final:!",
      descripcion:
        "El grupo se enfrenta a un desafío: Afrontar la etapa final:",
      opciones: [
        {
          texto: "Congelamiento total de alcance (Cerrar grifo)",
          etiquetas: [
            "[Control de Terreno]",
            "[Defensa Conservadora]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: 1,
            hp: 0,
            ac: 5,
            falloCritico: -20,
            mp: -5,
          },
        },
        {
          texto: "Permitir últimos cambios solicitados (Flexibilidad)",
          etiquetas: [
            "[Ataque Agresivo]",
            "[Hechizo de Calidad]",
            "[Carisma de Gremio]",
          ],
          impactos: {
            ap: -2,
            hp: -10000,
            ac: -10,
            falloCritico: 20,
            mp: 20,
          },
        },
      ],
    },
  ],
};
