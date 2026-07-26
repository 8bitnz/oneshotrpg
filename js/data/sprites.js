// sprites.js — procedural character sprites. One generator produces hero,
// companions, and NPCs from a small option object, keeping a consistent look.
// Returns { down:[a,b], up:[a,b], left:[a,b], right:[a,b] } of 16x16 canvases.
'use strict';

function charSprites(opt) {
  const skin = opt.skin || C.TAN;
  const hair = opt.hair || C.WOOD;
  const tunic = opt.tunic || C.BLUE;
  const pants = opt.pants || C.SLATE;
  const boots = opt.boots || C.VOID;
  const robe = !!opt.robe;              // long robe instead of legs
  const helmet = opt.helmet || null;    // helmet color (guards, knights)
  const hood = opt.hood || null;        // hood color (mages, rogues)
  const trim = opt.trim || null;        // tunic trim color

  function head(c, facing) {
    // Skull
    _r(c, 5, 2, 6, 5, skin);
    if (facing === 'down') {
      if (helmet) {
        _r(c, 4, 1, 8, 3, helmet); _r(c, 4, 4, 1, 2, helmet); _r(c, 11, 4, 1, 2, helmet);
        _px(c, 5, 2, C.WHITE);
      } else if (hood) {
        _r(c, 4, 1, 8, 3, hood); _r(c, 4, 4, 1, 3, hood); _r(c, 11, 4, 1, 3, hood);
      } else {
        _r(c, 4, 1, 8, 2, hair); _px(c, 4, 3, hair); _px(c, 11, 3, hair);
      }
      _px(c, 6, 4, C.VOID); _px(c, 9, 4, C.VOID);        // eyes
      _px(c, 7, 6, opt.beard ? hair : skin); _px(c, 8, 6, opt.beard ? hair : skin);
      if (opt.beard) { _r(c, 6, 5, 4, 2, hair); _r(c, 7, 7, 2, 1, hair); }
    } else if (facing === 'up') {
      if (helmet) { _r(c, 4, 1, 8, 4, helmet); _r(c, 4, 5, 1, 2, helmet); _r(c, 11, 5, 1, 2, helmet); }
      else if (hood) { _r(c, 4, 1, 8, 5, hood); }
      else { _r(c, 4, 1, 8, 5, hair); _r(c, 5, 6, 6, 1, hair); }
    } else { // side (drawn facing left)
      if (helmet) { _r(c, 4, 1, 7, 3, helmet); _r(c, 9, 4, 2, 2, helmet); _px(c, 4, 4, helmet); }
      else if (hood) { _r(c, 4, 1, 7, 3, hood); _r(c, 9, 4, 2, 3, hood); }
      else { _r(c, 4, 1, 7, 2, hair); _r(c, 9, 3, 2, 3, hair); _px(c, 4, 3, hair); }
      _px(c, 5, 4, C.VOID);                              // one eye
    }
  }

  function torso(c, facing, frame) {
    if (facing === 'side') {
      _r(c, 5, 7, 6, 5, tunic);
      if (trim) _r(c, 5, 11, 6, 1, trim);
      _r(c, 7, 8, 2, 3, tunic);                          // near arm
      _px(c, 7, 11, skin);
    } else {
      _r(c, 4, 7, 8, 5, tunic);
      if (trim) { _r(c, 4, 11, 8, 1, trim); _px(c, 7, 8, trim); _px(c, 8, 8, trim); }
      _r(c, 3, 8, 1, 3, tunic); _r(c, 12, 8, 1, 3, tunic); // arms
      _px(c, 3, 11, skin); _px(c, 12, 11, skin);           // hands
    }
  }

  function legs(c, facing, frame) {
    if (robe) {
      const col = opt.robeCol || tunic;
      if (facing === 'side') { _r(c, 5, 12, 6, 3, col); _r(c, 5, 15, 6, 1, frame ? boots : col); }
      else { _r(c, 4, 12, 8, 3, col); _r(c, frame ? 5 : 4, 15, 8, 1, col); }
      return;
    }
    if (facing === 'side') {
      if (frame) {
        _r(c, 4, 12, 2, 2, pants); _r(c, 3, 14, 2, 2, boots);
        _r(c, 8, 12, 2, 2, pants); _r(c, 9, 14, 2, 2, boots);
      } else {
        _r(c, 6, 12, 3, 2, pants); _r(c, 6, 14, 3, 2, boots);
      }
    } else {
      if (frame) {
        _r(c, 5, 12, 2, 2, pants); _r(c, 5, 14, 2, 2, boots);
        _r(c, 9, 12, 2, 3, pants); _r(c, 9, 15, 2, 1, boots);
      } else {
        _r(c, 5, 12, 2, 3, pants); _r(c, 5, 15, 2, 1, boots);
        _r(c, 9, 12, 2, 2, pants); _r(c, 9, 14, 2, 2, boots);
      }
    }
  }

  function make(facing, frame) {
    return drawnSprite(16, 16, (c) => {
      const f = facing === 'left' || facing === 'right' ? 'side' : facing;
      legs(c, f, frame);
      torso(c, f, frame);
      head(c, f);
    });
  }

  const left0 = make('left', 0), left1 = make('left', 1);
  const flip = (img) => drawnSprite(16, 16, (c) => {
    c.translate(16, 0); c.scale(-1, 1); c.drawImage(img, 0, 0);
  });
  return {
    down: [make('down', 0), make('down', 1)],
    up: [make('up', 0), make('up', 1)],
    left: [left0, left1],
    right: [flip(left0), flip(left1)],
  };
}

