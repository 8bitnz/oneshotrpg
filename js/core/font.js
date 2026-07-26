// font.js — 3x5 bitmap font in a 4x6 cell, hex-encoded rows.
// Each glyph: 6 hex digits, one per row, bit 8 = left column.
// Lowercase renders as uppercase (period-authentic; keeps text crisp at 3x5).
'use strict';

const FONT_W = 4;   // advance per character
const FONT_H = 6;   // line height

const FONT_GLYPHS = {
  'A': '4AEAA0', 'B': 'CACAC0', 'C': '688860', 'D': 'CAAAC0', 'E': 'E8C8E0',
  'F': 'E8C880', 'G': '68AA60', 'H': 'AAEAA0', 'I': 'E444E0', 'J': '222A40',
  'K': 'AACAA0', 'L': '8888E0', 'M': 'AEEAA0', 'N': 'CAAAA0', 'O': '4AAA40',
  'P': 'CAC880', 'Q': '4AAA42', 'R': 'CACAA0', 'S': '6842C0', 'T': 'E44440',
  'U': 'AAAA60', 'V': 'AAAA40', 'W': 'AAEEA0', 'X': 'AA4AA0', 'Y': 'AA4440',
  'Z': 'E248E0',
  '0': '4AAA40', '1': '4C44E0', '2': 'C248E0', '3': 'E262E0', '4': 'AAE220',
  '5': 'E8C2C0', '6': '68CA40', '7': 'E22440', '8': '4A4A40', '9': '4A62C0',
  ' ': '000000', '.': '000040', ',': '000048', '!': '444040', '?': 'C24040',
  ':': '040400', ';': '040480', "'": '440000', '"': 'AA0000', '-': '00E000',
  '+': '04E400', '=': '0E0E00', '/': '224880', '\\': '884220', '(': '244420',
  ')': '844480', '[': 'C888C0', ']': '622260', '<': '248420', '>': '842480',
  '*': 'A4A000', '%': 'A248A0', '#': 'AEAEA0', '_': '0000E0', '~': '05A000',
  '|': '444440',
  // Icon characters (used via FONT_ICON constants below)
  '\x01': 'AEE400',   // heart
  '\x02': '4E4A00',   // magic star
  '\x03': '4EE440',   // gold coin
  '\x04': '8CEC80',   // arrow right (cursor)
  '\x05': '04E040',   // arrow up? small diamond
  '\x06': '44EE40',   // arrow down
};

const ICON = { HEART: '\x01', STAR: '\x02', COIN: '\x03', CURSOR: '\x04' };

// Pre-decoded glyph bitmaps: char -> array of 6 row bitmasks.
const FONT_ROWS = {};
for (const ch in FONT_GLYPHS) {
  const hex = FONT_GLYPHS[ch];
  const rows = [];
  for (let i = 0; i < 6; i++) rows.push(parseInt(hex[i], 16));
  FONT_ROWS[ch] = rows;
}

function fontGlyph(ch) {
  let g = FONT_ROWS[ch];
  if (!g) g = FONT_ROWS[ch.toUpperCase()];
  if (!g) g = FONT_ROWS['?'];
  return g;
}

const textWidth = (str) => str.length * FONT_W - 1;
