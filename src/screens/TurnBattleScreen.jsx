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
  const {
    teamName,
    phaseIndex,
    encounterIndex,
    turnNumber,
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
      turnNumber: state.turnNumber,
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
      lastLuckPolarity: state.lastLuckPolarity,
      pickAction: state.pickAction,
      resolveEnemyTurn: state.resolveEnemyTurn,
      advanceEncounter: state.advanceEncounter,
      applyCoverageChoice: state.applyCoverageChoice,
      hireReplacementForRole: state.hireReplacementForRole,
    })),
  );

  const phaseTitle = phases[phaseIndex]?.title ?? `Fase ${phaseIndex + 1}`;

  const previousTurnRef = useRef(null);
  const previousLogLengthRef = useRef(0);
  const previousStatusRef = useRef(battleStatus);
  const [selectedEnemyId, setSelectedEnemyId] = useState(null);

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
      phaseTitle,
      turnNumber,
      encounterTitle: currentEncounter?.title ?? "",
      encounterSubtitle: currentEncounter?.subtitle ?? "",
      isBoss: currentEncounter?.isBoss ?? false,
      activeTurnToken,
      battleStatus,
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
      phaseTitle,
      turnNumber,
      currentEncounter,
      activeTurnToken,
      battleStatus,
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
    <div className="h-screen w-screen overflow-hidden">
      <BattleViewport snapshot={snapshot} handlers={handlers} />
    </div>
  );
}
