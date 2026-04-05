import React from "react";
import { baseDatos, eventoFase } from "../data/Events";
import { HUD } from "../components/HUD";
import { CouncilRoom } from "../components/CouncilRoom";
import { NarrativeEngine } from "../components/NarrativeEngine";
import { ActionLog } from "../components/ActionLog";
import { Button } from "../components/ui/Button";

export function GameScreen({ engine }) {
  const {
    estado,
    setEstado,
    ultimoResultadoVotacion,
    setUltimoResultadoVotacion,
    toastMessage,
    aplicarDecision,
    reiniciarProyecto,
  } = engine;

  const faseActual = baseDatos.fases[estado.faseActual];
  const faseClave = faseActual ? faseActual.clave : "";
  const todosEventosFase = eventoFase(faseClave);
  const todosCompletados = todosEventosFase.every((e) =>
    estado.historico.some((h) => h.id === e.id),
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-2 md:grid-cols-4">
        {baseDatos.fases
          .filter((f) => f.id > 0)
          .map((fase) => {
            const isActive = estado.faseActual === fase.id;
            const isDone = estado.faseActual > fase.id;

            return (
              <div
                key={fase.id}
                className={[
                  "rounded-lg border px-3 py-2 text-center text-xs font-semibold tracking-wide md:text-sm",
                  isActive
                    ? "border-indigo-400 bg-indigo-500/15 text-indigo-300"
                    : isDone
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-700 bg-slate-800 text-slate-400",
                ].join(" ")}
              >
                {fase.titulo.split(":")[1] || fase.titulo}
              </div>
            );
          })}
      </div>

      <main className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <HUD estado={estado} />

        <CouncilRoom
          estado={estado}
          ultimoResultadoVotacion={ultimoResultadoVotacion}
        />

        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
          <h1 className="mb-2 text-2xl font-bold text-indigo-400">
            {(faseActual?.titulo &&
              (faseActual.titulo.split(":")[1] || faseActual.titulo)) ||
              "Fase en Curso"}
          </h1>
          <p className="text-slate-400">
            Decisiones de la fase. Completa todas para avanzar.
          </p>
        </div>

        {todosEventosFase.map((ev, globalIdx) => {
          const yaRespondido = estado.historico.find((h) => h.id === ev.id);
          const idxPrimerFaltante = todosEventosFase.findIndex(
            (e) => !estado.historico.some((h) => h.id === e.id),
          );
          const esActivo = globalIdx === idxPrimerFaltante;

          if (yaRespondido || (!esActivo && globalIdx > idxPrimerFaltante)) {
            return null;
          }

          if (esActivo) {
            return (
              <NarrativeEngine
                key={ev.id}
                evento={ev}
                estado={estado}
                onSelectOption={aplicarDecision}
              />
            );
          }

          return null;
        })}

        {todosCompletados && (
          <div className="mb-6 rounded-lg border border-emerald-700 bg-emerald-900/30 p-6 text-center">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Fase Completada
            </h2>
            <Button
              variant="success"
              onClick={() => {
                setEstado((prev) => ({
                  ...prev,
                  faseActual: prev.faseActual + 1,
                  historico: [...prev.historico],
                }));
                setUltimoResultadoVotacion(null);
                window.scrollTo(0, 0);
              }}
            >
              Avanzar a la Siguiente Fase
            </Button>
          </div>
        )}

        <ActionLog historico={estado.historico} />
      </main>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-200">
        <span>
          <strong>Equipo:</strong> {estado.equipo}
        </span>
        <Button
          variant="secondary"
          className="px-3 py-2 text-sm"
          onClick={() => {
            if (window.confirm("¿Reiniciar progreso?")) reiniciarProyecto();
          }}
        >
          Reiniciar
        </Button>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border-l-4 border-indigo-400 bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