// Quadruped side-view sprites (wolves, rats, boars...). Returns the same
// {down/up/left/right} shape as charSprites so battle/map code is uniform;
// down/up reuse the side view.
function beastSprites(opt) {
  const body = opt.body || C.GRAY;
  const belly = opt.belly || C.STEEL;
  const eye = opt.eye || C.RED;
  const size = opt.size || 1;         // 0 = small (rat), 1 = wolf-sized
  const tail = opt.tail !== false;
  const ears = opt.ears !== false;

  const mk = (frame) => drawnSprite(16, 16, (c) => {
    if (size === 0) {
      // small critter
      _r(c, 4, 9, 8, 4, body);
      _r(c, 11, 8, 3, 3, body);                    // head
      _px(c, 13, 9, eye);
      if (tail) { _r(c, 1, 9, 3, 1, body); _px(c, 0, 8, body); }
      const legY = 13;
      if (frame) { _r(c, 5, legY, 1, 2, body); _r(c, 9, legY, 1, 2, body); }
      else { _r(c, 6, legY, 1, 2, body); _r(c, 10, legY, 1, 2, body); }
      if (ears) _px(c, 12, 7, body);
    } else {
      // wolf-sized
      _r(c, 3, 7, 9, 5, body);
      _r(c, 10, 5, 4, 4, body);                    // head
      _r(c, 13, 7, 2, 2, body);                    // snout
      _px(c, 12, 6, eye);
      if (ears) { _px(c, 10, 4, body); _px(c, 12, 4, body); }
      _r(c, 4, 11, 8, 1, belly);
      if (tail) { _r(c, 1, 5, 2, 2, body); _px(c, 2, 7, body); }
      const legY = 12;
      if (frame) {
        _r(c, 4, legY, 2, 3, body); _r(c, 10, legY, 2, 3, body);
      } else {
        _r(c, 5, legY, 2, 3, body); _r(c, 9, legY, 2, 3, body);
      }
    }
  });

  const left0 = mk(0), left1 = mk(1);
  const flip = (img) => drawnSprite(16, 16, (c) => {
    c.translate(16, 0); c.scale(-1, 1); c.drawImage(img, 0, 0);
  });
  const right = [flip(left0), flip(left1)];
  return { down: [left0, left1], up: right, left: [left0, left1], right };
}

