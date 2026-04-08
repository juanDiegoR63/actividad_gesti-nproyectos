import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";
import { DEFAULT_ROLE_COSMETICS } from "../../data/characterCosmetics";

const CANVAS_UI_SCALE = 2;
const UI_ANIMATION_MS = 3000;
const THREE_SECOND_WAVE = 0.45;
const EVENT_SPLASH_ALLY_MS = 5000;
const EVENT_SPLASH_FADE_IN_MS = 320;
const EVENT_SPLASH_FADE_OUT_MS = 760;
const MAX_COMBAT_LOG_CARDS = 5;
const INTENT_RESOURCE_LABELS = {
  budget: "Presupuesto",
  time: "Tiempo",
  quality: "Calidad",
  risk: "Riesgo",
  progress: "Avance",
};

const PROJECT_EFFECT_LABELS = {
  budget: "Presupuesto",
  time: "Tiempo",
  quality: "Calidad",
  risk: "Riesgo",
  progress: "Avance",
};

const ACTOR_EFFECT_LABELS = {
  energy: "Energia",
  stress: "Estres",
};

const TARGET_EFFECT_LABELS = {
  hp: "HP",
  threat: "Amenaza",
};

const PHASE_PALETTES = [
  { base: 0x1f2933, accent: 0x334155, floor: 0x0f172a, tile: 0x243041 },
  { base: 0x1f2d2b, accent: 0x2f4b46, floor: 0x0f1f1d, tile: 0x2a3d39 },
  { base: 0x2c2620, accent: 0x4a3b31, floor: 0x1a1512, tile: 0x3a2f27 },
  { base: 0x1e252e, accent: 0x3a4654, floor: 0x11161d, tile: 0x2f3843 },
  { base: 0x302520, accent: 0x4f3a2f, floor: 0x1c1411, tile: 0x402e25 },
];

const ALLY_COLORS = {
  director: 0x1f9d8a,
  planning: 0x3b82f6,
  quality: 0xf59e0b,
};

const ALLY_APPEARANCE = {
  director: {
    hair: 0x333333,
    shoes: 0x111827,
  },
  planning: {
    hair: 0x78350f,
    shoes: 0x0f172a,
  },
  quality: {
    hair: 0x1f2937,
    shoes: 0x1f2937,
  },
};

const SKIN_TONE_COLORS = {
  light: 0xf8dfc5,
  medium: 0xe8c09b,
  tan: 0xc99570,
  dark: 0x8d5c3b,
};

const SHIRT_COLOR_MAP = {
  teal: 0x0d9488,
  navy: 0x1e3a8a,
  maroon: 0x7f1d1d,
  olive: 0x4d7c0f,
  gray: 0x475569,
  white: 0xf8fafc,
};

const PANTS_COLOR_MAP = {
  black: 0x334155,
  charcoal: 0x374151,
  navy: 0x1e3a8a,
  brown: 0x7c2d12,
  khaki: 0xa16207,
};

const DEFAULT_COSMETIC = {
  gender: "male",
  hairStyle: "fade",
  skinTone: "medium",
  shirtStyle: "tshirt",
  shirtColor: "gray",
  pantsStyle: "slacks",
  pantsColor: "charcoal",
  shoeStyle: "dress",
  faceStyle: "neutral",
};

const ENEMY_AVATAR_GENDERS = ["male", "female"];
const ENEMY_AVATAR_HAIRS = ["fade", "side_part", "curly", "long_wavy", "ponytail", "bob_cut", "braids"];
const ENEMY_AVATAR_SKIN_TONES = ["light", "medium", "tan", "dark"];
const ENEMY_AVATAR_SHIRT_STYLES = ["tshirt", "polo", "dress_shirt", "formal_blazer", "blouse"];
const ENEMY_AVATAR_PANTS_STYLES = ["jeans", "slacks", "cargo", "skirt"];
const ENEMY_AVATAR_SHIRT_COLORS = ["teal", "navy", "maroon", "olive", "gray", "white"];
const ENEMY_AVATAR_PANTS_COLORS = ["black", "charcoal", "navy", "brown", "khaki"];
const ENEMY_AVATAR_SHOES = ["dress", "boots", "sneakers"];
const ENEMY_AVATAR_FACES = ["neutral", "smile", "focus", "serious"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashString(value) {
  const text = String(value || "seed");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + (text.codePointAt(index) ?? 0)) >>> 0;
  }
  return hash;
}

function pickDeterministic(list, seed, offset = 0) {
  if (!Array.isArray(list) || !list.length) {
    return undefined;
  }

  return list[(seed + offset) % list.length];
}

function toPercent(value, max) {
  if (max <= 0) return 0;
  return clamp(value / max, 0, 1);
}

const PROJECT_METERS = [
  {
    key: "budget",
    maxKey: "maxBudget",
    label: "Presupuesto",
    tooltip:
      "Fondos disponibles para decisiones del proyecto. Si se agota, no puedes sostener el plan.",
  },
  {
    key: "time",
    maxKey: "maxTime",
    label: "Tiempo",
    tooltip:
      "Holgura de calendario restante. Cada demora reduce margen para corregir incidentes.",
  },
  {
    key: "quality",
    maxKey: "maxQuality",
    label: "Calidad",
    tooltip:
      "Criterios QA cumplidos sobre el total esperado. Menor calidad implica mas retrabajo.",
  },
  {
    key: "risk",
    maxKey: "maxRisk",
    label: "Riesgo",
    reversed: true,
    fillColor: 0xf97316,
    tooltip:
      "Frentes de riesgo abiertos. Aqui menos es mejor: si sube demasiado, el proyecto entra en crisis.",
  },
  {
    key: "progress",
    maxKey: "maxProgress",
    label: "Avance",
    fillColor: 0x22c55e,
    tooltip:
      "Hitos consolidados respecto al total del slice. Mide avance real, no actividad.",
  },
];

function toDisplayMetric(metricKey, value, max) {
  const safeMax = Math.max(1, max || 1);
  const ratio = toPercent(value, safeMax);

  switch (metricKey) {
    case "budget":
      return {
        current: Math.round(value * 10),
        cap: Math.round(safeMax * 10),
        unit: "k USD",
      };
    case "time":
      return {
        current: Math.round(value * 1.5),
        cap: Math.round(safeMax * 1.5),
        unit: "dias",
      };
    case "quality":
      return {
        current: Math.round(ratio * 20),
        cap: 20,
        unit: "criterios QA",
      };
    case "risk":
      return {
        current: Math.round(ratio * 15),
        cap: 15,
        unit: "frentes",
      };
    case "progress":
      return {
        current: Math.round(ratio * 12),
        cap: 12,
        unit: "hitos",
      };
    default:
      return {
        current: Math.round(value),
        cap: Math.round(safeMax),
        unit: "pts",
      };
  }
}

function formatMetricMeasure(metricKey, value, max) {
  const display = toDisplayMetric(metricKey, value, max);
  return `${display.current}/${display.cap} ${display.unit}`;
}

function formatMetricDelta(metricKey, delta, max) {
  const safeMax = Math.max(1, max || 1);
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.01) {
    return null;
  }

  let scaledDelta = delta;
  let unit = "pts";

  switch (metricKey) {
    case "budget":
      scaledDelta = delta * 10;
      unit = "k";
      break;
    case "time":
      scaledDelta = delta * 1.5;
      unit = "d";
      break;
    case "quality":
      scaledDelta = (delta / safeMax) * 20;
      unit = "crit";
      break;
    case "risk":
      scaledDelta = (delta / safeMax) * 15;
      unit = "fr";
      break;
    case "progress":
      scaledDelta = (delta / safeMax) * 12;
      unit = "h";
      break;
    default:
      break;
  }

  if (Math.abs(scaledDelta) < 0.1) {
    return null;
  }

  const rounded = Math.abs(scaledDelta) >= 10
    ? Math.round(Math.abs(scaledDelta))
    : Math.round(Math.abs(scaledDelta) * 10) / 10;

  return `${scaledDelta > 0 ? "+" : "-"}${rounded} ${unit}`;
}

function formatEffectValue(value) {
  if (!Number.isFinite(value) || Math.abs(value) < 0.01) {
    return null;
  }

  const magnitude = Math.abs(value) >= 10 ? Math.round(Math.abs(value)) : Math.round(Math.abs(value) * 10) / 10;
  return `${value > 0 ? "+" : "-"}${magnitude}`;
}

function summarizeEffectSection(sectionLabel, effects, labelMap, maxItems = 3) {
  if (!effects) {
    return null;
  }

  const entries = Object.entries(effects)
    .map(([key, value]) => ({ key, value, formatted: formatEffectValue(value) }))
    .filter((entry) => entry.formatted)
    .slice(0, maxItems);

  if (!entries.length) {
    return null;
  }

  const text = entries
    .map((entry) => `${labelMap[entry.key] ?? entry.key}: ${entry.formatted}`)
    .join(", ");

  return `${sectionLabel}: ${text}`;
}

function summarizeDecisionEffects(effects, maxItems = 3) {
  if (!effects) {
    return [];
  }

  return [
    summarizeEffectSection("Proyecto", effects.project, PROJECT_EFFECT_LABELS, maxItems),
    summarizeEffectSection("Equipo", effects.actor, ACTOR_EFFECT_LABELS, maxItems),
    summarizeEffectSection("Objetivo", effects.targetEnemy, TARGET_EFFECT_LABELS, maxItems),
    summarizeEffectSection("Todos los enemigos", effects.allEnemies, TARGET_EFFECT_LABELS, maxItems),
  ].filter(Boolean);
}

function getEffectIcon(key) {
  const map = {
    budget: "[$]",
    time: "[T]",
    quality: "[Q]",
    risk: "[!]",
    progress: "[P]",
    energy: "[E]",
    stress: "[S]",
    hp: "[HP]",
    threat: "[TH]",
  };

  return map[key] ?? "[*]";
}

