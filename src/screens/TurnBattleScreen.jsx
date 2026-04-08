import React, { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useGameStore } from "../core/store/gameStore";
import { BattleViewport } from "../components/battle/BattleViewport";
import { audioService } from "../core/services/audioService";
import { phases } from "../data/phases";

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

export function TurnBattleScreen() {
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const {
    teamName,
    phaseIndex,
    encounterIndex,
    currentScenario,
    latestIncident,
    turnNumber,
    currentEncounter,
    project,
    team,
    enemies,
    combatLog,
    activeTurnToken,
    availableActions,
    battleStatus,
    activeStaffingCrisis,
    vacantRoles,
    lastLuckLabel,
    lastLuckPolarity,
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
      currentScenario: state.currentScenario,
      latestIncident: state.latestIncident,
      turnNumber: state.turnNumber,
      currentEncounter: state.currentEncounter,
      project: state.project,
      team: state.team,
      enemies: state.enemies,
      combatLog: state.combatLog,
      activeTurnToken: state.activeTurnToken,
      availableActions: state.availableActions,
      battleStatus: state.battleStatus,
      activeStaffingCrisis: state.activeStaffingCrisis,
      vacantRoles: state.vacantRoles,
      lastLuckLabel: state.lastLuckLabel,
      lastLuckPolarity: state.lastLuckPolarity,
      pickAction: state.pickAction,
      resolveEnemyTurn: state.resolveEnemyTurn,
      advanceEncounter: state.advanceEncounter,
      applyCoverageChoice: state.applyCoverageChoice,
      hireReplacementForRole: state.hireReplacementForRole,
    })),
  );

  const phaseData = phases[phaseIndex];
  const phaseTitle =
    currentScenario?.phaseOverrides?.[phaseData?.id ?? ""]?.title ??
    phaseData?.title ??
    `Fase ${phaseIndex + 1}`;
  const phaseCount = phases.length;
  const encounterTotalInPhase = phaseData?.encounters?.length ?? 1;

  const previousTurnRef = useRef(null);
  const previousLogLengthRef = useRef(0);
  const previousStatusRef = useRef(battleStatus);
  const [selectedEnemyId, setSelectedEnemyId] = useState(null);

  useEffect(() => {
    if (battleStatus !== "active" || activeTurnToken !== "enemy" || activeStaffingCrisis) {
      return;
    }

    const timer = setTimeout(() => {
      resolveEnemyTurn();
    }, 700);

    return () => clearTimeout(timer);
  }, [activeTurnToken, battleStatus, activeStaffingCrisis, resolveEnemyTurn]);

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

  useEffect(() => {
    if (!aliveEnemies.length) {
      setSelectedEnemyId(null);
      return;
    }

    if (selectedEnemyId && aliveEnemies.some((enemy) => enemy.id === selectedEnemyId)) {
      return;
    }

    setSelectedEnemyId(aliveEnemies[0]?.id ?? null);
  }, [aliveEnemies, selectedEnemyId]);

  const staffingCandidates = useMemo(
    () => team.filter((member) => member.status !== "out"),
    [team],
  );

  const actionEntries = useMemo(
    () =>
      availableActions.map((option) => ({
        ...option,
        hasDebt: hasDebt(project, option),
      })),
    [availableActions, project],
  );

  const snapshot = useMemo(
    () => ({
      teamName,
      phaseIndex,
      encounterIndex,
      phaseCount,
      encounterTotalInPhase,
      phaseTitle,
      turnNumber,
      encounterTitle: currentEncounter?.title ?? "",
      encounterSubtitle: currentEncounter?.subtitle ?? "",
      isBoss: currentEncounter?.isBoss ?? false,
      scenarioName: currentScenario?.name ?? "",
      scenarioSummary: currentScenario?.summary ?? "",
      latestIncidentTitle: latestIncident?.title ?? "",
      latestIncidentText: latestIncident?.text ?? "",
      activeTurnToken,
      battleStatus,
      staffingCrisis: activeStaffingCrisis,
      lastLuckLabel,
      lastLuckPolarity,
      project,
      team,
      enemies,
      combatLog,
      actions: actionEntries,
      selectedEnemyId,
      vacantRoles,
      staffingCandidates,
      roleNames,
    }),
    [
      teamName,
      phaseIndex,
      encounterIndex,
      phaseCount,
      encounterTotalInPhase,
      phaseTitle,
      turnNumber,
      currentEncounter,
      currentScenario,
      latestIncident,
      activeTurnToken,
      battleStatus,
      activeStaffingCrisis,
      lastLuckLabel,
      lastLuckPolarity,
      project,
      team,
      enemies,
      combatLog,
      actionEntries,
      selectedEnemyId,
      vacantRoles,
      staffingCandidates,
    ],
  );

  const handlers = useMemo(
    () => ({
      onPickAction: (actionId, hasDebtFlag, targetEnemyId) => {
        const fallbackTargetId = aliveEnemies[0]?.id;
        const targetId = targetEnemyId ?? selectedEnemyId ?? fallbackTargetId;
        if (!targetId) {
          return;
        }

        if (targetEnemyId) {
          setSelectedEnemyId(targetEnemyId);
        }

        audioService.playSfx(hasDebtFlag ? "debt" : "confirm");
        pickAction(actionId, targetId);
      },
      onSelectEnemy: (enemyId) => {
        if (!enemyId || !aliveEnemies.some((enemy) => enemy.id === enemyId)) {
          return;
        }

        audioService.playSfx("turn_start");
        setSelectedEnemyId(enemyId);
      },
      onApplyCoverage: (candidateId, missingRole) => {
        audioService.playSfx("confirm");
        applyCoverageChoice(candidateId, missingRole);
      },
      onHireReplacement: (role) => {
        audioService.playSfx("confirm");
        hireReplacementForRole(role);
      },
      onContinueEncounter: () => {
        audioService.playSfx("confirm");
        advanceEncounter();
      },
    }),
    [
      aliveEnemies,
      selectedEnemyId,
      pickAction,
      applyCoverageChoice,
      hireReplacementForRole,
      advanceEncounter,
    ],
  );

  if (!currentEncounter) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-6 py-10">
        <p className="text-slate-300">Preparando encuentro...</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-[100dvw] overflow-hidden">
      {/* Help Button */}
      <button
        onClick={() => setShowHelpModal(true)}
        className="fixed right-2 top-2 z-50 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-blue-700 sm:right-4 sm:top-4 sm:px-4 sm:py-2"
        title="Ayuda - Reglas del juego"
      >
        ?
      </button>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
          <div className="max-h-[92dvh] max-w-3xl overflow-y-auto rounded-lg border-2 border-slate-600 bg-slate-800 p-4 text-white shadow-2xl sm:max-h-[90vh] sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-yellow-400">📖 REGLAS DEL JUEGO</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-3xl text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Combat Rules */}
              <section>
                <h3 className="text-xl font-bold text-red-400 mb-2">⚔️ COMBATE</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Variación de daño real:</strong> Un ataque puede desviarse entre <strong>+20%</strong> y <strong>-34.4%</strong> según rol, estrés y cobertura</li>
                  <li><strong>Estrés por atacar:</strong> Cada ataque que hagas genera estrés en tu personaje equivalente al <strong>33% del daño causado</strong></li>
                  <li><strong>Muerte instantánea:</strong> Si el daño iguala o supera el HP del enemigo, lo elimina de una</li>
                  <li><strong>Ataques de área:</strong> Acciones con "(TODOS)" afectan a todos los enemigos simultáneamente</li>
                </ul>
              </section>

              {/* Stress Management */}
              <section>
                <h3 className="text-xl font-bold text-orange-400 mb-2">😰 GESTIÓN DE ESTRÉS</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Estrés máximo = 100:</strong> Si un personaje llega a 100, <strong>renuncia inmediatamente</strong></li>
                  <li><strong>Bonus por victoria:</strong> Eliminar un enemigo reduce <strong>-5 estrés a todo el equipo</strong></li>
                  <li><strong>Bonus por Boss:</strong> Derrotar un BOSS reduce el estrés de todo el equipo en <strong>50%</strong></li>
                </ul>
              </section>

              {/* Resources */}
              <section>
                <h3 className="text-xl font-bold text-green-400 mb-2">💰 RECURSOS DEL PROYECTO</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Presupuesto:</strong> Necesario para acciones costosas. Si llegas a 0, no puedes usar ciertas acciones</li>
                  <li><strong>Tiempo:</strong> Cada turno puede consumir tiempo. ¡No te quedes sin cronograma!</li>
                  <li><strong>Calidad:</strong> Mantén la calidad alta para evitar defectos críticos</li>
                  <li><strong>Riesgo:</strong> Si el riesgo sube mucho, pueden ocurrir incidentes graves</li>
                  <li><strong>Avance:</strong> Llega a 100 para completar un hito con éxito</li>
                </ul>
              </section>

              {/* Victory Conditions */}
              <section>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">🏆 CONDICIONES DE VICTORIA/DERROTA</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Victoria:</strong> Elimina todos los enemigos del encuentro</li>
                  <li><strong>Derrota:</strong> Si todo tu equipo renuncia (estrés 100), te quedas sin recursos críticos, o el mismo rol (Director/Planning/Calidad) renuncia <strong>3 veces</strong></li>
                  <li><strong>Objetivo final:</strong> Completa todas las fases</li>
                </ul>
              </section>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      <BattleViewport snapshot={snapshot} handlers={handlers} />
    </div>
  );
}
