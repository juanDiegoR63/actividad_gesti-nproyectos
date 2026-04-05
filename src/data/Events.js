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
    { id: 0, titulo: "Configuración", clave: "config" },
    { id: 1, titulo: "Fase 1: Inicio", clave: "inicio" },
    { id: 2, titulo: "Fase 2: Planificación", clave: "planificacion" },
    { id: 3, titulo: "Fase 3: Ejecución", clave: "ejecucion" },
    { id: 4, titulo: "Fase 4: Monitoreo y Control", clave: "monitoreo" },
    { id: 5, titulo: "Fase 5: Cierre", clave: "cierre" },
  ],
  eventos: [
    /* --- FASE 1: INICIO (Definiendo el Círculo Mágico) --- */
    {
      id: "i1",
      fase: "inicio",
      rol: "director",
      titulo: "¡Un Stakeholder Salvaje exige cambios de alcance!",
      descripcion:
        "El Jefe de Ventas quiere incluir una funcionalidad extra antes de firmar el Acta de Constitución.",
      opciones: [
        {
          texto: "Ceder para evitar conflictos (Estilo Colcha)",
          etiquetas: ["[Creación de Colcha]", "[Carisma de Gremio]"],
          impactos: { ap: 0, hp: -5000000, ac: -10, falloCritico: 15 },
        },
        {
          texto: "Negociar y castigar con planeación (Estilo Rompecabezas)",
          etiquetas: ["[Pensamiento de Rompecabezas]", "[Control de Terreno]"],
          impactos: { ap: -1, hp: -2000000, ac: 15, falloCritico: -5 },
        },
      ],
    },
    {
      id: "i2",
      fase: "inicio",
      rol: "calidad",
      titulo: "Definición del Acta de Constitución",
      descripcion:
        "Debes decidir cómo medirás el éxito del proyecto desde el día 1.",
      opciones: [
        {
          texto: "Visión rígida: Metas SMART ultra-detalladas",
          etiquetas: [
            "[Pensamiento de Rompecabezas]",
            "[Defensa Conservadora]",
          ],
          impactos: { ap: -2, hp: 0, ac: 25, falloCritico: -10 },
        },
        {
          texto: "Visión ágil: Basada en recursos actuales",
          etiquetas: ["[Creación de Colcha]", "[Ataque Agresivo]"],
          impactos: { ap: 1, hp: 5000000, ac: -15, falloCritico: 10 },
        },
      ],
    },

    /* --- FASE 2: PLANIFICACIÓN (Gestión de Riesgos) --- */
    {
      id: "p1",
      fase: "planificacion",
      rol: "planificacion",
      titulo: "Asignación de Reserva de Gestión",
      descripcion: "¿Cuánto presupuesto vas a 'congelar' para emergencias?",
      opciones: [
        {
          texto: "Guardar el 15% como reserva (Seguridad PMBOK)",
          etiquetas: [
            "[Pensamiento de Rompecabezas]",
            "[Defensa Conservadora]",
          ],
          impactos: {
            reservaGestion: 22500000,
            hp: -22500000,
            ac: 5,
            falloCritico: -15,
          },
        },
        {
          texto: "No guardar nada, invertir todo en ejecución",
          etiquetas: ["[Creación de Colcha]", "[Ataque Agresivo]"],
          impactos: { reservaGestion: 0, hp: 0, ac: 15, falloCritico: 20 },
        },
      ],
    },

    /* --- FASE 3: EJECUCIÓN (El Caos Estocástico) --- */
    {
      id: "e1",
      fase: "ejecucion",
      rol: "planificacion",
      titulo: "¡Crisis de Proveedores!",
      descripcion:
        "Tu proveedor principal declara fuerza mayor. Los costos pueden dispararse.",
      estocastico: true,
      opciones: [
        {
          texto: "Crashing: Pagar horas extra masivas para compensar",
          etiquetas: ["[Pensamiento de Rompecabezas]", "orientada_a_tiempo"],
          impactos: {
            ap: { base: 0, riesgoOculto: { prob: 0.3, extra: -2 } },
            hp: {
              base: -25000000,
              riesgoOculto: { prob: 0.4, extra: -15000000 },
            },
            ac: 5,
            falloCritico: 10,
          },
        },
        {
          texto: "Adaptar: Pivotar con recursos internos (Colcha de Retazos)",
          etiquetas: ["[Creación de Colcha]", "[Carisma de Gremio]"],
          impactos: {
            ap: { base: 1, riesgoOculto: { prob: 0.5, extra: -3 } },
            hp: {
              base: -5000000,
              riesgoOculto: { prob: 0.3, extra: -10000000 },
            },
            ac: -20,
            falloCritico: 25,
          },
        },
      ],
    },

    /* --- FASE 4: MONITOREO (Información Asimétrica) --- */
    {
      id: "m1",
      fase: "monitoreo",
      rol: "calidad",
      titulo: "Auditoría de Calidad Sorpresa",
      descripcion:
        "Un auditor externo encuentra fallos en los entregables. ¿Cómo respondes?",
      opciones: [
        {
          texto: "Corregir todo inmediatamente (Costo Alto)",
          etiquetas: ["[Hechizo de Calidad]", "[Control de Terreno]"],
          impactos: { ap: -2, hp: -15000000, ac: 30, falloCritico: -20 },
        },
        {
          texto: "Negociar excepciones técnicas (Riesgo Alto)",
          etiquetas: ["[Carisma de Gremio]", "[Ataque Agresivo]"],
          impactos: { ap: 0, hp: -2000000, ac: -15, falloCritico: 25 },
        },
      ],
    },

    /* --- FASE 5: CIERRE (Formalización del Éxito/Fracaso) --- */
    {
      id: "cl1",
      fase: "cierre",
      rol: "director",
      titulo: "Documentación y Lecciones Aprendidas",
      descripcion:
        "El proyecto terminó. ¿Inviertes el último aliento en documentar?",
      opciones: [
        {
          texto: "Cierre Formal: Documentar exhaustivamente",
          etiquetas: [
            "[Pensamiento de Rompecabezas]",
            "[Defensa Conservadora]",
          ],
          impactos: { ap: -1, hp: 0, ac: 20, falloCritico: -10 },
        },
        {
          texto: "Cierre Administrativo: Salida rápida",
          etiquetas: ["[Creación de Colcha]", "[Ataque Agresivo]"],
          impactos: { ap: 1, hp: 0, ac: -10, falloCritico: 10 },
        },
      ],
    },
  ],
};
