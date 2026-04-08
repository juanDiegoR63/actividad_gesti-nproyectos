import type { PhaseDefinition } from "../../types/game";
import { phase1 } from "./phase1";
import { phase2 } from "./phase2";
import { phase3 } from "./phase3";
import { phase4 } from "./phase4";
import { phase5 } from "./phase5";

export const phases: PhaseDefinition[] = [phase1, phase2, phase3, phase4, phase5];
