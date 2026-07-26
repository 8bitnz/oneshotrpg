// music.js — chiptune sequencer on Web Audio. Four channels: two pulses
// (lead + arp), triangle (bass), noise (drums). Songs are pattern strings,
// 16 sixteenth-steps per bar; '-' sustains, '.' rests.
'use strict';

const NOTE_SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(tok) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(tok);
  if (!m) return 0;
  let s = NOTE_SEMIS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + s;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Preparse "C4 - E4 . ..." into [{step, freq, len}] (len in steps).
function parsePattern(str) {
  const toks = str.trim().split(/\s+/);
  const notes = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === '.' || t === '-') continue;
    let len = 1;
    for (let j = i + 1; j < toks.length && toks[j] === '-'; j++) len++;
    notes.push({ step: i, freq: noteFreq(t), len });
  }
  return { notes, steps: toks.length };
}

function parseDrums(str) {
  const toks = str.trim().split(/\s+/);
  const hits = [];
  for (let i = 0; i < toks.length; i++) {
    if (toks[i] !== '.') hits.push({ step: i, kind: toks[i] });
  }
  return { hits, steps: toks.length };
}

const SONGS = {
  overworld: {
    bpm: 122,
    order: ['A', 'B', 'C', 'D'],
    lead: { wave: 'square', vol: 0.14, pats: {
      A: 'C4 - E4 G4 C5 - B4 A4 G4 - E4 G4 A4 - G4 -',
      B: 'A4 - C5 A4 E4 - A4 - B4 - C5 B4 A4 - - -',
      C: 'F4 - A4 C5 A4 - F4 - G4 - A4 G4 F4 - E4 D4',
      D: 'E4 - G4 B4 D5 - B4 - G4 - A4 B4 C5 - - -',
    } },
    arp: { wave: 'pulse', vol: 0.05, pats: {
      A: 'C5 . G4 . E4 . G4 . C5 . G4 . E4 . G4 .',
      B: 'A4 . E4 . C5 . E4 . A4 . E4 . C5 . E4 .',
      C: 'F4 . C5 . A4 . C5 . F4 . C5 . A4 . C5 .',
      D: 'G4 . D5 . B4 . D5 . G4 . D5 . B4 . D5 .',
    } },
    bass: { wave: 'triangle', vol: 0.2, pats: {
      A: 'C3 - - - C3 - G2 - C3 - - - G2 - - -',
      B: 'A2 - - - A2 - E2 - A2 - - - E2 - - -',
      C: 'F2 - - - F2 - C3 - F2 - - - C3 - - -',
      D: 'G2 - - - G2 - D3 - G2 - B2 - D3 - - -',
    } },
    drums: { vol: 0.5, pats: {
      A: 'k . h . s . h . k . h h s . h .',
      B: 'k . h . s . h . k . h h s . h .',
      C: 'k . h . s . h . k . h h s . h .',
      D: 'k . h . s . h . k k h . s . s .',
    } },
  },

  town: {
    bpm: 100,
    order: ['A', 'B', 'C', 'D'],
    lead: { wave: 'square', vol: 0.11, pats: {
      A: 'A4 - - G4 F4 - - - C5 - A4 - G4 - - -',
      B: 'F4 - A4 - D5 - C5 - A4 - F4 D4 E4 - - -',
      C: 'D4 - F4 - Bb4 - A4 G4 F4 - D4 F4 G4 - - -',
      D: 'E4 - G4 - C5 - B4 G4 E4 - F4 G4 F4 - E4 -',
    } },
    arp: { wave: 'pulse', vol: 0.04, pats: {
      A: '. . F4 . A4 . C5 . . . F4 . A4 . C5 .',
      B: '. . D4 . F4 . A4 . . . D4 . F4 . A4 .',
      C: '. . D4 . F4 . Bb4 . . . D4 . F4 . Bb4 .',
      D: '. . E4 . G4 . C5 . . . E4 . G4 . C5 .',
    } },
    bass: { wave: 'triangle', vol: 0.18, pats: {
      A: 'F2 - - - C3 - - - F2 - - - C3 - - -',
      B: 'D2 - - - A2 - - - D2 - - - A2 - - -',
      C: 'Bb2 - - - F2 - - - Bb2 - - - F2 - - -',
      D: 'C3 - - - G2 - - - C3 - - - G2 - - -',
    } },
    drums: { vol: 0.32, pats: {
      A: 'k . . . h . . . s . . . h . . .',
      B: 'k . . . h . . . s . . . h . . .',
      C: 'k . . . h . . . s . . . h . . .',
      D: 'k . . . h . . . s . . h . h . .',
    } },
  },

  dungeon: {
    bpm: 84,
    order: ['A', 'B', 'C', 'D'],
    lead: { wave: 'square', vol: 0.09, pats: {
      A: 'D4 - - - - - - - F4 - - - E4 - - -',
      B: '. - - - Bb3 - - - . - - - D4 - - -',
      C: 'G3 - - - - - Bb3 - . - A3 - - - - -',
      D: 'A3 - - - C#4 - - - - - - - . - - -',
    } },
    arp: { wave: 'pulse', vol: 0.035, pats: {
      A: 'D3 . . . A3 . . . D4 . . . A3 . . .',
      B: 'Bb2 . . . F3 . . . Bb3 . . . F3 . . .',
      C: 'G2 . . . D3 . . . G3 . . . D3 . . .',
      D: 'A2 . . . E3 . . . A3 . . . E3 . . .',
    } },
    bass: { wave: 'triangle', vol: 0.2, pats: {
      A: 'D2 - - - - - - - D2 - - - - - - -',
      B: 'Bb1 - - - - - - - Bb1 - - - - - - -',
      C: 'G1 - - - - - - - G1 - - - - - - -',
      D: 'A1 - - - - - - - A1 - - - - - - -',
    } },
    drums: { vol: 0.3, pats: {
      A: 'k . . . . . . . k . . . . . h .',
      B: 'k . . . . . . . k . . . . . . .',
      C: 'k . . . . . . . k . . . . . h .',
      D: 'k . . . . . . . k . . . s . . .',
    } },
  },

  combat: {
    bpm: 144,
    order: ['A', 'B', 'C', 'D'],
    lead: { wave: 'square', vol: 0.13, pats: {
      A: 'E4 - E4 G4 B4 - G4 E4 D4 - E4 - F#4 - - -',
      B: 'C4 - C4 E4 G4 - E4 C4 B3 - C4 - D4 - - -',
      C: 'D4 - D4 F#4 A4 - F#4 D4 E4 - F#4 - G4 - A4 -',
      D: 'B3 - B3 D#4 F#4 - D#4 B3 B4 - A4 - F#4 - D#4 -',
    } },
    arp: { wave: 'pulse', vol: 0.05, pats: {
      A: '. . E4 . . . B4 . . . E4 . . . B4 .',
      B: '. . C4 . . . G4 . . . C4 . . . G4 .',
      C: '. . D4 . . . A4 . . . D4 . . . A4 .',
      D: '. . B3 . . . F#4 . . . B3 . . . F#4 .',
    } },
    bass: { wave: 'triangle', vol: 0.22, pats: {
      A: 'E2 E2 E3 E2 E2 E2 E3 E2 E2 E2 E3 E2 E2 E2 E3 E2',
      B: 'C2 C2 C3 C2 C2 C2 C3 C2 C2 C2 C3 C2 C2 C2 C3 C2',
      C: 'D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 D3 D2',
      D: 'B1 B1 B2 B1 B1 B1 B2 B1 B1 B1 B2 B1 B1 B1 B2 B1',
    } },
    drums: { vol: 0.5, pats: {
      A: 'k . h h s . h . k k h . s . h h',
      B: 'k . h h s . h . k k h . s . h h',
      C: 'k . h h s . h . k k h . s . h h',
      D: 'k . h h s . h . k k h . s s s .',
    } },
  },

  victory: {
    bpm: 130,
    order: ['A', 'B'],
    lead: { wave: 'square', vol: 0.14, pats: {
      A: 'C4 C4 C4 - E4 - G4 - C5 - - - G4 - C5 -',
      B: 'E5 - D5 C5 G4 - E4 G4 C5 - - - - - - -',
    } },
    arp: { wave: 'pulse', vol: 0.05, pats: {
      A: 'C5 . G4 . E5 . G4 . C5 . G4 . E5 . G4 .',
      B: 'C5 . E5 . G5 . E5 . C5 . . . . . . .',
    } },
    bass: { wave: 'triangle', vol: 0.2, pats: {
      A: 'C3 - - - G2 - - - C3 - - - G2 - - -',
      B: 'F2 - - - G2 - - - C3 - - - - - - -',
    } },
    drums: { vol: 0.4, pats: {
      A: 'k . . . s . . . k . . . s . h h',
      B: 'k . . . s . . . k . . . . . . .',
    } },
  },

  gameover: {
    bpm: 62,
    order: ['A', 'B'],
    lead: { wave: 'square', vol: 0.09, pats: {
      A: 'A3 - - - G3 - - - F3 - - - E3 - - -',
      B: 'F3 - - - E3 - - - D3 - - - - - - -',
    } },
    arp: { wave: 'pulse', vol: 0.03, pats: {
      A: '. . A2 . . . E3 . . . A2 . . . E3 .',
      B: '. . D3 . . . A2 . . . D3 . . . . .',
    } },
    bass: { wave: 'triangle', vol: 0.2, pats: {
      A: 'A1 - - - - - - - F1 - - - - - - -',
      B: 'D2 - - - - - - - A1 - - - - - - -',
    } },
    drums: { vol: 0.25, pats: {
      A: 'k . . . . . . . . . . . . . . .',
      B: 'k . . . . . . . . . . . . . . .',
    } },
  },

  title: {
    bpm: 108,
    order: ['A', 'B', 'C', 'D'],
    lead: { wave: 'square', vol: 0.12, pats: {
      A: 'A4 - - - E4 - - - A4 - B4 - C5 - - -',
      B: 'F4 - - - C4 - - - F4 - G4 - A4 - - -',
      C: 'C5 - - - G4 - - - E4 - G4 - C5 - - -',
      D: 'B4 - - - G4 - - - D4 - E4 - E4 - - -',
    } },
    arp: { wave: 'pulse', vol: 0.045, pats: {
      A: 'A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4',
      B: 'F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3',
      C: 'C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4',
      D: 'G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3',
    } },
    bass: { wave: 'triangle', vol: 0.2, pats: {
      A: 'A2 - - - - - - - A2 - - - E2 - - -',
      B: 'F2 - - - - - - - F2 - - - C2 - - -',
      C: 'C3 - - - - - - - C3 - - - G2 - - -',
      D: 'G2 - - - - - - - G2 - - - D2 - - -',
    } },
    drums: { vol: 0.22, pats: {
      A: '. . . . h . . . . . . . h . . .',
      B: '. . . . h . . . . . . . h . . .',
      C: '. . . . h . . . . . . . h . . .',
      D: '. . . . h . . . . . . . h . h .',
    } },
  },
};

