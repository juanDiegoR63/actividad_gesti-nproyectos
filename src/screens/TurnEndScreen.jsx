import React, { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../core/store/gameStore";
import { audioService } from "../core/services/audioService";

function pretty(value) {
  return Math.round(value * 10) / 10;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function sanitizeFileName(value) {
  const fallback = "equipo";
  const safeValue = String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safeValue || fallback;
}

function buildCsvReport({
  generatedAt,
  teamName,
  scenarioName,
  gameOverReason,
  finalScore,
  project,
  team,
  turnNumber,
  combatLog,
}) {
  const lines = [];
  const push = (row) => {
    lines.push(row.map(csvEscape).join(","));
  };

  push(["Reporte de Campana PMBOK"]);
  push(["Fecha", generatedAt]);
  push(["Equipo", teamName || "Equipo"]);
  push(["Escenario", scenarioName || "N/A"]);
  push(["Turnos jugados", turnNumber ?? 0]);
  push(["Motivo de cierre", gameOverReason || "Victoria"]);
  push([]);

  push(["Puntaje Final"]);
  push(["Score", finalScore?.score ?? 0]);
  push(["Rango", finalScore?.rank ?? "Sin clasificar"]);
  push([]);

  push(["Estado del Proyecto"]);
  push(["Presupuesto", Math.round(project.budget), "Max Presupuesto", Math.round(project.maxBudget)]);
  push(["Tiempo", Math.round(project.time), "Max Tiempo", Math.round(project.maxTime)]);
  push(["Calidad", Math.round(project.quality), "Max Calidad", Math.round(project.maxQuality)]);
  push(["Riesgo", Math.round(project.risk), "Max Riesgo", Math.round(project.maxRisk)]);
  push(["Avance", Math.round(project.progress), "Max Avance", Math.round(project.maxProgress)]);
  push([]);

  if (finalScore?.breakdown) {
    push(["Desglose de Puntaje"]);
    push(["Salud presupuesto (%)", pretty(finalScore.breakdown.budgetHealth)]);
    push(["Cumplimiento temporal (%)", pretty(finalScore.breakdown.timeHealth)]);
    push(["Calidad final (%)", pretty(finalScore.breakdown.qualityHealth)]);
    push(["Control de riesgo (%)", pretty(finalScore.breakdown.riskControl)]);
    push(["Avance (%)", pretty(finalScore.breakdown.progressCompletion)]);
    push(["Estabilidad equipo (%)", pretty(finalScore.breakdown.teamStability)]);
    push([]);
  }

  push(["Equipo"]);
  push(["Rol", "Nombre", "Estado", "Energia", "Estres", "Rol Asignado"]);
  team.forEach((member) => {
    push([
      member.role,
      member.name,
      member.status,
      Math.round(member.energy),
      Math.round(member.stress),
      member.assignedRole,
    ]);
  });
  push([]);

  push(["Ultimos eventos de combate"]);
  push(["Turno", "Actor", "Tipo", "Categoria", "Evento"]);
  combatLog.slice(-30).forEach((entry) => {
    push([
      entry.turnNumber,
      entry.actorName,
      entry.actorType,
      entry.category,
      entry.text,
    ]);
  });

  return lines.join("\n");
}

export function TurnEndScreen() {
  const {
    finalScore,
    gameOverReason,
    project,
    team,
    teamName,
    turnNumber,
    combatLog,
    currentScenario,
    resetRun,
  } = useGameStore(
    useShallow((state) => ({
      finalScore: state.finalScore,
      gameOverReason: state.gameOverReason,
      project: state.project,
      team: state.team,
      teamName: state.teamName,
      turnNumber: state.turnNumber,
      combatLog: state.combatLog,
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

  const handleDownloadReport = async () => {
    const reportDate = new Date();
    const formattedDate = reportDate.toLocaleString("es-EC", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const report = buildCsvReport({
      generatedAt: formattedDate,
      teamName,
      scenarioName: currentScenario?.name,
      gameOverReason,
      finalScore,
      project,
      team,
      turnNumber,
      combatLog,
    });

    const stamp = reportDate.toISOString().slice(0, 10);
    const safeTeamName = sanitizeFileName(teamName || "equipo");
    const fileName = `reporte-${safeTeamName}-${stamp}.csv`;
    const blob = new Blob(["\uFEFF", report], {
      type: "text/csv;charset=utf-8;",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);

    await audioService.unlock();
    audioService.playSfx("confirm");
  };

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="border-4 border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Campaign Report</p>
        <h1 className="mt-2 text-2xl font-black uppercase text-slate-100 sm:text-3xl">Resultados de la run</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              Nombre: {teamName || "Equipo"}
            </p>
            <p className="mt-1 text-sm text-slate-200">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <p className="text-sm text-slate-200">Salud presupuesto: {pretty(finalScore.breakdown.budgetHealth)}%</p>
              <p className="text-sm text-slate-200">Cumplimiento temporal: {pretty(finalScore.breakdown.timeHealth)}%</p>
              <p className="text-sm text-slate-200">Calidad final: {pretty(finalScore.breakdown.qualityHealth)}%</p>
              <p className="text-sm text-slate-200">Control de riesgo: {pretty(finalScore.breakdown.riskControl)}%</p>
              <p className="text-sm text-slate-200">Avance: {pretty(finalScore.breakdown.progressCompletion)}%</p>
              <p className="text-sm text-slate-200">Estabilidad equipo: {pretty(finalScore.breakdown.teamStability)}%</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void handleDownloadReport();
            }}
            className="border-2 border-sky-400 bg-sky-300 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-900"
          >
            Descargar reporte Excel
          </button>

          <button
            type="button"
            onClick={() => {
              void handleReset();
            }}
            className="border-2 border-amber-400 bg-amber-300 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-900"
          >
            Nueva run
          </button>
        </div>
      </div>
    </div>
  );
}
