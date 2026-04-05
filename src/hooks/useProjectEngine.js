import { useState } from "react";
import { ROLES, ROLES_DEF } from "../constants/Roles";
import { METRICAS_INICIALES } from "../data/Config";
import { deciderOpcionAutomatica } from "../data/Events";
import { AgentEngine } from "../engine/AgentEngine";

export function useProjectEngine() {
  const [toastMessage, setToastMessage] = useState("");
  const [estado, setEstado] = useState({
    ...METRICAS_INICIALES,
    equipo: "",
    faseActual: 0,
    historico: [],
    rolesAsignados: {},
  });

  // Estado para habilidades RPG
  const [combateModifiers, setCombateModifiers] = useState({
    muroContencion: false,
  });
  const [ultimoResultadoVotacion, setUltimoResultadoVotacion] = useState(null);

  const [nombresForm, setNombresForm] = useState({
    [ROLES.DIRECTOR]: "",
    [ROLES.PLANIFICACION]: "",
    [ROLES.CALIDAD]: "",
  });

  const showToast = (mensaje) => {
    setToastMessage(mensaje);
    // Tiempo más largo para mensajes del sistema de votación
    const timeout = mensaje.length > 100 ? 6000 : 3500;
    setTimeout(() => {
      setToastMessage("");
    }, timeout);
  };

  const evaluarFinal = () => {
    const p = estado;

    if (p.hp <= 0 || p.ap <= 0) {
      return {
        veredicto: "BANCARROTA Y DESPIDO",
        mensaje:
          "El gremio ha sido disuelto. Has ignorado los principios básicos del PMBOK y quebrado la viabilidad del proyecto. Recibiste una carta de rescisión de contrato inmediata.",
        puntaje: 0,
      };
    }

    let puntaje = 0;
    // Cálculo proporcional (máximo 25 puntos por métrica para un total de 100)
    puntaje += Math.max(0, Math.min(25, (p.ap / METRICAS_INICIALES.ap) * 25));
    puntaje += Math.max(0, Math.min(25, (p.hp / METRICAS_INICIALES.hp) * 25));
    puntaje += Math.max(0, Math.min(25, (p.ac / 100) * 25));
    puntaje += Math.max(0, Math.min(25, ((100 - p.falloCritico) / 100) * 25));

    puntaje = Math.round(puntaje);

    const valorAgile = p.historico.some(
      (h) =>
        h.decision &&
        (h.decision.toLowerCase().includes("ágil") ||
          h.decision.toLowerCase().includes("agil") ||
          h.decision.toLowerCase().includes("valor")),
    );

    let veredicto, mensaje;
    if (puntaje >= 85) {
      veredicto = `CERTIFICACIÓN PMP - ${valorAgile ? "Líderes Ágiles" : "Líderes Predictivos"}`;
      mensaje =
        "El proyecto fue gestionado magistralmente. Desbloqueaste nuevas habilidades pasivas para futuras partidas por tu impecable historial corporativo.";
    } else if (puntaje >= 70) {
      veredicto = "Éxito Parcial";
      mensaje =
        "El proyecto se entregó, pero tuvo algunas desviaciones notables perdonables gracias a compensaciones tácticas.";
    } else if (puntaje >= 50) {
      veredicto = "Entrega con Problemas Graves";
      mensaje =
        "Se logró entregar algo de valor, pero las penalizaciones mermaron su utilidad. Tu reputación corporativa está dañada.";
    } else {
      veredicto = "FRACASO CRÍTICO";
      mensaje =
        "Las desviaciones fueron insostenibles y dejaste un legado de caos. Tus opciones en futuros proyectos serán severamente limitadas.";
    }
    return { veredicto, mensaje, puntaje };
  };

  const enviarDrive = async (resultado) => {
    const urlGoogleScript = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    if (!urlGoogleScript) {
      showToast(
        "Error: No se ha configurado la URL de acceso a Google Drive en el archivo .env.",
      );
      return;
    }

    const isExito =
      resultado.puntaje >= 70 && !resultado.veredicto.includes("BANCARROTA");
    const asunto = isExito ? "CERTIFICACIÓN DE ÉXITO" : "INFORME DE QUIEBRA";

    const textoReporte = `
${asunto} - BITÁCORA DE MISIÓN
GREMIO: ${estado.equipo}
--------------------------------------------------
INTEGRANTES:
${Object.entries(estado.rolesAsignados)
  .map(([rId, asig]) => `- ${ROLES_DEF[rId]?.nombre || rId}: ${asig.nombre}`)
  .join("\n")}

--------------------------------------------------
Veredicto: ${resultado.veredicto}
Puntaje: ${resultado.puntaje}/100
Presupuesto Restante: $${estado.hp}
Tiempo Restante: ${estado.ap} Semanas
Calidad Alcanzada: ${estado.ac}%
Riesgo Final: ${estado.falloCritico}%

--------------------------------------------------
HISTORIAL DE DECISIONES:
${estado.historico.map((h) => `- [${ROLES_DEF[h.rol]?.nombre || h.rol} (${estado.rolesAsignados[h.rol]?.nombre})] ${h.evento} -> ${h.decision}`).join("\n")}
`;

    const payload = {
      equipo: `[${isExito ? "ÉXITO" : "FRACASO"}] ${estado.equipo}`,
      reporte: textoReporte,
    };

    try {
      await fetch(urlGoogleScript, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showToast("¡Reporte enviado exitosamente a Google Drive!");
    } catch (error) {
      console.error(error);
      showToast(
        "Error al enviar a Drive. Revisa la conexión o la URL en el código.",
      );
    }
  };

  const reiniciarProyecto = () => {
    setEstado({
      ...METRICAS_INICIALES,
      equipo: "",
      faseActual: 0,
      historico: [],
      rolesAsignados: {},
    });
    setNombresForm({
      [ROLES.DIRECTOR]: "",
      [ROLES.PLANIFICACION]: "",
      [ROLES.CALIDAD]: "",
    });
  };

  const iniciarJuego = () => {
    if (!estado.equipo || estado.equipo.trim() === "") {
      showToast("⚠️ Por favor ingresa el nombre de tu equipo.");
      return;
    }
    const asignacion = {};
    for (const [rolId, nombreInput] of Object.entries(nombresForm)) {
      const limpio = nombreInput.trim();
      asignacion[rolId] =
        limpio !== ""
          ? { tipo: "humano", nombre: limpio }
          : { tipo: "auto", nombre: "IA (Automático)" };
    }

    setEstado((prev) => ({
      ...prev,
      rolesAsignados: asignacion,
      faseActual: 1,
    }));
  };

  // Sistema de votación con resolución de conflictos (Teoría de Juegos)
  const aplicarDecision = (
    evento,
    opcionVotadaPorJugador,
    seleccionesPersuasion = [],
  ) => {
    const engine = new AgentEngine(estado);

    // Determinar qué rol está votando (el del evento actual)
    const rolDelEvento = evento.rol;

    // Los otros dos roles votan automáticamente/por consenso
    const todosLosRoles = [ROLES.DIRECTOR, ROLES.PLANIFICACION, ROLES.CALIDAD];
    const otrosRoles = todosLosRoles.filter((r) => r !== rolDelEvento);

    // Recopilar todos los votos
    const votos = {};

    // El voto del jugador humano (o auto si es IA)
    let opcionActivaElegida = opcionVotadaPorJugador;

    if (estado.rolesAsignados[rolDelEvento]?.tipo === "auto") {
      // Si es automático, usar deciderOpcionAutomatica
      const votoAuto = deciderOpcionAutomatica(evento.opciones, rolDelEvento);
      opcionActivaElegida = votoAuto;
      votos[rolDelEvento] = {
        opcion: votoAuto,
        razonamiento: "Decisión automática basada en sesgo del rol",
      };
    } else {
      // Si es humano, usar la opción que eligió
      votos[rolDelEvento] = {
        opcion: opcionVotadaPorJugador,
        razonamiento: "Decisión del jugador humano",
      };
    }

    // Los otros roles votan usando AgentEngine con utilidad esperada (o son persuadidos)
    otrosRoles.forEach((rol) => {
      const esHumano = estado.rolesAsignados[rol]?.tipo === "humano";

      if (seleccionesPersuasion.includes(rol)) {
        votos[rol] = {
          opcion: opcionActivaElegida,
          razonamiento: "Obligado por habilidad de Persuasión 🗣️",
        };
      } else if (esHumano) {
        votos[rol] = {
          opcion: opcionActivaElegida,
          razonamiento: "Consenso de equipo.",
        };
      } else {
        const resultado = engine.emitirVoto(evento.opciones, rol);
        votos[rol] = {
          opcion: resultado.opcionElegida,
          razonamiento: resultado.razonamiento,
        };
      }
    });

    // Contar votos por opción

    const conteoVotos = {};
    evento.opciones.forEach((op) => {
      conteoVotos[op.texto] = { opcion: op, votantes: [], count: 0 };
    });

    Object.entries(votos).forEach(([rol, voto]) => {
      const textoOpcion = voto.opcion.texto;
      if (conteoVotos[textoOpcion]) {
        conteoVotos[textoOpcion].votantes.push(rol);
        conteoVotos[textoOpcion].count++;
      }
    });

    // Ordenar por número de votos
    const resultadosOrdenados = Object.values(conteoVotos).sort(
      (a, b) => b.count - a.count,
    );

    // Resolver el conflicto
    let opcionGanadora;
    let tipoResolucion;
    let penalizacion = {
      ap: 0,
      hp: 0,
      ac: 0,
      falloCritico: 0,
    };
    let mensajeResolucion;

    const maxVotos = resultadosOrdenados[0]?.count || 0;

    // Costo de Persuasión
    const gastoPersuasion = seleccionesPersuasion.length * 15;

    // Gasto de AP
    const gastoAp = Math.floor(Math.random() * 2) + 1; // Consume 1 o 2 AP

    if (maxVotos === 3) {
      tipoResolucion = "unanimidad";
      opcionGanadora = resultadosOrdenados[0].opcion;
      penalizacion = { ac: 5, falloCritico: -5 };
      mensajeResolucion = `¡Combo de Equipo! Unanimidad. +5 AC, -5 Fallo Crítico.`;
    } else if (maxVotos === 2) {
      tipoResolucion = "mayoria";
      opcionGanadora = resultadosOrdenados[0].opcion;
      penalizacion = { hp: -(estado.hp * 0.05) };
      mensajeResolucion = `Mayoría: Fricción en el grupo causa pérdida del 5% del Presupuesto (HP).`;
    } else {
      tipoResolucion = "empate";
      opcionGanadora = votos[ROLES.DIRECTOR].opcion;
      penalizacion = { ap: -1 };
      mensajeResolucion = `Aturdimiento: Empate total. El Director desempata pero se gasta -1 AP extra.`;
    }

    // Resolver impactos estocásticos si el evento es estocástico
    let impactosFinales;
    let mensajeRiesgos = "";

    if (evento.estocastico) {
      const resolucionEstocastica = engine.resolverImpactosEstocasticos(
        opcionGanadora,
        estado.falloCritico,
      );
      impactosFinales = resolucionEstocastica.impactos;

      if (resolucionEstocastica.riesgosActivados.length > 0) {
        const riesgosTexto = resolucionEstocastica.riesgosActivados
          .map((r) => `${r.metrica}: ${r.extra > 0 ? "+" : ""}${r.extra}`)
          .join(", ");
        mensajeRiesgos = ` ⚠️ Riesgos ocultos activados: ${riesgosTexto}`;
      }
    } else {
      impactosFinales = opcionGanadora.impactos;
    }

    // Mitigación de armadura AC
    let hpImpact = (impactosFinales.hp || 0) + (penalizacion.hp || 0);
    if (hpImpact < 0) {
      if (combateModifiers.muroContencion) {
        hpImpact = 0; // Se ignora
        showToast("🛡️ ¡Tu Muro de Contención ha bloqueado el daño!");
        setCombateModifiers((prev) => ({ ...prev, muroContencion: false }));
      } else {
        hpImpact = engine.mitigarDanio(hpImpact, estado.ac);
      }
    }

    // Aplicar impactos + penalización
    setEstado((prev) => {
      let nuevoAp =
        prev.ap - gastoAp + (impactosFinales.ap || 0) + (penalizacion.ap || 0);
      let ataqueOportunidadHp = 0;

      if (nuevoAp <= 0) {
        showToast(
          "⚔️ Has quedado expuesto sin AP: ¡Ataque de Oportunidad causa pérdida de 5000 HP!",
        );
        ataqueOportunidadHp = -5000;
        nuevoAp = 0; // O regenerar parcialmente
      }

      // Dynamic tag counting for Agile and Predictive
      let addedAgile = 0;
      let addedPredictive = 0;
      if (opcionGanadora.etiquetas) {
        if (
          opcionGanadora.etiquetas.includes("[Ataque Agresivo]") ||
          opcionGanadora.etiquetas.includes("[Carisma de Gremio]")
        )
          addedAgile = 1;
        if (
          opcionGanadora.etiquetas.includes("[Control de Terreno]") ||
          opcionGanadora.etiquetas.includes("[Defensa Conservadora]") ||
          opcionGanadora.etiquetas.includes("[Economía de Recursos]")
        )
          addedPredictive = 1;
      }

      const historicoM = {
        id: evento.id,
        evento: evento.titulo,
        decision: opcionGanadora.texto,
        rol: evento.rol,
        tipoResolucion,
        mitigacion:
          hpImpact !== (impactosFinales.hp || 0) + (penalizacion.hp || 0)
            ? "Daño Mitigado"
            : "",
        votos: Object.entries(votos).map(([rol, v]) => ({
          rol: ROLES_DEF[rol]?.nombre || rol,
          opcion: v.opcion.texto.substring(0, 40) + "...",
        })),
      };

      setUltimoResultadoVotacion(votos);

      let reservaGanada = impactosFinales.reservaGestion || 0;
      let newReserva = (prev.reservaGestion || 0) + reservaGanada;
      let totalHpDamage = hpImpact + ataqueOportunidadHp;
      let actualHpDamage = 0;

      if (totalHpDamage < 0) {
        if (newReserva >= Math.abs(totalHpDamage)) {
          newReserva += totalHpDamage;
          actualHpDamage = 0;
        } else {
          actualHpDamage = totalHpDamage + newReserva;
          newReserva = 0;
        }
      } else {
        actualHpDamage = totalHpDamage;
      }

      return {
        ...prev,
        ap: nuevoAp,
        hp: prev.hp + actualHpDamage,
        reservaGestion: newReserva,
        puntosAgile: (prev.puntosAgile || 0) + addedAgile,
        puntosPredictivo: (prev.puntosPredictivo || 0) + addedPredictive,
        ac: Math.min(
          100,
          Math.max(
            0,
            prev.ac + (impactosFinales.ac || 0) + (penalizacion.ac || 0),
          ),
        ),
        falloCritico: Math.min(
          100,
          Math.max(
            0,
            prev.falloCritico +
              (impactosFinales.falloCritico || 0) +
              (penalizacion.falloCritico || 0),
          ),
        ),
        historico: [...prev.historico, historicoM],
      };
    });

    // Mostrar resumen completo
    showToast(`📊 ${mensajeResolucion}${mensajeRiesgos}`);
  };

  return {
    estado,
    setEstado,
    combateModifiers,
    ultimoResultadoVotacion,
    setUltimoResultadoVotacion,
    nombresForm,
    setNombresForm,
    toastMessage,
    evaluarFinal,
    enviarDrive,
    reiniciarProyecto,
    iniciarJuego,
    aplicarDecision,
  };
}
