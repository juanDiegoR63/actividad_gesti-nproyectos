import { Application, Container, Graphics, Text } from "pixi.js";
import { DEFAULT_ROLE_COSMETICS } from "../../data/characterCosmetics";

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toPercent(value, max) {
  if (max <= 0) return 0;
  return clamp(value / max, 0, 1);
}

function makeLabel(text, fontSize, color) {
  return new Text({
    text,
    style: {
      fontFamily: "Courier New, monospace",
      fontSize,
      fill: color,
      fontWeight: "700",
      letterSpacing: 0.6,
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

  hitFlashOverlay = null;

  hitFlashUntil = 0;

  animationTick = 0;

  animateFrame = (ticker) => {
    this.animationTick += ticker.deltaTime * 0.08;

    if (this.activeAllyContainer) {
      const bob = Math.sin(this.animationTick * 1.4) * 1.6;
      this.activeAllyContainer.y = this.activeAllyContainer.baseY + bob;
      this.activeAllyContainer.alpha = 0.88 + ((Math.sin(this.animationTick * 2.2) + 1) / 2) * 0.12;
    }

    if (this.focusedEnemyContainer) {
      const sway = Math.sin(this.animationTick * 1.2) * 1.3;
      this.focusedEnemyContainer.x = this.focusedEnemyContainer.baseX + sway;
      this.focusedEnemyContainer.alpha =
        0.9 + ((Math.sin(this.animationTick * 1.8 + 0.8) + 1) / 2) * 0.1;
    }

    if (this.turnLabelRef) {
      this.turnLabelRef.alpha = 0.78 + ((Math.sin(this.animationTick * 2.6) + 1) / 2) * 0.22;
    }

    if (this.snapshot?.activeTurnToken === "enemy") {
      this.root.x = Math.sin(this.animationTick * 3.4) * 1.2;
    } else {
      this.root.x = 0;
    }

    if (this.hitFlashOverlay) {
      const now = performance.now();
      if (now < this.hitFlashUntil) {
        const ttl = clamp((this.hitFlashUntil - now) / 140, 0, 1);
        this.hitFlashOverlay.alpha = ttl * 0.16;
      } else {
        this.hitFlashOverlay.alpha = 0;
      }
    }
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
      this.effectLayer,
      this.overlayLayer,
    );
    app.stage.addChild(this.root);

    this.recreateHitFlashOverlay();
    app.ticker.add(this.animateFrame);

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

    this.snapshot = snapshot;

    if (!this.mounted) {
      return;
    }

    this.draw(snapshot);
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

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

    this.hitFlashOverlay = overlay;
    this.effectLayer.removeChildren();
    this.effectLayer.addChild(overlay);
  }

  clearLayer(layer) {
    const removed = layer.removeChildren();
    removed.forEach((child) => child.destroy());
  }

  draw(snapshot) {
    this.activeAllyContainer = null;
    this.focusedEnemyContainer = null;
    this.turnLabelRef = null;

    this.drawBackground(snapshot);
    this.drawLanes();
    this.drawAllies(snapshot);
    this.drawEnemies(snapshot);
    this.drawOverlay(snapshot);
  }

  drawBackground(snapshot) {
    this.clearLayer(this.backgroundLayer);

    const palette = PHASE_PALETTES[snapshot.phaseIndex % PHASE_PALETTES.length];

    const bg = new Graphics().rect(0, 0, this.width, this.height).fill({ color: palette.base });

    const tileSize = 24;
    for (let x = 0; x < this.width; x += tileSize) {
      const tile = new Graphics()
        .rect(x, 0, Math.ceil(tileSize / 2), this.height - 68)
        .fill({ color: palette.tile, alpha: x % (tileSize * 2) === 0 ? 0.32 : 0.16 });
      this.backgroundLayer.addChild(tile);
    }

    const floor = new Graphics()
      .rect(0, this.height - 68, this.width, 68)
      .fill({ color: palette.floor });

    const floorAccent = new Graphics()
      .rect(0, this.height - 76, this.width, 8)
      .fill({ color: palette.accent });

    if (snapshot.isBoss) {
      const bossTint = new Graphics()
        .rect(0, 0, this.width, this.height)
        .fill({ color: 0x2b130f, alpha: 0.22 });
      this.backgroundLayer.addChild(bg, bossTint, floor, floorAccent);
      return;
    }

    this.backgroundLayer.addChild(bg, floor, floorAccent);
  }

  drawLanes() {
    this.clearLayer(this.laneLayer);

    const laneCount = 3;
    const top = 56;
    const battleHeight = this.height - 128;
    const laneHeight = battleHeight / laneCount;

    for (let lane = 0; lane <= laneCount; lane += 1) {
      const y = top + lane * laneHeight;
      const line = new Graphics()
        .rect(0, y, this.width, 1)
        .fill({ color: 0x64748b, alpha: 0.35 });
      this.laneLayer.addChild(line);
    }

    for (let x = 0; x <= this.width; x += 32) {
      const marker = new Graphics()
        .rect(x, this.height - 64, 2, 8)
        .fill({ color: 0x94a3b8, alpha: 0.28 });
      this.laneLayer.addChild(marker);
    }
  }

  drawAllies(snapshot) {
    this.clearLayer(this.allyLayer);

    const members = snapshot.team;
    const laneTop = 72;
    const laneHeight = (this.height - 132) / Math.max(1, members.length);

    members.forEach((member, index) => {
      const y = laneTop + laneHeight * index;
      const x = 82;
      const isActive =
        snapshot.activeTurnToken !== "enemy" && member.assignedRole === snapshot.activeTurnToken;

      const row = new Container();
      row.x = x - 34;
      row.y = y - 8;
      row.baseY = row.y;

      const bodyColor = ALLY_COLORS[member.assignedRole] ?? 0x22c55e;
      const alpha = member.status === "out" ? 0.35 : 1;
      const borderColor = isActive ? 0xfbbf24 : 0x475569;
      const appearance = ALLY_APPEARANCE[member.assignedRole] ?? ALLY_APPEARANCE.director;
      const cosmetic = resolveCosmetic(member);

      const unitFrame = new Graphics()
        .rect(0, 0, 124, 72)
        .fill({ color: 0x0f172a, alpha: 0.76 * alpha })
        .stroke({ width: 2, color: borderColor, alpha: 0.95 });

      const sprite = buildAllySprite({
        bodyColor,
        appearance,
        cosmetic,
        alpha,
      });
      sprite.pivot.set(51, 30);
      sprite.position.set(36, 36);
      sprite.scale.x = 3;

      const name = makeLabel(member.name, 10, 0xe2e8f0);
      name.x = 76;
      name.y = 10;

      const role = makeLabel(member.assignedRole.toUpperCase(), 8, 0x94a3b8);
      role.x = 76;
      role.y = 25;

      const energyPct = toPercent(member.energy, member.maxEnergy);
      const stressPct = toPercent(member.stress, member.maxStress);

      const energyBarBg = new Graphics().rect(76, 44, 66, 6).fill({ color: 0x1e293b });
      const energyBarFill = new Graphics()
        .rect(76, 44, 66 * energyPct, 6)
        .fill({ color: 0x22c55e });

      const stressBarBg = new Graphics().rect(76, 53, 66, 5).fill({ color: 0x1e293b });
      const stressBarFill = new Graphics()
        .rect(76, 53, 66 * stressPct, 5)
        .fill({ color: 0xfb7185 });

      row.addChild(
        unitFrame,
        sprite,
        name,
        role,
        energyBarBg,
        energyBarFill,
        stressBarBg,
        stressBarFill,
      );

      if (isActive) {
        this.activeAllyContainer = row;
      }

      this.allyLayer.addChild(row);
    });
  }

  drawEnemies(snapshot) {
    this.clearLayer(this.enemyLayer);

    const aliveEnemies = snapshot.enemies.filter((enemy) => enemy.hp > 0);
    const focusedEnemyId = aliveEnemies.sort((a, b) => b.threat - a.threat)[0]?.id;
    const laneTop = 72;
    const laneHeight = (this.height - 132) / Math.max(1, aliveEnemies.length || 1);

    snapshot.enemies.forEach((enemy, index) => {
      const y = laneTop + laneHeight * index;
      const x = this.width - 210;
      const alpha = enemy.hp <= 0 ? 0.25 : 1;
      const isBoss = enemy.type === "boss";

      const row = new Container();
      row.x = x - 6;
      row.y = y - 8;
      row.baseX = row.x;

      const visual = enemy.visual ?? {
        bodyColor: isBoss ? 0xb45309 : 0x9f1239,
        headColor: 0xf5d0a9,
        accentColor: isBoss ? 0xfb923c : 0xf43f5e,
        eyeColor: 0x111827,
        mark: "visor",
      };

      const frame = new Graphics()
        .rect(0, 0, 138, 72)
        .fill({ color: 0x111827, alpha: 0.8 * alpha })
        .stroke({ width: isBoss ? 2.5 : 2, color: isBoss ? 0xf97316 : visual.accentColor, alpha: 0.95 });

      const sprite = new Graphics()
        .rect(98, 8, 34, 34)
        .fill({ color: visual.bodyColor, alpha })
        .rect(106, -4, 18, 12)
        .fill({ color: visual.headColor, alpha })
        .rect(110, 2, 2, 2)
        .fill({ color: visual.eyeColor, alpha })
        .rect(118, 2, 2, 2)
        .fill({ color: visual.eyeColor, alpha });

      drawEnemyMark(sprite, visual.mark, visual.accentColor, alpha);

      const name = makeLabel(enemy.name, 10, 0xf8fafc);
      name.x = 8;
      name.y = 10;

      const hpRatio = toPercent(enemy.hp, enemy.maxHp);
      const hpBarBg = new Graphics().rect(8, 42, 84, 6).fill({ color: 0x1f2937 });
      const hpBarFill = new Graphics()
        .rect(8, 42, 84 * hpRatio, 6)
        .fill({ color: isBoss ? 0xfb923c : visual.accentColor });

      const intentText = makeLabel(
        enemy.intent ? enemy.intent.label : "Sin intencion",
        8,
        enemy.intent ? 0xfda4af : 0x94a3b8,
      );
      intentText.x = 8;
      intentText.y = 54;

      row.addChild(frame, sprite, name, hpBarBg, hpBarFill, intentText);

      if (enemy.id === focusedEnemyId) {
        this.focusedEnemyContainer = row;
      }

      this.enemyLayer.addChild(row);
    });
  }

  drawOverlay(snapshot) {
    this.clearLayer(this.overlayLayer);

    const title = makeLabel(snapshot.encounterTitle.toUpperCase(), 12, 0xe2e8f0);
    title.x = 14;
    title.y = 10;

    const turnText =
      snapshot.activeTurnToken === "enemy"
        ? "TURNO ENEMIGO"
        : `TURNO ${snapshot.activeTurnToken.toUpperCase()}`;
    const turnLabel = makeLabel(
      turnText,
      12,
      snapshot.activeTurnToken === "enemy" ? 0xfda4af : 0xfde68a,
    );
    turnLabel.x = this.width / 2 - turnLabel.width / 2;
    turnLabel.y = 10;
    this.turnLabelRef = turnLabel;

    this.overlayLayer.addChild(title, turnLabel);

    if (snapshot.isBoss) {
      const boss = snapshot.enemies.find((enemy) => enemy.type === "boss") ?? snapshot.enemies[0];
      if (!boss) {
        return;
      }

      const ratio = toPercent(Math.max(0, boss.hp), boss.maxHp);
      const barWidth = Math.min(420, this.width - 220);
      const startX = this.width / 2 - barWidth / 2;

      const frame = new Graphics()
        .rect(startX, 34, barWidth, 14)
        .fill({ color: 0x111827 })
        .stroke({ width: 2, color: 0xf97316 });
      const fill = new Graphics()
        .rect(startX + 2, 36, (barWidth - 4) * ratio, 10)
        .fill({ color: 0xf97316 });

      const bossLabel = makeLabel(`BOSS ${boss.name.toUpperCase()}`, 9, 0xfed7aa);
      bossLabel.x = startX;
      bossLabel.y = 50;

      this.overlayLayer.addChild(frame, fill, bossLabel);
    }
  }
}
