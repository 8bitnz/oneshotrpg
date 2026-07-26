// scene.js — scene/state stack. Top scene updates & renders; scenes may be
// transparent (render the one below first, e.g. dialogue over the map).
'use strict';

// Full-screen fade used for map/scene changes. update/render hooked in main.
const Transition = {
  t: 0, phase: null, fn: null, speed: 6,
  start(fn, speed) {
    if (this.phase) { if (fn) fn(); return; }   // don't stack fades
    this.fn = fn; this.phase = 'out'; this.t = 0; this.speed = speed || 6;
  },
  update(dt) {
    if (!this.phase) return;
    this.t += dt * this.speed;
    if (this.phase === 'out' && this.t >= 1) {
      if (this.fn) this.fn();
      this.fn = null;
      this.phase = 'in'; this.t = 0;
    } else if (this.phase === 'in' && this.t >= 1) {
      this.phase = null;
    }
  },
  render() {
    if (!this.phase) return;
    const a = this.phase === 'out' ? clamp(this.t, 0, 1) : clamp(1 - this.t, 0, 1);
    Gfx.ctx.fillStyle = `rgba(8,5,12,${a.toFixed(3)})`;
    Gfx.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  },
  active() { return !!this.phase; },
};

const Scenes = {
  stack: [],

  push(scene) {
    if (this.top() && this.top().pause) this.top().pause();
    this.stack.push(scene);
    if (scene.enter) scene.enter();
  },

  pop(result) {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    const t = this.top();
    if (t) {
      if (t.resume) t.resume(result);
    } else {
      // Never leave an empty stack (stale deferred pops, worst-case bugs).
      this.stack.push(new TitleScene());
      if (this.top().enter) this.top().enter();
    }
    return s;
  },

  replace(scene) {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    this.stack.push(scene);
    if (scene.enter) scene.enter();
  },

  reset(scene) {
    while (this.stack.length) {
      const s = this.stack.pop();
      if (s && s.exit) s.exit();
    }
    this.push(scene);
  },

  top() { return this.stack[this.stack.length - 1]; },

  update(dt) {
    const t = this.top();
    if (t) t.update(dt);
  },

  render() {
    if (!this.stack.length) { Gfx.clear(C.VOID); return; }
    // Find deepest opaque scene, render up from there.
    let i = this.stack.length - 1;
    while (i > 0 && this.stack[i].transparent) i--;
    for (; i < this.stack.length; i++) this.stack[i].render();
  },
};
