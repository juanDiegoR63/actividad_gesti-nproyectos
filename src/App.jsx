import { useState } from "react";
import { ROLES, ROLES_DEF } from "./constants/Roles";
import {
  METRICAS_INICIALES,
  CASO_ESTUDIO,
  NOMBRES_ROLES,
} from "./data/Config";
import { baseDatos, eventoFase, deciderOpcionAutomatica } from "./data/Events";
import { AgentEngine } from "./engine/AgentEngine";

function App() {
  const [toastMessage, setToastMessage] = useState("");
  const [estado, setEstado] = useState({
    ...METRICAS_INICIALES,
    equipo: "",
    faseActual: 0,
    historico: [],
    rolesAsignados: {},
  });

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

  // Helper para mostrar impactos (soporta formato simple y estocástico)
  const formatearImpacto = (impacto) => {
    if (typeof impacto === "number") return impacto;
    if (impacto && typeof impacto === "object") {
      const base = impacto.base || 0;
      if (impacto.riesgoOculto && impacto.riesgoOculto.prob) {
        const prob = Math.round(impacto.riesgoOculto.prob * 100);
        const extra = impacto.riesgoOculto.extra;
        return `${base} (${prob}%: ${extra > 0 ? "+" : ""}${extra})`;
      }
      return base;
    }
    return 0;
  };

  const evaluarFinal = () => {
    const p = estado;
    let puntaje = 0;

    // Cálculo proporcional (máximo 20 puntos por métrica para un total de 100)
    puntaje += Math.max(
      0,
      Math.min(20, (p.tiempoRestante / METRICAS_INICIALES.tiempoRestante) * 20),
    );
    puntaje += Math.max(
      0,
      Math.min(
        20,
        (p.presupuestoRestante / METRICAS_INICIALES.presupuestoRestante) * 20,
      ),
    );
    puntaje += Math.max(0, Math.min(20, (p.calidadProyecto / 100) * 20));
    puntaje += Math.max(0, Math.min(20, ((100 - p.riesgoProyecto) / 100) * 20));
    puntaje += Math.max(
      0,
      Math.min(20, (p.satisfaccionStakeholders / 100) * 20),
    );

    puntaje = Math.round(puntaje);

    let veredicto, mensaje;
    if (puntaje >= 90) {
      veredicto = "Éxito Completo";
      mensaje =
        "El proyecto fue gestionado magistralmente, balanceando las restricciones de oro perfectamente.";
    } else if (puntaje >= 70) {
      veredicto = "Éxito Parcial";
      mensaje =
        "El proyecto se entregó, pero tuvo algunas desviaciones notables perdonables gracias a compensaciones.";
    } else if (puntaje >= 50) {
      veredicto = "Entrega con Problemas Graves";
      mensaje =
        "Se logró entregar algo de valor, pero las penalizaciones en costo, tiempo o insatisfacción mermaron su utilidad.";
    } else {
      veredicto = "Fracaso del Proyecto";
      mensaje =
        "Las desviaciones fueron insostenibles. Se descuidaron fuertemente demasiadas áreas de conocimiento y principios críticos del PMBOK.";
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

    const textoReporte = `
BITÁCORA DE MISIÓN - GREMIO:  ${estado.equipo}
--------------------------------------------------
INTEGRANTES:
${Object.entries(estado.rolesAsignados)
  .map(([rId, asig]) => `- ${ROLES_DEF[rId]?.nombre || rId}: ${asig.nombre}`)
  .join("\n")}

--------------------------------------------------
Veredicto: ${resultado.veredicto}
Puntaje: ${resultado.puntaje}/100
Presupuesto Restante: $${estado.presupuestoRestante}
Tiempo Restante: ${estado.tiempoRestante} Semanas
Calidad Alcanzada: ${estado.calidadProyecto}%
Riesgo Final: ${estado.riesgoProyecto}%
Satisfacción: ${estado.satisfaccionStakeholders}%

--------------------------------------------------
HISTORIAL DE DECISIONES:
${estado.historico.map((h) => `- [${ROLES_DEF[h.rol]?.nombre || h.rol} (${estado.rolesAsignados[h.rol]?.nombre})] ${h.evento} -> ${h.decision}`).join("\n")}
`;

    const payload = {
      equipo: estado.equipo,
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
  const aplicarDecision = (evento, opcionVotadaPorJugador) => {
    const engine = new AgentEngine(estado);

    // Determinar qué rol está votando (el del evento actual)
    const rolDelEvento = evento.rol;

    // Los otros dos roles votan automáticamente
    const todosLosRoles = [ROLES.DIRECTOR, ROLES.PLANIFICACION, ROLES.CALIDAD];
    const otrosRoles = todosLosRoles.filter((r) => r !== rolDelEvento);

    // Recopilar todos los votos
    const votos = {};

    // El voto del jugador humano (o auto si es IA)
    if (estado.rolesAsignados[rolDelEvento]?.tipo === "auto") {
      // Si es automático, usar deciderOpcionAutomatica
      const votoAuto = deciderOpcionAutomatica(evento.opciones, rolDelEvento);
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

    // Los otros roles votan usando AgentEngine con utilidad esperada
    otrosRoles.forEach((rol) => {
      const resultado = engine.emitirVoto(evento.opciones, rol);
      votos[rol] = {
        opcion: resultado.opcionElegida,
        razonamiento: resultado.razonamiento,
      };
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
      tiempo: 0,
      presupuesto: 0,
      calidad: 0,
      riesgo: 0,
      satisfaccion: 0,
    };
    let mensajeResolucion;

    const maxVotos = resultadosOrdenados[0]?.count || 0;

    if (maxVotos === 3) {
      // UNANIMIDAD (Equilibrio de Nash)
      tipoResolucion = "unanimidad";
      opcionGanadora = resultadosOrdenados[0].opcion;
      penalizacion = { calidad: 5, riesgo: -5 }; // Bonus por sinergia
      mensajeResolucion = `¡Unanimidad! Los 3 roles votaron por la misma opción. Bonus de Sinergia: +5 Calidad, -5 Riesgo.`;
    } else if (maxVotos === 2) {
      // MAYORÍA (Fricción moderada)
      tipoResolucion = "mayoria";
      opcionGanadora = resultadosOrdenados[0].opcion;
      penalizacion = { presupuesto: -2000 }; // Costo de fricción
      const ganadores = resultadosOrdenados[0].votantes.map(
        (r) => ROLES_DEF[r]?.nombre || r,
      );
      const perdedor = resultadosOrdenados[1]?.votantes.map(
        (r) => ROLES_DEF[r]?.nombre || r,
      );
      mensajeResolucion = `Mayoría: ${ganadores.join(" y ")} votaron igual, pero ${perdedor?.join(", ") || "otro rol"} votó diferente. Costos de fricción: -$2,000.`;
    } else {
      // EMPATE (Caos - cada rol votó diferente)
      tipoResolucion = "empate";
      // El Director desempata
      opcionGanadora = votos[ROLES.DIRECTOR].opcion;
      penalizacion = { tiempo: -2 }; // Parálisis por análisis
      mensajeResolucion = `Empate total: Cada rol votó diferente. El Director desempata. Penalización: -2 semanas por parálisis.`;
    }

    // Resolver impactos estocásticos si el evento es estocástico
    let impactosFinales;
    let mensajeRiesgos = "";

    if (evento.estocastico) {
      const resolucionEstocastica =
        engine.resolverImpactosEstocasticos(opcionGanadora);
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

    // Aplicar impactos + penalización
    setEstado((prev) => ({
      ...prev,
      tiempoRestante:
        prev.tiempoRestante +
        (impactosFinales.tiempo || 0) +
        (penalizacion.tiempo || 0),
      presupuestoRestante:
        prev.presupuestoRestante +
        (impactosFinales.presupuesto || 0) +
        (penalizacion.presupuesto || 0),
      calidadProyecto: Math.min(
        100,
        Math.max(
          0,
          prev.calidadProyecto +
            (impactosFinales.calidad || 0) +
            (penalizacion.calidad || 0),
        ),
      ),
      riesgoProyecto: Math.min(
        100,
        Math.max(
          0,
          prev.riesgoProyecto +
            (impactosFinales.riesgo || 0) +
            (penalizacion.riesgo || 0),
        ),
      ),
      satisfaccionStakeholders: Math.min(
        100,
        Math.max(
          0,
          prev.satisfaccionStakeholders +
            (impactosFinales.satisfaccion || 0) +
            (penalizacion.satisfaccion || 0),
        ),
      ),
      historico: [
        ...prev.historico,
        {
          id: evento.id,
          evento: evento.titulo,
          decision: opcionGanadora.texto,
          rol: evento.rol,
          tipoResolucion,
          votos: Object.entries(votos).map(([rol, v]) => ({
            rol: ROLES_DEF[rol]?.nombre || rol,
            opcion: v.opcion.texto.substring(0, 40) + "...",
          })),
        },
      ],
    }));

    // Mostrar resumen completo
    showToast(`📊 ${mensajeResolucion}${mensajeRiesgos}`);
  };

  if (estado.faseActual === 0) {
    return (
      <div className="app-container">
        <main style={{ marginTop: "5vh" }}>
          <h1 style={{ textAlign: "center" }}>{CASO_ESTUDIO.titulo}</h1>
          <div className="fase-header" style={{ textAlign: "center" }}>
            <p>
              Ingresa el nombre del equipo y los jugadores. Si algún rol queda
              en blanco, será auto.
            </p>
          </div>

          <div
            style={{
              maxWidth: "500px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label style={{ fontWeight: "bold", color: "var(--primary)" }}>
                Nombre del Equipo
              </label>
              <select
                value={estado.equipo}
                onChange={(e) =>
                  setEstado((prev) => ({ ...prev, equipo: e.target.value }))
                }
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "1rem",
                  backgroundColor: "#fff",
                }}
              >
                <option value="">Selecciona un equipo...</option>
                <option value="1">Equipo 1</option>
                <option value="2">Equipo 2</option>
                <option value="3">Equipo 3</option>
                <option value="4">Equipo 4</option>
                <option value="5">Equipo 5</option>
                <option value="6">Equipo 6</option>
                <option value="8">Equipo 8</option>
                <option value="profesor">Profesor</option>
              </select>
            </div>
            {Object.entries(ROLES_DEF).map(([rolId, def]) => (
              <div
                key={rolId}
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <label style={{ fontWeight: "bold", color: "var(--primary)" }}>
                  {def.nombre}
                </label>
                <input
                  type="text"
                  placeholder="Nombre del jugador (o vacío para automático)"
                  value={nombresForm[rolId]}
                  onChange={(e) =>
                    setNombresForm((prev) => ({
                      ...prev,
                      [rolId]: e.target.value,
                    }))
                  }
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "1rem",
                  }}
                />
                <small style={{ color: "var(--text-light)" }}>
                  {def.descripcion}
                </small>
              </div>
            ))}
            <button
              className="btn-block"
              onClick={iniciarJuego}
              style={{ marginTop: "10px" }}
            >
              Comenzar Simulación
            </button>
          </div>
        </main>
        {toastMessage && <div className="toast">{toastMessage}</div>}
      </div>
    );
  }

  if (estado.faseActual > 4) {
    return (
      <div className="app-container">
        <main>
          <PantallaCierre
            estado={estado}
            resultado={evaluarFinal()}
            reiniciar={reiniciarProyecto}
            enviarDrive={enviarDrive}
          />
        </main>
        {toastMessage && <div className="toast">{toastMessage}</div>}
      </div>
    );
  }

  const faseClave = baseDatos.fases[estado.faseActual]
    ? baseDatos.fases[estado.faseActual].clave
    : "";
  const todosEventosFase = eventoFase(faseClave);
  const todosCompletados = todosEventosFase.every((e) =>
    estado.historico.some((h) => h.id === e.id),
  );

  return (
    <div className="app-container">
      <div className="fase-progreso">
        {baseDatos.fases
          .filter((f) => f.id > 0)
          .map((fase, i) => (
            <div
              key={i}
              className={`fase-step ${estado.faseActual === fase.id ? "activa" : ""} ${estado.faseActual > fase.id ? "completada" : ""}`}
            >
              {fase.titulo.split(":")[0]}
            </div>
          ))}
      </div>

      <div className="metricas-panel">
        <div className="metrica">
          <span>Tiempo Restante</span>
          <progress
            value={estado.tiempoRestante}
            max="12"
            className={estado.tiempoRestante < 4 ? "warning-bar" : ""}
          ></progress>
          <small>{estado.tiempoRestante} semanas</small>
        </div>
        <div className="metrica">
          <span>Presupuesto</span>
          <progress
            value={estado.presupuestoRestante}
            max={METRICAS_INICIALES.presupuestoRestante}
            className={estado.presupuestoRestante < 30000 ? "warning-bar" : ""}
          ></progress>
          <small>$${estado.presupuestoRestante.toLocaleString()}</small>
        </div>
        <div className="metrica">
          <span>Calidad</span>
          <progress
            value={estado.calidadProyecto}
            max="100"
            className="calidad-bar"
          ></progress>
          <small>{estado.calidadProyecto}%</small>
        </div>
        <div className="metrica">
          <span>Riesgo</span>
          <progress
            value={estado.riesgoProyecto}
            max="100"
            className="riesgo-bar"
          ></progress>
          <small>{estado.riesgoProyecto}%</small>
        </div>
        <div className="metrica">
          <span>Satisfacción</span>
          <progress
            value={estado.satisfaccionStakeholders}
            max="100"
          ></progress>
          <small>{estado.satisfaccionStakeholders}%</small>
        </div>
      </div>

      <main>
        <div className="fase-header">
          <h1>{baseDatos.fases[estado.faseActual].titulo}</h1>
          <p>Decisiones de la fase. Completa todas para avanzar.</p>
        </div>

        {todosEventosFase.map((ev, globalIdx) => {
          const yaRespondido = estado.historico.find((h) => h.id === ev.id);
          const idxPrimerFaltante = todosEventosFase.findIndex(
            (e) => !estado.historico.some((h) => h.id === e.id),
          );
          const esActivo = globalIdx === idxPrimerFaltante;
          const esBloqueadoFuturo =
            globalIdx > idxPrimerFaltante && idxPrimerFaltante !== -1;
          const nombreJugador =
            estado.rolesAsignados[ev.rol]?.nombre || "Desconocido";

          if (yaRespondido) {
            return (
              <div
                key={ev.id}
                className="tarjeta-decision"
                style={{ opacity: 0.7, borderLeft: "4px solid var(--success)" }}
              >
                <h2 style={{ textDecoration: "line-through" }}>{ev.titulo}</h2>
                <p>
                  <strong>
                    Decidido por {nombreJugador} ({ROLES_DEF[ev.rol].nombre}):
                  </strong>{" "}
                  {yaRespondido.decision}
                </p>
              </div>
            );
          }

          return (
            <div
              key={ev.id}
              className="tarjeta-decision"
              style={{ opacity: esBloqueadoFuturo ? 0.5 : 1 }}
            >
              <h2>{ev.titulo}</h2>
              <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>
                {ev.descripcion}
              </p>

              <div
                style={{
                  padding: "10px",
                  background: "var(--light)",
                  borderRadius: "8px",
                  borderLeft: "4px solid var(--accent)",
                  marginBottom: "20px",
                }}
              >
                <strong>
                  Turno responsable: {nombreJugador} ({ROLES_DEF[ev.rol].nombre}
                  )
                </strong>
              </div>

              {!esBloqueadoFuturo ? (
                estado.rolesAsignados[ev.rol]?.tipo === "auto" ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <p
                      style={{
                        color: "var(--secondary)",
                        marginBottom: "15px",
                      }}
                    >
                      <em>🤖 Rol automático en base a sesgo.</em>
                    </p>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        aplicarDecision(
                          ev,
                          deciderOpcionAutomatica(ev.opciones, ev.rol),
                        )
                      }
                    >
                      Permitir que la IA decida
                    </button>
                  </div>
                ) : (
                  <div className="opciones-container">
                    {/* --- NUEVO: RADAR DE TENSIÓN (PRE-CÁLCULO DE TEORÍA DE JUEGOS) --- */}
                    {(() => {
                      const engine = new AgentEngine(estado);
                      const rolesIA = [
                        ROLES.DIRECTOR,
                        ROLES.PLANIFICACION,
                        ROLES.CALIDAD,
                      ].filter((r) => r !== ev.rol);
                      const intenciones = rolesIA.map(
                        (r) =>
                          engine.emitirVoto(ev.opciones, r).opcionElegida.texto,
                      );
                      const hayConflicto = intenciones[0] !== intenciones[1];

                      return (
                        <div
                          style={{
                            background: hayConflicto ? "#fff3cd" : "#d4edda",
                            border: `1px solid ${hayConflicto ? "#ffeeba" : "#c3e6cb"}`,
                            padding: "12px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span style={{ fontSize: "1.5rem" }}>
                            {hayConflicto ? "⚡" : "🤝"}
                          </span>
                          <div>
                            <strong
                              style={{
                                color: hayConflicto ? "#856404" : "#155724",
                              }}
                            >
                              Radar de Comité:{" "}
                              {hayConflicto
                                ? "Alta Tensión Detectada"
                                : "Alineación Detectada"}
                            </strong>
                            <p
                              style={{
                                margin: "5px 0 0 0",
                                fontSize: "0.85rem",
                                color: "var(--text-light)",
                              }}
                            >
                              {hayConflicto
                                ? "Los otros roles tienen prioridades opuestas. Cualquier decisión generará fricción y sobrecostos."
                                : "Los otros roles parecen coincidir en su evaluación. Es un buen momento para buscar el consenso."}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    {/* --- FIN RADAR --- */}

                    {ev.opciones.map((op, idx) => {
                      const tieneRiesgo = Object.values(op.impactos).some(
                        (imp) => typeof imp === "object" && imp?.riesgoOculto,
                      );

                      return (
                        <button
                          key={idx}
                          className="tarjeta-opcion"
                          onClick={() => aplicarDecision(ev, op)}
                          style={{
                            position: "relative",
                            border: tieneRiesgo
                              ? "2px dashed var(--warning)"
                              : "2px solid transparent",
                            transition: "all 0.3s ease",
                          }}
                        >
                          {/* Etiqueta de Juego Estocástico */}
                          {tieneRiesgo && (
                            <div
                              style={{
                                position: "absolute",
                                top: "-12px",
                                right: "15px",
                                background: "var(--warning)",
                                color: "black",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                            >
                              🎲 Apuesta Estocástica
                            </div>
                          )}

                          <h3 style={{ marginTop: tieneRiesgo ? "10px" : "0" }}>
                            {op.texto}
                          </h3>

                          {/* Visualización de Impactos Mejorada */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "8px",
                              marginTop: "15px",
                              background: "var(--light)",
                              padding: "10px",
                              borderRadius: "6px",
                            }}
                          >
                            <div style={{ fontSize: "0.85rem" }}>
                              ⏱ <strong>Tiempo:</strong>{" "}
                              {formatearImpacto(op.impactos.tiempo)}
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              💰 <strong>Costo:</strong>{" "}
                              {formatearImpacto(op.impactos.presupuesto)}
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              🛡 <strong>Riesgo:</strong>{" "}
                              {formatearImpacto(op.impactos.riesgo)}
                            </div>
                            <div style={{ fontSize: "0.85rem" }}>
                              🤝 <strong>Satisfacc:</strong>{" "}
                              {formatearImpacto(op.impactos.satisfaccion)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div
                  style={{ textAlign: "center", color: "var(--text-light)" }}
                >
                  <p>
                    Bloqueado: Debes completar la decisión anterior primero.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {todosCompletados && (
          <div
            className="tarjeta-decision"
            style={{
              textAlign: "center",
              background: "var(--success)",
              color: "white",
            }}
          >
            <h2>Fase Completada</h2>
            <button
              onClick={() => {
                setEstado((prev) => ({
                  ...prev,
                  faseActual: prev.faseActual + 1,
                }));
                window.scrollTo(0, 0);
              }}
              style={{
                background: "white",
                color: "var(--success)",
                fontSize: "1.2rem",
                marginTop: "15px",
              }}
            >
              Avanzar a la Siguiente Fase
            </button>
          </div>
        )}
      </main>

      <div
        className="tarjeta-decision"
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          <strong>Equipo:</strong> {estado.equipo}
        </span>
        <button
          onClick={() => {
            if (window.confirm("¿Reiniciar progreso?")) reiniciarProyecto();
          }}
          className="btn-secondary small"
        >
          Reiniciar
        </button>
      </div>
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}

function PantallaCierre({ estado, resultado, reiniciar, enviarDrive }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const feedbackTiempo =
    estado.tiempoRestante >= 0
      ? "Lograste contener satisfactoriamente el cronograma."
      : "Se rebasó fuertemente el tiempo esperado.";
  const feedbackCosto =
    estado.presupuestoRestante >= 0
      ? "Respetaste el presupuesto de línea base."
      : "Incurriste en sobrecostos excesivos.";
  const feedbackCalidadRiesgo =
    estado.riesgoProyecto > 40 && estado.calidadProyecto < 80
      ? "Te enfrentaste a un espiral negativo con los riesgos."
      : "Hubo un equilibrio decente entre riesgos y calidad.";
  const valorAgile = estado.historico.find(
    (h) =>
      h.decision &&
      (h.decision.includes("agil") || h.decision.includes("Valor")),
  );

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      await enviarDrive(resultado);
      setEnviado(true);
    } catch (e) {
      // Error manejado
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="fase-header">
        <h2>Fase Final: Cierre del Proyecto y Lecciones</h2>
        <p>Balance ejecutivo para el Equipo {estado.equipo}</p>
      </div>
      <div className="tarjeta-decision reporte-final">
        <h3
          style={{
            color: resultado.puntaje >= 70 ? "var(--success)" : "var(--danger)",
            fontSize: "1.5rem",
          }}
        >
          Resultado General: {resultado.veredicto}
        </h3>
        <p style={{ marginBottom: "20px" }}>{resultado.mensaje}</p>

        <div
          className="metricas-finales"
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div
            className="metrica-card"
            style={{
              flex: 1,
              minWidth: "120px",
              background: "var(--light)",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h4>Presupuesto</h4>
            <span
              style={{
                color:
                  estado.presupuestoRestante >= 0
                    ? "var(--success)"
                    : "var(--danger)",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              $${estado.presupuestoRestante.toLocaleString()}
            </span>
            <br />
            <small>Restante Final</small>
          </div>
          <div
            className="metrica-card"
            style={{
              flex: 1,
              minWidth: "120px",
              background: "var(--light)",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h4>Cronograma</h4>
            <span
              style={{
                color:
                  estado.tiempoRestante >= 0
                    ? "var(--success)"
                    : "var(--danger)",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              {estado.tiempoRestante} Sem.
            </span>
            <br />
            <small>Holgura</small>
          </div>
          <div
            className="metrica-card"
            style={{
              flex: 1,
              minWidth: "120px",
              background: "var(--light)",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h4>Calidad Total</h4>
            <span
              style={{
                color: "var(--success)",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              {estado.calidadProyecto}%
            </span>
            <br />
            <small>Alcanzada</small>
          </div>
          <div
            className="metrica-card"
            style={{
              flex: 1,
              minWidth: "120px",
              background: "var(--light)",
              padding: "15px",
              borderRadius: "8px",
            }}
          >
            <h4>Puntuación</h4>
            <span
              style={{
                color: "var(--accent)",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              {resultado.puntaje}/100
            </span>
            <br />
            <small>Obtenida</small>
          </div>
        </div>

        <hr style={{ margin: "30px 0", border: "1px solid var(--light)" }} />

        <h3 style={{ color: "var(--primary)", fontSize: "1.2rem" }}>
          Retroalimentación Directa PMBOK:
        </h3>
        <div
          style={{
            background: "var(--light)",
            padding: "20px",
            borderRadius: "8px",
            marginTop: "15px",
          }}
        >
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              listStyleType: "none",
              margin: 0,
              padding: 0,
            }}
          >
            <li>
              ⏱️ <strong>Área de Cronograma:</strong> {feedbackTiempo}
            </li>
            <li>
              💰 <strong>Área de Costos:</strong> {feedbackCosto}
            </li>
            <li>
              🛡️ <strong>Área de Riesgos y Calidad:</strong>{" "}
              {feedbackCalidadRiesgo}
            </li>
            <li>
              🤝 <strong>Enfoque Ágil / Predictivo:</strong>{" "}
              {valorAgile
                ? "Tomaste decisiones con enfoque ágil."
                : "Tu enfoque consistió en gobernanza predictiva sólida."}
            </li>
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            gap: "15px",
            marginTop: "30px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => window.print()}
            className="btn-secondary"
            style={{ padding: "10px 20px" }}
          >
            🖨️ Imprimir Informe
          </button>

          <button
            onClick={handleEnviar}
            disabled={enviando || enviado}
            style={{
              background: enviado ? "var(--success)" : "var(--primary)",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              fontWeight: "bold",
              cursor: enviando || enviado ? "not-allowed" : "pointer",
              opacity: enviando || enviado ? 0.8 : 1,
            }}
          >
            {enviando
              ? "⏳ Enviando a Drive..."
              : enviado
                ? "✅ Reporte Enviado"
                : "📤 Enviar Resultado a Drive"}
          </button>

          <button
            onClick={reiniciar}
            className="btn-secondary"
            style={{ padding: "10px 20px" }}
          >
            🔄 Volver a Jugar
          </button>
        </div>
      </div>
    </>
  );
}

export default App;

