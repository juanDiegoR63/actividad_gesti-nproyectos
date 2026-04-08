import type { TeamMember, TurnToken } from "../../types/game";

export const TURN_SEQUENCE: TurnToken[] = [
  "director",
  "planning",
  "quality",
  "enemy",
];

export function findActingMember(team: TeamMember[], token: TurnToken): TeamMember | null {
  if (token === "enemy") {
    return null;
  }

  return (
    team.find(
      (member) => member.assignedRole === token && member.status !== "out",
    ) ?? null
  );
}

function isTokenAvailable(team: TeamMember[], token: TurnToken): boolean {
  if (token === "enemy") {
    return true;
  }

  return team.some(
    (member) => member.assignedRole === token && member.status !== "out",
  );
}

export function getStartingTurnToken(team: TeamMember[]): TurnToken {
  return (
    TURN_SEQUENCE.find((token) => isTokenAvailable(team, token) && token !== "enemy") ??
    "enemy"
  );
}

export function getNextTurnToken(
  currentToken: TurnToken,
  team: TeamMember[],
): TurnToken {
  const currentIndex = TURN_SEQUENCE.indexOf(currentToken);

  for (let offset = 1; offset <= TURN_SEQUENCE.length; offset += 1) {
    const candidate = TURN_SEQUENCE[(currentIndex + offset) % TURN_SEQUENCE.length];
    if (isTokenAvailable(team, candidate)) {
      return candidate;
    }
  }

  return "enemy";
}
