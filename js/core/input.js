// input.js — keyboard-first input with named actions, plus mouse for menus.
'use strict';

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'confirm', Enter: 'confirm', Space: 'confirm',
  KeyX: 'cancel', Escape: 'cancel', Backspace: 'cancel',
  KeyC: 'menu', Tab: 'menu',
  KeyQ: 'prev', KeyE: 'next',
  KeyM: 'map',
  KeyJ: 'journal',
  F9: 'debug',
};

const Input = {
  held: {},        // action -> bool
  hit: {},         // action -> pressed this frame
  mouseX: -1, mouseY: -1,
  mouseHit: false, mouseHeld: false, mouseMoved: false,
  typed: '',       // text typed this frame (for name entry)
  anyHit: false,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) { e.preventDefault(); return; }
      Audio.unlock();
      const act = KEYMAP[e.code];
      if (act) {
        if (!this.held[act]) this.hit[act] = true;
        this.held[act] = true;
        this.anyHit = true;
        e.preventDefault();
      }
      // Text entry capture (letters, digits, space handled via code above)
      if (e.key.length === 1) this.typed += e.key;
      if (e.code === 'Backspace') this.typed += '\b';
    });
    window.addEventListener('keyup', (e) => {
      const act = KEYMAP[e.code];
      if (act) { this.held[act] = false; e.preventDefault(); }
    });
    window.addEventListener('blur', () => { this.held = {}; });

    const toInternal = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.floor((e.clientX - r.left) / Gfx.scale),
        y: Math.floor((e.clientY - r.top) / Gfx.scale),
      };
    };
    canvas.addEventListener('mousemove', (e) => {
      const p = toInternal(e);
      if (p.x !== this.mouseX || p.y !== this.mouseY) this.mouseMoved = true;
      this.mouseX = p.x; this.mouseY = p.y;
    });
    canvas.addEventListener('mousedown', (e) => {
      Audio.unlock();
      const p = toInternal(e);
      this.mouseX = p.x; this.mouseY = p.y;
      this.mouseHit = true; this.mouseHeld = true;
      this.anyHit = true;
      e.preventDefault();
    });
    window.addEventListener('mouseup', () => { this.mouseHeld = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  pressed(act) { return !!this.hit[act]; },
  down(act) { return !!this.held[act]; },

  // Consume a press so lower scenes don't also react.
  eat(act) { this.hit[act] = false; },

  mouseIn(x, y, w, h) {
    return this.mouseX >= x && this.mouseX < x + w &&
           this.mouseY >= y && this.mouseY < y + h;
  },

  clicked(x, y, w, h) { return this.mouseHit && this.mouseIn(x, y, w, h); },

  endFrame() {
    this.hit = {};
    this.mouseHit = false;
    this.mouseMoved = false;
    this.typed = '';
    this.anyHit = false;
  },
};
