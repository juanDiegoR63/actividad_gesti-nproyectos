import { useState, useEffect } from "react";
import { METRICAS_INICIALES, baseDatos } from "./data";

function App() {
  const [estado, setEstado] = useState(() => {
    const saved = localStorage.getItem("pmbok_estado_react");
    if (saved) {
      return JSON.parse(saved);
    }
    return { ...METRICAS_INICIALES, equipo: "" };
  });

  const [eventoActivo, setEventoActivo] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("pmbok_estado_react", JSON.stringify(estado));
  }, [estado]);

  const showToast = (mensaje) => {
    setToastMessage(mensaje);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const reiniciarProyecto = (forzar) => {
    if (
      forzar &&
      !window.confirm(
        "¿Seguro que deseas reiniciar la simulación? Perderás todo el progreso.",
      )
    ) {
      return;
    }
    setEstado({ ...METRICAS_INICIALES, equipo: "" });
    setEventoActivo(null);
  };

  const aplicarOpcion = (opcion, descripcionDecision) => {
    setEstado((prev) => {
      let t = prev.tiempoRestante + opcion.tiempo;
      let p = prev.presupuestoRestante + opcion.presupuesto;
      let c = prev.calidadProyecto + opcion.calidad;
      let r = prev.riesgoProyecto + opcion.riesgo;
      let s = prev.satisfaccionStakeholders + opcion.satisfaccion;

      return {
        ...prev,
        tiempoRestante: t,
        presupuestoRestante: p,
        calidadProyecto: Math.min(100, Math.max(0, c)),
        riesgoProyecto: Math.min(100, Math.max(0, r)),
        satisfaccionStakeholders: Math.min(100, Math.max(0, s)),
        historial: [
          ...prev.historial,
          {
            fase: baseDatos.fases[prev.faseActual].titulo,
            decision: descripcionDecision,
            eleccion: opcion.texto,
            impacto: `Tiempo: ${opcion.tiempo > 0 ? "+" : ""}${opcion.tiempo}s | $: ${opcion.presupuesto > 0 ? "+" : ""}${opcion.presupuesto} | Calidad: ${opcion.calidad > 0 ? "+" : ""}${opcion.calidad}% | Riesgo: ${opcion.riesgo > 0 ? "+" : ""}${opcion.riesgo}%`,
          },
        ],
      };
    });

    showToast(`Decisión registrada: ${opcion.texto} 👀 (Revisa tus métricas)`);
  };

  const avanzarFase = () => {
    window.scrollTo(0, 0);
    setEstado((prev) => ({
      ...prev,
      faseActual: prev.faseActual + 1,
      avanceProyecto:
        baseDatos.fases[prev.faseActual + 1]?.avanceObjetivo ||
        prev.avanceProyecto,
    }));
  };

  const evaluarFinal = () => {
    const p = estado;
    let puntaje = 0;
    if (p.tiempoRestante >= 0) puntaje += 25;
    if (p.presupuestoRestante >= 0) puntaje += 25;
    if (p.calidadProyecto >= 80) puntaje += 20;
    if (p.riesgoProyecto <= 40) puntaje += 15;
    if (p.satisfaccionStakeholders >= 75) puntaje += 15;

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
    // Importamos la URL desde las variables de entorno de Vite
    const urlGoogleScript = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

    if (!urlGoogleScript) {
      showToast(
        "Error: No se ha configurado la URL de acceso a Google Drive en el archivo .env.",
      );
      return;
    }

    const textoReporte = `
REPORTE DEL SIMULADOR - EQUIPO ${estado.equipo}
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
${estado.historial.map((h) => `- [${h.fase}] ${h.decision} -> ${h.eleccion}`).join("\n")}
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
      throw error;
    }
  };

  return (
    <div className="app-container">
      {estado.faseActual > 0 && estado.faseActual < 5 && (
        <ProgressBar faseActual={estado.faseActual} fases={baseDatos.fases} />
      )}

      {estado.faseActual > 0 && (
        <header className="metricas-panel">
          <Metrica
            label="Presupuesto"
            value={estado.presupuestoRestante}
            max={100000}
            format={(v) => `$${v.toLocaleString()}`}
            isDanger={estado.presupuestoRestante < 0}
          />
          <Metrica
            label="Tiempo (Sem)"
            value={estado.tiempoRestante}
            max={8}
            format={(v) => `${Math.max(0, v)} Sem.`}
            isDanger={estado.tiempoRestante < 0}
          />
          <Metrica
            label="Calidad"
            value={estado.calidadProyecto}
            max={100}
            format={(v) => `${v}%`}
            barClass="calidad-bar"
          />
          <Metrica
            label="Riesgo"
            value={estado.riesgoProyecto}
            max={100}
            format={(v) => `${v}%`}
            barClass={estado.riesgoProyecto > 50 ? "riesgo-bar" : "warning-bar"}
          />
          <Metrica
            label="Stakeholders"
            value={estado.satisfaccionStakeholders}
            max={100}
            format={(v) => `${v}%`}
            barClass="calidad-bar"
          />
          <div className="header-actions">
            <button
              onClick={() => reiniciarProyecto(true)}
              className="btn-secondary small"
            >
              Reiniciar
            </button>
          </div>
        </header>
      )}

      <main>
        {estado.faseActual === 0 && (
          <PantallaBienvenida
            estado={estado}
            setEquipo={(eq) => setEstado((prev) => ({ ...prev, equipo: eq }))}
            onAvanzar={avanzarFase}
          />
        )}
        {estado.faseActual === 1 && (
          <FaseNormal
            estado={estado}
            fase={baseDatos.fases[1]}
            clave="inicio"
            enAplicar={aplicarOpcion}
            enAvanzar={avanzarFase}
          />
        )}
        {estado.faseActual === 2 && (
          <FaseNormal
            estado={estado}
            fase={baseDatos.fases[2]}
            clave="planificacion"
            enAplicar={aplicarOpcion}
            enAvanzar={avanzarFase}
          />
        )}
        {estado.faseActual === 3 && (
          <FaseEjecucion
            estado={estado}
            fase={baseDatos.fases[3]}
            enAvanzar={avanzarFase}
            setEvento={(ev) => setEventoActivo(ev)}
            setDisparados={() =>
              setEstado((prev) => ({
                ...prev,
                eventosDisparados: prev.eventosDisparados + 1,
              }))
            }
          />
        )}
        {estado.faseActual === 4 && (
          <FaseNormal
            estado={estado}
            fase={baseDatos.fases[4]}
            clave="monitoreo"
            enAplicar={aplicarOpcion}
            enAvanzar={avanzarFase}
          />
        )}
        {estado.faseActual === 5 && (
          <PantallaCierre
            estado={estado}
            resultado={evaluarFinal()}
            reiniciar={() => reiniciarProyecto(false)}
            enviarDrive={enviarDrive}
          />
        )}
      </main>

      {estado.faseActual > 0 && <PanelHistorial historial={estado.historial} />}

      {eventoActivo && (
        <ModalEvento
          evento={eventoActivo}
          enOpcion={(op) => {
            aplicarOpcion(op, `EVENTO: ${eventoActivo.texto}`);
            setEventoActivo(null);
          }}
        />
      )}

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
}

function ProgressBar({ faseActual, fases }) {
  return (
    <div className="fase-progreso">
      {fases.slice(1, 5).map((f) => (
        <div
          key={f.id}
          className={`fase-step ${faseActual === f.id ? "activa" : ""} ${faseActual > f.id ? "completada" : ""}`}
        >
          {f.titulo}
        </div>
      ))}
    </div>
  );
}

function Metrica({ label, value, max, format, isDanger, barClass }) {
  return (
    <div className="metrica">
      <span>{label}</span>
      <progress
        max={max}
        value={Math.max(0, value)}
        className={isDanger ? "riesgo-bar" : barClass || ""}
      ></progress>
      <small style={{ color: isDanger ? "var(--danger)" : "" }}>
        {format(value)}
      </small>
    </div>
  );
}

function PantallaBienvenida({ estado, onAvanzar, setEquipo }) {
  return (
    <>
      <div className="fase-header">
        <h1>Simulador PMBOK - Gestión de Proyectos</h1>
        <p>
          Bienvenido al simulador interactivo para la gestión profesional de
          proyectos.
        </p>
      </div>
      <div className="tarjeta-decision">
        <h3>Contexto de tu Misión: Plataforma de Capacitación Interna</h3>
        <p>
          <strong>Meta:</strong> Desarrollar y lanzar exitosamente este sistema
          a toda la corporación.
        </p>
        <ul>
          <li>
            <strong>Cronograma Baseline:</strong> 8 Semanas. (¡Cada semana extra
            es penalizada!)
          </li>
          <li>
            <strong>Presupuesto Aprobado:</strong> $100,000 USD.
          </li>
          <li>
            <strong>Expectativas:</strong> Las áreas de la empresa requieren una
            calidad elevada.
          </li>
        </ul>

        <div
          style={{
            background: "var(--light)",
            padding: "15px",
            borderRadius: "8px",
            margin: "20px 0",
          }}
        >
          <h4 style={{ marginBottom: "10px" }}>Identificación de la Sesión:</h4>
          <label>
            <strong>Selecciona tu Equipo de Trabajo:</strong>
          </label>
          <select
            value={estado.equipo || ""}
            onChange={(e) => setEquipo(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "8px",
              borderRadius: "5px",
              border: "1px solid var(--border)",
              fontSize: "1rem",
            }}
          >
            <option value="">-- Por favor selecciona un equipo --</option>
            {[1, 2, 3, 4, 5, 6, 8].map((n) => (
              <option key={n} value={n}>
                Equipo {n}
              </option>
            ))}
          </select>
          {!estado.equipo && (
            <small
              style={{
                color: "var(--danger)",
                display: "block",
                marginTop: "5px",
              }}
            >
              * Debes seleccionar un equipo para acceder a la simulación.
            </small>
          )}
        </div>

        <button
          onClick={onAvanzar}
          disabled={!estado.equipo}
          style={{
            marginTop: "10px",
            opacity: !estado.equipo ? 0.5 : 1,
            cursor: !estado.equipo ? "not-allowed" : "pointer",
          }}
        >
          Comenzar Fase 1: Inicio
        </button>
      </div>
    </>
  );
}

function FaseNormal({ estado, fase, clave, enAplicar, enAvanzar }) {
  const decisiones = baseDatos[clave];
  const respondidas = estado.historial.filter(
    (h) => h.fase === fase.titulo,
  ).length;
  const completado = respondidas >= decisiones.length;

  return (
    <>
      <div className="fase-header">
        <h2>{fase.titulo}</h2>
        <p>Evalúa las alternativas y compromete el rumbo del proyecto.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        {decisiones.map((dec, idx) => {
          const yaRespondida = estado.historial.find(
            (h) => h.fase === fase.titulo && h.decision === dec.texto,
          );
          return (
            <div className="tarjeta-decision" key={dec.id}>
              <h4>
                {idx + 1}. {dec.texto}
              </h4>
              <div className="opciones-container">
                {dec.opciones.map((opc, oIdx) => {
                  const esLaSeleccionada =
                    yaRespondida && yaRespondida.eleccion === opc.texto;
                  return (
                    <button
                      key={oIdx}
                      className={`tarjeta-opcion ${esLaSeleccionada ? "seleccionada" : ""}`}
                      disabled={!!yaRespondida}
                      onClick={() => enAplicar(opc, dec.texto)}
                    >
                      {opc.texto}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {completado && (
          <button className="btn-block" onClick={enAvanzar}>
            Cerrar Fase y Avanzar al Siguiente Nivel 🚀
          </button>
        )}
      </div>
    </>
  );
}

function FaseEjecucion({ estado, fase, enAvanzar, setEvento, setDisparados }) {
  const completado = estado.eventosDisparados >= 4;

  const generarEvento = () => {
    if (completado) return;
    const ev =
      baseDatos.eventos[Math.floor(Math.random() * baseDatos.eventos.length)];
    setDisparados();
    setEvento(ev);
  };

  return (
    <>
      <div className="fase-header">
        <h2>{fase.titulo}</h2>
        <p>
          El código empieza a fluir y la realidad golpea duro a la
          planificación.
        </p>
      </div>
      {!completado ? (
        <div className="tarjeta-decision" style={{ textAlign: "center" }}>
          <p>
            La curva de Ejecución está en su apogeo. ¡Aparecerán incidencias
            semanales!
          </p>
          <button onClick={generarEvento} style={{ marginTop: "20px" }}>
            Avanzar de Semana y Afrontar Realidad ({estado.eventosDisparados}/4)
          </button>
        </div>
      ) : (
        <div
          className="tarjeta-decision"
          style={{
            background: "var(--success)",
            color: "white",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <h3>✅ Fase Principal de Trabajo Completada</h3>
          <p>
            Has sobrevivido a la vorágine. Te encuentras en la fase de testeo
            final y control.
          </p>
          <button
            onClick={enAvanzar}
            style={{
              background: "var(--card-bg)",
              color: "var(--text)",
              marginTop: "20px",
              padding: "10px 30px",
            }}
          >
            Pasar a Monitoreo y Control
          </button>
        </div>
      )}
    </>
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
  const valorAgile = estado.historial.find(
    (h) =>
      h.eleccion.includes("Valor entregado") || h.eleccion.includes("backlog"),
  );

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      await enviarDrive(resultado);
      setEnviado(true);
    } catch (e) {
      // Error manejado en App.jsx
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

        <div className="metricas-finales">
          <div className="metrica-card">
            <h4>Presupuesto</h4>
            <span
              style={{
                color:
                  estado.presupuestoRestante >= 0
                    ? "var(--success)"
                    : "var(--danger)",
              }}
            >
              ${estado.presupuestoRestante.toLocaleString()}
            </span>
            <small>Restante Final</small>
          </div>
          <div className="metrica-card">
            <h4>Cronograma</h4>
            <span
              style={{
                color:
                  estado.tiempoRestante >= 0
                    ? "var(--success)"
                    : "var(--danger)",
              }}
            >
              {estado.tiempoRestante} Sem.
            </span>
            <small>Holgura</small>
          </div>
          <div className="metrica-card">
            <h4>Calidad Total</h4>
            <span style={{ color: "var(--success)" }}>
              {estado.calidadProyecto}%
            </span>
            <small>Alcanzada</small>
          </div>
          <div className="metrica-card">
            <h4>Puntuación Obtenida</h4>
            <span style={{ color: "var(--accent)" }}>
              {resultado.puntaje}/100
            </span>
            <small>Simulación</small>
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
          }}
        >
          <button onClick={() => window.print()} className="btn-secondary">
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

          <button onClick={reiniciar}>🔄 Volver a Jugar</button>
        </div>
      </div>
    </>
  );
}

function PanelHistorial({ historial }) {
  return (
    <aside className="panel-historial">
      <h3>Historial de Decisiones</h3>
      <ul className="lista-historial">
        {[...historial].reverse().map((item, i) => (
          <li key={i}>
            <strong>[{item.fase}]</strong> {item.decision}
            <br />
            <em>👉 {item.eleccion}</em>
            <small
              style={{
                display: "block",
                color: "var(--secondary)",
                marginTop: "4px",
              }}
            >
              [Impacto] {item.impacto}
            </small>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function ModalEvento({ evento, enOpcion }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="alerta">⚠️ {evento.texto}</h3>
        <p style={{ margin: "15px 0", color: "var(--text-light)" }}>
          Debes reaccionar a esta perturbación real mitigando sus consecuencias.
        </p>
        <div className="opciones-container">
          {evento.opciones.map((opc, i) => (
            <button
              key={i}
              className="tarjeta-opcion"
              onClick={() => enOpcion(opc)}
              style={{ justifyContent: "center" }}
            >
              {opc.texto}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
