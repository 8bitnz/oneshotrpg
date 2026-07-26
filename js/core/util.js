// util.js — RNG, math helpers, misc.
'use strict';

// Deterministic RNG (mulberry32). Use a dedicated instance per system so
// world generation stays identical regardless of gameplay randomness.
function RNG(seed) {
  let s = seed >>> 0;
  const next = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    f: next,                                  // [0,1)
    i: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)), // int inclusive
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}

// Global gameplay RNG (not used for worldgen).
const rng = RNG((Math.random() * 0xFFFFFFFF) >>> 0);

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist2 = (x1, y1, x2, y2) => (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
const manhattan = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

// Value-noise for terrain: smooth 2D noise from a seeded lattice.
function ValueNoise(seed) {
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263) ^ seed;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  return function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = hash(xi, yi), b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = smooth(xf), v = smooth(yf);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
}

// Fractal (octaved) noise builder.
function FractalNoise(seed, octaves, baseFreq) {
  const layers = [];
  for (let o = 0; o < octaves; o++) layers.push(ValueNoise(seed + o * 7919));
  return function (x, y) {
    let sum = 0, amp = 1, freq = baseFreq, tot = 0;
    for (let o = 0; o < octaves; o++) {
      sum += layers[o](x * freq, y * freq) * amp;
      tot += amp;
      amp *= 0.5; freq *= 2;
    }
    return sum / tot;
  };
}

const DIRS = {
  up:    { dx: 0, dy: -1 },
  down:  { dx: 0, dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
const DIR_LIST = ['up', 'down', 'left', 'right'];