const Music = {
  song: null,
  songName: null,
  playing: false,
  step: 0,
  orderIdx: 0,
  nextTime: 0,
  parsed: {},        // songName -> {channels: [{cfg, pats:{key:parsed}}], drums}
  pulseWave: null,

  _prepare(name) {
    if (this.parsed[name]) return this.parsed[name];
    const s = SONGS[name];
    const out = { bpm: s.bpm, order: s.order, channels: [], drums: null };
    for (const ch of ['lead', 'arp', 'bass']) {
      if (!s[ch]) continue;
      const pats = {};
      for (const k in s[ch].pats) pats[k] = parsePattern(s[ch].pats[k]);
      out.channels.push({ wave: s[ch].wave, vol: s[ch].vol, pats });
    }
    if (s.drums) {
      const pats = {};
      for (const k in s.drums.pats) pats[k] = parseDrums(s.drums.pats[k]);
      out.drums = { vol: s.drums.vol, pats };
    }
    this.parsed[name] = out;
    return out;
  },

  play(name) {
    if (!SONGS[name]) { this.stop(); return; }
    if (this.songName === name && this.playing) return;
    this.songName = name;
    this.song = this._prepare(name);
    this.step = 0;
    this.orderIdx = 0;
    this.playing = true;
    if (Audio.unlocked) this.nextTime = Audio.ctx.currentTime + 0.06;
  },

  stop() { this.playing = false; this.songName = null; },

  _getPulseWave(ctx) {
    if (this.pulseWave) return this.pulseWave;
    const n = 16;
    const real = new Float32Array(n), imag = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * 0.25);
    }
    this.pulseWave = ctx.createPeriodicWave(real, imag);
    return this.pulseWave;
  },

  update() {
    if (!this.playing || !Audio.unlocked) return;
    const ctx = Audio.ctx;
    if (this.nextTime < ctx.currentTime - 0.4) this.nextTime = ctx.currentTime + 0.05;
    const stepDur = 60 / this.song.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.15) {
      this._scheduleStep(this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step++;
      if (this.step >= 16) {
        this.step = 0;
        this.orderIdx = (this.orderIdx + 1) % this.song.order.length;
      }
    }
  },

  _scheduleStep(t, stepDur) {
    const ctx = Audio.ctx;
    const key = this.song.order[this.orderIdx];
    for (const ch of this.song.channels) {
      const pat = ch.pats[key];
      if (!pat) continue;
      for (const n of pat.notes) {
        if (n.step !== this.step || !n.freq) continue;
        const osc = ctx.createOscillator();
        if (ch.wave === 'pulse') osc.setPeriodicWave(this._getPulseWave(ctx));
        else osc.type = ch.wave;
        osc.frequency.value = n.freq;
        const g = ctx.createGain();
        const dur = n.len * stepDur * 0.92;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(ch.vol, t + 0.008);
        g.gain.setValueAtTime(ch.vol, t + Math.max(0.008, dur - 0.05));
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        osc.connect(g); g.connect(Audio.musicGain);
        osc.start(t); osc.stop(t + dur + 0.02);
      }
    }
    if (this.song.drums) {
      const pat = this.song.drums.pats[key];
      if (pat) {
        for (const h of pat.hits) {
          if (h.step !== this.step) continue;
          this._drum(h.kind, t, this.song.drums.vol);
        }
      }
    }
  },

  _drum(kind, t, vol) {
    const ctx = Audio.ctx;
    if (kind === 'k') {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(g); g.connect(Audio.musicGain);
      osc.start(t); osc.stop(t + 0.12);
    } else {
      const dur = kind === 's' ? 0.07 : 0.025;
      const n = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      const v = kind === 's' ? vol * 0.28 : vol * 0.12;
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = kind === 's' ? 1400 : 5200;
      src.connect(f); f.connect(g); g.connect(Audio.musicGain);
      src.start(t);
    }
  },
};

// Dev sanity: every pattern must be exactly 16 steps.
(function validateSongs() {
  for (const name in SONGS) {
    const s = SONGS[name];
    for (const ch of ['lead', 'arp', 'bass', 'drums']) {
      if (!s[ch]) continue;
      for (const k in s[ch].pats) {
        const len = s[ch].pats[k].trim().split(/\s+/).length;
        if (len !== 16) console.warn(`SONG ${name}.${ch}.${k}: ${len} steps (want 16)`);
      }
    }
  }
})();
