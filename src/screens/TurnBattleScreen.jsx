import React, { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../core/store/gameStore";
import { BattleViewport } from "../components/battle/BattleViewport";
import { audioService } from "../core/services/audioService";

const roleNames = {
  director: "Director",
  planning: "Planning",
  quality: "Calidad",
};

function hasDebt(project, option) {
  const req = option.requirements;
  if (!req) return false;

  return (
    (req.budget != null && project.budget < req.budget) ||
    (req.time != null && project.time < req.time) ||
    (req.minQuality != null && project.quality < req.minQuality) ||
    (req.maxRisk != null && project.risk > req.maxRisk)
  );
}

function metricColor(value, max, reversed = false) {
  const ratio = value / max;
  if (reversed) {
    if (ratio > 0.65) return "bg-red-500";
    if (ratio > 0.35) return "bg-amber-400";
    return "bg-emerald-500";
  }

  if (ratio < 0.25) return "bg-red-500";
  if (ratio < 0.55) return "bg-amber-400";
  return "bg-emerald-500";
}

function Bar({ label, value, max, reversed = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-widest text-slate-300">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-3 border border-slate-700 bg-slate-900">
        <div className={`h-full ${metricColor(value, max, reversed)} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TurnBattleScreen() {
  const {
    teamName,
    phaseIndex,
    encounterIndex,
    currentEncounter,
    project,
    team,
    enemies,
    combatLog,
    activeTurnToken,
    availableActions,
    battleStatus,
    vacantRoles,
    lastLuckLabel,
    pickAction,
    resolveEnemyTurn,
    advanceEncounter,
    applyCoverageChoice,
    hireReplacementForRole,
  } = useGameStore(
    useShallow((state) => ({
      teamName: state.teamName,
      phaseIndex: state.phaseIndex,
      encounterIndex: state.encounterIndex,
      currentEncounter: state.currentEncounter,
      project: state.project,
      team: state.team,
      enemies: state.enemies,
      combatLog: state.combatLog,
      activeTurnToken: state.activeTurnToken,
      availableActions: state.availableActions,
      battleStatus: state.battleStatus,
      vacantRoles: state.vacantRoles,
      lastLuckLabel: state.lastLuckLabel,
      pickAction: state.pickAction,
      resolveEnemyTurn: state.resolveEnemyTurn,
      advanceEncounter: state.advanceEncounter,
      applyCoverageChoice: state.applyCoverageChoice,
      hireReplacementForRole: state.hireReplacementForRole,
    })),
  );

  const previousTurnRef = useRef(null);
  const previousLogLengthRef = useRef(0);
  const previousStatusRef = useRef(battleStatus);

  useEffect(() => {
    if (battleStatus !== "active" || activeTurnToken !== "enemy") {
      return;
    }

    const timer = setTimeout(() => {
      resolveEnemyTurn();
    }, 700);

    return () => clearTimeout(timer);
  }, [activeTurnToken, battleStatus, resolveEnemyTurn]);

  useEffect(() => {
    if (!currentEncounter) {
      return;
    }

    audioService.playMusic(currentEncounter.musicKey || "phase1_normal");
  }, [currentEncounter]);

  useEffect(() => {
    if (previousTurnRef.current === activeTurnToken) {
      return;
    }

    previousTurnRef.current = activeTurnToken;
    audioService.playSfx(activeTurnToken === "enemy" ? "turn_enemy" : "turn_start");
  }, [activeTurnToken]);

  useEffect(() => {
    if (combatLog.length === previousLogLengthRef.current) {
      return;
    }

    const lastEntry = combatLog[combatLog.length - 1];
    previousLogLengthRef.current = combatLog.length;

    if (!lastEntry) {
      return;
    }

    if (lastEntry.actorType === "enemy") {
      audioService.playSfx("damage_ally");
      return;
    }

    if (lastEntry.category === "warning") {
      audioService.playSfx("debt");
      return;
    }

    if (lastEntry.actorType === "ally") {
      audioService.playSfx("damage_enemy");
    }
  }, [combatLog]);

  useEffect(() => {
    if (previousStatusRef.current === battleStatus) {
      return;
    }

    previousStatusRef.current = battleStatus;
    if (battleStatus === "victory") {
      audioService.playSfx("victory");
    }
    if (battleStatus === "defeat") {
      audioService.playSfx("defeat");
    }
  }, [battleStatus]);

  const aliveEnemies = useMemo(() => enemies.filter((enemy) => enemy.hp > 0), [enemies]);

  const staffingCandidates = useMemo(
    () => team.filter((member) => member.status !== "out"),
    [team],
  );

  if (!currentEncounter) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <p className="text-slate-300">Preparando encuentro...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1480px] px-4 py-4">
      <div className="mb-3 border-2 border-slate-700 bg-slate-900 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {teamName} • Fase {phaseIndex + 1} • Encuentro {encounterIndex + 1}
            </p>
            <h1 className="text-2xl font-black uppercase text-slate-100">
              {currentEncounter.title}
            </h1>
            <p className="text-sm text-slate-300">{currentEncounter.subtitle}</p>
          </div>
          <div className="border-2 border-amber-500 bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-900">
            {currentEncounter.isBoss ? "Boss" : "Normal"}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <Bar label="Presupuesto" value={project.budget} max={project.maxBudget} />
          <Bar label="Tiempo" value={project.time} max={project.maxTime} />
          <Bar label="Calidad" value={project.quality} max={project.maxQuality} />
          <Bar label="Riesgo" value={project.risk} max={project.maxRisk} reversed />
          <Bar label="Avance" value={project.progress} max={project.maxProgress} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="border-2 border-slate-700 bg-slate-900 p-3">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Team Panel
          </h2>
          <div className="space-y-2">
            {team.map((member) => {
              const isActiveTurn =
                activeTurnToken !== "enemy" && member.assignedRole === activeTurnToken;
              return (
                <article
                  key={member.id}
                  className={`border-2 p-3 ${
                    isActiveTurn
                      ? "border-amber-400 bg-amber-200/10"
                      : "border-slate-700 bg-slate-950"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-100">{member.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      {roleNames[member.role]}
                    </p>
                  </div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    Estado: {member.status}
                  </p>
                  <div className="mt-2 space-y-1">
                    <Bar label="Energia" value={member.energy} max={member.maxEnergy} />
                    <Bar label="Estres" value={member.stress} max={member.maxStress} reversed />
                  </div>
                </article>
              );
            })}
          </div>
        </aside>

        <section className="border-2 border-slate-700 bg-slate-900 p-3">
          <div className="mb-3 border-2 border-slate-700 bg-slate-950 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Turno activo</p>
            <p className="text-xl font-black uppercase text-amber-300">
              {activeTurnToken === "enemy"
                ? "Respuesta enemiga"
                : `Turno de ${roleNames[activeTurnToken]}`}
            </p>
            {lastLuckLabel && (
              <p className="mt-1 text-xs text-cyan-300">Ultimo evento de suerte: {lastLuckLabel}</p>
            )}
          </div>

          <BattleViewport
            phaseIndex={phaseIndex}
            encounterTitle={currentEncounter.title}
            isBoss={currentEncounter.isBoss}
            activeTurnToken={activeTurnToken}
            team={team}
            enemies={enemies}
          />

          <div className="my-3 border-2 border-slate-700 bg-slate-950 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              Intenciones enemigas visibles
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {enemies.map((enemy) => (
                <div key={enemy.id} className="border border-slate-700 bg-slate-900 px-3 py-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-100">
                    <span>{enemy.name}</span>
                    <span>HP {Math.round(enemy.hp)}</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-rose-300">
                    {enemy.hp > 0 && enemy.intent
                      ? `Intencion: ${enemy.intent.label}`
                      : "Sin amenaza activa"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {battleStatus === "active" && activeTurnToken !== "enemy" && (
            <div className="border-2 border-slate-700 bg-slate-950 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Action Bar
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {availableActions.map((option) => {
                  const debt = hasDebt(project, option);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        audioService.playSfx(debt ? "debt" : "confirm");
                        pickAction(option.id, aliveEnemies[0]?.id);
                      }}
                      className={`border-2 p-3 text-left transition ${
                        debt
                          ? "border-rose-500 bg-rose-900/20 hover:bg-rose-900/35"
                          : "border-slate-700 bg-slate-900 hover:border-amber-300"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-100">{option.title}</span>
                        {debt && (
                          <span className="border border-rose-400 bg-rose-500 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
                            Deuda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{option.summary}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {battleStatus === "victory" && (
            <div className="border-2 border-emerald-500 bg-emerald-950/20 p-3">
              <p className="text-lg font-black uppercase text-emerald-300">Encuentro superado</p>
              {vacantRoles.length > 0 && (
                <div className="mt-3 border-2 border-amber-400 bg-amber-200/10 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Continuidad operativa
                  </p>
                  {vacantRoles.map((role) => (
                    <div key={role} className="mt-2 border border-slate-700 bg-slate-900 p-2">
                      <p className="text-xs text-slate-300">Rol vacante: {roleNames[role]}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {staffingCandidates.map((candidate) => (
                          <button
                            key={`${role}-${candidate.id}`}
                            type="button"
                            onClick={() => {
                              audioService.playSfx("confirm");
                              applyCoverageChoice(candidate.id, role);
                            }}
                            className="border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wider text-slate-200 hover:bg-slate-700"
                          >
                            Suplencia: {candidate.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            audioService.playSfx("confirm");
                            hireReplacementForRole(role);
                          }}
                          className="border border-emerald-400 bg-emerald-300 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900"
                        >
                          Contratar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  audioService.playSfx("confirm");
                  advanceEncounter();
                }}
                className="mt-3 border-2 border-emerald-400 bg-emerald-300 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-900"
              >
                Continuar
              </button>
            </div>
          )}
        </section>

        <aside className="border-2 border-slate-700 bg-slate-900 p-3">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Combat Log
          </h2>
          <div className="h-[580px] space-y-2 overflow-y-auto border-2 border-slate-700 bg-slate-950 p-2">
            {combatLog.map((entry) => (
              <article key={entry.id} className="border border-slate-800 bg-slate-900 p-2 text-xs text-slate-300">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">
                  Turno {entry.turnNumber} • {entry.actorName}
                </p>
                <p>{entry.text}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
