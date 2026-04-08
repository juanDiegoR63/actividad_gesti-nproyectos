import React, { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../core/store/gameStore";
import { audioService } from "../core/services/audioService";

function pretty(value) {
  return Math.round(value * 10) / 10;
}

export function TurnEndScreen() {
  const { finalScore, gameOverReason, project, team, currentScenario, resetRun } = useGameStore(
    useShallow((state) => ({
      finalScore: state.finalScore,
      gameOverReason: state.gameOverReason,
      project: state.project,
      team: state.team,
      currentScenario: state.currentScenario,
      resetRun: state.resetRun,
    })),
  );

  const activeMembers = team.filter((member) => member.status !== "out");
  const playedOutcomeSfx = useRef(false);

  useEffect(() => {
    audioService.playMusic("results");
  }, []);

  useEffect(() => {
    if (playedOutcomeSfx.current) {
      return;
    }

    playedOutcomeSfx.current = true;
    audioService.playSfx(gameOverReason ? "defeat" : "victory");
  }, [gameOverReason]);

  const handleReset = async () => {
    await audioService.unlock();
    audioService.playSfx("confirm");
    resetRun();
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <div className="border-4 border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Campaign Report</p>
        <h1 className="mt-2 text-3xl font-black uppercase text-slate-100">Resultados de la run</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="border-2 border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Puntaje final</p>
            <p className="mt-2 text-3xl font-black text-amber-300">{finalScore?.score ?? 0}</p>
            <p className="text-sm text-slate-300">{finalScore?.rank ?? "Sin clasificar"}</p>
          </div>
          <div className="border-2 border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Estado del proyecto</p>
            <p className="mt-2 text-sm text-slate-200">
              Presupuesto {Math.round(project.budget)} • Tiempo {Math.round(project.time)} • Calidad {Math.round(project.quality)} • Riesgo {Math.round(project.risk)}
            </p>
          </div>
          <div className="border-2 border-slate-700 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Equipo</p>
            <p className="mt-2 text-sm text-slate-200">
              Activos: {activeMembers.length}/{team.length}
            </p>
            {currentScenario && (
              <p className="mt-2 text-xs uppercase tracking-wider text-sky-300">
                Escenario: {currentScenario.name}
              </p>
            )}
            {gameOverReason && (
              <p className="mt-2 text-xs uppercase tracking-wider text-rose-300">Motivo: {gameOverReason}</p>
            )}
          </div>
        </div>

        {finalScore && (
          <div className="mt-6 border-2 border-slate-700 bg-slate-950 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Desglose</p>
            <div className="grid gap-3 md:grid-cols-3">
              <p className="text-sm text-slate-200">Salud presupuesto: {pretty(finalScore.breakdown.budgetHealth)}%</p>
              <p className="text-sm text-slate-200">Cumplimiento temporal: {pretty(finalScore.breakdown.timeHealth)}%</p>
              <p className="text-sm text-slate-200">Calidad final: {pretty(finalScore.breakdown.qualityHealth)}%</p>
              <p className="text-sm text-slate-200">Control de riesgo: {pretty(finalScore.breakdown.riskControl)}%</p>
              <p className="text-sm text-slate-200">Avance: {pretty(finalScore.breakdown.progressCompletion)}%</p>
              <p className="text-sm text-slate-200">Estabilidad equipo: {pretty(finalScore.breakdown.teamStability)}%</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            void handleReset();
          }}
          className="mt-8 border-2 border-amber-400 bg-amber-300 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-900"
        >
          Nueva run
        </button>
      </div>
    </div>
  );
}
