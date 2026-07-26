// palette.js — DB16-based palette with a few extensions. ~24 colors total.
// Every sprite and UI color comes from here; keeps the whole game coherent.
'use strict';

const C = {
  VOID:      '#140c1c',  // near-black purple (outlines, night sky, UI bg)
  MAROON:    '#442434',
  NAVY:      '#30346d',
  SLATE:     '#4e4a4e',
  BROWN:     '#854c30',
  DGREEN:    '#346524',
  RED:       '#d04648',
  GRAY:      '#757161',
  BLUE:      '#597dce',
  ORANGE:    '#d27d2c',
  STEEL:     '#8595a1',
  GREEN:     '#6daa2c',
  TAN:       '#d2aa99',
  CYAN:      '#6dc2ca',
  YELLOW:    '#dad45e',
  WHITE:     '#deeed6',
  // Extensions
  DEEPSEA:   '#1b2447',
  SWAMPY:    '#204631',
  SAND:      '#e8d8a0',
  PURPLE:    '#8b52c8',
  WOOD:      '#5a3921',
  FLASH:     '#ffffff',
  STONE:     '#4a3b32',
  BLOOD:     '#7a1f2b',
};

// Semantic aliases used by UI code.
const PAL = {
  TEXT: C.WHITE,
  TEXT_DIM: C.STEEL,
  TEXT_DARK: C.SLATE,
  UI_BG: C.VOID,
  UI_BORDER: C.STEEL,
  UI_HILITE: C.YELLOW,
  GOLD: C.YELLOW,
  HP: C.RED,
  MP: C.BLUE,
  XP: C.GREEN,
  GOOD: C.GREEN,
  BAD: C.RED,
  MAGIC: C.PURPLE,
};
