import { phases } from "../../data/phases";

export function getPhaseByIndex(phaseIndex) {
	return phases[phaseIndex] ?? null;
}

export function getEncounterByIndex(phaseIndex, encounterIndex) {
	const phase = getPhaseByIndex(phaseIndex);
	if (!phase) {
		return null;
	}

	return phase.encounters[encounterIndex] ?? null;
}

export function hasNextEncounter(phaseIndex, encounterIndex) {
	const phase = getPhaseByIndex(phaseIndex);
	if (!phase) {
		return false;
	}

	return encounterIndex + 1 < phase.encounters.length;
}

export function hasNextPhase(phaseIndex) {
	return phaseIndex + 1 < phases.length;
}
