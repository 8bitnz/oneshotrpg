// audio.js — Web Audio chiptune engine. Square/triangle/noise channels.
// Milestone 1: minimal beeper SFX + unlock plumbing. Music sequencer lands
// in the audio milestone, but the interface is stable from day one:
//   Audio.sfx('menuMove'), Audio.playMusic('overworld'), Audio.stopMusic().
'use strict';

const Audio = {
  ctx: null,
  unlocked: false,
  sfxVol: 0.5,
  musicVol: 0.5,
  sfxGain: null, musicGain: null,
  currentMusic: null,

  unlock() {
    if (this.unlocked) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol;
      this.musicGain.connect(this.ctx.destination);
      this.unlocked = true;
      // start whatever was requested before the user's first interaction
      if (this.currentMusic && typeof Music !== 'undefined') {
        const want = this.currentMusic;
        Music.songName = null;
        Music.play(want);
      }
    } catch (e) { /* audio unavailable; game must still run silent */ }
  },

  setSfxVol(v) { this.sfxVol = v; if (this.sfxGain) this.sfxGain.gain.value = v; },
  setMusicVol(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v; },

  // --- simple SFX primitives -----------------------------------------------
  _tone(freq, dur, type, vol, slideTo, delay) {
    if (!this.unlocked) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol || 0.15, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(t0); osc.stop(t0 + dur + 0.01);
  },

  _noise(dur, vol, delay) {
    if (!this.unlocked) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(g); g.connect(this.sfxGain);
    src.start(t0);
  },

  sfx(name) {
    if (!this.unlocked) return;
    switch (name) {
      case 'menuMove': this._tone(520, 0.05, 'square', 0.08); break;
      case 'menuPick': this._tone(660, 0.06, 'square', 0.1); this._tone(880, 0.08, 'square', 0.1, 0, 0.05); break;
      case 'menuBack': this._tone(440, 0.07, 'square', 0.08, 220); break;
      case 'error':    this._tone(160, 0.12, 'square', 0.1); break;
      case 'step':     this._tone(90, 0.03, 'triangle', 0.05); break;
      case 'bump':     this._tone(70, 0.06, 'triangle', 0.09); break;
      case 'hit':      this._noise(0.09, 0.14); this._tone(180, 0.08, 'square', 0.1, 60); break;
      case 'crit':     this._noise(0.14, 0.2); this._tone(320, 0.12, 'square', 0.14, 40); break;
      case 'miss':     this._tone(500, 0.08, 'triangle', 0.06, 200); break;
      case 'heal':     this._tone(523, 0.08, 'triangle', 0.1); this._tone(784, 0.1, 'triangle', 0.1, 0, 0.07); break;
      case 'magic':    this._tone(700, 0.15, 'sawtooth', 0.07, 1400); break;
      case 'fire':     this._noise(0.2, 0.12); this._tone(220, 0.18, 'sawtooth', 0.08, 90); break;
      case 'gold':     this._tone(988, 0.05, 'square', 0.09); this._tone(1319, 0.09, 'square', 0.09, 0, 0.05); break;
      case 'levelup':  [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.12, 'square', 0.1, 0, i * 0.09)); break;
      case 'open':     this._tone(330, 0.06, 'square', 0.08); this._tone(494, 0.08, 'square', 0.08, 0, 0.06); break;
      case 'door':     this._tone(110, 0.1, 'triangle', 0.1); this._noise(0.06, 0.06); break;
      case 'stairs':   this._tone(262, 0.08, 'triangle', 0.08, 131); break;
      case 'save':     [660, 880].forEach((f, i) => this._tone(f, 0.09, 'triangle', 0.09, 0, i * 0.08)); break;
      case 'encounter': this._tone(200, 0.3, 'sawtooth', 0.1, 800); break;
      case 'die':      this._tone(300, 0.4, 'sawtooth', 0.1, 40); this._noise(0.3, 0.08, 0.1); break;
      case 'flee':     this._tone(400, 0.2, 'square', 0.07, 900); break;
    }
  },

  // Music sequencer stubs (implemented in audio milestone).
  playMusic(name) { this.currentMusic = name; if (typeof Music !== 'undefined') Music.play(name); },
  stopMusic() { this.currentMusic = null; if (typeof Music !== 'undefined') Music.stop(); },
  update(dt) { if (typeof Music !== 'undefined') Music.update(dt); },
};
