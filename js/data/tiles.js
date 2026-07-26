// tiles.js — ground & object tile registries with procedural pixel art.
// Maps are two layers: ground (opaque) + object (transparent overlay).
// Walkable = ground.walk && (no obj || obj.walk).
'use strict';

// ---- helpers ---------------------------------------------------------------
const _tileRng = RNG(0xC0FFEE);   // deterministic art speckles

function _fill(c, col) { c.fillStyle = col; c.fillRect(0, 0, 16, 16); }
function _px(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 1, 1); }
function _r(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function _speck(c, col, n) {
  for (let i = 0; i < n; i++) _px(c, _tileRng.i(0, 15), _tileRng.i(0, 15), col);
}

function groundTile(base, decorate) {
  return drawnSprite(16, 16, (c) => { _fill(c, base); if (decorate) decorate(c); });
}

// ---- GROUND tiles ----------------------------------------------------------
// id constants
const GT = {
  VOID: 0, DEEP: 1, WATER: 2, SAND: 3, GRASS: 4, MEADOW: 5, DIRT: 6,
  SWAMP: 7, DESERT: 8, SNOW: 9, ROAD: 10, BRIDGE: 11, FLOOR_WOOD: 12,
  FLOOR_STONE: 13, DFLOOR: 14, CARPET: 15, LAVA: 16, TILE_FLOOR: 17,
  GRAVEL: 18, WATER_T: 19,
};

const GROUND = [];  // id -> {name, spr:[frames], walk, boat, enc, slow}

function defGround(id, name, frames, opts) {
  GROUND[id] = Object.assign({ name, spr: frames, walk: true, boat: false, enc: 0, slow: 0 }, opts);
}

function waterFrames(base, waveCol) {
  const mk = (phase) => drawnSprite(16, 16, (c) => {
    _fill(c, base);
    for (let row = 0; row < 3; row++) {
      const y = 2 + row * 5 + (row % 2);
      const off = (row * 5 + phase * 4) % 16;
      _r(c, off, y, 3, 1, waveCol);
      _r(c, (off + 9) % 16, y + 2, 2, 1, waveCol);
    }
  });
  return [mk(0), mk(1)];
}

function grassTile(base, dark, light, tufts) {
  return groundTile(base, (c) => {
    for (let i = 0; i < tufts; i++) {
      const x = _tileRng.i(0, 14), y = _tileRng.i(0, 14);
      _px(c, x, y, dark); _px(c, x + 1, y, dark);
    }
    _speck(c, light, 4);
  });
}

defGround(GT.VOID, 'void', [groundTile(C.VOID)], { walk: false });
defGround(GT.DEEP, 'deep water', waterFrames(C.DEEPSEA, C.NAVY), { walk: false, boat: true });
defGround(GT.WATER, 'water', waterFrames(C.NAVY, C.BLUE), { walk: false, boat: true });
defGround(GT.SAND, 'sand', [groundTile(C.SAND, (c) => { _speck(c, C.TAN, 14); _speck(c, C.WHITE, 3); })], { enc: 0.5 });
defGround(GT.GRASS, 'grass', [grassTile(C.GREEN, C.DGREEN, C.YELLOW, 9)], { enc: 1 });
defGround(GT.MEADOW, 'meadow', [groundTile(C.GREEN, (c) => {
  _speck(c, C.DGREEN, 8);
  for (let i = 0; i < 4; i++) {
    const x = _tileRng.i(1, 14), y = _tileRng.i(1, 14);
    _px(c, x, y, [C.YELLOW, C.RED, C.WHITE][_tileRng.i(0, 2)]);
  }
})], { enc: 0.7 });
defGround(GT.DIRT, 'dirt', [groundTile(C.BROWN, (c) => { _speck(c, C.WOOD, 10); _speck(c, C.TAN, 5); })], { enc: 0.6 });
defGround(GT.SWAMP, 'swamp', [groundTile(C.SWAMPY, (c) => {
  _speck(c, C.DGREEN, 10);
  _r(c, _tileRng.i(1, 10), _tileRng.i(2, 12), 4, 1, C.NAVY);
  _r(c, _tileRng.i(1, 10), _tileRng.i(2, 12), 3, 1, C.NAVY);
  _speck(c, C.GREEN, 4);
})], { enc: 1.6, slow: 1 });
defGround(GT.DESERT, 'desert', [groundTile(C.SAND, (c) => {
  _speck(c, C.TAN, 8);
  _r(c, 2, 4, 6, 1, C.TAN); _r(c, 8, 11, 6, 1, C.TAN);
})], { enc: 1.2 });
defGround(GT.SNOW, 'snow', [groundTile(C.WHITE, (c) => { _speck(c, C.STEEL, 8); _speck(c, C.CYAN, 4); })], { enc: 1.1 });
defGround(GT.ROAD, 'road', [groundTile(C.TAN, (c) => { _speck(c, C.BROWN, 12); _speck(c, C.GRAY, 4); })], { enc: 0.15 });
defGround(GT.BRIDGE, 'bridge', [drawnSprite(16, 16, (c) => {
  _fill(c, C.NAVY);
  _r(c, 0, 2, 16, 12, C.WOOD);
  for (let x = 0; x < 16; x += 4) _r(c, x, 2, 1, 12, C.VOID);
  _r(c, 0, 1, 16, 1, C.BROWN); _r(c, 0, 14, 16, 1, C.BROWN);
})], { enc: 0 });
defGround(GT.FLOOR_WOOD, 'floor', [groundTile(C.BROWN, (c) => {
  for (let y = 3; y < 16; y += 4) _r(c, 0, y, 16, 1, C.WOOD);
  _r(c, 5, 0, 1, 3, C.WOOD); _r(c, 11, 4, 1, 3, C.WOOD); _r(c, 3, 8, 1, 3, C.WOOD); _r(c, 12, 12, 1, 3, C.WOOD);
})], {}),
defGround(GT.FLOOR_STONE, 'floor', [groundTile(C.GRAY, (c) => {
  _r(c, 0, 7, 16, 1, C.SLATE); _r(c, 0, 15, 16, 1, C.SLATE);
  _r(c, 7, 0, 1, 8, C.SLATE); _r(c, 12, 8, 1, 8, C.SLATE); _r(c, 3, 8, 1, 8, C.SLATE);
  _speck(c, C.STEEL, 6);
})], {});
defGround(GT.DFLOOR, 'cave floor', [groundTile(C.STONE, (c) => {
  _speck(c, C.SLATE, 12); _speck(c, C.VOID, 6); _speck(c, C.GRAY, 4);
})], { enc: 1 });
defGround(GT.CARPET, 'carpet', [groundTile(C.MAROON, (c) => {
  _r(c, 1, 1, 14, 14, C.BLOOD);
  _r(c, 2, 2, 12, 12, C.MAROON);
  _px(c, 3, 3, C.YELLOW); _px(c, 12, 3, C.YELLOW); _px(c, 3, 12, C.YELLOW); _px(c, 12, 12, C.YELLOW);
})], {});
defGround(GT.LAVA, 'lava', [
  groundTile(C.RED, (c) => { _speck(c, C.ORANGE, 14); _speck(c, C.YELLOW, 5); }),
  groundTile(C.RED, (c) => { _speck(c, C.ORANGE, 10); _speck(c, C.YELLOW, 9); }),
], { walk: false });
defGround(GT.TILE_FLOOR, 'tiles', [groundTile(C.STEEL, (c) => {
  for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8)
    if ((x + y) % 16 === 8) _r(c, x, y, 8, 8, C.GRAY);
  _speck(c, C.SLATE, 4);
})], {});
defGround(GT.GRAVEL, 'gravel', [groundTile(C.SLATE, (c) => { _speck(c, C.GRAY, 14); _speck(c, C.STONE, 8); })], { enc: 0.8 });
defGround(GT.WATER_T, 'water', waterFrames(C.BLUE, C.CYAN), { walk: false });

