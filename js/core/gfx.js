// gfx.js — fixed internal-resolution renderer, integer-scaled, crisp pixels.
'use strict';

const VIEW_W = 384, VIEW_H = 216;
const TILE = 16;

const Gfx = {
  canvas: null, ctx: null,
  scale: 1,
  shakeT: 0, shakePow: 0, shakeX: 0, shakeY: 0,
  fontAtlases: {},   // color -> canvas with all glyphs

  init() {
    this.canvas = document.getElementById('screen');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    window.addEventListener('resize', () => this.fit());
    this.fit();
  },

  fit() {
    const s = Math.max(1, Math.floor(Math.min(
      window.innerWidth / VIEW_W, window.innerHeight / VIEW_H)));
    this.scale = s;
    this.canvas.style.width = (VIEW_W * s) + 'px';
    this.canvas.style.height = (VIEW_H * s) + 'px';
  },

  clear(color) {
    this.ctx.fillStyle = color || '#000000';
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  },

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  },

  frame(x, y, w, h, color) {   // 1px outline
    this.rect(x, y, w, 1, color);
    this.rect(x, y + h - 1, w, 1, color);
    this.rect(x, y, 1, h, color);
    this.rect(x + w - 1, y, 1, h, color);
  },

  // Standard bordered UI panel.
  panel(x, y, w, h) {
    this.rect(x, y, w, h, PAL.UI_BG);
    this.frame(x + 1, y + 1, w - 2, h - 2, PAL.UI_BORDER);
  },

  sprite(img, x, y) {
    this.ctx.drawImage(img, x | 0, y | 0);
  },

  spriteFlipH(img, x, y) {
    const c = this.ctx;
    c.save();
    c.translate((x | 0) + img.width, y | 0);
    c.scale(-1, 1);
    c.drawImage(img, 0, 0);
    c.restore();
  },

  // --- Text ---------------------------------------------------------------
  _atlas(color) {
    let a = this.fontAtlases[color];
    if (a) return a;
    const chars = Object.keys(FONT_ROWS);
    a = { canvas: document.createElement('canvas'), index: {} };
    a.canvas.width = chars.length * FONT_W;
    a.canvas.height = FONT_H;
    const c = a.canvas.getContext('2d');
    c.fillStyle = color;
    chars.forEach((ch, i) => {
      a.index[ch] = i * FONT_W;
      const rows = FONT_ROWS[ch];
      for (let ry = 0; ry < 6; ry++) {
        const bits = rows[ry];
        for (let rx = 0; rx < 4; rx++) {
          if (bits & (8 >> rx)) c.fillRect(i * FONT_W + rx, ry, 1, 1);
        }
      }
    });
    this.fontAtlases[color] = a;
    return a;
  },

  text(str, x, y, color) {
    const a = this._atlas(color || PAL.TEXT);
    const c = this.ctx;
    x |= 0; y |= 0;
    for (let i = 0; i < str.length; i++) {
      let ch = str[i];
      if (a.index[ch] === undefined) ch = ch.toUpperCase();
      if (a.index[ch] === undefined) ch = '?';
      c.drawImage(a.canvas, a.index[ch], 0, FONT_W, FONT_H, x, y, FONT_W, FONT_H);
      x += FONT_W;
    }
  },

  textC(str, cx, y, color) {   // centered on cx
    this.text(str, cx - Math.floor(textWidth(str) / 2), y, color);
  },

  textR(str, rx, y, color) {   // right-aligned at rx
    this.text(str, rx - textWidth(str) - 1, y, color);
  },

  // Scaled-up text (titles). Centered on cx.
  textBig(str, cx, y, color, scale) {
    scale = scale || 3;
    const a = this._atlas(color || PAL.TEXT);
    const w = str.length * FONT_W;
    let x = Math.floor(cx - (w * scale) / 2);
    const c = this.ctx;
    for (let i = 0; i < str.length; i++) {
      let ch = str[i];
      if (a.index[ch] === undefined) ch = ch.toUpperCase();
      if (a.index[ch] === undefined) ch = '?';
      c.drawImage(a.canvas, a.index[ch], 0, FONT_W, FONT_H,
        x, y, FONT_W * scale, FONT_H * scale);
      x += FONT_W * scale;
    }
  },

  // Word-wrap text into width w (pixels). Returns line count drawn.
  textWrap(str, x, y, w, color, lineH) {
    lineH = lineH || (FONT_H + 1);
    const maxChars = Math.floor(w / FONT_W);
    const lines = wrapText(str, maxChars);
    for (let i = 0; i < lines.length; i++) {
      this.text(lines[i], x, y + i * lineH, color);
    }
    return lines.length;
  },

  // --- Screen shake ---------------------------------------------------------
  shake(power, dur) {
    this.shakePow = Math.max(this.shakePow, power);
    this.shakeT = Math.max(this.shakeT, dur);
  },

  updateShake(dt) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      this.shakeX = Math.round((Math.random() * 2 - 1) * this.shakePow);
      this.shakeY = Math.round((Math.random() * 2 - 1) * this.shakePow);
      if (this.shakeT <= 0) { this.shakePow = 0; this.shakeX = 0; this.shakeY = 0; }
    }
  },
};

function wrapText(str, maxChars) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      if (line.length === 0) line = word;
      else if (line.length + 1 + word.length <= maxChars) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}

// Build a sprite from string art. lines: array of equal-length strings.
// map: char -> color string. '.' or ' ' = transparent.
function makeSprite(lines, map) {
  const h = lines.length, w = lines[0].length;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = lines[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = map[ch];
      if (!col) continue;
      c.fillStyle = col;
      c.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}

// Draw-procedure sprite: fn(ctx, w, h) paints onto a fresh offscreen canvas.
function drawnSprite(w, h, fn) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  fn(cv.getContext('2d'), w, h);
  return cv;
}