// Blob/slime — a classic. Same sprite-set shape.
function blobSprites(opt) {
  const body = opt.body || C.GREEN;
  const hi = opt.hi || C.WHITE;
  const mk = (frame) => drawnSprite(16, 16, (c) => {
    const squish = frame ? 1 : 0;
    _r(c, 4, 8 + squish, 8, 6 - squish, body);
    _r(c, 3, 10 + squish, 10, 4 - squish, body);
    _r(c, 5, 7 + squish, 6, 1, body);
    _px(c, 6, 10 + squish, C.VOID); _px(c, 9, 10 + squish, C.VOID);
    _px(c, 5, 8 + squish, hi);
  });
  const a = mk(0), b = mk(1);
  return { down: [a, b], up: [a, b], left: [a, b], right: [a, b] };
}

// Skeleton — walking bones. Same sprite-set shape as charSprites.
function skeletonSprites(opt) {
  opt = opt || {};
  const bone = opt.bone || C.WHITE;
  const dark = opt.dark || C.STEEL;
  const eye = opt.eye || C.RED;
  const mk = (frame) => drawnSprite(16, 16, (c) => {
    _r(c, 5, 2, 6, 5, bone);                       // skull
    _px(c, 6, 4, C.VOID); _px(c, 9, 4, C.VOID);
    _px(c, 6, 4, eye); _px(c, 9, 4, eye);
    _r(c, 6, 6, 4, 1, dark);                       // jaw
    _r(c, 7, 7, 2, 1, bone);                       // neck
    _r(c, 5, 8, 6, 1, bone);                       // shoulders
    _r(c, 7, 8, 2, 4, bone);                       // spine
    _r(c, 5, 9, 6, 1, dark); _r(c, 5, 11, 6, 1, dark);   // ribs
    _px(c, 4, 9, bone); _px(c, 11, 9, bone);       // arms
    _px(c, 4, 10, bone); _px(c, 11, 10, bone);
    if (frame) {
      _r(c, 5, 12, 2, 3, bone); _r(c, 9, 12, 2, 2, bone);
      _px(c, 9, 14, dark);
    } else {
      _r(c, 5, 12, 2, 2, bone); _r(c, 9, 12, 2, 3, bone);
      _px(c, 5, 14, dark);
    }
  });
  const a = mk(0), b = mk(1);
  return { down: [a, b], up: [a, b], left: [a, b], right: [a, b] };
}

// Spider — round body, legs, too many eyes.
function spiderSprites(opt) {
  opt = opt || {};
  const body = opt.body || C.VOID;
  const mark = opt.mark || C.PURPLE;
  const eye = opt.eye || C.RED;
  const small = opt.size === 0;
  const mk = (frame) => drawnSprite(16, 16, (c) => {
    if (small) {
      _r(c, 6, 9, 4, 3, body);
      _px(c, 6, 10 + (frame ? 1 : 0), eye);
      const ly = 12;
      _px(c, 4, ly - (frame ? 1 : 0), body); _px(c, 11, ly - (frame ? 0 : 1), body);
      _px(c, 5, ly, body); _px(c, 10, ly, body);
    } else {
      _r(c, 4, 7, 8, 6, body);
      _r(c, 6, 5, 4, 3, body);                      // head
      _px(c, 6, 6, eye); _px(c, 8, 6, eye); _px(c, 7, 7, eye);
      _r(c, 6, 9, 4, 2, mark);                      // abdomen mark
      // legs (alternate)
      for (let i = 0; i < 4; i++) {
        const off = frame ? (i % 2) : ((i + 1) % 2);
        _px(c, 2, 7 + i * 2 - off, body); _px(c, 3, 8 + i * 2 - off, body);
        _px(c, 13, 7 + i * 2 - off, body); _px(c, 12, 8 + i * 2 - off, body);
      }
    }
  });
  const a = mk(0), b = mk(1);
  return { down: [a, b], up: [a, b], left: [a, b], right: [a, b] };
}

// Convenience presets used before the content pass fills in real cast data.
const SPRITE_PRESETS = {
  hero:    () => charSprites({ hair: C.WOOD, tunic: C.BLUE, trim: C.YELLOW }),
  guard:   () => charSprites({ helmet: C.STEEL, tunic: C.SLATE, trim: C.RED }),
  mage:    () => charSprites({ hood: C.PURPLE, robe: true, tunic: C.PURPLE }),
  villager: () => charSprites({ hair: C.ORANGE, tunic: C.DGREEN, pants: C.BROWN }),
};
