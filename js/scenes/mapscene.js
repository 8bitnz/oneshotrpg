// mapscene.js — tile map container + walkable map scene with camera,
// tweened grid movement, and layered rendering. Overworld, towns and
// dungeons all specialize this.
'use strict';

class GameMap {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.ground = new Uint8Array(w * h);
    this.obj = new Uint8Array(w * h);
  }
  idx(x, y) { return y * this.w + x; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  g(x, y) { return this.inBounds(x, y) ? this.ground[this.idx(x, y)] : GT.VOID; }
  o(x, y) { return this.inBounds(x, y) ? this.obj[this.idx(x, y)] : OT.NONE; }
  setG(x, y, t) { if (this.inBounds(x, y)) this.ground[this.idx(x, y)] = t; }
  setO(x, y, t) { if (this.inBounds(x, y)) this.obj[this.idx(x, y)] = t; }
  groundDef(x, y) { return GROUND[this.g(x, y)]; }
  objDef(x, y) { const o = this.o(x, y); return o ? OBJ[o] : null; }
  walkable(x, y) {
    if (!this.inBounds(x, y)) return false;
    const g = GROUND[this.g(x, y)];
    if (!g || !g.walk) return false;
    const o = this.o(x, y);
    if (o) { const od = OBJ[o]; if (od && !od.walk) return false; }
    return true;
  }
  fillRect(x, y, w, h, gt) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.setG(i, j, gt);
  }
  objRect(x, y, w, h, ot) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.setO(i, j, ot);
  }
}

const STEP_TIME = 0.14;   // seconds per tile step

class Walker {
  constructor(x, y, sprites) {
    this.x = x; this.y = y;           // tile coords
    this.px = x * TILE; this.py = y * TILE;
    this.dir = 'down';
    this.moving = false;
    this.tx = x; this.ty = y;
    this.t = 0;
    this.sprites = sprites;
    this.animT = 0;
    this.stepParity = 0;
  }

  tryStep(dir, map) {
    if (this.moving) return false;
    this.dir = dir;
    const d = DIRS[dir];
    const nx = this.x + d.dx, ny = this.y + d.dy;
    if (!map.walkable(nx, ny)) return false;
    this.forceStep(dir);
    return true;
  }

  // Step without a walkability check (the scene already decided).
  forceStep(dir) {
    this.dir = dir;
    const d = DIRS[dir];
    this.tx = this.x + d.dx;
    this.ty = this.y + d.dy;
    this.moving = true;
    this.t = 0;
    this.stepParity ^= 1;
  }

  update(dt, slowMult) {
    if (this.moving) {
      this.t += dt / (STEP_TIME * (slowMult || 1));
      if (this.t >= 1) {
        this.x = this.tx; this.y = this.ty;
        this.px = this.x * TILE; this.py = this.y * TILE;
        this.moving = false;
        return true;   // arrived at a new tile
      }
      this.px = lerp(this.x * TILE, this.tx * TILE, this.t);
      this.py = lerp(this.y * TILE, this.ty * TILE, this.t);
    }
    return false;
  }

  frame() {
    const frames = this.sprites[this.dir];
    if (!this.moving) return frames[0];
    return frames[this.stepParity ^ (this.t > 0.5 ? 1 : 0)];
  }
}

class MapScene {
  constructor(map, player) {
    this.map = map;
    this.player = player;
    this.camX = 0; this.camY = 0;
    this.entities = [];       // NPCs etc: {walker, ...}
    this.t = 0;
    this.moveHeld = 0;
    this.interactCd = 0;      // grace so closing a dialogue doesn't reopen it
  }

  enter() {}

  resume() { this.interactCd = 0.25; }

  // Direction currently held, favoring the most recent axis pressed.
  heldDir() {
    for (const d of DIR_LIST) if (Input.pressed(d)) return d;
    for (const d of DIR_LIST) if (Input.down(d)) return d;
    return null;
  }

  update(dt) {
    this.t += dt;
    const p = this.player;
    const arrived = p.update(dt, this.slowAt(p.x, p.y));
    if (arrived) this.onArrive(p.x, p.y);
    if (!p.moving) {
      const dir = this.heldDir();
      if (dir) {
        const before = { x: p.x, y: p.y };
        const nx = p.x + DIRS[dir].dx, ny = p.y + DIRS[dir].dy;
        if (this.entityAt(nx, ny)) {
          p.dir = dir;                     // face them, don't overlap them
          this.onBlocked(nx, ny, dir);
        } else if (this.canWalk(nx, ny)) {
          p.forceStep(dir);
          Audio.sfx('step');
          this.onStep(before, dir);
        } else {
          p.dir = dir;
          this.onBlocked(nx, ny, dir);
        }
      }
    }
    for (const e of this.entities) this.updateEntity(e, dt);
    this.updateCamera();
    if (this.interactCd > 0) this.interactCd -= dt;
    else if (Input.pressed('confirm')) this.interact();
  }

  updateEntity(e, dt) { e.walker.update(dt, 1); }

  entityAt(x, y) {
    return this.entities.find(e => (e.walker.x === x && e.walker.y === y) ||
      (e.walker.moving && e.walker.tx === x && e.walker.ty === y)) || null;
  }
  onStep(from, dir) {}
  onArrive(x, y) {}
  onBlocked(x, y, dir) { Audio.sfx('bump'); }
  canWalk(x, y) { return this.map.walkable(x, y); }
  interact() {}
  slowAt(x, y) {
    const g = this.map.groundDef(x, y);
    const o = this.map.objDef(x, y);
    return 1 + ((g && g.slow) || 0) + ((o && o.slow) || 0);
  }

  updateCamera() {
    const p = this.player;
    let cx = Math.round(p.px + TILE / 2 - VIEW_W / 2);
    let cy = Math.round(p.py + TILE / 2 - VIEW_H / 2);
    this.camX = clamp(cx, 0, Math.max(0, this.map.w * TILE - VIEW_W));
    this.camY = clamp(cy, 0, Math.max(0, this.map.h * TILE - VIEW_H));
  }

  render() {
    Gfx.clear(C.VOID);
    const ox = this.camX - Gfx.shakeX, oy = this.camY - Gfx.shakeY;
    const x0 = Math.floor(ox / TILE), y0 = Math.floor(oy / TILE);
    const x1 = Math.ceil((ox + VIEW_W) / TILE), y1 = Math.ceil((oy + VIEW_H) / TILE);
    const c = Gfx.ctx;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const g = GROUND[this.map.g(tx, ty)];
        if (g) c.drawImage(tileFrame(g.spr, this.t), tx * TILE - ox, ty * TILE - oy);
        const o = this.map.o(tx, ty);
        if (o) {
          const od = OBJ[o];
          if (od) c.drawImage(tileFrame(od.spr, this.t), tx * TILE - ox, ty * TILE - oy);
        }
      }
    }
    this.renderEntities(ox, oy);
    this.renderOverlay(ox, oy);
  }

  renderEntities(ox, oy) {
    const list = [...this.entities.map(e => e.walker), this.player];
    list.sort((a, b) => a.py - b.py);
    for (const w of list) {
      Gfx.ctx.drawImage(w.frame(), Math.round(w.px - ox), Math.round(w.py - oy - 1));
    }
  }

  renderOverlay(ox, oy) {}
}