// ---- OBJECT tiles (transparent overlays) -----------------------------------
const OT = {
  NONE: 0, TREE: 1, PINES: 2, THICK: 3, MTN: 4, PEAK: 5, HOUSE: 6, CASTLE: 7,
  CAVE: 8, TOWER: 9, RUINS: 10, SHRINE: 11, GRAVE: 12, SIGN: 13, WELL: 14,
  FENCE: 15, DOOR: 16, TABLE: 17, CHAIR: 18, BED: 19, CHEST: 20, COUNTER: 21,
  SHELF: 22, BARREL: 23, ALTAR: 24, LEVER: 25, STAIRS_UP: 26, STAIRS_DN: 27,
  TORCH: 28, CACTUS: 29, BUSH: 30, ROCK: 31, DWALL: 32, WALL: 33, DDOOR: 34,
  DDOOR_LOCK: 35, CHEST_OPEN: 36, DOOR_OPEN: 37, GATE: 38, STATUE: 39,
  POT: 40, BONES: 41, WEB: 42, CRYSTAL: 43, ANVIL: 44, STOVE: 45, BOAT: 46,
  RUBBLE: 47, PALM: 48, SNOWTREE: 49, DEADTREE: 50, MUSHROOM: 51, PILLAR: 52,
  FOUNTAIN: 53, THRONE: 54, SWITCH_ON: 55, PORTAL: 56, LADDER: 57, CAMP: 58,
  BUOY: 59, WOLFDEN: 60, WRECK: 61,
};

const OBJ = [];  // id -> {name, spr:[frames], walk, block sight?, enter?, light}
OBJ[OT.NONE] = null;

function defObj(id, name, frames, opts) {
  OBJ[id] = Object.assign({ name, spr: frames, walk: false, sight: true, light: 0 }, opts);
}

function objSprite(fn) { return drawnSprite(16, 16, fn); }

