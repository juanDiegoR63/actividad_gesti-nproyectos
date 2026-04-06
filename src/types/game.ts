export type CharacterRole = "director" | "planning" | "quality";

export type Gender = "male" | "female";

export type HairStyle =
  | "fade"
  | "side_part"
  | "curly"
  | "long_wavy"
  | "ponytail"
  | "bob_cut"
  | "braids";

export type SkinTone = "light" | "medium" | "tan" | "dark";

export type ShoeStyle = "dress" | "boots" | "sneakers";

export type ShirtStyle = "tshirt" | "polo" | "dress_shirt" | "formal_blazer" | "blouse";

export type PantsStyle = "jeans" | "slacks" | "cargo" | "skirt";

export type ShirtColor = "teal" | "navy" | "maroon" | "olive" | "gray" | "white";

export type PantsColor = "black" | "charcoal" | "navy" | "brown" | "khaki";

export type FaceStyle = "neutral" | "smile" | "focus" | "serious";

export type CharacterCosmetic = {
  gender: Gender;
  hairStyle: HairStyle;
  skinTone: SkinTone;
  shirtStyle: ShirtStyle;
  shirtColor: ShirtColor;
  pantsStyle: PantsStyle;
  pantsColor: PantsColor;
  shoeStyle: ShoeStyle;
  faceStyle: FaceStyle;
};

export type CharacterStatus =
  | "active"
  | "overloaded"
  | "covering_other_role"
  | "out";

export type EnemyType = "stakeholder" | "department" | "organization" | "boss";

export type RunScreen = "menu" | "creation" | "battle" | "results";

export type BattleStatus = "idle" | "active" | "victory" | "defeat";

export type TurnToken = CharacterRole | "enemy";

export type ProjectResourceKey =
  | "budget"
  | "time"
  | "quality"
  | "risk"
  | "progress";

export type ProjectStats = {
  budget: number;
  maxBudget: number;
  time: number;
  maxTime: number;
  quality: number;
  maxQuality: number;
  risk: number;
  maxRisk: number;
  progress: number;
  maxProgress: number;
};

export type TeamMember = {
  id: string;
  name: string;
  role: CharacterRole;
  assignedRole: CharacterRole;
  cosmetic: CharacterCosmetic;
  energy: number;
  maxEnergy: number;
  stress: number;
  maxStress: number;
  salary: number;
  status: CharacterStatus;
};

export type EnemyIntentType =
  | "scope_pressure"
  | "budget_burn"
  | "delay"
  | "quality_attack"
  | "risk_spike"
  | "compliance_gate"
  | "rework"
  | "stakeholder_noise";

export type EnemyIntent = {
  type: EnemyIntentType;
  label: string;
  previewText: string;
  expectedEffects: Partial<Record<ProjectResourceKey, number>>;
  telegraphLevel: "clear" | "partial";
};

export type EnemyVisual = {
  bodyColor: number;
  headColor: number;
  accentColor: number;
  eyeColor: number;
  mark: "visor" | "horns" | "scar" | "mask";
};

export type EnemyUnit = {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  threat: number;
  intent: EnemyIntent | null;
  tags: string[];
  visual?: EnemyVisual;
};

export type ResourceRequirement = Partial<{
  budget: number;
  time: number;
  minQuality: number;
  maxRisk: number;
}>;

export type DecisionEffects = {
  project?: Partial<Record<ProjectResourceKey, number>>;
  actor?: Partial<{
    energy: number;
    stress: number;
  }>;
  targetEnemy?: Partial<{
    hp: number;
    threat: number;
  }>;
  allEnemies?: Partial<{
    hp: number;
    threat: number;
  }>;
};

export type DecisionOption = {
  id: string;
  actorRole: CharacterRole | "any";
  title: string;
  summary: string;
  description: string;
  tags: string[];
  glossaryKeys: string[];
  requirements?: ResourceRequirement;
  baseEffects: DecisionEffects;
  debtEffects?: DecisionEffects;
  roleScaling?: Partial<Record<CharacterRole, number>>;
  luckProfile: "low" | "normal" | "high";
  targetMode: "single" | "all" | "self" | "project";
  narrativeResult: string;
};

export type EnemySeed = {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  threat: number;
  tags: string[];
  intents: EnemyIntentType[];
};

export type BossRules = {
  thresholds?: Array<{
    hpRatio: number;
    intent?: EnemyIntentType;
    logText: string;
  }>;
};

export type EncounterDefinition = {
  id: string;
  phaseId: string;
  title: string;
  subtitle: string;
  isBoss: boolean;
  background: string;
  musicKey: string;
  introText: string;
  completionText: string;
  enemies: EnemySeed[];
  actionPoolId: string[];
  bossRules?: BossRules;
};

export type PhaseDefinition = {
  id: string;
  title: string;
  theme: string;
  introNarrative: string;
  encounters: EncounterDefinition[];
};

export type LogCategory =
  | "action"
  | "damage"
  | "luck"
  | "status"
  | "warning"
  | "phase";

export type LogEntry = {
  id: string;
  turnNumber: number;
  actorName: string;
  actorType: "ally" | "enemy" | "system";
  text: string;
  glossaryKeys?: string[];
  category: LogCategory;
  timestamp: number;
};

export type LuckEventPolarity = "positive" | "negative";

export type LuckEvent = {
  id: string;
  polarity: LuckEventPolarity;
  label: string;
  description: string;
  effects: DecisionEffects;
  weight: number;
};

export type DebtResult = {
  hasDebt: boolean;
  missingBudget: boolean;
  missingTime: boolean;
  missingQuality: boolean;
  missingRiskCap: boolean;
};

export type ResolutionResult = {
  project: ProjectStats;
  team: TeamMember[];
  enemies: EnemyUnit[];
  logEntry: LogEntry;
  debt: DebtResult;
  luckEvent: LuckEvent | null;
};

export type StartRunPayload = {
  teamName: string;
  members: Record<CharacterRole, string>;
  cosmetics?: Record<CharacterRole, CharacterCosmetic>;
};
