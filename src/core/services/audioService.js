const NOTE = {
  Bb2: 116.54,
  C3: 130.81,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  Gb3: 185.00,
  G3: 196,
  Ab3: 207.65,
  A3: 220,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  Gb4: 369.99,
  G4: 392,
  Ab4: 415.30,
  A4: 440,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
};

const MUSIC_PATTERNS = {
  menu: {
    // Inspired by Carol of the Bells - Pattern: B-A-G-B with variations
    notes: [
      NOTE.B3, NOTE.A3, NOTE.G3, NOTE.B3, 
      NOTE.B3, NOTE.A3, NOTE.G3, NOTE.B3,
      NOTE.C4, NOTE.B3, NOTE.A3, NOTE.C4,
      NOTE.D4, NOTE.C4, NOTE.B3, NOTE.D4,
      NOTE.B3, NOTE.A3, NOTE.G3, NOTE.E3,
      NOTE.G3, NOTE.A3, NOTE.B3, NOTE.C4
    ],
    intervalMs: 200,
    type: "square",
    volume: 0.20,
  },
  creation: {
    // Dark harmonic minor progression
    notes: [
      NOTE.D4, NOTE.F4, NOTE.A4, NOTE.D5,
      NOTE.C4, NOTE.Eb4, NOTE.G4, NOTE.C5,
      NOTE.Bb3, NOTE.D4, NOTE.F4, NOTE.Bb4,
      NOTE.A3, NOTE.C4, NOTE.E4, NOTE.A4,
      NOTE.G3, NOTE.Bb3, NOTE.D4, NOTE.G4,
      NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4
    ],
    intervalMs: 220,
    type: "triangle",
    volume: 0.19,
  },
  phase1_normal: {
    // Battle theme with Carol of the Bells style urgency
    notes: [
      NOTE.E4, NOTE.D4, NOTE.C4, NOTE.E4,
      NOTE.E4, NOTE.D4, NOTE.C4, NOTE.E4,
      NOTE.G4, NOTE.F4, NOTE.E4, NOTE.G4,
      NOTE.A4, NOTE.G4, NOTE.F4, NOTE.A4,
      NOTE.C5, NOTE.B4, NOTE.A4, NOTE.C5,
      NOTE.B4, NOTE.A4, NOTE.G4, NOTE.B4,
      NOTE.A4, NOTE.G4, NOTE.F4, NOTE.A4,
      NOTE.G4, NOTE.F4, NOTE.E4, NOTE.D4
    ],
    intervalMs: 180,
    type: "square",
    volume: 0.18,
  },
  phase1_boss: {
    // Castlevania-style horror theme: chromatic descents, tritones, and gothic darkness
    notes: [
      // Intro amenazante - tritono (el "intervalo del diablo")
      NOTE.C3, NOTE.Gb3, NOTE.C3, NOTE.Gb3,
      // Descenso cromático terrorífico
      NOTE.Bb3, NOTE.A3, NOTE.Ab3, NOTE.G3,
      NOTE.Gb3, NOTE.F3, NOTE.E3, NOTE.Eb3,
      // Saltos dramáticos de octava
      NOTE.D3, NOTE.D4, NOTE.C3, NOTE.C4,
      // Progresión menor oscura
      NOTE.Ab3, NOTE.C4, NOTE.Eb4, NOTE.Ab4,
      NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4,
      // Tritono alto (más horror)
      NOTE.C4, NOTE.Gb4, NOTE.C4, NOTE.Gb4,
      // Climax con notas bajas amenazantes
      NOTE.Bb3, NOTE.F3, NOTE.D3, NOTE.Bb2,
      // Patrón de Castlevania: rápido y caótico
      NOTE.E4, NOTE.Eb4, NOTE.D4, NOTE.Eb4,
      NOTE.C4, NOTE.B3, NOTE.Bb3, NOTE.A3,
      // Final oscuro descendente
      NOTE.Ab3, NOTE.G3, NOTE.Gb3, NOTE.F3,
      NOTE.E3, NOTE.Eb3, NOTE.D3, NOTE.C3
    ],
    intervalMs: 140,
    type: "sawtooth",
    volume: 0.24,
  },
  results: {
    // Triumphant ending with ascending pattern
    notes: [
      NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5,
      NOTE.B4, NOTE.G4, NOTE.E4, NOTE.B3,
      NOTE.A4, NOTE.F4, NOTE.D4, NOTE.A3,
      NOTE.G4, NOTE.E4, NOTE.C4, NOTE.G3,
      NOTE.C5, NOTE.A4, NOTE.F4, NOTE.C4,
      NOTE.D5, NOTE.B4, NOTE.G4, NOTE.D4,
      NOTE.E4, NOTE.G4, NOTE.C5, NOTE.E5
    ],
    intervalMs: 240,
    type: "triangle",
    volume: 0.20,
  },
};

class AudioService {
  ctx = null;

  masterGain = null;

  enabled = true;

  unlocked = false;

  musicTimer = null;

  currentMusicKey = null;

  step = 0;

