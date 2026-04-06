import { useGameStore } from "../core/store/gameStore";
import { useShallow } from "zustand/react/shallow";

export function useTurnBasedEngine() {
	const state = useGameStore(
		useShallow((store) => ({
			currentScreen: store.currentScreen,
			phaseIndex: store.phaseIndex,
			encounterIndex: store.encounterIndex,
			turnNumber: store.turnNumber,
			battleStatus: store.battleStatus,
			project: store.project,
			team: store.team,
			enemies: store.enemies,
			currentEncounter: store.currentEncounter,
			availableActions: store.availableActions,
			activeTurnToken: store.activeTurnToken,
			combatLog: store.combatLog,
			finalScore: store.finalScore,
			gameOverReason: store.gameOverReason,
			startRun: store.startRun,
			pickAction: store.pickAction,
			resolveEnemyTurn: store.resolveEnemyTurn,
			advanceEncounter: store.advanceEncounter,
			applyCoverageChoice: store.applyCoverageChoice,
			hireReplacementForRole: store.hireReplacementForRole,
			goToCreation: store.goToCreation,
			backToMenu: store.backToMenu,
			resetRun: store.resetRun,
		})),
	);

	return state;
}
