const NOTE = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  G3: 196,
  A3: 220,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392,
  A4: 440,
};

const MUSIC_PATTERNS = {
  menu: {
    notes: [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4, NOTE.D4, NOTE.G4],
    intervalMs: 320,
    type: "square",
    volume: 0.07,
  },
  creation: {
    notes: [NOTE.D4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.G4],
    intervalMs: 280,
    type: "triangle",
    volume: 0.065,
  },
  phase1_normal: {
    notes: [NOTE.C3, NOTE.G3, NOTE.C4, NOTE.D4, NOTE.G3, NOTE.E4],
    intervalMs: 250,
    type: "square",
    volume: 0.06,
  },
  phase1_boss: {
    notes: [NOTE.C3, NOTE.D3, NOTE.C3, NOTE.G3, NOTE.C4, NOTE.G3],
    intervalMs: 210,
    type: "sawtooth",
    volume: 0.07,
  },
  results: {
    notes: [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4],
    intervalMs: 300,
    type: "triangle",
    volume: 0.06,
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
        volume: pattern.volume,
      });

      if (key === "phase1_boss" && this.step % 2 === 0) {
        this.playTone(note / 2, pattern.intervalMs / 1400, {
          type: "square",
          volume: pattern.volume * 0.8,
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