function buildIconConsequenceList(effects, maxItems = 3) {
  if (!effects) {
    return [];
  }

  const chunks = [
    ...(effects.project ? Object.entries(effects.project) : []),
    ...(effects.actor ? Object.entries(effects.actor) : []),
    ...(effects.targetEnemy ? Object.entries(effects.targetEnemy) : []),
    ...(effects.allEnemies ? Object.entries(effects.allEnemies).map(([k, v]) => [k + '_all', v]) : []),
  ];

  return chunks
    .map(([key, value]) => {
      // Apply 5x multiplier to enemy HP damage for display (hidden from user)
      let displayValue = value;
      let actualKey = key.replace('_all', '');
      
      if (actualKey === 'hp' && (effects.targetEnemy || effects.allEnemies) && value !== 0) {
        displayValue = value * 5;
      }

      const formatted = formatEffectValue(displayValue);
      if (!formatted) {
        return null;
      }

      const label = PROJECT_EFFECT_LABELS[actualKey] ?? ACTOR_EFFECT_LABELS[actualKey] ?? TARGET_EFFECT_LABELS[actualKey] ?? actualKey;
      const suffix = key.endsWith('_all') ? ' (TODOS)' : '';
      return {
        text: `${getEffectIcon(actualKey)} ${label} ${formatted}${suffix}`,
        weight: Math.abs(Number(displayValue) || 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => entry.text)
    .slice(0, maxItems);
}

function buildActionConsequenceLines(option, hasDebt, maxItems = 3) {
  const selectedEffects = hasDebt && option.debtEffects ? option.debtEffects : option.baseEffects;
  const chunks = [
    ...(selectedEffects?.project ? Object.entries(selectedEffects.project) : []),
    ...(selectedEffects?.actor ? Object.entries(selectedEffects.actor) : []),
    ...(selectedEffects?.targetEnemy ? Object.entries(selectedEffects.targetEnemy) : []),
    ...(selectedEffects?.allEnemies ? Object.entries(selectedEffects.allEnemies).map(([k, v]) => [k + '_all', v]) : []),
  ];

  return chunks
    .map(([key, value]) => {
      // Apply 5x multiplier to enemy HP damage for display (hidden from user)
      let displayValue = value;
      let actualKey = key.replace('_all', '');
      
      if (actualKey === 'hp' && (selectedEffects?.targetEnemy || selectedEffects?.allEnemies) && value !== 0) {
        displayValue = value * 5;
      }

      const formatted = formatEffectValue(displayValue);
      if (!formatted) {
        return null;
      }

      const suffix = key.endsWith('_all') ? ' (TODOS)' : '';
      const text = `${getEffectIcon(actualKey)} ${(PROJECT_EFFECT_LABELS[actualKey] ?? ACTOR_EFFECT_LABELS[actualKey] ?? TARGET_EFFECT_LABELS[actualKey] ?? actualKey)} ${formatted}${suffix}`;
      const good = 0x4ade80;
      const bad = 0xf87171;
      let color;

      if (["risk", "stress", "threat"].includes(actualKey)) {
        color = value > 0 ? bad : good;
      } else if (actualKey === "hp") {
        color = value < 0 ? good : bad;
      } else {
        color = value > 0 ? good : bad;
      }

      return { text, color, weight: Math.abs(Number(displayValue) || 0) };
    })
    .filter(Boolean)
    .sort((a, b) => b.weight - a.weight)
    .map(({ text, color }) => ({ text, color }))
    .slice(0, maxItems);
}

function buildActionQuickSummary(option, hasDebt) {
  const selectedEffects = hasDebt && option.debtEffects ? option.debtEffects : option.baseEffects;
  const iconLines = buildIconConsequenceList(selectedEffects, 3);
  if (!iconLines.length) {
    return option.summary;
  }

  return iconLines.join("  ");
}

function getLuckProfileBadge(luckProfile) {
  if (luckProfile === "high") {
    return "ALTA";
  }

  if (luckProfile === "low") {
    return "BAJA";
  }

  return null;
}

function getLuckProfileLabel(luckProfile) {
  if (luckProfile === "high") {
    return "alta";
  }

  if (luckProfile === "low") {
    return "baja";
  }

  return "normal";
}

function getLuckProfileExplanation(luckProfile) {
  if (luckProfile === "high") {
    return "Alta: mas variacion aleatoria (puede ayudar o perjudicar).";
  }

  if (luckProfile === "low") {
    return "Baja: menor variacion aleatoria y resultado mas estable.";
  }

  return "Normal: variacion moderada sin dominar el efecto base.";
}

function buildActionTooltip(option, hasDebt) {
  const selectedEffects = hasDebt && option.debtEffects ? option.debtEffects : option.baseEffects;
  const lines = buildIconConsequenceList(selectedEffects, 4);
  const header = hasDebt ? "Consecuencias esperadas (con deuda):" : "Consecuencias esperadas:";
  const luck = `Suerte: ${getLuckProfileLabel(option.luckProfile)}. ${getLuckProfileExplanation(option.luckProfile)}\nLa suerte agrega variacion contextual y nunca reemplaza los efectos base de la accion.`;
  const body = lines.length ? lines.join("\n") : "[*] Sin variacion numerica relevante";
  const sections = [
    option.title,
    option.summary ? `Resumen: ${option.summary}` : null,
    option.description ? `Descripcion: ${option.description}` : null,
    `${header}\n${body}`,
    luck,
    hasDebt ? "Advertencia: esta accion se ejecuta con deuda." : null,
  ].filter(Boolean);

  return sections.join("\n\n");
}

function drawLuckClover(graphics, x, y, size, color) {
  const leaf = Math.max(4, Math.round(size * 0.28));
  const stemWidth = Math.max(2, Math.round(size * 0.14));
  const stemHeight = Math.max(8, Math.round(size * 0.34));

  graphics
    .circle(x, y - leaf, leaf)
    .fill({ color, alpha: 1 })
    .circle(x - leaf, y, leaf)
    .fill({ color, alpha: 1 })
    .circle(x + leaf, y, leaf)
    .fill({ color, alpha: 1 })
    .circle(x, y + leaf, leaf)
    .fill({ color, alpha: 1 })
    .roundRect(x - stemWidth / 2, y + leaf + 1, stemWidth, stemHeight, stemWidth / 2)
    .fill({ color, alpha: 1 });

  return graphics;
}

function truncateText(text, maxChars) {
  if (!text) {
    return "";
  }

  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
}

function estimateCharsPerLine(pixelWidth, fontSize) {
  const safeWidth = Math.max(1, pixelWidth || 1);
  const safeFontSize = Math.max(1, fontSize || 1);
  return Math.max(8, Math.floor(safeWidth / (safeFontSize * 0.62)));
}

function buildIntentTooltip(enemy) {
  if (!enemy?.intent) {
    return "No hay intencion activa para este objetivo.";
  }

  const effectLines = Object.entries(enemy.intent.expectedEffects ?? {})
    .filter(([, value]) => Number.isFinite(value) && value !== 0)
    .map(([resourceKey, value]) => {
      const abs = Math.abs(value);
      const rounded = abs >= 10 ? Math.round(abs) : Math.round(abs * 10) / 10;
      const sign = value > 0 ? "+" : "-";
      const label = INTENT_RESOURCE_LABELS[resourceKey] ?? resourceKey;
      return `${label}: ${sign}${rounded}`;
    });

  const impactSummary = effectLines.length
    ? effectLines.join("\n")
    : "Sin impacto numerico directo en recursos.";

  return `${enemy.intent.previewText}\n\nImpacto esperado:\n${impactSummary}`;
}

function makeLabel(text, fontSize, color) {
  return new Text({
    text,
    style: {
      fontFamily: "Courier New, monospace",
      fontSize: Math.max(7, Math.round(fontSize * CANVAS_UI_SCALE)),
      fill: color,
      fontWeight: "700",
      letterSpacing: 0.6,
    },
  });
}

function makeCompactLabel(text, color = 0xcbd5e1) {
  return new Text({
    text,
    style: {
      fontFamily: "Courier New, monospace",
      fontSize: 9,
      fill: color,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
  });
}

function resolveCosmetic(member) {
  const roleDefault = DEFAULT_ROLE_COSMETICS[member.assignedRole] ?? DEFAULT_COSMETIC;
  return {
    gender: member?.cosmetic?.gender ?? roleDefault.gender,
    hairStyle: member?.cosmetic?.hairStyle ?? roleDefault.hairStyle,
    skinTone: member?.cosmetic?.skinTone ?? roleDefault.skinTone,
    shirtStyle: member?.cosmetic?.shirtStyle ?? roleDefault.shirtStyle,
    shirtColor: member?.cosmetic?.shirtColor ?? roleDefault.shirtColor,
    pantsStyle: member?.cosmetic?.pantsStyle ?? roleDefault.pantsStyle,
    pantsColor: member?.cosmetic?.pantsColor ?? roleDefault.pantsColor,
    shoeStyle: member?.cosmetic?.shoeStyle ?? roleDefault.shoeStyle,
    faceStyle: member?.cosmetic?.faceStyle ?? roleDefault.faceStyle,
  };
}

function resolveSkinToneColor(skinTone) {
  return SKIN_TONE_COLORS[skinTone] ?? SKIN_TONE_COLORS.medium;
}

function resolveShirtColor(shirtColor, fallbackColor) {
  return SHIRT_COLOR_MAP[shirtColor] ?? fallbackColor;
}

function resolvePantsColor(pantsColor) {
  return PANTS_COLOR_MAP[pantsColor] ?? PANTS_COLOR_MAP.charcoal;
}

function createEnemyGeneratedCosmetic(enemy) {
  const seed = hashString(`${enemy?.id || "enemy"}:${enemy?.name || "anon"}`);
  return {
    gender: pickDeterministic(ENEMY_AVATAR_GENDERS, seed, 1),
    hairStyle: pickDeterministic(ENEMY_AVATAR_HAIRS, seed, 3),
    skinTone: pickDeterministic(ENEMY_AVATAR_SKIN_TONES, seed, 5),
    shirtStyle: pickDeterministic(ENEMY_AVATAR_SHIRT_STYLES, seed, 7),
    shirtColor: pickDeterministic(ENEMY_AVATAR_SHIRT_COLORS, seed, 11),
    pantsStyle: pickDeterministic(ENEMY_AVATAR_PANTS_STYLES, seed, 13),
    pantsColor: pickDeterministic(ENEMY_AVATAR_PANTS_COLORS, seed, 17),
    shoeStyle: pickDeterministic(ENEMY_AVATAR_SHOES, seed, 19),
    faceStyle: pickDeterministic(ENEMY_AVATAR_FACES, seed, 23),
  };
}

function createEnemyGeneratedAppearance(enemy) {
  const seed = hashString(`${enemy?.name || "enemy"}:${enemy?.type || "threat"}`);
  const darkHair = [0x1f2937, 0x111827, 0x334155, 0x78350f, 0x7f1d1d];
  const shoes = [0x0f172a, 0x1e293b, 0x334155, 0x111827];

  return {
    hair: pickDeterministic(darkHair, seed, 2),
    shoes: pickDeterministic(shoes, seed, 4),
  };
}

function drawHair(sprite, hairStyle, color, alpha) {
  if (hairStyle === "long_wavy") {
    sprite.rect(40, 1, 22, 9).fill({ color, alpha });
    return;
  }

  if (hairStyle === "ponytail") {
    sprite
      .rect(41, 2, 20, 5)
      .fill({ color, alpha })
      .rect(60, 7, 4, 7)
      .fill({ color, alpha });
    return;
  }

  if (hairStyle === "bob_cut") {
    sprite
      .rect(40, 2, 22, 7)
      .fill({ color, alpha })
      .rect(39, 6, 2, 5)
      .fill({ color, alpha })
      .rect(61, 6, 2, 5)
      .fill({ color, alpha });
    return;
  }

  if (hairStyle === "braids") {
    sprite
      .rect(41, 2, 20, 4)
      .fill({ color, alpha })
      .rect(40, 6, 2, 8)
      .fill({ color, alpha })
      .rect(60, 6, 2, 8)
      .fill({ color, alpha });
    return;
  }

  if (hairStyle === "curly") {
    sprite
      .rect(41, 2, 4, 4)
      .fill({ color, alpha })
      .rect(47, 0, 4, 6)
      .fill({ color, alpha })
      .rect(53, 1, 4, 5)
      .fill({ color, alpha })
      .rect(58, 2, 3, 4)
      .fill({ color, alpha });
    return;
  }

  if (hairStyle === "side_part") {
    sprite
      .rect(41, 2, 20, 5)
      .fill({ color, alpha })
      .rect(56, 2, 1, 5)
      .fill({ color: 0xe2e8f0, alpha: alpha * 0.5 });
    return;
  }

  sprite.rect(41, 2, 20, 4).fill({ color, alpha });
}

function drawShirtStyle(sprite, shirtStyle, alpha) {
  if (shirtStyle === "formal_blazer") {
    sprite
      .rect(48, 16, 1, 8)
      .fill({ color: 0xe2e8f0, alpha: alpha * 0.55 })
      .rect(52, 16, 1, 8)
      .fill({ color: 0xe2e8f0, alpha: alpha * 0.55 })
      .rect(50, 16, 1, 20)
      .fill({ color: 0x111827, alpha: alpha * 0.75 });
    return;
  }

  if (shirtStyle === "polo") {
    sprite.rect(48, 16, 4, 3).fill({ color: 0xe2e8f0, alpha: alpha * 0.5 });
    return;
  }

  if (shirtStyle === "blouse") {
    sprite
      .rect(47, 16, 6, 2)
      .fill({ color: 0xf8fafc, alpha: alpha * 0.5 })
      .rect(50, 18, 1, 3)
      .fill({ color: 0xf8fafc, alpha: alpha * 0.5 });
    return;
  }

  if (shirtStyle === "dress_shirt") {
    sprite
      .rect(50, 16, 1, 20)
      .fill({ color: 0xe2e8f0, alpha: alpha * 0.6 })
      .rect(48, 16, 5, 2)
      .fill({ color: 0xe2e8f0, alpha: alpha * 0.5 });
  }
}

function drawPantsStyle(sprite, pantsStyle, alpha) {
  if (pantsStyle === "skirt") {
    sprite
      .rect(40, 36, 22, 8)
      .fill({ color: 0x111827, alpha: alpha * 0.15 })
      .rect(42, 44, 18, 2)
      .fill({ color: 0x111827, alpha: alpha * 0.12 });
    return;
  }

  if (pantsStyle === "jeans") {
    sprite.rect(40, 38, 22, 1).fill({ color: 0x93c5fd, alpha: alpha * 0.5 });
    return;
  }

  if (pantsStyle === "cargo") {
    sprite
      .rect(41, 44, 2, 3)
      .fill({ color: 0x111827, alpha: alpha * 0.35 })
      .rect(59, 44, 2, 3)
      .fill({ color: 0x111827, alpha: alpha * 0.35 });
  }
}

function drawFace(sprite, faceStyle, alpha) {
  if (faceStyle === "smile") {
    sprite
      .rect(46, 8, 2, 2)
      .fill({ color: 0x111827, alpha })
      .rect(54, 8, 2, 2)
      .fill({ color: 0x111827, alpha })
      .rect(44, 11, 1, 1)
      .fill({ color: 0xfda4af, alpha: alpha * 0.45 })
      .rect(57, 11, 1, 1)
      .fill({ color: 0xfda4af, alpha: alpha * 0.45 })
      .rect(48, 12, 4, 1)
      .fill({ color: 0xf43f5e, alpha })
      .rect(47, 11, 1, 1)
      .fill({ color: 0xf43f5e, alpha })
      .rect(52, 11, 1, 1)
      .fill({ color: 0xf43f5e, alpha });
    return;
  }

  if (faceStyle === "focus") {
    sprite
      .rect(45, 7, 3, 1)
      .fill({ color: 0x111827, alpha: alpha * 0.85 })
      .rect(54, 7, 3, 1)
      .fill({ color: 0x111827, alpha: alpha * 0.85 })
      .rect(46, 8, 2, 2)
      .fill({ color: 0x111827, alpha })
      .rect(54, 8, 2, 2)
      .fill({ color: 0x111827, alpha })
      .rect(48, 12, 5, 1)
      .fill({ color: 0x1d4ed8, alpha });
    return;
  }

  if (faceStyle === "serious") {
    sprite
      .rect(45, 7, 3, 1)
      .fill({ color: 0x111827, alpha })
      .rect(54, 7, 3, 1)
      .fill({ color: 0x111827, alpha })
      .rect(46, 8, 2, 2)
      .fill({ color: 0x111827, alpha })
      .rect(54, 8, 2, 2)
      .fill({ color: 0x111827, alpha })
      .rect(48, 12, 6, 1)
      .fill({ color: 0x111827, alpha });
    return;
  }

  sprite
    .rect(46, 8, 2, 2)
    .fill({ color: 0x111827, alpha })
    .rect(54, 8, 2, 2)
    .fill({ color: 0x111827, alpha });

  sprite.rect(48, 12, 6, 1).fill({ color: 0x64748b, alpha });
}

function drawShoes(sprite, shoeStyle, shoesColor, alpha) {
  if (shoeStyle === "boots") {
    sprite
      .rect(40, 55, 7, 3)
      .fill({ color: shoesColor, alpha })
      .rect(55, 55, 7, 3)
      .fill({ color: shoesColor, alpha });
    return;
  }

  if (shoeStyle === "sneakers") {
    sprite
      .rect(40, 55, 7, 3)
      .fill({ color: 0xe2e8f0, alpha })
      .rect(55, 55, 7, 3)
      .fill({ color: 0xe2e8f0, alpha });
    return;
  }

  sprite
    .rect(40, 55, 7, 3)
    .fill({ color: 0x0f172a, alpha })
    .rect(55, 55, 7, 3)
    .fill({ color: 0x0f172a, alpha });
}

function buildAllySprite({ bodyColor, appearance, cosmetic, alpha }) {
  const sprite = new Graphics();
  const skinColor = resolveSkinToneColor(cosmetic.skinTone);
  const shirtColor = resolveShirtColor(cosmetic.shirtColor, bodyColor);
  const pantsColor = resolvePantsColor(cosmetic.pantsColor);
  const isSkirt = cosmetic.pantsStyle === "skirt";
  const isFemale = cosmetic.gender === "female";

  if (isFemale) {
    sprite
      .rect(35, 16, 32, 12)
      .fill({ color: shirtColor, alpha })
      .rect(37, 28, 28, 6)
      .fill({ color: shirtColor, alpha })
      .rect(33, 21, 2, 10)
      .fill({ color: shirtColor, alpha })
      .rect(65, 21, 2, 10)
      .fill({ color: shirtColor, alpha })
      .rect(42, 4, 18, 12)
      .fill({ color: skinColor, alpha });
  } else {
    sprite
      .rect(35, 16, 32, 20)
      .fill({ color: shirtColor, alpha })
      .rect(32, 21, 3, 10)
      .fill({ color: shirtColor, alpha })
      .rect(66, 21, 3, 10)
      .fill({ color: shirtColor, alpha })
      .rect(42, 4, 18, 12)
      .fill({ color: skinColor, alpha });
  }

  if (isSkirt) {
    sprite
      .rect(40, 36, 22, 10)
      .fill({ color: pantsColor, alpha })
      .rect(45, 46, 4, 3)
      .fill({ color: pantsColor, alpha })
      .rect(53, 46, 4, 3)
      .fill({ color: pantsColor, alpha });
  } else {
    sprite
      .rect(40, 38, 8, 16)
      .fill({ color: pantsColor, alpha })
      .rect(54, 38, 8, 16)
      .fill({ color: pantsColor, alpha });
  }

  drawHair(sprite, cosmetic.hairStyle, appearance.hair, alpha);
  drawShirtStyle(sprite, cosmetic.shirtStyle, alpha);
  drawPantsStyle(sprite, cosmetic.pantsStyle, alpha);
  drawFace(sprite, cosmetic.faceStyle, alpha);
  drawShoes(sprite, cosmetic.shoeStyle, appearance.shoes, alpha);

  return sprite;
}

function drawEnemyMark(sprite, mark, accentColor, alpha) {
  if (mark === "horns") {
    sprite
      .rect(101, 4, 4, 4)
      .fill({ color: accentColor, alpha })
      .rect(125, 4, 4, 4)
      .fill({ color: accentColor, alpha });
    return;
  }

  if (mark === "scar") {
    sprite
      .rect(112, 6, 1, 14)
      .fill({ color: accentColor, alpha })
      .rect(111, 12, 3, 1)
      .fill({ color: accentColor, alpha });
    return;
  }

  if (mark === "mask") {
    sprite.rect(106, 0, 18, 7).fill({ color: accentColor, alpha: alpha * 0.8 });
    return;
  }

  sprite.rect(106, 1, 18, 2).fill({ color: accentColor, alpha: alpha * 0.9 });
}

export class BattleScene {
  app = null;

  host = null;

  root = new Container();

  backgroundLayer = new Container();

  laneLayer = new Container();

  allyLayer = new Container();

  enemyLayer = new Container();

  uiLayer = new Container();

  overlayLayer = new Container();

  effectLayer = new Container();

  mounted = false;

  width = 920;

  height = 380;

  snapshot = null;

  resizeObserver = null;

  activeAllyContainer = null;

  focusedEnemyContainer = null;

  turnLabelRef = null;

  actionPanelRef = null;

  hitFlashOverlay = null;

  hitFlashUntil = 0;

  animationTick = 0;

  handlers = {};

  selectedEnemyId = null;

  metricDeltaByKey = {};

  meterPulseRefs = [];

  meterDeltaLabelRefs = [];

  metricTooltipRef = null;

  eventSplashRef = null;

  lastAnnouncedLogId = null;

  handleEventSplashContinueKey = (event) => {
    if (!this.eventSplashRef?.manualDismiss) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    this.clearEventSplash();
  };

  setHandlers(handlers = {}) {
    this.handlers = handlers;
  }

  resolveEventSplashActor(entry, snapshot) {
    if (!entry) {
      return {
        name: "Sistema",
        subtitle: "Sistema",
        accent: 0x67e8f9,
        glyph: "!",
      };
    }

    if (entry.actorType === "ally") {
      const member = snapshot?.team?.find((candidate) => candidate.name === entry.actorName);
      const role = member?.assignedRole ?? member?.role ?? "director";
      return {
        name: entry.actorName,
        subtitle: this.getRoleLabel(role),
        accent: ALLY_COLORS[role] ?? 0x60a5fa,
        member,
        actorType: "ally",
      };
    }

    if (entry.actorType === "enemy") {
      const enemy = snapshot?.enemies?.find((candidate) => candidate.name === entry.actorName);
      return {
        name: entry.actorName,
        subtitle: enemy?.type === "boss" ? "Boss" : "Amenaza",
        accent: enemy?.visual?.accentColor ?? (enemy?.type === "boss" ? 0xfb923c : 0xf97316),
        enemy,
        actorType: "enemy",
      };
    }

    return {
      name: entry.actorName || "Sistema",
      subtitle: "Sistema",
      accent: 0x67e8f9,
      actorType: "system",
    };
  }

  buildEventActorSprite(actor) {
    if (actor?.actorType === "ally" && actor.member) {
      const role = actor.member.assignedRole ?? actor.member.role ?? "director";
      const bodyColor = ALLY_COLORS[role] ?? 0x22c55e;
      const appearance = ALLY_APPEARANCE[role] ?? ALLY_APPEARANCE.director;
      return buildAllySprite({
        bodyColor,
        appearance,
        cosmetic: resolveCosmetic(actor.member),
        alpha: 1,
      });
    }

    if (actor?.actorType === "enemy") {
      const enemy = actor.enemy ?? { id: actor.name, name: actor.name, type: "stakeholder" };
      const bodyColor = enemy?.visual?.bodyColor ?? actor.accent ?? 0xf97316;
      return buildAllySprite({
        bodyColor,
        appearance: createEnemyGeneratedAppearance(enemy),
        cosmetic: createEnemyGeneratedCosmetic(enemy),
        alpha: 1,
      });
    }

    return null;
  }

  buildEventSplashContent(actor, snapshot, entry) {
    const ribbonHeight = clamp(Math.round(this.height * 0.42), 144, 220);
    const ribbonY = Math.round((this.height - ribbonHeight) / 2);
    const plateW = clamp(Math.round(this.width * 0.28), 200, 360);
    const plateH = clamp(Math.round(this.height * 0.48), 180, 320);
    const plateX = clamp(Math.round(this.width * 0.08), 20, 120);
    const plateY = Math.round(this.height / 2 - plateH / 2);

    const veil = new Graphics().rect(0, 0, this.width, this.height).fill({
      color: 0x020617,
      alpha: 0.88,
    });

    const ribbon = new Graphics()
      .rect(0, ribbonY, this.width, ribbonHeight)
      .fill({ color: actor.accent, alpha: 0.36 });

    const plate = new Graphics()
      .roundRect(plateX, plateY, plateW, plateH, 16)
      .fill({ color: 0x0b1220, alpha: 0.96 })
      .stroke({ width: 3, color: actor.accent, alpha: 1 });

    const portraitFrameW = clamp(Math.round(plateW * 0.58), 104, 168);
    const portraitFrameH = clamp(Math.round(plateH * 0.66), 116, 188);
    const portraitFrameX = plateX + Math.round((plateW - portraitFrameW) / 2);
    const portraitFrameY = plateY + Math.round((plateH - portraitFrameH) / 2);
    const portraitFrame = new Graphics()
      .roundRect(portraitFrameX, portraitFrameY, portraitFrameW, portraitFrameH, 12)
      .fill({ color: actor.accent, alpha: 0.2 })
      .stroke({ width: 2, color: 0xf8fafc, alpha: 0.95 });

    const portrait = this.buildEventActorSprite(actor);
    if (portrait) {
      portrait.pivot.set(51, 30);
      portrait.scale.set(clamp(portraitFrameH / 58, 1.9, 2.8));
      portrait.position.set(
        portraitFrameX + Math.round(portraitFrameW / 2),
        portraitFrameY + Math.round(portraitFrameH * 0.44),
      );
    }

    const systemIcon = actor.actorType === "system"
      ? new Graphics()
        .roundRect(portraitFrameX + 20, portraitFrameY + 30, portraitFrameW - 40, portraitFrameH - 60, 8)
        .fill({ color: 0x0f172a, alpha: 0.95 })
        .stroke({ width: 2, color: 0x67e8f9, alpha: 0.95 })
        .rect(portraitFrameX + 30, portraitFrameY + 46, portraitFrameW - 60, 6)
        .fill({ color: 0x67e8f9, alpha: 0.7 })
        .rect(portraitFrameX + 30, portraitFrameY + 60, portraitFrameW - 60, 6)
        .fill({ color: 0x38bdf8, alpha: 0.7 })
        .rect(portraitFrameX + 30, portraitFrameY + 74, portraitFrameW - 60, 6)
        .fill({ color: 0x22d3ee, alpha: 0.7 })
      : null;

    const textX = plateX + plateW + 30;
    const bodyWidth = Math.max(220, this.width - textX - 24);
    const actorTitle = makeLabel(actor.name.toUpperCase(), 20, 0xf8fafc);
    actorTitle.x = textX;
    actorTitle.y = ribbonY + 16;

    const subtitle = makeLabel(`EVENTO DE ${actor.subtitle.toUpperCase()}`, 10, actor.accent);
    subtitle.x = textX;
    subtitle.y = actorTitle.y + actorTitle.height + 6;

    const body = new Text({
      text: entry.text || "",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: Math.max(8, Math.round(10 * CANVAS_UI_SCALE)),
        fill: 0xe2e8f0,
        wordWrap: true,
        wordWrapWidth: bodyWidth,
      },
    });
    body.x = textX;
    body.y = subtitle.y + subtitle.height + 8;

    const luckPolarity = snapshot?.lastLuckPolarity ?? null;
    const luckLabel = snapshot?.lastLuckLabel ?? null;
    let luckBadge = null;
    const entryHasLuck = typeof entry?.text === "string" && entry.text.includes("Suerte:");
    if (luckPolarity && luckLabel && entryHasLuck) {
      const luckColor = luckPolarity === "positive" ? 0x22c55e : 0xef4444;
      const luckBadgeX = textX;
      const luckBadgeY = Math.max(ribbonY + 16, body.y + body.height + 8);
      const luckBadgeBg = new Graphics()
        .roundRect(luckBadgeX, luckBadgeY, 176, 24, 8)
        .fill({ color: 0x0b1220, alpha: 0.92 })
        .stroke({ width: 1.5, color: luckColor, alpha: 0.95 });
      const luckBadgeText = makeLabel(`FACTOR SUERTE: ${luckLabel.toUpperCase()}`, 8, luckColor);
      luckBadgeText.x = luckBadgeX + 28;
      luckBadgeText.y = luckBadgeY + 7;
      const clover = drawLuckClover(new Graphics(), luckBadgeX + 14, luckBadgeY + 12, 10, luckColor);
      luckBadge = { bg: luckBadgeBg, text: luckBadgeText, clover };
    }

    let continueHint = null;
    if (actor.actorType !== "ally") {
      continueHint = makeLabel("CLIC O ENTER PARA CONTINUAR", 8, 0xf8fafc);
      continueHint.x = textX;
      continueHint.y = clamp(
        body.y + body.height + 8,
        body.y + 18,
        ribbonY + ribbonHeight - continueHint.height - 10,
      );
    }

    return {
      children: [
        veil,
        ribbon,
        plate,
        portraitFrame,
        ...(portrait ? [portrait] : []),
        ...(systemIcon ? [systemIcon] : []),
        actorTitle,
        subtitle,
        body,
        ...(luckBadge ? [luckBadge.bg, luckBadge.clover, luckBadge.text] : []),
        ...(continueHint ? [continueHint] : []),
      ],
      startedAt: performance.now(),
      until: actor.actorType === "ally" ? performance.now() + EVENT_SPLASH_ALLY_MS : null,
      manualDismiss: actor.actorType !== "ally",
      baseTitleX: actorTitle.x,
      titleRef: actorTitle,
    };
  }

  clearEventSplash() {
    if (!this.eventSplashRef?.container) {
      this.eventSplashRef = null;
      return;
    }

    this.eventSplashRef.container.destroy({ children: true });
    this.eventSplashRef = null;
  }

  triggerEventSplash(entry, snapshot) {
    if (!entry || !this.effectLayer) {
      return;
    }

    this.clearEventSplash();

    const actor = this.resolveEventSplashActor(entry, snapshot);
    const splash = this.buildEventSplashContent(actor, snapshot, entry);
    const container = new Container();

    container.eventMode = splash.manualDismiss ? "static" : "none";
    container.cursor = splash.manualDismiss ? "pointer" : undefined;
    if (splash.manualDismiss) {
      container.hitArea = new Rectangle(0, 0, this.width, this.height);
      container.on("pointertap", () => {
        this.clearEventSplash();
      });
    }

    container.alpha = 0;
    container.addChild(...splash.children);
    this.effectLayer.addChild(container);

    this.eventSplashRef = {
      container,
      startedAt: splash.startedAt,
      until: splash.until,
      durationMs: splash.durationMs,
      manualDismiss: splash.manualDismiss,
      baseTitleX: splash.baseTitleX,
      titleRef: splash.titleRef,
    };
  }

  resolveSelectedEnemyId(snapshot) {
    const aliveEnemies = snapshot.enemies.filter((enemy) => enemy.hp > 0);
    if (!aliveEnemies.length) {
      return null;
    }

    if (
      snapshot.selectedEnemyId &&
      aliveEnemies.some((enemy) => enemy.id === snapshot.selectedEnemyId)
    ) {
      return snapshot.selectedEnemyId;
    }

    if (this.selectedEnemyId && aliveEnemies.some((enemy) => enemy.id === this.selectedEnemyId)) {
      return this.selectedEnemyId;
    }

    return aliveEnemies.sort((a, b) => b.threat - a.threat)[0]?.id ?? aliveEnemies[0].id;
  }

  getRoleLabel(role) {
    return this.snapshot?.roleNames?.[role] ?? String(role).toUpperCase();
  }

  computeLayout() {
    const padding = clamp(Math.round(this.width * 0.014), 10, 28);
    const gap = clamp(Math.round(this.width * 0.01), 8, 18);
    const desiredSide = Math.max(240, Math.floor(this.width * 0.22));
    const sideMaxByCenter = Math.floor((this.width - padding * 2 - gap * 2 - 420) / 2);
    const sideWidth = clamp(desiredSide, 180, Math.max(180, sideMaxByCenter));

    const topHeight = clamp(Math.round(this.height * 0.25), 150, 260);
    const centerHeight = this.height - padding * 2 - topHeight - gap;
    const bottomHeight = 0;

    const centerWidth = Math.max(420, this.width - padding * 2 - sideWidth * 2 - gap * 2);
    const centerX = Math.round((this.width - centerWidth) / 2);
    const railY = padding + topHeight + gap;

    return {
      padding,
      gap,
      top: {
        x: padding,
        y: padding,
        w: this.width - padding * 2,
        h: topHeight,
      },
      left: {
        x: padding,
        y: railY,
        w: sideWidth,
        h: this.height - railY - padding,
      },
      center: {
        x: centerX,
        y: railY,
        w: centerWidth,
        h: centerHeight,
      },
      bottom: {
        x: centerX,
        y: railY + centerHeight,
        w: centerWidth,
        h: bottomHeight,
      },
      right: {
        x: this.width - padding - sideWidth,
        y: railY,
        w: sideWidth,
        h: this.height - railY - padding,
      },
    };
  }

  makePanel(x, y, width, height, radius = 10) {
    const panel = new Graphics()
      .roundRect(x, y, width, height, radius)
      .fill({ color: 0x0b1220, alpha: 0.8 })
      .stroke({ width: 2, color: 0x334155, alpha: 0.95 });
    panel.eventMode = "none";
    return panel;
  }

  captureProjectMetricDeltas(previousProject, nextProject) {
    if (!previousProject || !nextProject) {
      return;
    }

    const now = performance.now();
    PROJECT_METERS.forEach((metric) => {
      const previousValue = Number(previousProject[metric.key] ?? 0);
      const nextValue = Number(nextProject[metric.key] ?? 0);
      const delta = nextValue - previousValue;

      if (Math.abs(delta) > 0.01) {
        this.metricDeltaByKey[metric.key] = {
          delta,
          startedAt: now,
        };
      }
    });
  }

  getRecentMetricDelta(metricKey) {
    const entry = this.metricDeltaByKey[metricKey];
    if (!entry) {
      return null;
    }

    if (performance.now() - entry.startedAt > UI_ANIMATION_MS) {
      delete this.metricDeltaByKey[metricKey];
      return null;
    }

    return entry;
  }

  getTurnDescriptor(snapshot) {
    if (snapshot.activeTurnToken === "enemy") {
      const activeEnemy = snapshot.enemies
        .filter((enemy) => enemy.hp > 0)
        .sort((a, b) => b.threat - a.threat)[0] ?? snapshot.enemies[0];
      const enemyName = truncateText(activeEnemy?.name ?? "Amenaza", 22);

      return {
        text: `Turno de ${enemyName} - Enemigo`,
        color: 0xfda4af,
      };
    }

    const actingMember = snapshot.team.find(
      (member) => member.assignedRole === snapshot.activeTurnToken && member.status !== "out",
    );

    const roleLabel = this.getRoleLabel(snapshot.activeTurnToken);
    const memberName = truncateText(actingMember?.name ?? roleLabel, 20);
    return {
      text: `Turno de ${memberName} - ${roleLabel}`,
      color: 0xfde68a,
    };
  }

  drawMetricIcon(metricKey) {
    const icon = new Graphics();

    if (metricKey === "budget") {
      icon
        .roundRect(1, 4, 14, 10, 3)
        .fill({ color: 0x1d4ed8, alpha: 0.92 })
        .stroke({ width: 1, color: 0x93c5fd, alpha: 0.95 })
        .rect(4, 8, 8, 2)
        .fill({ color: 0xe2e8f0, alpha: 0.9 });
      return icon;
    }

    if (metricKey === "time") {
      icon
        .roundRect(1, 2, 14, 14, 7)
        .fill({ color: 0x0f172a, alpha: 0.95 })
        .stroke({ width: 1.2, color: 0x60a5fa, alpha: 0.95 })
        .rect(8, 6, 1, 4)
        .fill({ color: 0xbfdbfe, alpha: 0.95 })
        .rect(8, 9, 3, 1)
        .fill({ color: 0xbfdbfe, alpha: 0.95 });
      return icon;
    }

    if (metricKey === "quality") {
      icon
        .roundRect(1, 2, 14, 14, 3)
        .fill({ color: 0x064e3b, alpha: 0.95 })
        .stroke({ width: 1.2, color: 0x34d399, alpha: 0.95 })
        .rect(4, 9, 3, 2)
        .fill({ color: 0xecfdf5, alpha: 0.98 })
        .rect(7, 7, 5, 2)
        .fill({ color: 0xecfdf5, alpha: 0.98 })
        .rect(10, 5, 2, 2)
        .fill({ color: 0xecfdf5, alpha: 0.98 });
      return icon;
    }

    if (metricKey === "risk") {
      icon
        .poly([8, 1, 15, 15, 1, 15])
        .fill({ color: 0x7c2d12, alpha: 0.95 })
        .stroke({ width: 1.2, color: 0xfb923c, alpha: 0.95 })
        .rect(7, 6, 2, 5)
        .fill({ color: 0xffedd5, alpha: 0.98 })
        .rect(7, 12, 2, 2)
        .fill({ color: 0xffedd5, alpha: 0.98 });
      return icon;
    }

    icon
      .rect(2, 2, 12, 12)
      .fill({ color: 0x14532d, alpha: 0.95 })
      .stroke({ width: 1.2, color: 0x4ade80, alpha: 0.95 })
      .rect(4, 10, 3, 2)
      .fill({ color: 0xdcfce7, alpha: 0.98 })
      .rect(8, 8, 3, 4)
      .fill({ color: 0xdcfce7, alpha: 0.98 })
      .rect(12, 5, 2, 7)
      .fill({ color: 0xdcfce7, alpha: 0.98 });
    return icon;
  }

  showMetricTooltip(title, description, pointerX, pointerY) {
    this.hideMetricTooltip();

    const tooltip = new Container();
    tooltip.eventMode = "none";

    const tooltipTitle = makeLabel(title.toUpperCase(), 8, 0xf8fafc);
    tooltipTitle.x = 8;
    tooltipTitle.y = 6;

    const body = new Text({
      text: description,
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: Math.max(7, Math.round(8 * CANVAS_UI_SCALE)),
        fill: 0xcbd5e1,
        wordWrap: true,
        wordWrapWidth: 260,
      },
    });
    body.x = 8;
    body.y = 22;

    const boxWidth = Math.max(220, Math.ceil(Math.max(tooltipTitle.width, body.width) + 16));
    const boxHeight = Math.ceil(body.y + body.height + 8);

    const bg = new Graphics()
      .roundRect(0, 0, boxWidth, boxHeight, 7)
      .fill({ color: 0x020617, alpha: 0.96 })
      .stroke({ width: 1.5, color: 0x64748b, alpha: 0.98 });

    tooltip.addChild(bg, tooltipTitle, body);

    tooltip.x = clamp(pointerX + 14, 8, this.width - boxWidth - 8);
    tooltip.y = clamp(pointerY - boxHeight - 14, 8, this.height - boxHeight - 8);

    this.metricTooltipRef = tooltip;
    this.overlayLayer.addChild(tooltip);
  }

  hideMetricTooltip() {
    if (!this.metricTooltipRef) {
      return;
    }

    this.metricTooltipRef.destroy({ children: true });
    this.metricTooltipRef = null;
  }

  resolveMeterColor(normalized, fillColor) {
    if (fillColor != null) {
      return fillColor;
    }

    if (normalized < 0.25) {
      return 0xef4444;
    }

    if (normalized < 0.55) {
      return 0xf59e0b;
    }

    return 0x22c55e;
  }

  drawLegacyMeter(
    layer,
    {
      x,
      y,
      width,
      label,
      value,
      max,
      fillColor,
      reversed = false,
    },
  ) {
    const ratio = toPercent(value, max);
    const normalized = reversed ? 1 - ratio : ratio;
    const title = makeLabel(`${label.toUpperCase()} ${Math.round(value)}`, 8, 0xcbd5e1);
    title.x = x;
    title.y = y;

    const barY = y + Math.max(14, Math.round(16 * CANVAS_UI_SCALE));
    const barHeight = Math.max(8, Math.round(8 * CANVAS_UI_SCALE));
    const fillHeight = Math.max(6, barHeight - 2);

    const meterBg = new Graphics()
      .roundRect(x, barY, width, barHeight, 4)
      .fill({ color: 0x0f172a, alpha: 1 })
      .stroke({ width: 1, color: 0x334155, alpha: 0.95 });

    const color = this.resolveMeterColor(normalized, fillColor);
    const meterFill = new Graphics()
      .roundRect(x + 1, barY + 1, Math.max(2, (width - 2) * ratio), fillHeight, 3)
      .fill({ color, alpha: 0.95 });

    layer.addChild(title, meterBg, meterFill);
  }

  attachMeterDeltaFeedback(meterContainer, { metricKey, max, width, barY, barHeight }) {
    const recentDelta = this.getRecentMetricDelta(metricKey);
    if (!recentDelta) {
      return;
    }

    const deltaText = formatMetricDelta(metricKey, recentDelta.delta, max);
    if (!deltaText) {
      return;
    }

    const isPositive = recentDelta.delta > 0;
    const deltaColor = isPositive ? 0x4ade80 : 0xf87171;
    const deltaLabel = makeLabel(deltaText, 7, deltaColor);
    deltaLabel.x = Math.max(20, width - deltaLabel.width);
    deltaLabel.y = 0;
    meterContainer.addChild(deltaLabel);

    const pulse = new Graphics()
      .roundRect(-1, barY - 2, width + 2, barHeight + 4, 5)
      .stroke({ width: 1.5, color: deltaColor, alpha: 0.95 });
    meterContainer.addChild(pulse);

    this.meterPulseRefs.push({
      graphic: pulse,
      startedAt: recentDelta.startedAt,
    });

    this.meterDeltaLabelRefs.push({
      label: deltaLabel,
      baseY: deltaLabel.y,
      startedAt: recentDelta.startedAt,
    });
  }

  attachMeterTooltip(
    meterContainer,
    {
      width,
      barY,
      barHeight,
      label,
      tooltip,
      x,
      y,
    },
  ) {
    if (!tooltip) {
      return;
    }

    meterContainer.eventMode = "static";
    meterContainer.cursor = "help";
    meterContainer.interactiveChildren = false;
    meterContainer.hitArea = new Rectangle(0, 0, width, barY + barHeight + 2);

    const handleTooltip = (event) => {
      const point = event?.global ?? { x: x + width / 2, y };
      this.showMetricTooltip(label, tooltip, point.x, point.y);
    };

    meterContainer.on("pointerover", handleTooltip);
    meterContainer.on("pointermove", handleTooltip);
    meterContainer.on("pointerout", () => {
      this.hideMetricTooltip();
    });
  }

  drawMeter(
    layer,
    {
      metricKey,
      x,
      y,
      width,
      label,
      value,
      max,
      fillColor,
      reversed = false,
      tooltip,
    },
  ) {
    if (!metricKey) {
      this.drawLegacyMeter(layer, {
        x,
        y,
        width,
        label,
        value,
        max,
        fillColor,
        reversed,
      });
      return;
    }

    const ratio = toPercent(value, max);
    const normalized = reversed ? 1 - ratio : ratio;
    const meterContainer = new Container();
    meterContainer.x = x;
    meterContainer.y = y;

    const icon = this.drawMetricIcon(metricKey);
    icon.x = 0;
    icon.y = 2;

    const title = makeLabel(label.toUpperCase(), 7, 0xcbd5e1);
    title.x = 20;
    title.y = 0;

    const measure = makeLabel(formatMetricMeasure(metricKey, value, max), 7, 0x93c5fd);
    measure.x = 20;
    measure.y = 12;

    const barY = 24;
    const barHeight = Math.max(8, Math.round(8 * CANVAS_UI_SCALE));
    const fillHeight = Math.max(6, barHeight - 2);

    const meterBg = new Graphics()
      .roundRect(0, barY, width, barHeight, 4)
      .fill({ color: 0x0f172a, alpha: 1 })
      .stroke({ width: 1, color: 0x334155, alpha: 0.95 });

    const color = this.resolveMeterColor(normalized, fillColor);

    const meterFill = new Graphics()
      .roundRect(1, barY + 1, Math.max(2, (width - 2) * ratio), fillHeight, 3)
      .fill({ color, alpha: 0.95 });

    meterContainer.addChild(icon, title, measure, meterBg, meterFill);

    this.attachMeterDeltaFeedback(meterContainer, {
      metricKey,
      max,
      width,
      barY,
      barHeight,
    });

    this.attachMeterTooltip(meterContainer, {
      width,
      barY,
      barHeight,
      label,
      tooltip,
      x,
      y,
    });

    title.eventMode = "none";
    measure.eventMode = "none";
    icon.eventMode = "none";

    layer.addChild(meterContainer);
  }

  makeButton({
    x,
    y,
    width,
    height,
    label,
    subtitle,
    consequenceLines = [],
    tone = "default",
    badge,
    onTap,
    disabled = false,
    subtitleTooltipText,
  }) {
    const container = new Container();
    container.x = x;
    container.y = y;

    let toneConfig = { border: 0x64748b, bg: 0x172033, hover: 0x273246 };
    if (tone === "danger") {
      toneConfig = { border: 0xfb7185, bg: 0x3f1d2f, hover: 0x5f2a46 };
    } else if (tone === "success") {
      toneConfig = { border: 0x34d399, bg: 0x123329, hover: 0x1e4d3c };
    }

    const bg = new Graphics()
      .roundRect(0, 0, width, height, 7)
      .fill({ color: toneConfig.bg, alpha: disabled ? 0.55 : 0.92 })
      .stroke({ width: 2, color: toneConfig.border, alpha: disabled ? 0.45 : 0.95 });

    const contentWrapWidth = width - (badge ? 82 : 16);
    const hasConsequenceContent = consequenceLines.length > 0;
    const titleFontSize = Math.max(8, Math.round(10 * CANVAS_UI_SCALE));
    const subtitleFontSize = Math.max(7, Math.round(8 * CANVAS_UI_SCALE));
    const consequenceFontSize = Math.max(7, Math.round(7 * CANVAS_UI_SCALE));
    const titleCharsPerLine = estimateCharsPerLine(contentWrapWidth, titleFontSize);
    const subtitleCharsPerLine = estimateCharsPerLine(contentWrapWidth, subtitleFontSize);
    const consequenceCharsPerLine = estimateCharsPerLine(contentWrapWidth, consequenceFontSize);
    const titleText = hasConsequenceContent
      ? truncateText(label, titleCharsPerLine)
      : truncateText(label, titleCharsPerLine * 2);
    const subtitleTextRaw = typeof subtitle === "string" ? subtitle : String(subtitle ?? "");
    const subtitleText = hasConsequenceContent
      ? truncateText(subtitleTextRaw, subtitleCharsPerLine)
      : truncateText(subtitleTextRaw, subtitleCharsPerLine * 2);
    const subtitleWasTruncated = subtitleText !== subtitleTextRaw;

    const title = new Text({
      text: titleText,
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: titleFontSize,
        fill: 0xf8fafc,
        fontWeight: "700",
        align: "center",
        wordWrap: true,
        wordWrapWidth: contentWrapWidth,
        breakWords: true,
      },
    });

    let subtitleNode = null;
    if (subtitleText.trim()) {
      subtitleNode = new Text({
        text: subtitleText,
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: subtitleFontSize,
          fill: 0x94a3b8,
          align: "center",
          wordWrap: true,
          wordWrapWidth: contentWrapWidth,
          breakWords: true,
        },
      });
    }

    const maxConsequenceRows = hasConsequenceContent
      ? clamp(Math.floor((height - 30) / 11), 0, 3)
      : 0;
    const displayedConsequenceLines = consequenceLines.slice(0, maxConsequenceRows).map((line) => {
      const originalText = String(line.text ?? "");
      const renderedText = truncateText(originalText, consequenceCharsPerLine);
      return {
        text: renderedText,
        color: line.color,
      };
    });
    const consequenceNodes = displayedConsequenceLines.map((line) => {
      return new Text({
        text: line.text,
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: consequenceFontSize,
          fill: line.color,
          align: "center",
          wordWrap: true,
          wordWrapWidth: contentWrapWidth,
          breakWords: true,
        },
      });
    });

    const contentNodes = [title, ...(subtitleNode ? [subtitleNode] : []), ...consequenceNodes];
    const contentGap = hasConsequenceContent ? 3 : 4;
    const getContentHeight = () => {
      return contentNodes.reduce((sum, node, index) => {
        return sum + node.height + (index < contentNodes.length - 1 ? contentGap : 0);
      }, 0);
    };

    const maxContentHeight = Math.max(20, height - 12);
    while (consequenceNodes.length > 0 && getContentHeight() > maxContentHeight) {
      const removedNode = consequenceNodes.pop();
      const nodeIndex = contentNodes.lastIndexOf(removedNode);
      if (nodeIndex >= 0) {
        contentNodes.splice(nodeIndex, 1);
      }
    }

    if (subtitleNode && getContentHeight() > maxContentHeight) {
      const subtitleIndex = contentNodes.indexOf(subtitleNode);
      if (subtitleIndex >= 0) {
        contentNodes.splice(subtitleIndex, 1);
      }
    }

    const totalContentHeight = getContentHeight();
    let cursorY = Math.max(6, Math.round((height - totalContentHeight) / 2));
    contentNodes.forEach((node) => {
      node.x = Math.max(8, Math.round((width - node.width) / 2));
      node.y = cursorY;
      cursorY += node.height + contentGap;
    });

    const normalizedSubtitleTooltipText =
      typeof subtitleTooltipText === "string" ? subtitleTooltipText.trim() : "";
    const isSubtitleVisible = Boolean(subtitleNode && contentNodes.includes(subtitleNode));
    const shouldShowSubtitleTooltip =
      isSubtitleVisible &&
      subtitleWasTruncated &&
      normalizedSubtitleTooltipText.length > 0;

    if (subtitleNode && shouldShowSubtitleTooltip) {
      const showSubtitleTooltip = (event) => {
        const point = event?.global ?? { x: x + width / 2, y: y + height / 2 };
        this.showMetricTooltip("Descripcion completa", normalizedSubtitleTooltipText, point.x, point.y);
      };

      subtitleNode.eventMode = "static";
      subtitleNode.cursor = "help";
      subtitleNode.on("pointerover", showSubtitleTooltip);
      subtitleNode.on("pointermove", showSubtitleTooltip);
      subtitleNode.on("pointerout", () => {
        this.hideMetricTooltip();
      });
    }

    container.addChild(bg, ...contentNodes);
    container.interactiveChildren = true;
    container.hitArea = new Rectangle(0, 0, width, height);

    if (badge) {
      const badgeText = makeCompactLabel(badge.toUpperCase(), 0x0f172a);
      const badgeWidth = Math.max(46, Math.ceil(badgeText.width + 12));
      const badgeX = Math.max(6, width - badgeWidth - 6);
      const badgeBg = new Graphics()
        .roundRect(badgeX, 6, badgeWidth, 14, 5)
        .fill({ color: 0xfb7185, alpha: 0.95 });
      badgeText.x = badgeX + Math.round((badgeWidth - badgeText.width) / 2);
      badgeText.y = 9;
      container.addChild(badgeBg, badgeText);
    }

    const isInteractive = !disabled && typeof onTap === "function";

    if (isInteractive) {
      container.eventMode = "static";
      container.cursor = "pointer";

      container.on("pointertap", onTap);

      container.on("pointerover", () => {
        bg.clear();
        bg
          .roundRect(0, 0, width, height, 7)
          .fill({ color: toneConfig.hover, alpha: 0.98 })
          .stroke({ width: 2, color: toneConfig.border, alpha: 1 });
      });

      container.on("pointerout", () => {
        bg.clear();
        bg
          .roundRect(0, 0, width, height, 7)
          .fill({ color: toneConfig.bg, alpha: 0.92 })
          .stroke({ width: 2, color: toneConfig.border, alpha: 0.95 });
      });
    }

    contentNodes.forEach((node) => {
      if (node === subtitleNode && shouldShowSubtitleTooltip) {
        return;
      }

      node.eventMode = "none";
    });

    return container;
  }

  animateActiveUnits() {
    if (this.activeAllyContainer) {
      const bob = Math.sin(this.animationTick * THREE_SECOND_WAVE) * 1.6;
      this.activeAllyContainer.y = this.activeAllyContainer.baseY + bob;
      this.activeAllyContainer.alpha =
        0.88 + ((Math.sin(this.animationTick * THREE_SECOND_WAVE * 1.6) + 1) / 2) * 0.12;
    }

    if (this.focusedEnemyContainer) {
      const sway = Math.sin(this.animationTick * THREE_SECOND_WAVE) * 1.3;
      this.focusedEnemyContainer.x = this.focusedEnemyContainer.baseX + sway;
      this.focusedEnemyContainer.alpha =
        0.9 + ((Math.sin(this.animationTick * THREE_SECOND_WAVE * 1.45 + 0.8) + 1) / 2) * 0.1;
    }

    if (this.turnLabelRef) {
      this.turnLabelRef.alpha =
        0.78 + ((Math.sin(this.animationTick * THREE_SECOND_WAVE * 1.2) + 1) / 2) * 0.22;
    }

    if (
      this.actionPanelRef &&
      this.snapshot?.battleStatus === "active" &&
      this.snapshot?.activeTurnToken !== "enemy"
    ) {
      this.actionPanelRef.alpha =
        0.9 + ((Math.sin(this.animationTick * THREE_SECOND_WAVE * 1.45) + 1) / 2) * 0.08;
    }
  }

  animateMeterFeedback() {
    if (this.meterPulseRefs.length > 0) {
      const now = performance.now();
      this.meterPulseRefs = this.meterPulseRefs.filter((entry) => {
        if (!entry?.graphic || entry.graphic.destroyed) {
          return false;
        }

        const elapsed = now - entry.startedAt;
        if (elapsed > UI_ANIMATION_MS) {
          entry.graphic.alpha = 0;
          return false;
        }

        const life = 1 - elapsed / UI_ANIMATION_MS;
        entry.graphic.alpha = Math.max(
          0,
          life * (0.7 + Math.sin(this.animationTick * THREE_SECOND_WAVE * 1.8) * 0.25),
        );
        return true;
      });
    }

    if (this.meterDeltaLabelRefs.length > 0) {
      const now = performance.now();
      this.meterDeltaLabelRefs = this.meterDeltaLabelRefs.filter((entry) => {
        if (!entry?.label || entry.label.destroyed) {
          return false;
        }

        const elapsed = now - entry.startedAt;
        if (elapsed > UI_ANIMATION_MS) {
          entry.label.alpha = 0;
          return false;
        }

        const life = 1 - elapsed / UI_ANIMATION_MS;
        entry.label.alpha = life;
        entry.label.y = entry.baseY - (1 - life) * 8;
        return true;
      });
    }
  }

  animateEventSplash() {
    if (!this.eventSplashRef?.container) {
      return;
    }

    const now = performance.now();
    const { until, manualDismiss, startedAt } = this.eventSplashRef;
    if (!manualDismiss && until != null && now >= until) {
      this.clearEventSplash();
      return;
    }

    const elapsed = now - startedAt;
    const fadeIn = clamp(elapsed / EVENT_SPLASH_FADE_IN_MS, 0, 1);
    let alpha = fadeIn;

    if (!manualDismiss && until != null) {
      const fadeOut = clamp((until - now) / EVENT_SPLASH_FADE_OUT_MS, 0, 1);
      alpha = Math.min(fadeIn, fadeOut);
    }

    this.eventSplashRef.container.alpha = alpha;
    if (this.eventSplashRef.titleRef) {
      this.eventSplashRef.titleRef.x =
        this.eventSplashRef.baseTitleX + Math.sin(this.animationTick * 0.9) * 6;
    }
  }

  animateRootShake() {
    if (this.snapshot?.activeTurnToken === "enemy") {
      this.root.x = Math.sin(this.animationTick * THREE_SECOND_WAVE * 2) * 1.2;
      return;
    }

    this.root.x = 0;
  }

  animateHitFlash() {
    if (!this.hitFlashOverlay) {
      return;
    }

    const now = performance.now();
    if (now < this.hitFlashUntil) {
      const ttl = clamp((this.hitFlashUntil - now) / 140, 0, 1);
      this.hitFlashOverlay.alpha = ttl * 0.16;
      return;
    }

    this.hitFlashOverlay.alpha = 0;
  }

  animateFrame = (ticker) => {
    this.animationTick += ticker.deltaTime * 0.08;

    this.animateActiveUnits();
    this.animateMeterFeedback();
    this.animateEventSplash();
    this.animateRootShake();
    this.animateHitFlash();
  };

  async mount(host) {
    this.host = host;
    this.width = Math.max(420, Math.floor(host.clientWidth || this.width));
    this.height = Math.max(280, Math.floor(host.clientHeight || this.height));

    const app = new Application();
    await app.init({
      width: this.width,
      height: this.height,
      antialias: false,
      autoDensity: true,
      resolution: globalThis.devicePixelRatio || 1,
      backgroundColor: 0x0f172a,
      powerPreference: "high-performance",
    });

    this.app = app;
    host.replaceChildren(app.canvas);

    this.root.addChild(
      this.backgroundLayer,
      this.laneLayer,
      this.allyLayer,
      this.enemyLayer,
      this.uiLayer,
      this.effectLayer,
      this.overlayLayer,
    );
    app.stage.addChild(this.root);
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    this.backgroundLayer.eventMode = "none";
    this.laneLayer.eventMode = "none";
    this.allyLayer.eventMode = "passive";
    this.enemyLayer.eventMode = "passive";
    this.uiLayer.eventMode = "passive";
    this.effectLayer.eventMode = "passive";
    this.overlayLayer.eventMode = "passive";

    this.recreateHitFlashOverlay();
    app.ticker.add(this.animateFrame);
    globalThis.addEventListener("keydown", this.handleEventSplashContinueKey);

    if ("ResizeObserver" in globalThis) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this.resizeObserver.observe(host);
    }

    this.mounted = true;

    if (this.snapshot) {
      this.draw(this.snapshot);
    }
  }

  sync(snapshot) {
    if (this.snapshot && this.hasDamageDelta(this.snapshot, snapshot)) {
      this.hitFlashUntil = performance.now() + 140;
    }

    if (this.snapshot?.project && snapshot?.project) {
      this.captureProjectMetricDeltas(this.snapshot.project, snapshot.project);
    }

    this.snapshot = snapshot;

    if (!this.mounted) {
      return;
    }

    const latestEntry = snapshot.combatLog?.[snapshot.combatLog.length - 1] ?? null;
    if (latestEntry?.id && latestEntry.id !== this.lastAnnouncedLogId) {
      this.lastAnnouncedLogId = latestEntry.id;
      this.triggerEventSplash(latestEntry, snapshot);
    }

    this.draw(snapshot);
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.hideMetricTooltip();
    this.metricDeltaByKey = {};
    this.meterPulseRefs = [];
    this.meterDeltaLabelRefs = [];
    this.clearEventSplash();
    this.lastAnnouncedLogId = null;
    globalThis.removeEventListener("keydown", this.handleEventSplashContinueKey);

    if (this.app) {
      this.app.ticker.remove(this.animateFrame);
      this.app.destroy(false, { children: true });
      this.app = null;
    }

    this.host = null;
    this.snapshot = null;
    this.mounted = false;
  }

  resize() {
    if (!this.app || !this.host) return;

    const nextWidth = Math.max(420, Math.floor(this.host.clientWidth || this.width));
    const nextHeight = Math.max(280, Math.floor(this.host.clientHeight || this.height));

    if (nextWidth === this.width && nextHeight === this.height) {
      return;
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.app.renderer.resize(this.width, this.height);
    this.recreateHitFlashOverlay();

    if (this.snapshot) {
      this.draw(this.snapshot);
    }
  }

  hasDamageDelta(previousSnapshot, nextSnapshot) {
    const previousTeam = new Map(previousSnapshot.team.map((member) => [member.id, member]));
    const previousEnemies = new Map(previousSnapshot.enemies.map((enemy) => [enemy.id, enemy]));

    const allyHit = nextSnapshot.team.some((member) => {
      const previous = previousTeam.get(member.id);
      return previous && member.energy < previous.energy;
    });

    if (allyHit) {
      return true;
    }

    return nextSnapshot.enemies.some((enemy) => {
      const previous = previousEnemies.get(enemy.id);
      return previous && enemy.hp < previous.hp;
    });
  }

  recreateHitFlashOverlay() {
    if (this.hitFlashOverlay) {
      this.hitFlashOverlay.destroy();
      this.hitFlashOverlay = null;
    }

    const overlay = new Graphics().rect(0, 0, this.width, this.height).fill({
      color: 0xffffff,
      alpha: 0,
    });
    overlay.eventMode = "none";

    this.hitFlashOverlay = overlay;
    const activeSplash = this.eventSplashRef?.container ?? null;
    this.effectLayer.removeChildren();
    this.effectLayer.addChild(overlay);
    if (activeSplash) {
      this.effectLayer.addChild(activeSplash);
    }
  }

  clearLayer(layer) {
    const removed = layer.removeChildren();
    removed.forEach((child) => child.destroy());
  }

  draw(snapshot) {
    this.activeAllyContainer = null;
    this.focusedEnemyContainer = null;
    this.turnLabelRef = null;
    this.actionPanelRef = null;
    this.meterPulseRefs = [];
    this.meterDeltaLabelRefs = [];

    this.hideMetricTooltip();

    const layout = this.computeLayout();
    const selectedEnemyId = this.resolveSelectedEnemyId(snapshot);
    this.selectedEnemyId = selectedEnemyId;

    this.drawBackground(snapshot, layout);
    this.drawLanes(layout);
    this.drawAllies(snapshot, layout);
    this.drawEnemies(snapshot, layout, selectedEnemyId);

    this.clearLayer(this.uiLayer);
    this.clearLayer(this.overlayLayer);

    this.drawTopHud(snapshot, layout);
    this.drawIntelRail(snapshot, layout, selectedEnemyId);
    this.drawActionRail(snapshot, layout, selectedEnemyId);
    this.drawStaffingCrisisOverlay(snapshot, layout);
    this.drawVictoryOverlay(snapshot, layout);
  }

  drawBackground(snapshot, layout) {
    this.clearLayer(this.backgroundLayer);

    const palette = PHASE_PALETTES[snapshot.phaseIndex % PHASE_PALETTES.length];

    const bg = new Graphics().rect(0, 0, this.width, this.height).fill({ color: palette.base });
    const atmosphere = new Graphics()
      .rect(0, 0, this.width, Math.floor(this.height * 0.56))
      .fill({ color: palette.tile, alpha: 0.14 });
    const horizon = new Graphics()
      .rect(0, Math.floor(this.height * 0.56), this.width, 2)
      .fill({ color: palette.accent, alpha: 0.25 });

    const floorHeight = clamp(Math.round(this.height * 0.16), 56, 124);
    const floorY = this.height - floorHeight;

    const floor = new Graphics().rect(0, floorY, this.width, floorHeight).fill({ color: palette.floor });

    const floorAccent = new Graphics().rect(0, floorY - 8, this.width, 8).fill({ color: palette.accent });

    if (snapshot.isBoss) {
      const bossTint = new Graphics()
        .rect(0, 0, this.width, this.height)
        .fill({ color: 0x2b130f, alpha: 0.22 });
      this.backgroundLayer.addChild(bg, atmosphere, horizon, bossTint, floor, floorAccent);
      return;
    }

    this.backgroundLayer.addChild(bg, atmosphere, horizon, floor, floorAccent);
  }

  drawLanes(layout) {
    this.clearLayer(this.laneLayer);

    const arena = layout.center;
    const laneCount = 3;
    const laneHeight = arena.h / laneCount;

    const arenaFrame = this.makePanel(arena.x, arena.y, arena.w, arena.h, 10);
    this.laneLayer.addChild(arenaFrame);

    for (let lane = 0; lane <= laneCount; lane += 1) {
      const y = arena.y + lane * laneHeight;
      const line = new Graphics()
        .rect(arena.x + 8, y, arena.w - 16, 1)
        .fill({ color: 0x64748b, alpha: 0.32 });
      this.laneLayer.addChild(line);
    }

    for (let x = arena.x + 6; x <= arena.x + arena.w - 6; x += 26) {
      const marker = new Graphics()
        .rect(x, arena.y + arena.h - 10, 2, 8)
        .fill({ color: 0x94a3b8, alpha: 0.24 });
      this.laneLayer.addChild(marker);
    }
  }

  drawAllies(snapshot, layout) {
    this.clearLayer(this.allyLayer);

    const members = snapshot.team;
    const arena = layout.center;
    const laneTop = arena.y + 10;
    const laneHeight = (arena.h - 20) / Math.max(1, members.length);

    members.forEach((member, index) => {
      const y = laneTop + laneHeight * index;
      const x = arena.x + 14;
      const isActive =
        snapshot.activeTurnToken !== "enemy" && member.assignedRole === snapshot.activeTurnToken;
      const unitCardWidth = 220;
      const unitCardHeight = 168;

      const row = new Container();
      row.x = x;
      row.y = y + laneHeight / 2 - unitCardHeight / 2;
      row.baseY = row.y;

      const bodyColor = ALLY_COLORS[member.assignedRole] ?? 0x22c55e;
      const alpha = member.status === "out" ? 0.35 : 1;
      const borderColor = isActive ? 0xfbbf24 : 0x475569;
      const appearance = ALLY_APPEARANCE[member.assignedRole] ?? ALLY_APPEARANCE.director;
      const cosmetic = resolveCosmetic(member);

      const unitFrame = new Graphics()
        .roundRect(0, 0, unitCardWidth, unitCardHeight, 8)
        .fill({ color: 0x0f172a, alpha: 0.72 * alpha })
        .stroke({ width: 2, color: borderColor, alpha: 0.95 });

      const sprite = buildAllySprite({
        bodyColor,
        appearance,
        cosmetic,
        alpha,
      });
      sprite.pivot.set(51, 30);
      sprite.position.set(110, 48);
      sprite.scale.x = 1.7;
      sprite.scale.y = 2.4;

      const name = makeLabel(member.name.toUpperCase(), 9, 0xe2e8f0);
      name.x = 8;
      name.y = 66;

      const role = makeLabel(this.getRoleLabel(member.assignedRole).toUpperCase(), 8, 0x94a3b8);
      role.x = 8;
      role.y = 88;

      const barWidth = 202;
      const energyLabel = makeCompactLabel("HP", 0x86efac);
      energyLabel.x = 8;
      energyLabel.y = 104;
      const hpValue = makeCompactLabel(
        `${Math.round(member.energy)}/${Math.round(member.maxEnergy)}`,
        0x86efac,
      );
      hpValue.x = 158;
      hpValue.y = 104;
      const energyBg = new Graphics().roundRect(8, 114, barWidth, 8, 4).fill({ color: 0x1e293b, alpha: 1 });
      const energyFill = new Graphics()
        .roundRect(9, 115, Math.max(2, 200 * toPercent(member.energy, member.maxEnergy)), 6, 3)
        .fill({ color: 0x22c55e, alpha: 0.95 });

      const stressLabel = makeCompactLabel("ESTRES", 0xfda4af);
      stressLabel.x = 8;
      stressLabel.y = 134;
      const stressValue = makeCompactLabel(
        `${Math.round(member.stress)}/${Math.round(member.maxStress)}`,
        0xfda4af,
      );
      stressValue.x = 156;
      stressValue.y = 134;
      const stressBg = new Graphics().roundRect(8, 142, barWidth, 8, 4).fill({ color: 0x1e293b, alpha: 1 });
      const stressFill = new Graphics()
        .roundRect(9, 143, Math.max(2, 200 * toPercent(member.stress, member.maxStress)), 6, 3)
        .fill({ color: 0xfb7185, alpha: 0.95 });

      row.addChild(
        unitFrame,
        sprite,
        name,
        role,
        energyLabel,
        hpValue,
        energyBg,
        energyFill,
        stressLabel,
        stressValue,
        stressBg,
        stressFill,
      );

      if (isActive) {
        this.activeAllyContainer = row;
      }

      this.allyLayer.addChild(row);
    });
  }

  drawEnemies(snapshot, layout, selectedEnemyId) {
    this.clearLayer(this.enemyLayer);

    const aliveEnemies = snapshot.enemies.filter((enemy) => enemy.hp > 0);
    const focusedEnemyId = selectedEnemyId ?? aliveEnemies.sort((a, b) => b.threat - a.threat)[0]?.id;
    const arena = layout.center;
    const laneTop = arena.y + 10;
    const laneHeight = (arena.h - 20) / Math.max(1, snapshot.enemies.length || 1);

    snapshot.enemies.forEach((enemy, index) => {
      const y = laneTop + laneHeight * index;
      const enemyCardWidth = 252;
      const enemyCardHeight = 122;
      const x = arena.x + arena.w - enemyCardWidth - 8;
      const alpha = enemy.hp <= 0 ? 0.25 : 1;
      const isBoss = enemy.type === "boss";

      const row = new Container();
      row.x = x;
      row.y = y + laneHeight / 2 - enemyCardHeight / 2;
      row.baseX = row.x;
      const isSelected = enemy.id === selectedEnemyId;
      const isSelectable =
        snapshot.battleStatus === "active" &&
        snapshot.activeTurnToken !== "enemy" &&
        enemy.hp > 0;

      const visual = enemy.visual ?? {
        bodyColor: isBoss ? 0xb45309 : 0x9f1239,
        headColor: 0xf5d0a9,
        accentColor: isBoss ? 0xfb923c : 0xf43f5e,
        eyeColor: 0x111827,
        mark: "visor",
      };

      let frameStrokeWidth = 2;
      let frameStrokeColor = visual.accentColor;
      if (isBoss) {
        frameStrokeWidth = 2.5;
        frameStrokeColor = 0xf97316;
      }
      if (isSelected) {
        frameStrokeWidth = 3;
        frameStrokeColor = 0xfde047;
      }

      const frame = new Graphics()
        .roundRect(0, 0, enemyCardWidth, enemyCardHeight, 8)
        .fill({ color: 0x111827, alpha: 0.8 * alpha })
        .stroke({
          width: frameStrokeWidth,
          color: frameStrokeColor,
          alpha: 0.95,
        });

      const portraitBox = new Graphics()
        .roundRect(enemyCardWidth - 88, 12, 76, 98, 10)
        .fill({ color: 0x0b1220, alpha: 0.96 })
        .stroke({ width: 2, color: visual.accentColor, alpha: 0.95 });

      const enemyAvatar = buildAllySprite({
        bodyColor: visual.bodyColor,
        appearance: createEnemyGeneratedAppearance(enemy),
        cosmetic: createEnemyGeneratedCosmetic(enemy),
        alpha,
      });
      enemyAvatar.pivot.set(51, 30);
      enemyAvatar.position.set(enemyCardWidth - 50, 62);
      enemyAvatar.scale.set(1.45, 1.65);

      const tagBg = new Graphics()
        .roundRect(enemyCardWidth - 86, 92, 68, 14, 5)
        .fill({ color: isBoss ? 0xfb923c : 0x334155, alpha: 0.95 });
      const tagText = makeLabel(isBoss ? "BOSS" : "AMENAZA", 6, 0x0f172a);
      tagText.x = enemyCardWidth - 79;
      tagText.y = 95;

      const name = new Text({
        text: truncateText(enemy.name.toUpperCase(), 20),
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: Math.max(5, Math.round(5 * CANVAS_UI_SCALE)),
          fill: 0xf8fafc,
          fontWeight: "700",
          wordWrap: false,
          wordWrapWidth: enemyCardWidth - 104,
        },
      });
      name.x = 8;
      name.y = 10;

      const hpRatio = toPercent(enemy.hp, enemy.maxHp);
      const hpBarBg = new Graphics().roundRect(8, 54, enemyCardWidth - 104, 10, 4).fill({ color: 0x1f2937 });
      const hpBarFill = new Graphics()
        .roundRect(9, 55, Math.max(2, (enemyCardWidth - 106) * hpRatio), 8, 3)
        .fill({ color: isBoss ? 0xfb923c : visual.accentColor });

      const hpLabel = makeLabel(`HP ${Math.round(enemy.hp)} / ${Math.round(enemy.maxHp)}`, 6, 0xcbd5e1);
      hpLabel.x = 8;
      hpLabel.y = 36;

      const intentText = new Text({
        text: enemy.intent ? truncateText(enemy.intent.label, 44) : "Sin intencion",
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: Math.max(6, Math.round(6 * CANVAS_UI_SCALE)),
          fill: enemy.intent ? 0xfda4af : 0x94a3b8,
          wordWrap: true,
          wordWrapWidth: enemyCardWidth - 16,
        },
      });
      intentText.x = 8;
      intentText.y = 76;

      row.addChild(
        frame,
        portraitBox,
        enemyAvatar,
        tagBg,
        tagText,
        name,
        hpLabel,
        hpBarBg,
        hpBarFill,
        intentText,
      );

      if (isSelectable) {
        row.eventMode = "static";
        row.cursor = "pointer";
        row.interactiveChildren = false;
        row.hitArea = new Rectangle(0, 0, enemyCardWidth, enemyCardHeight);
        row.on("pointertap", () => {
          this.selectedEnemyId = enemy.id;
          if (typeof this.handlers.onSelectEnemy === "function") {
            this.handlers.onSelectEnemy(enemy.id);
          }

          if (this.snapshot) {
            this.draw(this.snapshot);
          }
        });
      }

      if (enemy.id === focusedEnemyId) {
        this.focusedEnemyContainer = row;
      }

      this.enemyLayer.addChild(row);
    });
  }

  drawTopHud(snapshot, layout) {
    const panel = this.makePanel(layout.top.x, layout.top.y, layout.top.w, layout.top.h, 10);
    this.uiLayer.addChild(panel);

    const phaseLabel = snapshot.phaseTitle ?? `Fase ${snapshot.phaseIndex + 1}`;
    const phaseCount = Math.max(1, snapshot.phaseCount ?? 5);
    const waveTotal = Math.max(1, snapshot.encounterTotalInPhase ?? 1);
    const levelText = `Nivel ${snapshot.phaseIndex + 1}/${phaseCount}`;
    const waveText = `Tanda ${snapshot.encounterIndex + 1}/${waveTotal}`;

    const context = makeLabel(
      `${truncateText(snapshot.teamName || "Equipo", 18)} • ${levelText} • ${waveText} • ${truncateText(phaseLabel, 24)}`,
      7,
      0x94a3b8,
    );
    context.x = layout.top.x + 12;
    context.y = layout.top.y + 12;

    let scenarioLine = null;
    if (snapshot.scenarioName) {
      scenarioLine = makeLabel(
        `Escenario: ${truncateText(snapshot.scenarioName, 20)} - ${truncateText(snapshot.scenarioSummary || "", 42)}`,
        6,
        0x7dd3fc,
      );
      scenarioLine.x = layout.top.x + 12;
      scenarioLine.y = layout.top.y + 30;
    }

    const title = makeLabel(truncateText(snapshot.encounterTitle.toUpperCase(), 38), 11, 0xe2e8f0);
    title.x = layout.top.x + 12;
    title.y = layout.top.y + 50;

    const subtitle = new Text({
      text: snapshot.encounterSubtitle,
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: Math.max(6, Math.round(7 * CANVAS_UI_SCALE)),
        fill: 0xcbd5e1,
        wordWrap: true,
        wordWrapWidth: Math.max(180, layout.top.w - 280),
      },
    });
    subtitle.x = layout.top.x + 12;
    subtitle.y = layout.top.y + 72;

    const statusBadge = new Graphics()
      .roundRect(layout.top.x + layout.top.w - 210, layout.top.y + 12, 196, 34, 7)
      .fill({ color: snapshot.isBoss ? 0xf59e0b : 0x60a5fa, alpha: 0.95 });
    const statusText = makeLabel(
      snapshot.isBoss ? "TANDA FINAL BOSS" : "TANDA OPERATIVA",
      8,
      0x0f172a,
    );
    statusText.x = layout.top.x + layout.top.w - 200;
    statusText.y = layout.top.y + 22;

    const turnDescriptor = this.getTurnDescriptor(snapshot);
    const turnLabel = makeLabel(truncateText(turnDescriptor.text, 44), 9, turnDescriptor.color);
    turnLabel.x = clamp(
      layout.top.x + layout.top.w / 2 - turnLabel.width / 2,
      layout.top.x + 12,
      layout.top.x + layout.top.w - turnLabel.width - 12,
    );
    turnLabel.y = layout.top.y + 50;
    this.turnLabelRef = turnLabel;

    this.uiLayer.addChild(
      context,
      ...(scenarioLine ? [scenarioLine] : []),
      title,
      subtitle,
      statusBadge,
      statusText,
      turnLabel,
    );

    const metricRowY = layout.top.y + layout.top.h - Math.max(58, Math.round(29 * CANVAS_UI_SCALE));
    const meterGap = 14;
    const meterWidth = (layout.top.w - 24 - meterGap * 4) / 5;

    PROJECT_METERS.forEach((metric, index) => {
      this.drawMeter(this.uiLayer, {
        metricKey: metric.key,
        x: layout.top.x + 12 + (meterWidth + meterGap) * index,
        y: metricRowY,
        width: meterWidth,
        label: metric.label,
        value: snapshot.project[metric.key],
        max: snapshot.project[metric.maxKey],
        reversed: metric.reversed ?? false,
        fillColor: metric.fillColor,
        tooltip: metric.tooltip,
      });
    });

    const baseInfoY = metricRowY - Math.max(10, Math.round(5 * CANVAS_UI_SCALE));

    if (snapshot.latestIncidentTitle) {
      const incidentBadge = makeLabel(
        `Incidente reciente: ${truncateText(snapshot.latestIncidentTitle, 44)}`,
        7,
        0xfda4af,
      );
      incidentBadge.x = layout.top.x + 12;
      incidentBadge.y = baseInfoY - 12;
      this.uiLayer.addChild(incidentBadge);
    }

    if (snapshot.lastLuckLabel) {
      const luck = makeLabel(`Ultimo evento de suerte: ${snapshot.lastLuckLabel}`, 8, 0x67e8f9);
      luck.x = layout.top.x + 12;
      luck.y = baseInfoY;
      this.uiLayer.addChild(luck);
    }
  }

  drawTeamRail(snapshot, layout) {
    const panel = this.makePanel(layout.left.x, layout.left.y, layout.left.w, layout.left.h, 10);
    this.uiLayer.addChild(panel);

    const title = makeLabel("TEAM PANEL", 11, 0xcbd5e1);
    title.x = layout.left.x + 10;
    title.y = layout.left.y + 10;
    this.uiLayer.addChild(title);

    const gap = 8;
    const cardsTop = layout.left.y + 32;
    const availableHeight = layout.left.h - 42;
    const cardHeight = (availableHeight - gap * (snapshot.team.length - 1)) / Math.max(1, snapshot.team.length);

    snapshot.team.forEach((member, index) => {
      const y = cardsTop + index * (cardHeight + gap);
      const isActive =
        snapshot.activeTurnToken !== "enemy" && member.assignedRole === snapshot.activeTurnToken;

      const card = new Graphics()
        .roundRect(layout.left.x + 8, y, layout.left.w - 16, cardHeight, 7)
        .fill({ color: 0x0f172a, alpha: 0.9 })
        .stroke({ width: 2, color: isActive ? 0xfbbf24 : 0x334155, alpha: 0.95 });

      const name = makeLabel(member.name.toUpperCase(), 9, 0xe2e8f0);
      name.x = layout.left.x + 14;
      name.y = y + 8;

      const role = makeLabel(this.getRoleLabel(member.assignedRole).toUpperCase(), 8, 0x94a3b8);
      role.x = layout.left.x + 14;
      role.y = y + 20;

      const status = makeLabel(`ESTADO ${String(member.status).toUpperCase()}`, 7, 0x94a3b8);
      status.x = layout.left.x + 14;
      status.y = y + 31;

      const hpText = makeLabel(
        `HP ${Math.round(member.energy)} / ${Math.round(member.maxEnergy)}`,
        7,
        0x86efac,
      );
      hpText.x = layout.left.x + 14;
      hpText.y = y + 42;

      const barWidth = layout.left.w - 28;
      this.drawMeter(this.uiLayer, {
        x: layout.left.x + 14,
        y: y + cardHeight - 28,
        width: barWidth,
        label: "HP",
        value: member.energy,
        max: member.maxEnergy,
      });
      this.drawMeter(this.uiLayer, {
        x: layout.left.x + 14,
        y: y + cardHeight - 14,
        width: barWidth,
        label: "Estres",
        value: member.stress,
        max: member.maxStress,
        reversed: true,
        fillColor: 0xfb7185,
      });

      this.uiLayer.addChild(card, name, role, status, hpText);
    });
  }

  getThreatIntelRows(snapshot, intentsRect) {
    const rowGap = 10;
    const cardInset = 12;
    const headerHeight = 28;
    const verticalMargin = 10;
    const minRowHeight = 64;
    const listTop = intentsRect.y + headerHeight + verticalMargin;
    const intelCandidates = snapshot.enemies.filter((enemy) => enemy.hp > 0).slice(0, 6);
    const availableListHeight = Math.max(36, intentsRect.h - headerHeight - verticalMargin * 2);
    const normalizedMinRowHeight = Math.min(minRowHeight, availableListHeight);
    const maxVisibleRows = intelCandidates.length
      ? Math.max(
        1,
        Math.min(
          intelCandidates.length,
          Math.floor((availableListHeight + rowGap) / (normalizedMinRowHeight + rowGap)),
        ),
      )
      : 0;
    const intelEnemies = intelCandidates.slice(0, maxVisibleRows);
    const rowHeight = intelEnemies.length
      ? Math.max(
        normalizedMinRowHeight,
        Math.floor((availableListHeight - rowGap * (intelEnemies.length - 1)) / intelEnemies.length),
      )
      : normalizedMinRowHeight;

    return {
      rowGap,
      listTop,
      rowHeight,
      intelEnemies,
      cardInset,
      hiddenCount: Math.max(0, intelCandidates.length - intelEnemies.length),
    };
  }

  wireThreatIntelInteractions(
    entry,
    {
      isSelectable,
      enemy,
      cardWidth,
      rowHeight,
    },
  ) {
    if (!isSelectable) {
      return;
    }

    entry.eventMode = "static";
    entry.cursor = "pointer";
    entry.interactiveChildren = true;
    entry.hitArea = new Rectangle(0, 0, cardWidth, rowHeight);

    entry.on("pointertap", () => {
      this.selectedEnemyId = enemy.id;
      if (typeof this.handlers.onSelectEnemy === "function") {
        this.handlers.onSelectEnemy(enemy.id);
      }

      if (this.snapshot) {
        this.draw(this.snapshot);
      }
    });
  }

  drawThreatIntelEntry(snapshot, intentsRect, enemy, rowY, rowHeight, selectedEnemyId, cardInset) {
    const isSelected = enemy.id === selectedEnemyId;
    const isSelectable =
      snapshot.battleStatus === "active" &&
      snapshot.activeTurnToken !== "enemy" &&
      enemy.hp > 0;

    const entry = new Container();
    entry.x = intentsRect.x + cardInset;
    entry.y = rowY;
    entry.interactiveChildren = true;
    const cardWidth = intentsRect.w - cardInset * 2;
    const contentPadX = 10;
    const contentGap = 4;
    const textWidth = cardWidth - contentPadX * 2;
    const nameFontSize = Math.max(7, Math.round(8 * CANVAS_UI_SCALE));
    const bodyFontSize = Math.max(7, Math.round(7 * CANVAS_UI_SCALE));
    const nameCharsPerLine = estimateCharsPerLine(textWidth, nameFontSize);
    const bodyCharsPerLine = estimateCharsPerLine(textWidth, bodyFontSize);

    const card = new Graphics()
      .roundRect(0, 0, cardWidth, rowHeight, 7)
      .fill({ color: 0x111827, alpha: 0.9 })
      .stroke({ width: isSelected ? 2.5 : 1.5, color: isSelected ? 0xfde047 : 0x334155, alpha: 0.95 });

    entry.addChild(card);

    const name = makeLabel(truncateText(enemy.name.toUpperCase(), Math.min(nameCharsPerLine, 18)), 5, 0xf8fafc);

    const hp = makeLabel(`HP ${Math.round(enemy.hp)} / ${Math.round(enemy.maxHp)}`, 6, 0xfda4af);

    const hasActiveIntent = enemy.hp > 0 && Boolean(enemy.intent);
    const intentLabelText = hasActiveIntent
      ? `INTENCION: ${enemy.intent.label}`
      : "SIN AMENAZA ACTIVA";

    const intent = makeLabel(
      truncateText(intentLabelText, Math.min(bodyCharsPerLine, 20)),
      6,
      hasActiveIntent ? 0xfda4af : 0x94a3b8,
    );

    const detailColor = hasActiveIntent ? 0xcbd5e1 : 0x64748b;
    const detailText = hasActiveIntent
      ? enemy.intent.previewText
      : "No hay accion prevista en este objetivo.";

    const markerHeight = 14;
    const markerY = 6;
    const topReserve = isSelected ? markerY + markerHeight + 6 : 8;
    const bottomReserve = hp.height + 8;
    const contentTop = topReserve;

    name.x = contentPadX;
    name.y = contentTop;

    intent.x = contentPadX;
    intent.y = name.y + name.height + contentGap;

    const detailTop = intent.y + intent.height + contentGap;
    const detailBottomLimit = rowHeight - bottomReserve - 2;
    let intentDetail = null;
    let detailWasTruncated = false;

    if (detailBottomLimit - detailTop >= 8) {
      const detailAvailableHeight = detailBottomLimit - detailTop;
      const detailLineHeight = Math.max(10, bodyFontSize);
      const maxDetailLines = Math.max(1, Math.floor(detailAvailableHeight / detailLineHeight));
      const detailTextLimit = bodyCharsPerLine * maxDetailLines;
      const detailRenderedText = truncateText(detailText, detailTextLimit);
      detailWasTruncated = detailRenderedText !== detailText;
      intentDetail = new Text({
        text: detailRenderedText,
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: bodyFontSize,
          fill: detailColor,
          wordWrap: true,
          wordWrapWidth: textWidth,
          breakWords: true,
          lineHeight: detailLineHeight,
        },
      });
      intentDetail.x = contentPadX;
      intentDetail.y = detailTop;
      if (intentDetail.y + intentDetail.height > detailBottomLimit) {
        intentDetail.destroy();
        intentDetail = null;
      }
    }

    hp.x = contentPadX;
    hp.y = rowHeight - hp.height - 6;

    entry.addChild(name, hp, intent, ...(intentDetail ? [intentDetail] : []));

    if (isSelected) {
      const markerWidth = 68;
      const markerX = cardWidth - markerWidth - 8;
      const markerBg = new Graphics()
        .roundRect(markerX, markerY, markerWidth, markerHeight, 5)
        .fill({ color: 0xfde047, alpha: 1 })
        .stroke({ width: 1, color: 0xfacc15, alpha: 1 });
      const marker = makeLabel("OBJETIVO", 6, 0x111827);
      marker.x = markerX + Math.round((markerWidth - marker.width) / 2);
      marker.y = markerY + 3;
      marker.eventMode = "none";
      entry.addChild(markerBg, marker);
    }

    this.wireThreatIntelInteractions(entry, {
      isSelectable,
      enemy,
      cardWidth,
      rowHeight,
    });

    if (hasActiveIntent) {
      const tooltipText = buildIntentTooltip(enemy);
      const showIntentTooltip = (event) => {
        const point = event?.global ?? { x: intentsRect.x + intentsRect.w - 10, y: rowY };
        this.showMetricTooltip(`Intencion: ${enemy.intent.label}`, tooltipText, point.x, point.y);
      };

      intent.eventMode = "static";
      intent.cursor = "help";
      intent.on("pointerover", showIntentTooltip);
      intent.on("pointermove", showIntentTooltip);
      intent.on("pointerout", () => {
        this.hideMetricTooltip();
      });
    }

    if (intentDetail && detailWasTruncated) {
      const showDetailTooltip = (event) => {
        const point = event?.global ?? { x: intentsRect.x + intentsRect.w - 10, y: rowY };
        this.showMetricTooltip("Descripcion completa", detailText, point.x, point.y);
      };

      intentDetail.eventMode = "static";
      intentDetail.cursor = "help";
      intentDetail.on("pointerover", showDetailTooltip);
      intentDetail.on("pointermove", showDetailTooltip);
      intentDetail.on("pointerout", () => {
        this.hideMetricTooltip();
      });
    }

    name.eventMode = "none";
    hp.eventMode = "none";
    if (!hasActiveIntent) {
      intent.eventMode = "none";
    }
    if (intentDetail && !detailWasTruncated) {
      intentDetail.eventMode = "none";
    }
    this.uiLayer.addChild(entry);
  }

  estimateCombatLogBodyLines(logRect, text) {
    const charsPerLine = Math.max(14, Math.floor((logRect.w - 28) / 6));
    const segments = String(text || "").split(/\r?\n/);
    const total = segments.reduce((sum, segment) => {
      return sum + Math.max(1, Math.ceil(segment.length / charsPerLine));
    }, 0);

    return Math.max(1, total);
  }

  estimateCombatLogRowHeight(logRect, entry) {
    const bodyLines = this.estimateCombatLogBodyLines(logRect, entry?.text || "");
    const bodyLineHeight = Math.max(10, Math.round(6 * CANVAS_UI_SCALE));
    const bodyHeight = bodyLines * bodyLineHeight;
    const headerHeight = Math.max(10, Math.round(6 * CANVAS_UI_SCALE));
    return Math.max(38, Math.ceil(10 + headerHeight + 6 + bodyHeight + 8));
  }

  getCombatLogRows(logRect, entries) {
    const entryGap = 6;
    const availableHeight = Math.max(48, logRect.h - 38);
    const startY = logRect.y + 30;

    const rows = [];
    let usedHeight = 0;

    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      const rowHeight = this.estimateCombatLogRowHeight(logRect, entry);
      const projectedHeight = rows.length
        ? usedHeight + entryGap + rowHeight
        : usedHeight + rowHeight;

      if (projectedHeight > availableHeight) {
        if (!rows.length) {
          rows.unshift({
            entry,
            rowHeight: availableHeight,
          });
        }
        break;
      }

      rows.unshift({ entry, rowHeight });
      usedHeight = projectedHeight;
    }

    return {
      entryGap,
      startY,
      rows,
    };
  }

  drawCombatLogEntry(logRect, y, rowHeightLog, entry) {
    const card = new Graphics()
      .roundRect(logRect.x + 8, y, logRect.w - 16, rowHeightLog, 6)
      .fill({ color: 0x0f172a, alpha: 0.95 })
      .stroke({ width: 1, color: 0x1e293b, alpha: 1 });

    const header = new Text({
      text: `T${entry.turnNumber} • ${entry.actorName}`,
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: Math.max(6, Math.round(6 * CANVAS_UI_SCALE)),
        fill: 0x94a3b8,
      },
    });
    header.x = logRect.x + 13;
    header.y = y + 6;

    const body = new Text({
      text: entry.text || "",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: Math.max(6, Math.round(6 * CANVAS_UI_SCALE)),
        fill: 0xe2e8f0,
        wordWrap: true,
        wordWrapWidth: logRect.w - 28,
      },
    });
    body.x = logRect.x + 13;
    body.y = y + 20;

    this.uiLayer.addChild(card, header, body);
  }

  drawIntelRail(snapshot, layout, selectedEnemyId) {
    const minIntentsHeight = 120;
    const minLogHeight = Math.max(96, Math.round(layout.left.h * 0.28));
    const maxIntentsHeight = Math.max(64, layout.left.h - layout.gap - minLogHeight);
    const desiredIntentsHeight = Math.round(layout.left.h * 0.52);
    const intentsHeight = clamp(
      desiredIntentsHeight,
      Math.min(minIntentsHeight, maxIntentsHeight),
      Math.min(360, maxIntentsHeight),
    );
    const intentsRect = {
      x: layout.left.x,
      y: layout.left.y,
      w: layout.left.w,
      h: intentsHeight,
    };
    const logRect = {
      x: layout.left.x,
      y: intentsRect.y + intentsRect.h + layout.gap,
      w: layout.left.w,
      h: layout.left.h - intentsRect.h - layout.gap,
    };

    this.uiLayer.addChild(this.makePanel(intentsRect.x, intentsRect.y, intentsRect.w, intentsRect.h, 10));

    const intelTitle = makeLabel("INTEL DE AMENAZAS", 11, 0xcbd5e1);
    intelTitle.x = intentsRect.x + 10;
    intelTitle.y = intentsRect.y + 10;
    this.uiLayer.addChild(intelTitle);

    const { rowGap, listTop, rowHeight, intelEnemies, cardInset, hiddenCount } = this.getThreatIntelRows(
      snapshot,
      intentsRect,
    );

    if (!intelEnemies.length) {
      const emptyIntel = makeLabel("Sin amenazas activas", 8, 0x64748b);
      emptyIntel.x = intentsRect.x + 10;
      emptyIntel.y = listTop + 6;
      this.uiLayer.addChild(emptyIntel);
    } else {
      intelEnemies.forEach((enemy, index) => {
        const rowY = listTop + index * (rowHeight + rowGap);
        this.drawThreatIntelEntry(snapshot, intentsRect, enemy, rowY, rowHeight, selectedEnemyId, cardInset);
      });
    }

    if (hiddenCount > 0) {
      const hiddenLabel = makeLabel(`+${hiddenCount} amenazas adicionales`, 7, 0x93c5fd);
      hiddenLabel.x = intentsRect.x + intentsRect.w - hiddenLabel.width - 10;
      hiddenLabel.y = intentsRect.y + 12;
      this.uiLayer.addChild(hiddenLabel);
    }

    this.uiLayer.addChild(this.makePanel(logRect.x, logRect.y, logRect.w, logRect.h, 10));

    const logTitle = makeLabel("REGISTRO DE COMBATE", 11, 0xcbd5e1);
    logTitle.x = logRect.x + 10;
    logTitle.y = logRect.y + 10;
    this.uiLayer.addChild(logTitle);

    const entries = snapshot.combatLog.slice(-MAX_COMBAT_LOG_CARDS);
    const { entryGap, startY, rows } = this.getCombatLogRows(logRect, entries);

    let rowY = startY;
    rows.forEach(({ entry, rowHeight }) => {
      this.drawCombatLogEntry(logRect, rowY, rowHeight, entry);
      rowY += rowHeight + entryGap;
    });
  }

  drawActionRail(snapshot, layout, selectedEnemyId) {
    const panel = this.makePanel(layout.right.x, layout.right.y, layout.right.w, layout.right.h, 10);
    this.uiLayer.addChild(panel);
    this.actionPanelRef = panel;

    const title = makeLabel("PANEL DE ACCION", 11, 0xcbd5e1);
    title.x = layout.right.x + 10;
    title.y = layout.right.y + 10;
    this.uiLayer.addChild(title);

    if (snapshot.battleStatus !== "active") {
      const statusText = makeLabel(
        snapshot.battleStatus === "victory" ? "ENCUENTRO SUPERADO" : "EN ESPERA",
        10,
        snapshot.battleStatus === "victory" ? 0x86efac : 0x94a3b8,
      );
      statusText.x = layout.right.x + 10;
      statusText.y = layout.right.y + 48;
      this.uiLayer.addChild(statusText);
      return;
    }

    if (snapshot.activeTurnToken === "enemy") {
      const waiting = makeLabel("RESPUESTA ENEMIGA EN CURSO...", 10, 0xfda4af);
      waiting.x = layout.right.x + 10;
      waiting.y = layout.right.y + 48;
      this.uiLayer.addChild(waiting);
      return;
    }

    const selectedEnemy = snapshot.enemies.find((enemy) => enemy.id === selectedEnemyId);
    const targetFontSize = Math.max(6, Math.round(6 * CANVAS_UI_SCALE));
    const targetCharsPerLine = estimateCharsPerLine(layout.right.w - 24, targetFontSize);
    const targetNameText = selectedEnemy ? selectedEnemy.name.toUpperCase() : "";
    const targetNameDisplay = selectedEnemy
      ? truncateText(targetNameText, Math.max(8, targetCharsPerLine - 10))
      : "NINGUNO";
    const targetLabel = makeLabel(
      `OBJETIVO: ${targetNameDisplay}`,
      6,
      selectedEnemy ? 0xfde047 : 0x94a3b8,
    );
    targetLabel.x = layout.right.x + 12;
    targetLabel.y = layout.right.y + 48;

    if (selectedEnemy && targetNameDisplay !== targetNameText) {
      const showTargetTooltip = (event) => {
        const point = event?.global ?? { x: targetLabel.x + 10, y: targetLabel.y + 10 };
        this.showMetricTooltip("Objetivo completo", targetNameText, point.x, point.y);
      };

      targetLabel.eventMode = "static";
      targetLabel.cursor = "help";
      targetLabel.on("pointerover", showTargetTooltip);
      targetLabel.on("pointermove", showTargetTooltip);
      targetLabel.on("pointerout", () => {
        this.hideMetricTooltip();
      });
    } else {
      targetLabel.eventMode = "none";
    }

    this.uiLayer.addChild(targetLabel);

    const luckHint = makeLabel(
      "Nota: la suerte agrega variacion secundaria y no reemplaza efectos base.",
      7,
      0x93c5fd,
    );
    luckHint.x = layout.right.x + 12;
    luckHint.y = layout.right.y + 62;
    this.uiLayer.addChild(luckHint);

    const actions = snapshot.actions ?? [];
    if (!actions.length) {
      const empty = makeLabel("SIN ACCIONES DISPONIBLES", 9, 0x94a3b8);
      empty.x = layout.right.x + 10;
      empty.y = layout.right.y + 82;
      this.uiLayer.addChild(empty);
      return;
    }

    const cols = 1;
    const rows = Math.ceil(actions.length / cols);
    const gap = 12;
    const availableW = layout.right.w - 20;
    const availableH = layout.right.h - 112 - gap * (rows - 1);
    const btnW = availableW / cols;
    const btnH = availableH / rows;
    const maxConsequenceLines = btnH >= 126 ? 3 : btnH >= 96 ? 2 : btnH >= 74 ? 1 : 0;

    actions.forEach((action, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = layout.right.x + 10 + col * (btnW + gap);
      const y = layout.right.y + 84 + row * (btnH + gap);

      const button = this.makeButton({
        x,
        y,
        width: btnW,
        height: btnH,
        label: action.title,
        subtitle: action.summary,
        consequenceLines: buildActionConsequenceLines(action, action.hasDebt, maxConsequenceLines),
        subtitleTooltipText: buildActionTooltip(action, action.hasDebt),
        tone: action.hasDebt ? "danger" : "default",
        badge: action.hasDebt ? "DEUDA" : getLuckProfileBadge(action.luckProfile),
        onTap: () => {
          if (typeof this.handlers.onPickAction === "function") {
            this.handlers.onPickAction(action.id, action.hasDebt, selectedEnemyId);
          }
        },
      });

      this.uiLayer.addChild(button);
    });
  }

  drawVictoryOverlay(snapshot, layout) {
    if (snapshot.battleStatus !== "victory") {
      return;
    }

    const veil = new Graphics().rect(0, 0, this.width, this.height).fill({ color: 0x020617, alpha: 0.45 });
    veil.eventMode = "none";
    this.overlayLayer.addChild(veil);

    const modalWidth = Math.min(780, this.width - 160);
    const modalHeight = Math.min(420, this.height - 120);
    const modalX = this.width / 2 - modalWidth / 2;
    const modalY = this.height / 2 - modalHeight / 2;

    const modal = this.makePanel(modalX, modalY, modalWidth, modalHeight, 12);
    modal.eventMode = "none";
    this.overlayLayer.addChild(modal);

    const title = makeLabel("ENCUENTRO SUPERADO", 16, 0x86efac);
    title.x = modalX + 18;
    title.y = modalY + 16;
    this.overlayLayer.addChild(title);

    let cursorY = modalY + 48;
    const modalInnerW = modalWidth - 36;

    if ((snapshot.vacantRoles ?? []).length > 0) {
      const continuity = makeLabel("CONTINUIDAD OPERATIVA", 10, 0xfcd34d);
      continuity.x = modalX + 18;
      continuity.y = cursorY;
      this.overlayLayer.addChild(continuity);
      cursorY += 20;

      snapshot.vacantRoles.forEach((role) => {
        const roleLabel = makeLabel(`ROL VACANTE: ${this.getRoleLabel(role).toUpperCase()}`, 9, 0xe2e8f0);
        roleLabel.x = modalX + 18;
        roleLabel.y = cursorY;
        this.overlayLayer.addChild(roleLabel);
        cursorY += 14;

        const candidates = (snapshot.staffingCandidates ?? []).slice(0, 3);
        const candidateWidth = candidates.length
          ? (modalInnerW - 12 * (candidates.length - 1) - 134) / candidates.length
          : modalInnerW - 134;

        candidates.forEach((candidate, index) => {
          const button = this.makeButton({
            x: modalX + 18 + index * (candidateWidth + 12),
            y: cursorY,
            width: candidateWidth,
            height: 36,
            label: `Suplencia: ${candidate.name}`,
            subtitle: "Cobertura interna",
            tone: "default",
            onTap: () => {
              if (typeof this.handlers.onApplyCoverage === "function") {
                this.handlers.onApplyCoverage(candidate.id, role);
              }
            },
          });
          this.overlayLayer.addChild(button);
        });

        const hireButton = this.makeButton({
          x: modalX + modalWidth - 116,
          y: cursorY,
          width: 98,
          height: 36,
          label: "Contratar",
          subtitle: "Nuevo perfil",
          tone: "success",
          onTap: () => {
            if (typeof this.handlers.onHireReplacement === "function") {
              this.handlers.onHireReplacement(role);
            }
          },
        });
        this.overlayLayer.addChild(hireButton);

        cursorY += 48;
      });
    }

    const continueButton = this.makeButton({
      x: modalX + modalWidth - 170,
      y: modalY + modalHeight - 56,
      width: 152,
      height: 38,
      label: "Continuar",
      subtitle: "Siguiente encuentro",
      tone: "success",
      onTap: () => {
        if (typeof this.handlers.onContinueEncounter === "function") {
          this.handlers.onContinueEncounter();
        }
      },
    });

    this.overlayLayer.addChild(continueButton);
  }

  drawStaffingCrisisOverlay(snapshot, layout) {
    const crisis = snapshot.staffingCrisis;
    if (snapshot.battleStatus !== "active" || !crisis) {
      return;
    }

    const veil = new Graphics().rect(0, 0, this.width, this.height).fill({ color: 0x020617, alpha: 0.58 });
    veil.eventMode = "none";
    this.overlayLayer.addChild(veil);

    const modalWidth = Math.min(900, this.width - 110);
    const modalHeight = Math.min(560, this.height - 90);
    const modalX = this.width / 2 - modalWidth / 2;
    const modalY = this.height / 2 - modalHeight / 2;

    const modal = this.makePanel(modalX, modalY, modalWidth, modalHeight, 12);
    modal.eventMode = "none";
    this.overlayLayer.addChild(modal);

    const bodyFontSize = 11;
    const bodyLineHeight = 16;
    const contentPadding = 24;
    const infoGap = 10;
    const contentX = modalX + contentPadding;
    const contentY = modalY + contentPadding;
    const contentW = modalWidth - contentPadding * 2;

    const title = makeLabel("EVENTO CRITICO: CRISIS DE PERSONAL", 16, 0xfda4af);
    title.x = contentX;
    title.y = contentY;
    this.overlayLayer.addChild(title);

    const subtitle = new Text({
      text: "Resuelve vacantes para recuperar el flujo operativo del proyecto.",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: bodyFontSize,
        fill: 0xf8fafc,
        lineHeight: bodyLineHeight,
        fontWeight: "700",
        letterSpacing: 0.4,
      },
    });
    subtitle.x = contentX;
    subtitle.y = title.y + title.height + 6;
    this.overlayLayer.addChild(subtitle);

    const separator = new Graphics()
      .moveTo(contentX, subtitle.y + subtitle.height + 8)
      .lineTo(contentX + contentW, subtitle.y + subtitle.height + 8)
      .stroke({ width: 1, color: 0x334155, alpha: 0.9 });
    separator.eventMode = "none";
    this.overlayLayer.addChild(separator);

    const infoBoxY = subtitle.y + subtitle.height + 16;
    const infoBox = new Graphics()
      .roundRect(contentX, infoBoxY, contentW, 122, 8)
      .fill({ color: 0x0f172a, alpha: 0.74 })
      .stroke({ width: 1, color: 0x334155, alpha: 0.95 });
    infoBox.eventMode = "none";
    this.overlayLayer.addChild(infoBox);

    const infoStyle = {
      fontFamily: "Courier New, monospace",
      fontSize: bodyFontSize,
      lineHeight: bodyLineHeight,
      fontWeight: "700",
      letterSpacing: 0.35,
      wordWrap: true,
      wordWrapWidth: contentW - 24,
    };

    const infoLines = [];
    infoLines.push({
      text:
        crisis.summary ||
        "Se rompio la continuidad del equipo y hay que actuar ya para que el proyecto no se caiga.",
      fill: 0xe2e8f0,
    });
    infoLines.push({
      text: "Si un rol se queda sin persona, el proyecto se traba. Cubre internamente o contrata para mantener el flujo.",
      fill: 0xfcd34d,
    });

    if ((crisis.dismissedMembers ?? []).length > 0) {
      const getDismissalDetail = (record) => {
        if (record.cause === "stress_resignation") {
          return `${record.memberName} ha renunciado por demasiado estres`;
        }

        const causeLabelByType = {
          energy_collapse: "agotamiento energetico",
          disciplinary_exit: "sancion disciplinaria",
          incident_impact: "impacto de incidente",
          unknown: "causa operativa",
        };

        const causeLabel = causeLabelByType[record.cause] ?? "causa operativa";
        return `${record.memberName} ha sido despedido por ${causeLabel}`;
      };

      const dismissedText = crisis.dismissedMembers
        .map((record) => getDismissalDetail(record))
        .join(" • ");

      infoLines.push({ text: `Detalle de bajas: ${dismissedText}`, fill: 0xfda4af });
    }

    let infoCursorY = infoBoxY + 12;
    infoLines.forEach((line) => {
      const label = new Text({
        text: line.text,
        style: {
          ...infoStyle,
          fill: line.fill,
        },
      });
      label.x = contentX + 12;
      label.y = infoCursorY;
      this.overlayLayer.addChild(label);
      infoCursorY += label.height + infoGap;
    });

    let cursorY = infoBoxY + infoBox.height + 14;
    const roleHeader = new Text({
      text: "ROLES VACANTES Y ACCIONES DISPONIBLES",
      style: {
        fontFamily: "Courier New, monospace",
        fontSize: bodyFontSize,
        fill: 0xe2e8f0,
        lineHeight: bodyLineHeight,
        fontWeight: "700",
        letterSpacing: 0.5,
      },
    });
    roleHeader.x = contentX;
    roleHeader.y = cursorY;
    this.overlayLayer.addChild(roleHeader);
    cursorY += roleHeader.height + 10;

    const modalInnerW = contentW;

    (crisis.vacantRoles ?? []).forEach((role) => {
      const rowHeight = 48;
      const row = new Graphics()
        .roundRect(contentX, cursorY - 4, contentW, rowHeight, 8)
        .fill({ color: 0x111827, alpha: 0.68 })
        .stroke({ width: 1, color: 0x334155, alpha: 0.9 });
      row.eventMode = "none";
      this.overlayLayer.addChild(row);

      const roleLabel = new Text({
        text: `VACANTE: ${this.getRoleLabel(role).toUpperCase()}`,
        style: {
          fontFamily: "Courier New, monospace",
          fontSize: bodyFontSize,
          fill: 0xe2e8f0,
          lineHeight: bodyLineHeight,
          fontWeight: "700",
          letterSpacing: 0.4,
        },
      });
      roleLabel.x = contentX + 10;
      roleLabel.y = cursorY + 10;
      this.overlayLayer.addChild(roleLabel);

      const candidates = (snapshot.staffingCandidates ?? [])
        .filter((candidate) => candidate.assignedRole !== role)
        .slice(0, 3);
      const candidateWidth = candidates.length
        ? (modalInnerW - 156 - 12 * (candidates.length - 1) - 144) / candidates.length
        : modalInnerW - 300;

      const actionY = cursorY + 2;
      const startX = contentX + 156;

      if (!candidates.length) {
        const noCandidate = new Text({
          text: "Sin perfiles internos viables para suplencia.",
          style: {
            fontFamily: "Courier New, monospace",
            fontSize: bodyFontSize,
            fill: 0x94a3b8,
            lineHeight: bodyLineHeight,
            fontWeight: "700",
            letterSpacing: 0.35,
          },
        });
        noCandidate.x = startX;
        noCandidate.y = cursorY + 12;
        this.overlayLayer.addChild(noCandidate);
      }

      candidates.forEach((candidate, index) => {
        const button = this.makeButton({
          x: startX + index * (candidateWidth + 12),
          y: actionY,
          width: candidateWidth,
          height: 40,
          label: `Suplencia: ${candidate.name}`,
          subtitle: "Cobertura interna",
          tone: "default",
          onTap: () => {
            if (typeof this.handlers.onApplyCoverage === "function") {
              this.handlers.onApplyCoverage(candidate.id, role);
            }
          },
        });
        this.overlayLayer.addChild(button);
      });

      const hireButton = this.makeButton({
        x: contentX + contentW - 132,
        y: actionY,
        width: 122,
        height: 40,
        label: "Contratar",
        subtitle: "Costo alto",
        tone: "danger",
        onTap: () => {
          if (typeof this.handlers.onHireReplacement === "function") {
            this.handlers.onHireReplacement(role);
          }
        },
      });
      this.overlayLayer.addChild(hireButton);

      cursorY += rowHeight + 12;
    });
  }
}