// Trees
defObj(OT.TREE, 'tree', [objSprite((c) => {
  _r(c, 6, 10, 3, 5, C.WOOD);
  _r(c, 3, 2, 9, 8, C.DGREEN);
  _r(c, 2, 4, 11, 5, C.DGREEN);
  _r(c, 4, 3, 4, 2, C.GREEN); _px(c, 9, 5, C.GREEN); _px(c, 5, 7, C.GREEN);
  _px(c, 10, 7, C.GREEN); _px(c, 3, 6, C.GREEN);
})], { enc: 1.5 });
defObj(OT.PINES, 'pines', [objSprite((c) => {
  _r(c, 7, 12, 2, 3, C.WOOD);
  _r(c, 7, 1, 2, 2, C.DGREEN); _r(c, 6, 3, 4, 2, C.DGREEN);
  _r(c, 5, 5, 6, 2, C.DGREEN); _r(c, 4, 7, 8, 2, C.DGREEN);
  _r(c, 3, 9, 10, 3, C.DGREEN);
  _px(c, 7, 2, C.GREEN); _px(c, 6, 5, C.GREEN); _px(c, 5, 8, C.GREEN); _px(c, 9, 10, C.GREEN);
})], { enc: 1.5 });
defObj(OT.THICK, 'deep woods', [objSprite((c) => {
  _r(c, 0, 0, 16, 14, C.DGREEN);
  _r(c, 0, 14, 3, 2, C.DGREEN); _r(c, 13, 14, 3, 2, C.DGREEN);
  _r(c, 4, 14, 2, 2, C.WOOD); _r(c, 10, 14, 2, 2, C.WOOD);
  _speck(c, C.GREEN, 8); _speck(c, C.SWAMPY, 8); _speck(c, C.VOID, 4);
})], { walk: false, sight: false });
defObj(OT.MTN, 'mountains', [objSprite((c) => {
  c.fillStyle = C.GRAY;
  for (let y = 0; y < 13; y++) c.fillRect(7 - Math.floor(y * 7 / 13), 2 + y, 1 + Math.floor(y * 14 / 13), 1);
  _r(c, 0, 14, 16, 2, C.GRAY);
  for (let y = 3; y < 14; y += 2) _px(c, 7 - Math.floor((y - 2) * 6 / 13), y, C.STEEL);
  _r(c, 8, 4, 1, 3, C.SLATE); _r(c, 9, 7, 1, 4, C.SLATE); _r(c, 10, 10, 1, 4, C.SLATE);
  _px(c, 7, 2, C.WHITE);
})], { walk: false, sight: false });
defObj(OT.PEAK, 'peaks', [objSprite((c) => {
  c.fillStyle = C.SLATE;
  for (let y = 0; y < 14; y++) c.fillRect(7 - Math.floor(y * 7 / 14), 1 + y, 1 + Math.floor(y * 14 / 14), 1);
  _r(c, 0, 14, 16, 2, C.SLATE);
  _r(c, 6, 1, 3, 2, C.WHITE); _r(c, 5, 3, 5, 2, C.WHITE); _r(c, 4, 5, 3, 1, C.WHITE); _px(c, 9, 5, C.WHITE);
})], { walk: false, sight: false });
// Settlements & landmarks
defObj(OT.HOUSE, 'village', [objSprite((c) => {
  _r(c, 1, 6, 7, 7, C.TAN);
  _r(c, 0, 3, 9, 3, C.RED); _r(c, 1, 2, 7, 1, C.RED);
  _r(c, 3, 9, 2, 4, C.WOOD);
  _r(c, 9, 8, 6, 6, C.TAN);
  _r(c, 8, 5, 8, 3, C.ORANGE); _r(c, 9, 4, 6, 1, C.ORANGE);
  _px(c, 11, 10, C.VOID); _px(c, 12, 10, C.VOID);
})], { walk: true, enter: 'town' });
defObj(OT.CASTLE, 'city', [objSprite((c) => {
  _r(c, 1, 4, 3, 11, C.STEEL); _r(c, 12, 4, 3, 11, C.STEEL);
  _r(c, 1, 3, 1, 1, C.STEEL); _r(c, 3, 3, 1, 1, C.STEEL);
  _r(c, 12, 3, 1, 1, C.STEEL); _r(c, 14, 3, 1, 1, C.STEEL);
  _r(c, 4, 7, 8, 8, C.GRAY);
  _r(c, 4, 6, 1, 1, C.GRAY); _r(c, 6, 6, 1, 1, C.GRAY); _r(c, 8, 6, 1, 1, C.GRAY); _r(c, 10, 6, 1, 1, C.GRAY);
  _r(c, 6, 10, 4, 5, C.VOID);
  _r(c, 7, 9, 2, 1, C.VOID);
  _px(c, 2, 6, C.VOID); _px(c, 13, 6, C.VOID);
  _r(c, 7, 0, 1, 4, C.GRAY); _r(c, 8, 1, 3, 2, C.RED);
})], { walk: true, enter: 'town' });
defObj(OT.CAVE, 'cave', [objSprite((c) => {
  _r(c, 2, 4, 12, 11, C.GRAY);
  _r(c, 4, 2, 8, 2, C.GRAY);
  _r(c, 6, 8, 4, 7, C.VOID); _r(c, 5, 10, 6, 5, C.VOID);
  _speck(c, C.STEEL, 4);
})], { walk: true, enter: 'dungeon' });
defObj(OT.TOWER, 'tower', [objSprite((c) => {
  _r(c, 5, 3, 6, 12, C.SLATE);
  _r(c, 4, 1, 1, 2, C.SLATE); _r(c, 7, 1, 2, 2, C.SLATE); _r(c, 11, 1, 1, 2, C.SLATE);
  _r(c, 4, 3, 8, 1, C.SLATE);
  _r(c, 7, 5, 2, 2, C.YELLOW);
  _r(c, 6, 11, 3, 4, C.VOID);
  _px(c, 5, 4, C.STEEL); _px(c, 10, 8, C.STEEL);
})], { walk: true, enter: 'dungeon' });
defObj(OT.RUINS, 'ruins', [objSprite((c) => {
  _r(c, 2, 8, 2, 7, C.STEEL); _r(c, 2, 6, 2, 1, C.GRAY);
  _r(c, 12, 10, 2, 5, C.STEEL);
  _r(c, 7, 12, 3, 3, C.GRAY);
  _r(c, 5, 14, 1, 1, C.STEEL); _px(c, 11, 14, C.STEEL);
  _r(c, 6, 4, 4, 1, C.STEEL);
})], { walk: true, enter: 'dungeon' });
defObj(OT.SHRINE, 'shrine', [objSprite((c) => {
  _r(c, 4, 6, 2, 9, C.STEEL); _r(c, 10, 6, 2, 9, C.STEEL);
  _r(c, 3, 4, 10, 2, C.GRAY);
  _px(c, 7, 9, C.YELLOW); _px(c, 8, 9, C.YELLOW);
  _px(c, 7, 10, C.ORANGE); _px(c, 8, 10, C.ORANGE);
}), objSprite((c) => {
  _r(c, 4, 6, 2, 9, C.STEEL); _r(c, 10, 6, 2, 9, C.STEEL);
  _r(c, 3, 4, 10, 2, C.GRAY);
  _px(c, 7, 8, C.WHITE); _px(c, 8, 9, C.YELLOW);
  _px(c, 7, 10, C.YELLOW); _px(c, 8, 10, C.ORANGE);
})], { walk: true, enter: 'shrine', light: 2 });
defObj(OT.GRAVE, 'grave', [objSprite((c) => {
  _r(c, 5, 6, 6, 9, C.GRAY);
  _r(c, 6, 4, 4, 2, C.GRAY);
  _r(c, 7, 8, 2, 1, C.SLATE); _r(c, 6, 10, 4, 1, C.SLATE);
})], { walk: false, read: true });
defObj(OT.SIGN, 'sign', [objSprite((c) => {
  _r(c, 7, 8, 2, 7, C.WOOD);
  _r(c, 3, 3, 10, 5, C.BROWN);
  _r(c, 4, 4, 8, 1, C.TAN); _r(c, 4, 6, 6, 1, C.TAN);
})], { walk: false, read: true });
defObj(OT.WELL, 'well', [objSprite((c) => {
  _r(c, 4, 8, 8, 6, C.GRAY);
  _r(c, 5, 9, 6, 3, C.VOID);
  _r(c, 4, 2, 1, 6, C.WOOD); _r(c, 11, 2, 1, 6, C.WOOD);
  _r(c, 3, 1, 10, 2, C.BROWN);
})], {});
defObj(OT.FENCE, 'fence', [objSprite((c) => {
  _r(c, 0, 7, 16, 2, C.BROWN);
  _r(c, 2, 4, 2, 9, C.WOOD); _r(c, 12, 4, 2, 9, C.WOOD);
  _px(c, 2, 4, C.BROWN); _px(c, 12, 4, C.BROWN);
})], {}),
// Doors & walls
defObj(OT.WALL, 'wall', [objSprite((c) => {
  _fill(c, C.SLATE);
  _r(c, 0, 0, 16, 1, C.GRAY);
  _r(c, 0, 5, 16, 1, C.VOID); _r(c, 0, 10, 16, 1, C.VOID); _r(c, 0, 15, 16, 1, C.VOID);
  _r(c, 5, 1, 1, 4, C.VOID); _r(c, 11, 1, 1, 4, C.VOID);
  _r(c, 2, 6, 1, 4, C.VOID); _r(c, 8, 6, 1, 4, C.VOID); _r(c, 14, 6, 1, 4, C.VOID);
  _r(c, 5, 11, 1, 4, C.VOID); _r(c, 11, 11, 1, 4, C.VOID);
  _speck(c, C.GRAY, 5);
})], { walk: false, sight: false });
defObj(OT.DWALL, 'rock wall', [objSprite((c) => {
  _fill(c, C.VOID);
  _r(c, 1, 1, 6, 5, C.STONE); _r(c, 9, 2, 6, 4, C.STONE);
  _r(c, 2, 8, 5, 5, C.STONE); _r(c, 9, 8, 5, 6, C.STONE);
  _speck(c, C.SLATE, 8);
})], { walk: false, sight: false });
defObj(OT.DOOR, 'door', [objSprite((c) => {
  _r(c, 3, 1, 10, 14, C.WOOD);
  _r(c, 4, 2, 8, 13, C.BROWN);
  _r(c, 6, 2, 1, 13, C.WOOD); _r(c, 9, 2, 1, 13, C.WOOD);
  _px(c, 11, 8, C.YELLOW);
})], { walk: true, sight: false, door: true });
defObj(OT.DOOR_OPEN, 'open door', [objSprite((c) => {
  _r(c, 3, 1, 2, 14, C.WOOD);
  _r(c, 11, 1, 2, 14, C.WOOD);
  _r(c, 3, 0, 10, 2, C.WOOD);
})], { walk: true });
defObj(OT.DDOOR, 'door', [objSprite((c) => {
  _r(c, 2, 0, 12, 16, C.STONE);
  _r(c, 4, 2, 8, 14, C.WOOD);
  _r(c, 5, 3, 6, 13, C.BROWN);
  _px(c, 9, 9, C.YELLOW);
})], { walk: true, sight: false, door: true });
defObj(OT.DDOOR_LOCK, 'locked door', [objSprite((c) => {
  _r(c, 2, 0, 12, 16, C.STONE);
  _r(c, 4, 2, 8, 14, C.WOOD);
  _r(c, 5, 3, 6, 13, C.BROWN);
  _r(c, 7, 7, 3, 4, C.YELLOW);
  _r(c, 8, 9, 1, 2, C.VOID);
})], { walk: false, sight: false, locked: true });
defObj(OT.GATE, 'gate', [objSprite((c) => {
  _r(c, 0, 0, 3, 16, C.SLATE); _r(c, 13, 0, 3, 16, C.SLATE);
  _r(c, 3, 0, 10, 3, C.SLATE);
  for (let x = 4; x < 13; x += 3) _r(c, x, 3, 1, 13, C.GRAY);
  _r(c, 3, 6, 10, 1, C.GRAY);
})], { walk: false, gate: true });
// Furniture
defObj(OT.TABLE, 'table', [objSprite((c) => {
  _r(c, 2, 5, 12, 6, C.BROWN);
  _r(c, 2, 5, 12, 1, C.TAN);
  _r(c, 3, 11, 2, 3, C.WOOD); _r(c, 11, 11, 2, 3, C.WOOD);
})], {}),
defObj(OT.CHAIR, 'chair', [objSprite((c) => {
  _r(c, 5, 3, 2, 10, C.WOOD);
  _r(c, 5, 8, 7, 2, C.BROWN);
  _r(c, 10, 10, 2, 4, C.WOOD); _r(c, 5, 13, 2, 1, C.WOOD);
})], { walk: true }),
defObj(OT.BED, 'bed', [objSprite((c) => {
  _r(c, 2, 2, 12, 12, C.WOOD);
  _r(c, 3, 3, 10, 10, C.MAROON);
  _r(c, 3, 3, 10, 4, C.WHITE);
  _r(c, 4, 4, 3, 2, C.STEEL);
})], { bed: true }),
defObj(OT.CHEST, 'chest', [objSprite((c) => {
  _r(c, 3, 5, 10, 8, C.BROWN);
  _r(c, 3, 5, 10, 3, C.WOOD);
  _r(c, 3, 8, 10, 1, C.YELLOW);
  _r(c, 7, 8, 2, 3, C.YELLOW);
})], { chest: true }),
defObj(OT.CHEST_OPEN, 'empty chest', [objSprite((c) => {
  _r(c, 3, 7, 10, 6, C.BROWN);
  _r(c, 3, 3, 10, 3, C.WOOD);
  _r(c, 4, 7, 8, 2, C.VOID);
})], {}),
defObj(OT.COUNTER, 'counter', [objSprite((c) => {
  _r(c, 1, 4, 14, 9, C.BROWN);
  _r(c, 1, 4, 14, 2, C.TAN);
  _r(c, 1, 12, 14, 1, C.WOOD);
})], {}),
defObj(OT.SHELF, 'bookshelf', [objSprite((c) => {
  _r(c, 1, 1, 14, 14, C.WOOD);
  _r(c, 2, 2, 12, 4, C.VOID); _r(c, 2, 8, 12, 4, C.VOID);
  const cols = [C.RED, C.BLUE, C.GREEN, C.YELLOW, C.MAROON, C.PURPLE];
  for (let i = 0; i < 6; i++) { _r(c, 3 + i * 2, 3, 1, 3, cols[i]); }
  for (let i = 0; i < 5; i++) { _r(c, 4 + i * 2, 9, 1, 3, cols[(i + 3) % 6]); }
})], { read: true }),
defObj(OT.BARREL, 'barrel', [objSprite((c) => {
  _r(c, 4, 4, 8, 11, C.BROWN);
  _r(c, 3, 6, 10, 2, C.WOOD); _r(c, 3, 11, 10, 2, C.WOOD);
  _r(c, 5, 4, 6, 1, C.TAN);
})], {}),
defObj(OT.ALTAR, 'altar', [objSprite((c) => {
  _r(c, 4, 6, 8, 8, C.STEEL);
  _r(c, 3, 5, 10, 2, C.WHITE);
  _px(c, 7, 2, C.YELLOW); _px(c, 8, 2, C.YELLOW);
  _px(c, 7, 3, C.ORANGE); _px(c, 8, 3, C.ORANGE);
})], { altar: true, light: 2 }),
defObj(OT.LEVER, 'lever', [objSprite((c) => {
  _r(c, 5, 10, 6, 4, C.GRAY);
  _r(c, 7, 4, 2, 7, C.BROWN);
  _r(c, 6, 3, 4, 2, C.RED);
})], { lever: true }),
defObj(OT.SWITCH_ON, 'lever', [objSprite((c) => {
  _r(c, 5, 10, 6, 4, C.GRAY);
  _r(c, 7, 8, 2, 3, C.BROWN);
  _r(c, 6, 10, 4, 2, C.GREEN);
})], { lever: true }),
defObj(OT.STAIRS_UP, 'stairs up', [objSprite((c) => {
  _r(c, 1, 12, 14, 3, C.STEEL);
  _r(c, 3, 9, 12, 3, C.GRAY);
  _r(c, 5, 6, 10, 3, C.STEEL);
  _r(c, 7, 3, 8, 3, C.GRAY);
  _r(c, 9, 0, 7, 3, C.STEEL);
})], { walk: true, stairs: 'up' }),
defObj(OT.STAIRS_DN, 'stairs down', [objSprite((c) => {
  _r(c, 0, 0, 16, 16, C.VOID);
  _r(c, 0, 0, 14, 3, C.STEEL);
  _r(c, 0, 3, 11, 3, C.GRAY);
  _r(c, 0, 6, 8, 3, C.SLATE);
  _r(c, 0, 9, 5, 3, C.STONE);
})], { walk: true, stairs: 'down' }),
defObj(OT.TORCH, 'torch', [objSprite((c) => {
  _r(c, 7, 8, 2, 6, C.WOOD);
  _r(c, 6, 5, 4, 3, C.ORANGE);
  _r(c, 7, 3, 2, 3, C.YELLOW);
}), objSprite((c) => {
  _r(c, 7, 8, 2, 6, C.WOOD);
  _r(c, 6, 5, 4, 3, C.ORANGE);
  _px(c, 7, 4, C.YELLOW); _px(c, 8, 3, C.YELLOW); _px(c, 7, 2, C.WHITE);
})], { walk: false, light: 4 }),
defObj(OT.CACTUS, 'cactus', [objSprite((c) => {
  _r(c, 7, 3, 2, 12, C.GREEN);
  _r(c, 3, 5, 2, 4, C.GREEN); _r(c, 4, 8, 3, 2, C.GREEN);
  _r(c, 11, 6, 2, 3, C.GREEN); _r(c, 9, 8, 3, 2, C.GREEN);
  _px(c, 7, 3, C.DGREEN); _px(c, 3, 5, C.DGREEN);
})], {}),
defObj(OT.BUSH, 'bush', [objSprite((c) => {
  _r(c, 3, 8, 10, 6, C.DGREEN);
  _r(c, 5, 6, 6, 3, C.DGREEN);
  _px(c, 5, 9, C.GREEN); _px(c, 9, 8, C.GREEN); _px(c, 7, 11, C.GREEN);
  _px(c, 6, 10, C.RED); _px(c, 10, 11, C.RED);
})], { walk: true, enc: 1.2 }),
defObj(OT.ROCK, 'boulder', [objSprite((c) => {
  _r(c, 3, 7, 10, 7, C.GRAY);
  _r(c, 5, 5, 6, 3, C.GRAY);
  _r(c, 5, 6, 3, 2, C.STEEL);
  _px(c, 10, 9, C.SLATE); _r(c, 4, 12, 8, 2, C.SLATE);
})], {}),
defObj(OT.STATUE, 'statue', [objSprite((c) => {
  _r(c, 4, 12, 8, 3, C.SLATE);
  _r(c, 6, 8, 4, 4, C.GRAY);
  _r(c, 5, 5, 6, 3, C.GRAY);
  _r(c, 6, 2, 4, 3, C.STEEL);
  _px(c, 6, 3, C.VOID); _px(c, 9, 3, C.VOID);
})], { read: true }),
defObj(OT.POT, 'pot', [objSprite((c) => {
  _r(c, 5, 8, 6, 6, C.ORANGE);
  _r(c, 4, 9, 8, 3, C.ORANGE);
  _r(c, 6, 7, 4, 1, C.BROWN);
})], { walk: true, pot: true }),
defObj(OT.BONES, 'bones', [objSprite((c) => {
  _r(c, 4, 10, 3, 3, C.WHITE);
  _px(c, 5, 11, C.VOID);
  _r(c, 8, 12, 5, 1, C.STEEL);
  _r(c, 9, 8, 1, 4, C.STEEL); _px(c, 12, 9, C.WHITE);
})], { walk: true, read: true }),
defObj(OT.WEB, 'web', [objSprite((c) => {
  c.fillStyle = C.STEEL;
  for (let i = 0; i < 8; i++) { c.fillRect(i * 2, i * 2, 1, 1); c.fillRect(15 - i * 2, i * 2, 1, 1); }
  _r(c, 0, 7, 16, 1, C.STEEL); _r(c, 7, 0, 1, 16, C.STEEL);
})], { walk: true, slow: 1 }),
defObj(OT.CRYSTAL, 'crystal', [objSprite((c) => {
  _r(c, 6, 4, 4, 9, C.CYAN);
  _r(c, 7, 2, 2, 2, C.CYAN);
  _px(c, 7, 4, C.WHITE); _px(c, 6, 7, C.WHITE);
  _r(c, 4, 12, 8, 2, C.SLATE);
}), objSprite((c) => {
  _r(c, 6, 4, 4, 9, C.CYAN);
  _r(c, 7, 2, 2, 2, C.WHITE);
  _px(c, 8, 6, C.WHITE); _px(c, 7, 9, C.WHITE);
  _r(c, 4, 12, 8, 2, C.SLATE);
})], { light: 3, read: true }),
defObj(OT.ANVIL, 'anvil', [objSprite((c) => {
  _r(c, 3, 6, 10, 3, C.SLATE);
  _r(c, 6, 9, 4, 3, C.SLATE);
  _r(c, 4, 12, 8, 2, C.STONE);
  _r(c, 3, 6, 10, 1, C.STEEL);
})], {}),
defObj(OT.STOVE, 'hearth', [objSprite((c) => {
  _r(c, 2, 2, 12, 13, C.SLATE);
  _r(c, 4, 6, 8, 7, C.VOID);
  _r(c, 5, 9, 6, 3, C.ORANGE);
  _r(c, 6, 8, 4, 2, C.YELLOW);
}), objSprite((c) => {
  _r(c, 2, 2, 12, 13, C.SLATE);
  _r(c, 4, 6, 8, 7, C.VOID);
  _r(c, 5, 9, 6, 3, C.ORANGE);
  _px(c, 6, 8, C.YELLOW); _px(c, 9, 7, C.YELLOW);
})], { light: 3 }),
defObj(OT.BOAT, 'ship', [objSprite((c) => {
  _r(c, 2, 9, 12, 4, C.BROWN);
  _r(c, 3, 13, 10, 1, C.WOOD);
  _r(c, 7, 2, 1, 7, C.WOOD);
  _r(c, 8, 3, 5, 4, C.WHITE);
})], { walk: true, boat: true }),
defObj(OT.RUBBLE, 'rubble', [objSprite((c) => {
  _r(c, 3, 10, 4, 4, C.GRAY);
  _r(c, 8, 11, 5, 3, C.SLATE);
  _r(c, 6, 8, 3, 3, C.GRAY);
  _speck(c, C.STEEL, 4);
})], { walk: true, slow: 1 }),
defObj(OT.PALM, 'palm', [objSprite((c) => {
  _r(c, 7, 6, 2, 9, C.BROWN);
  _px(c, 8, 5, C.BROWN);
  _r(c, 3, 2, 4, 2, C.GREEN); _r(c, 9, 2, 4, 2, C.GREEN);
  _r(c, 5, 4, 6, 2, C.DGREEN);
  _r(c, 2, 4, 2, 1, C.GREEN); _r(c, 12, 4, 2, 1, C.GREEN);
})], {}),
defObj(OT.SNOWTREE, 'snowy pine', [objSprite((c) => {
  _r(c, 7, 12, 2, 3, C.WOOD);
  _r(c, 7, 1, 2, 2, C.DGREEN); _r(c, 6, 3, 4, 2, C.WHITE);
  _r(c, 5, 5, 6, 2, C.DGREEN); _r(c, 4, 7, 8, 2, C.WHITE);
  _r(c, 3, 9, 10, 3, C.DGREEN);
})], { enc: 1.4 }),
defObj(OT.DEADTREE, 'dead tree', [objSprite((c) => {
  _r(c, 7, 6, 2, 9, C.WOOD);
  _r(c, 4, 3, 1, 3, C.WOOD); _px(c, 5, 5, C.WOOD); _px(c, 6, 6, C.WOOD);
  _r(c, 11, 2, 1, 4, C.WOOD); _px(c, 10, 5, C.WOOD); _px(c, 9, 6, C.WOOD);
  _px(c, 8, 4, C.WOOD); _px(c, 8, 5, C.WOOD);
})], { enc: 1.3 }),
defObj(OT.MUSHROOM, 'mushrooms', [objSprite((c) => {
  _r(c, 4, 10, 2, 4, C.TAN);
  _r(c, 3, 8, 4, 2, C.RED); _px(c, 4, 8, C.WHITE);
  _r(c, 10, 11, 1, 3, C.TAN);
  _r(c, 9, 9, 3, 2, C.PURPLE); _px(c, 10, 9, C.WHITE);
})], { walk: true, read: true }),
defObj(OT.PILLAR, 'pillar', [objSprite((c) => {
  _r(c, 5, 1, 6, 2, C.STEEL);
  _r(c, 6, 3, 4, 10, C.GRAY);
  _r(c, 5, 13, 6, 2, C.STEEL);
  _r(c, 6, 3, 1, 10, C.STEEL);
})], {}),
defObj(OT.FOUNTAIN, 'fountain', [objSprite((c) => {
  _r(c, 2, 9, 12, 5, C.STEEL);
  _r(c, 3, 10, 10, 3, C.BLUE);
  _r(c, 7, 4, 2, 6, C.STEEL);
  _px(c, 6, 3, C.CYAN); _px(c, 9, 3, C.CYAN); _px(c, 7, 2, C.CYAN); _px(c, 8, 2, C.CYAN);
}), objSprite((c) => {
  _r(c, 2, 9, 12, 5, C.STEEL);
  _r(c, 3, 10, 10, 3, C.CYAN);
  _r(c, 7, 4, 2, 6, C.STEEL);
  _px(c, 6, 2, C.CYAN); _px(c, 9, 2, C.CYAN); _px(c, 7, 3, C.WHITE); _px(c, 8, 3, C.WHITE);
})], { fountain: true }),
defObj(OT.THRONE, 'throne', [objSprite((c) => {
  _r(c, 4, 2, 8, 12, C.YELLOW);
  _r(c, 5, 4, 6, 8, C.MAROON);
  _r(c, 3, 8, 2, 6, C.YELLOW); _r(c, 11, 8, 2, 6, C.YELLOW);
  _px(c, 5, 1, C.YELLOW); _px(c, 10, 1, C.YELLOW); _r(c, 7, 0, 2, 2, C.YELLOW);
})], { read: true }),
defObj(OT.PORTAL, 'moongate', [objSprite((c) => {
  _r(c, 4, 2, 8, 13, C.PURPLE);
  _r(c, 6, 4, 4, 9, C.WHITE);
  _r(c, 7, 5, 2, 7, C.CYAN);
}), objSprite((c) => {
  _r(c, 4, 2, 8, 13, C.PURPLE);
  _r(c, 6, 4, 4, 9, C.CYAN);
  _r(c, 7, 5, 2, 7, C.WHITE);
})], { walk: true, portal: true, light: 4 }),
defObj(OT.LADDER, 'ladder', [objSprite((c) => {
  _r(c, 4, 0, 2, 16, C.WOOD);
  _r(c, 10, 0, 2, 16, C.WOOD);
  for (let y = 2; y < 16; y += 4) _r(c, 6, y, 4, 1, C.BROWN);
})], { walk: true, stairs: 'up' });
defObj(OT.CAMP, 'camp', [objSprite((c) => {
  _r(c, 1, 5, 7, 7, C.MAROON);                 // tent
  _r(c, 2, 4, 5, 1, C.MAROON);
  _r(c, 3, 8, 2, 4, C.VOID);
  _r(c, 10, 11, 5, 2, C.WOOD);                 // fire logs
  _r(c, 11, 8, 3, 3, C.ORANGE);
  _r(c, 12, 6, 1, 2, C.YELLOW);
}), objSprite((c) => {
  _r(c, 1, 5, 7, 7, C.MAROON);
  _r(c, 2, 4, 5, 1, C.MAROON);
  _r(c, 3, 8, 2, 4, C.VOID);
  _r(c, 10, 11, 5, 2, C.WOOD);
  _r(c, 11, 8, 3, 3, C.ORANGE);
  _px(c, 11, 7, C.YELLOW); _px(c, 13, 6, C.YELLOW);
})], { walk: true, light: 3 });