  sfxVolume = 0.22;

  musicVolumeMultiplier = 3;

  ensureContext() {
    if (this.ctx) {
      return this.ctx;
    }

    const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    this.ctx = new AudioContextCtor();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.45;
    this.masterGain.connect(this.ctx.destination);

    return this.ctx;
  }

  async unlock() {
    const ctx = this.ensureContext();
    if (!ctx) {
      return false;
    }

    if (ctx.state !== "running") {
      await ctx.resume();
    }

    this.unlocked = ctx.state === "running";
    return this.unlocked;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  playTone(frequency, duration, options = {}) {
    if (!this.enabled) {
      return;
    }

    const ctx = this.ensureContext();
    if (ctx?.state !== "running" || !this.masterGain) {
      return;
    }

    const {
      type = "square",
      volume = 0.1,
      startOffset = 0,
      slideTo = null,
      detune = 0,
    } = options;

    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    if (detune !== 0) {
      osc.detune.value = detune;
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume * this.sfxVolume),
      now + 0.01,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSfx(key) {
    switch (key) {
      case "hover":
        this.playTone(780, 0.06, { type: "triangle", volume: 0.07 });
        break;
      case "cancel":
        this.playTone(460, 0.09, { type: "square", volume: 0.1, slideTo: 320 });
        break;
      case "confirm":
        this.playTone(660, 0.07, { type: "square", volume: 0.12 });
        this.playTone(880, 0.08, {
          type: "square",
          volume: 0.09,
          startOffset: 0.06,
        });
        break;
      case "turn_start":
        this.playTone(520, 0.06, { type: "triangle", volume: 0.1 });
        this.playTone(660, 0.06, {
          type: "triangle",
          volume: 0.09,
          startOffset: 0.05,
        });
        break;
      case "turn_enemy":
        this.playTone(220, 0.08, { type: "sawtooth", volume: 0.11 });
        this.playTone(180, 0.09, {
          type: "sawtooth",
          volume: 0.1,
          startOffset: 0.05,
        });
        break;
      case "damage_ally":
        this.playTone(180, 0.12, { type: "sawtooth", volume: 0.14, slideTo: 120 });
        break;
      case "damage_enemy":
        this.playTone(420, 0.08, { type: "square", volume: 0.13, slideTo: 260 });
        break;
      case "debt":
        this.playTone(240, 0.11, { type: "sawtooth", volume: 0.13, slideTo: 180 });
        break;
      case "luck_positive":
        this.playTone(620, 0.08, { type: "triangle", volume: 0.11 });
        this.playTone(830, 0.08, {
          type: "triangle",
          volume: 0.11,
          startOffset: 0.07,
        });
        break;
      case "luck_negative":
        this.playTone(250, 0.08, { type: "square", volume: 0.11 });
        this.playTone(180, 0.1, {
          type: "square",
          volume: 0.11,
          startOffset: 0.07,
        });
        break;
      case "victory":
        this.playTone(520, 0.1, { type: "triangle", volume: 0.12 });
        this.playTone(660, 0.1, {
          type: "triangle",
          volume: 0.12,
          startOffset: 0.08,
        });
        this.playTone(880, 0.14, {
          type: "triangle",
          volume: 0.12,
          startOffset: 0.16,
        });
        break;
      case "defeat":
        this.playTone(300, 0.11, { type: "sawtooth", volume: 0.12 });
        this.playTone(220, 0.12, {
          type: "sawtooth",
          volume: 0.12,
          startOffset: 0.1,
        });
        this.playTone(160, 0.16, {
          type: "sawtooth",
          volume: 0.12,
          startOffset: 0.2,
        });
        break;
      default:
        this.playTone(560, 0.06, { type: "square", volume: 0.1 });
        break;
    }
  }

  playMusic(key) {
    if (!this.enabled || !key) {
      return;
    }

    const pattern = MUSIC_PATTERNS[key] ?? MUSIC_PATTERNS.phase1_normal;

    if (this.currentMusicKey === key && this.musicTimer) {
      return;
    }

    const ctx = this.ensureContext();
    if (ctx?.state !== "running") {
      return;
    }

    this.stopMusic();
    this.currentMusicKey = key;
    this.step = 0;

    const playStep = () => {
      if (!this.enabled || this.currentMusicKey !== key) {
        return;
      }

      const note = pattern.notes[this.step % pattern.notes.length];
      this.playTone(note, pattern.intervalMs / 1200, {
        type: pattern.type,
        volume: Math.min(1, pattern.volume * this.musicVolumeMultiplier),
      });

      if (key === "phase1_boss" && this.step % 2 === 0) {
        this.playTone(note / 2, pattern.intervalMs / 1400, {
          type: "square",
          volume: Math.min(1, pattern.volume * this.musicVolumeMultiplier * 0.8),
          startOffset: 0.04,
        });
      }

      this.step += 1;
    };

    playStep();
    this.musicTimer = globalThis.setInterval(playStep, pattern.intervalMs);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    this.currentMusicKey = null;
  }
}

export const audioService = new AudioService();
