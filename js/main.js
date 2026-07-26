// main.js — boot + fixed-timestep loop.
'use strict';

const DEBUG = { fps: 0, frames: 0, acc: 0, show: false };

function frame(dt) {
  if (Input.pressed('debug')) DEBUG.show = !DEBUG.show;
  if (!Transition.active()) Scenes.update(dt);
  Transition.update(dt);
  Gfx.updateShake(dt);
  Audio.update(dt);
  Scenes.render();
  Transition.render();
  Input.endFrame();

  DEBUG.frames++; DEBUG.acc += dt;
  if (DEBUG.acc >= 1) { DEBUG.fps = DEBUG.frames; DEBUG.frames = 0; DEBUG.acc -= 1; }
}

function boot() {
  Gfx.init();
  Input.init(Gfx.canvas);
  loadOptions();

  Game.world = generateWorld();
  Scenes.push(new TitleScene());

  let last = performance.now();
  function tick(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;   // tab-switch guard
    frame(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Scripted-harness hooks: drive deterministic frames and simulate input from
// automated playtests (used because hidden preview tabs never fire rAF).
const EV_TEST = {
  step(n, dt) { for (let i = 0; i < (n || 1); i++) frame(dt || 1 / 60); },
  key(act) { Input.hit[act] = true; },
  hold(act, on) { Input.held[act] = on === undefined ? true : !!on; },
  shot(name) {
    return fetch('/__shot?name=' + (name || 'shot'), {
      method: 'POST', body: Gfx.canvas.toDataURL('image/png'),
    }).then(r => r.text());
  },
  // Skip title/creation for scripted playtests.
  quickStart(clsId, withParty) {
    Game.startRun(makeHero('Tester', clsId || 'fighter'));
    if (withParty) for (const id of ['bram', 'wren', 'maro', 'sela']) {
      if (id !== 'hero') Game.recruit(id);
    }
    Game.party = Game.party.slice(0, 4);
    Scenes.reset(new WorldScene(Game.world));
    return Game.party.map(m => m.name + ' ' + m.cls);
  },
};

window.addEventListener('load', boot);