defObj(OT.BUOY, 'drowned buoy', [objSprite((c) => {
  _r(c, 6, 6, 4, 6, C.RED);
  _r(c, 6, 8, 4, 2, C.WHITE);
  _r(c, 7, 3, 2, 3, C.SLATE);
  _px(c, 7, 2, C.YELLOW);
  _r(c, 4, 12, 8, 2, C.NAVY);
}), objSprite((c) => {
  _r(c, 6, 7, 4, 6, C.RED);
  _r(c, 6, 9, 4, 2, C.WHITE);
  _r(c, 7, 4, 2, 3, C.SLATE);
  _px(c, 7, 3, C.YELLOW);
  _r(c, 4, 12, 8, 2, C.NAVY);
})], { walk: true, marker: true });
defObj(OT.WOLFDEN, 'wolf den', [objSprite((c) => {
  _r(c, 2, 6, 12, 8, C.WOOD);
  _r(c, 3, 5, 10, 2, C.WOOD);
  _r(c, 5, 9, 6, 5, C.VOID);
  _px(c, 6, 10, C.YELLOW); _px(c, 9, 10, C.YELLOW);
  _r(c, 1, 13, 3, 1, C.WHITE); _px(c, 12, 13, C.WHITE);
})], { walk: true, marker: true });
defObj(OT.WRECK, 'wrecked caravan', [objSprite((c) => {
  _r(c, 2, 8, 10, 4, C.WOOD);
  _r(c, 3, 5, 8, 3, C.TAN);
  _r(c, 1, 11, 3, 3, C.VOID); _px(c, 2, 12, C.SLATE);
  _r(c, 10, 11, 3, 3, C.VOID); _px(c, 11, 12, C.SLATE);
  _r(c, 12, 6, 2, 2, C.SAND);
  _px(c, 5, 4, C.MAROON);
})], { walk: true, marker: true });

// ---- lookup helpers ---------------------------------------------------------
function tileFrame(frames, t) {
  return frames.length === 1 ? frames[0] : frames[Math.floor(t * 2.5) % frames.length];
}
