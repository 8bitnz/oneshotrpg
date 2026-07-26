// combat.js — the tactical battle screen. Grid on the left, unit card and
// menus on the right, log along the bottom, turn queue up top.
'use strict';

const BGX = 8, BGY = 20;            // grid origin on screen
const BCELL = 16;

// Battle terrain recipes per overworld biome.
const BATTLE_BIOMES = {
  field:  { ground: [GT.GRASS], deco: [[OT.TREE, 1, 1], [OT.BUSH, 0, 1], [OT.ROCK, 0, 1]], count: [5, 8] },
  forest: { ground: [GT.GRASS], deco: [[OT.TREE, 1, 1], [OT.PINES, 1, 1], [OT.BUSH, 0, 1]], count: [8, 11] },
  desert: { ground: [GT.DESERT], deco: [[OT.CACTUS, 1, 1], [OT.ROCK, 0, 1], [OT.BONES, 0, 0]], count: [4, 7] },
  swamp:  { ground: [GT.SWAMP], deco: [[OT.DEADTREE, 1, 1], [OT.MUSHROOM, 0, 0]], count: [5, 8], water: GT.WATER_T, waterCount: [3, 6] },
  snow:   { ground: [GT.SNOW], deco: [[OT.SNOWTREE, 1, 1], [OT.ROCK, 0, 1]], count: [5, 8] },
  cave:   { ground: [GT.DFLOOR], deco: [[OT.RUBBLE, 0, 0], [OT.PILLAR, 1, 1], [OT.ROCK, 0, 1]], count: [5, 8] },
  sea:    { ground: [GT.SAND], deco: [[OT.ROCK, 0, 1], [OT.BONES, 0, 0]], count: [2, 4], water: GT.WATER_T, waterCount: [7, 11] },
};

function biomeForTile(gt, hasTrees) {
  switch (gt) {
    case GT.DESERT: case GT.SAND: return 'desert';
    case GT.SWAMP: return 'swamp';
    case GT.SNOW: return 'snow';
    case GT.DFLOOR: return 'cave';
    default: return hasTrees ? 'forest' : 'field';
  }
}

class BattleScene {
  // opts: {enemies: [typeIds], biome, boss?: bool, intro?: string}
  constructor(opts) {
    this.opts = opts;
    this.units = [];
    this.blocked = [];     // movement blockers
    this.sight = [];       // sight blockers
    this.deco = [];
    this.groundArt = [];
    this.log = [];
    this.floats = [];      // damage numbers {x,y,txt,color,t,big}
    this.flashes = [];     // cell flashes {x,y,t}
    this.bolts = [];       // projectiles {x0,y0,x1,y1,t,dur,color}
    this.queue = [];       // animation steps
    this.state = 'intro';
    this.stateT = 0;
    this.round = 0;
    this.order = [];
    this.orderIdx = 0;
    this.cursor = { x: 0, y: 0 };
    this.menuIdx = 0;
    this.subIdx = 0;
    this.reach = null;
    this.targeting = null; // {ability|attack, cells, validTargets, idx}
    this.t = 0;
    this.result = null;
    this.moved = false;
  }

  enter() {
    this.buildTerrain();
    // party
    const spots = [[1, 2], [1, 4], [2, 3], [2, 5], [1, 3], [2, 2]];
    let si = 0;
    for (const u of Game.party) {
      if (u.hp <= 0) { u.downed = true; continue; }
      u.downed = false; u.defending = false; u.statuses = [];
      const s = this.freeSpot(spots, si++);
      u.x = s[0]; u.y = s[1]; u.facing = 'right';
      this.units.push(u);
    }
    // enemies
    const espots = [[10, 2], [10, 4], [9, 3], [9, 5], [10, 3], [9, 2], [10, 5], [9, 4]];
    let ei = 0;
    for (const id of this.opts.enemies) {
      const e = makeEnemy(id);
      const s = this.freeSpot(espots, ei++);
      e.x = s[0]; e.y = s[1]; e.facing = 'left';
      this.units.push(e);
    }
    this.addLog(this.opts.intro || 'Enemies close in!', C.RED);
    Audio.playMusic('combat');
  }

  exit() { /* the scene below re-asserts its own theme in resume() */ }

  freeSpot(list, i) {
    for (let k = 0; k < list.length; k++) {
      const s = list[(i + k) % list.length];
      if (!this.blocked[s[1]][s[0]] && !unitAt(this.units, s[0], s[1])) return s;
    }
    for (let y = 0; y < BGRID_H; y++) for (let x = 0; x < BGRID_W; x++) {
      if (!this.blocked[y][x] && !unitAt(this.units, x, y)) return [x, y];
    }
    return [0, 0];
  }

  buildTerrain() {
    const recipe = BATTLE_BIOMES[this.opts.biome] || BATTLE_BIOMES.field;
    for (let y = 0; y < BGRID_H; y++) {
      this.blocked.push(new Array(BGRID_W).fill(false));
      this.sight.push(new Array(BGRID_W).fill(false));
      this.groundArt.push(new Array(BGRID_W).fill(recipe.ground[0]));
    }
    const nDeco = rng.i(recipe.count[0], recipe.count[1]);
    for (let i = 0; i < nDeco; i++) {
      const x = rng.i(3, BGRID_W - 4), y = rng.i(0, BGRID_H - 1);
      if (this.blocked[y][x]) continue;
      const [obj, blockMove, blockSight] = rng.pick(recipe.deco);
      this.deco.push({ x, y, obj });
      if (blockMove || true) this.blocked[y][x] = true;   // all deco blocks movement
      if (blockSight) this.sight[y][x] = true;
    }
    if (recipe.water) {
      const n = rng.i(recipe.waterCount[0], recipe.waterCount[1]);
      for (let i = 0; i < n; i++) {
        const x = rng.i(3, BGRID_W - 4), y = rng.i(0, BGRID_H - 1);
        if (this.blocked[y][x]) continue;
        this.groundArt[y][x] = recipe.water;
        this.blocked[y][x] = true;   // water blocks movement, not sight
      }
    }
  }

  addLog(txt, color) {
    this.log.push({ txt, color: color || PAL.TEXT });
    if (this.log.length > 40) this.log.shift();
  }

  // --- animation queue -------------------------------------------------------
  push(step) { this.queue.push(step); }
  pushWait(dur) { this.push({ dur }); }
  pushCall(fn) { this.push({ dur: 0, start: fn }); }

  runQueue(nextState) {
    this.afterAnim = nextState;
    this.state = 'anim';
  }

  updateAnim(dt) {
    if (!this.queue.length) {
      const n = this.afterAnim;
      this.afterAnim = null;
      if (typeof n === 'function') n(); else this.state = n || 'nextTurn';
      return;
    }
    const s = this.queue[0];
    if (s.t === undefined) { s.t = 0; if (s.start) s.start(); }
    s.t += dt;
    if (s.update) s.update(clamp(s.t / (s.dur || 0.0001), 0, 1));
    if (s.t >= (s.dur || 0)) {
      if (s.end) s.end();
      this.queue.shift();
    }
  }

  // --- turn management ---------------------------------------------------
  aliveParty() { return this.units.filter(u => !u.isEnemy && !u.downed); }
  aliveEnemies() { return this.units.filter(u => u.isEnemy && !u.downed); }

  nextTurn() {
    if (this.checkEnd()) return;
    while (true) {
      if (this.orderIdx >= this.order.length) {
        this.round++;
        this.order = initiativeOrder(this.units);
        this.orderIdx = 0;
        if (this.round > 1) this.addLog(`— Round ${this.round} —`, PAL.TEXT_DIM);
      }
      const u = this.order[this.orderIdx];
      if (!u || u.downed) { this.orderIdx++; continue; }
      this.active = u;
      break;
    }
    const u = this.active;
    u.defending = false;
    // status ticks
    let skip = false;
    for (const st of u.statuses.slice()) {
      if (st.id === 'poison') {
        const d = Math.max(1, st.power || 2);
        this.hurt(u, d, { poison: true });
        this.addLog(`${u.name} suffers the venom (${d}).`, C.GREEN);
      }
      if (st.id === 'stun') { skip = true; this.addLog(`${u.name} is stunned!`, C.YELLOW); }
      st.turns--;
      if (st.turns <= 0) u.statuses.splice(u.statuses.indexOf(st), 1);
    }
    if (u.downed) { this.orderIdx++; this.nextTurn(); return; }
    if (skip) { this.orderIdx++; this.runQueue('nextTurn'); this.pushWait(0.35); return; }
    if (u.isEnemy) {
      this.state = 'enemyThink';
      this.stateT = 0;
    } else {
      this.moved = false;
      this.reach = reachableCells(this.blocked, this.units, u);
      this.cursor = { x: u.x, y: u.y };
      this.state = 'move';
      this.menuIdx = 0;
    }
  }

  endTurn() {
    this.orderIdx++;
    if (!this.checkEnd()) this.nextTurn();
  }

  checkEnd() {
    if (!this.aliveEnemies().length && this.state !== 'victory') {
      this.doVictory(); return true;
    }
    if (!this.aliveParty().length && this.state !== 'defeat') {
      this.state = 'defeat'; this.stateT = 0;
      Audio.playMusic('gameover'); Audio.sfx('die');
      return true;
    }
    return false;
  }

  doVictory() {
    let xp = 0, gold = 0;
    for (const u of this.units) {
      if (u.isEnemy) { xp += u.xp; gold += rng.i(u.gold[0], u.gold[1]); }
    }
    this.reward = { xp, gold, ups: [] };
    Game.gold += gold;
    // XP to each member; the fallen earn half and limp on at 1 HP
    for (const u of Game.party) {
      const share = (u.downed || u.hp <= 0) ? Math.floor(xp / 2) : xp;
      if (u.downed || u.hp <= 0) { u.hp = 1; u.downed = false; }
      u.statuses = []; u.defending = false;
      const ups = gainXp(u, share);
      for (const up of ups) {
        this.reward.ups.push({ name: u.name, level: up.level, learned: up.learned });
      }
    }
    if (this.opts.onWin) this.opts.onWin();
    this.state = 'victory';
    this.stateT = 0;
    Audio.playMusic('victory');
    Audio.sfx('levelup');
  }

  // --- combat actions -----------------------------------------------------
  hurt(u, dmg, opts) {
    u.hp = Math.max(0, u.hp - dmg);
    this.floats.push({
      x: u.x, y: u.y, txt: String(dmg), t: 0,
      color: (opts && opts.crit) ? C.YELLOW : (opts && opts.heal) ? C.GREEN : C.WHITE,
      big: opts && opts.crit,
    });
    if (!(opts && opts.poison)) this.flashes.push({ x: u.x, y: u.y, t: 0 });
    if (u.hp <= 0 && !u.downed) {
      u.downed = true;
      this.addLog(u.isEnemy ? `${u.name} falls.` : `${u.name} is down!`, u.isEnemy ? PAL.TEXT_DIM : C.RED);
      Audio.sfx('die');
    }
  }

  heal(u, amt) {
    u.hp = Math.min(u.maxHp, u.hp + amt);
    this.floats.push({ x: u.x, y: u.y, txt: '+' + amt, t: 0, color: C.GREEN });
  }

  faceToward(u, tx, ty) {
    const dx = tx - u.x, dy = ty - u.y;
    if (Math.abs(dx) >= Math.abs(dy)) u.facing = dx >= 0 ? 'right' : 'left';
    else u.facing = dy >= 0 ? 'down' : 'up';
  }

  animMove(u, path) {
    for (const step of path) {
      this.push({
        dur: 0.07,
        start: () => { this.faceToward(u, step.x, step.y); Audio.sfx('step'); },
        end: () => { u.x = step.x; u.y = step.y; },
      });
    }
  }

  animAttack(att, tgt) {
    this.push({
      dur: 0.22,
      start: () => {
        this.faceToward(att, tgt.x, tgt.y);
        const r = rollPhys(att, tgt, 0);
        att._lunge = { tx: tgt.x, ty: tgt.y };
        if (r.miss) {
          this.floats.push({ x: tgt.x, y: tgt.y, txt: 'MISS', t: 0, color: C.STEEL });
          Audio.sfx('miss');
          this.addLog(`${att.name} misses ${tgt.name}.`, PAL.TEXT_DIM);
        } else {
          const fl = r.flank === 'back' ? ' From behind!' : r.flank === 'side' ? ' Flanked!' : '';
          this.addLog(`${att.name} hits ${tgt.name} for ${r.dmg}${r.crit ? '. CRITICAL!' : '.'}${fl}`,
            att.isEnemy ? C.ORANGE : PAL.TEXT);
          this.hurt(tgt, r.dmg, { crit: r.crit });
          if (att.poisonBite && !tgt.downed && rng.chance(0.45)) {
            addStatus(tgt, { id: 'poison', turns: 2, power: 3 });
            this.addLog(`${tgt.name} is poisoned!`, C.GREEN);
          }
          Audio.sfx(r.crit ? 'crit' : 'hit');
          Gfx.shake(r.crit ? 3 : 1.5, 0.15);
        }
      },
      end: () => { att._lunge = null; },
    });
    this.pushWait(0.16);
  }

  animAbility(u, abId, tx, ty) {
    const ab = ABILITIES[abId];
    this.push({
      dur: 0.12,
      start: () => {
        u.mp = Math.max(0, u.mp - ab.mp);
        this.faceToward(u, tx, ty);
        this.addLog(`${u.name} uses ${ab.name}!`, u.isEnemy ? C.ORANGE : C.CYAN);
        Audio.sfx(ab.sfx || 'magic');
      },
    });
    if (ab.range > 1 && (ab.fx === 'bolt' || ab.fx === 'burst')) {
      this.push({
        dur: 0.18,
        start: () => {
          this.bolts.push({
            x0: u.x, y0: u.y, x1: tx, y1: ty, t: 0, dur: 0.18,
            color: ab.kind === 'heal' ? C.GREEN : ab.fx === 'burst' ? C.ORANGE : C.CYAN,
          });
        },
      });
    }
    this.push({
      dur: 0.24,
      start: () => {
        if (hasStatus(u, 'silence')) {
          this.addLog('...but the words will not come!', C.PURPLE);
          return;
        }
        // Revive targets the fallen directly.
        if (ab.kind === 'revive') {
          const v = this.units.find(w => w.downed && w.x === tx && w.y === ty);
          if (v) {
            v.downed = false;
            v.hp = Math.max(1, Math.round(v.maxHp * 0.35));
            this.floats.push({ x: v.x, y: v.y, txt: 'UP!', t: 0, color: C.YELLOW });
            this.addLog(`${v.name} rises again!`, C.YELLOW);
          }
          return;
        }
        const cells = shapeCells(ab.shape, tx, ty, u);
        let any = false, drained = 0;
        for (const c of cells) {
          if (ab.fx === 'burst') this.flashes.push({ x: c.x, y: c.y, t: 0 });
          const v = unitAt(this.units, c.x, c.y);
          if (!v || v === u) continue;
          any = true;
          if (ab.kind === 'heal') {
            if (v.isEnemy === u.isEnemy) {
              const amt = rollHeal(u, ab);
              this.heal(v, amt);
              this.addLog(`${v.name} recovers ${amt}.`, C.GREEN);
            }
          } else if (ab.kind === 'buff' || ab.kind === 'debuff') {
            if (ab.status && rng.f() < (ab.statusChance === undefined ? 1 : ab.statusChance)) {
              addStatus(v, ab.status);
              this.addLog(`${v.name}: ${STATUS_DEFS[ab.status.id].name}`, STATUS_DEFS[ab.status.id].color());
              this.floats.push({ x: v.x, y: v.y, txt: STATUS_DEFS[ab.status.id].name, t: 0, color: STATUS_DEFS[ab.status.id].color() });
            }
          } else {
            const hits = ab.hits || 1;
            for (let h = 0; h < hits; h++) {
              if (v.downed) break;
              const r = ab.kind === 'magic' ? rollMagic(u, v, ab) : rollPhys(u, v, ab.pow, { execute: ab.execute });
              if (r.miss) {
                this.floats.push({ x: v.x, y: v.y, txt: 'MISS', t: 0, color: C.STEEL });
              } else {
                this.addLog(`${ab.name} hits ${v.name} for ${r.dmg}.`, u.isEnemy ? C.ORANGE : PAL.TEXT);
                this.hurt(v, r.dmg, { crit: r.crit });
                if (ab.drain) drained += r.dmg;
                if (ab.status && rng.f() < (ab.statusChance || 0)) {
                  addStatus(v, ab.status);
                  this.addLog(`${v.name}: ${STATUS_DEFS[ab.status.id].name}`, STATUS_DEFS[ab.status.id].color());
                }
              }
            }
            Gfx.shake(1.5, 0.12);
          }
        }
        // Self-buff shapes (self/ring buffs) also hit the caster's own cell.
        if ((ab.shape === 'self') && (ab.kind === 'buff') && ab.status) {
          addStatus(u, ab.status);
          this.floats.push({ x: u.x, y: u.y, txt: STATUS_DEFS[ab.status.id].name, t: 0, color: STATUS_DEFS[ab.status.id].color() });
          any = true;
        }
        if (drained > 0) {
          const back = Math.round(drained / 2);
          this.heal(u, back);
          this.addLog(`${u.name} drinks the stolen life (+${back}).`, C.PURPLE);
        }
        if (!any && ab.kind !== 'buff') this.addLog('...it hits nothing.', PAL.TEXT_DIM);
      },
    });
    this.pushWait(0.15);
  }

  // --- player input ------------------------------------------------------
  update(dt) {
    this.t += dt;
    this.stateT += dt;
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 0.8);
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter(f => f.t < 0.18);
    for (const b of this.bolts) b.t += dt;
    this.bolts = this.bolts.filter(b => b.t < b.dur);

    switch (this.state) {
      case 'intro':
        if (this.stateT > 0.8 || Input.pressed('confirm')) { this.nextTurn(); }
        break;
      case 'anim': this.updateAnim(dt); break;
      case 'move': this.updateMove(); break;
      case 'menu': this.updateMenu(); break;
      case 'skills': this.updateSkills(); break;
      case 'items': this.updateItems(); break;
      case 'target': this.updateTarget(); break;
      case 'enemyThink':
        if (this.stateT > 0.3) this.doEnemyTurn();
        break;
      case 'victory':
        if (this.stateT > 0.5 && (Input.pressed('confirm') || Input.pressed('cancel'))) {
          Input.eat('confirm');
          Scenes.pop({ victory: true });
        }
        break;
      case 'defeat':
        if (this.stateT > 1.2 && Input.pressed('confirm')) {
          Scenes.reset(new GameOverScene());
        }
        break;
      case 'nextTurn': this.nextTurn(); break;
    }
  }

  cellClicked() {
    if (!Input.mouseHit) return null;
    const cx = Math.floor((Input.mouseX - BGX) / BCELL);
    const cy = Math.floor((Input.mouseY - BGY) / BCELL);
    if (cx < 0 || cy < 0 || cx >= BGRID_W || cy >= BGRID_H) return null;
    return { x: cx, y: cy };
  }
  cellHover() {
    if (!Input.mouseMoved) return null;
    const cx = Math.floor((Input.mouseX - BGX) / BCELL);
    const cy = Math.floor((Input.mouseY - BGY) / BCELL);
    if (cx < 0 || cy < 0 || cx >= BGRID_W || cy >= BGRID_H) return null;
    return { x: cx, y: cy };
  }

  updateMove() {
    const u = this.active;
    this.moveCursor();
    const hov = this.cellHover();
    if (hov) this.cursor = hov;
    const click = this.cellClicked();
    const confirm = Input.pressed('confirm') || (click && click.x === this.cursor.x && click.y === this.cursor.y);
    if (click) this.cursor = click;
    if (Input.pressed('cancel')) {
      Audio.sfx('menuPick');
      this.state = 'menu'; this.menuIdx = 0;
      return;
    }
    if (confirm) {
      const k = cellKey(this.cursor.x, this.cursor.y);
      if (this.cursor.x === u.x && this.cursor.y === u.y) {
        Audio.sfx('menuPick');
        this.state = 'menu'; this.menuIdx = 0;
      } else if (this.reach.dist[k] !== undefined && this.reach.stopOk[k]) {
        const path = pathTo(this.blocked, this.units, u, this.cursor.x, this.cursor.y);
        if (path) {
          this.moved = true;
          this.animMove(u, path);
          this.runQueue(() => { this.state = 'menu'; this.menuIdx = 0; });
        }
      } else {
        Audio.sfx('error');
      }
    }
  }

  moveCursor() {
    let dx = 0, dy = 0;
    if (Input.pressed('up')) dy = -1;
    else if (Input.pressed('down')) dy = 1;
    else if (Input.pressed('left')) dx = -1;
    else if (Input.pressed('right')) dx = 1;
    if (dx || dy) {
      const nx = clamp(this.cursor.x + dx, 0, BGRID_W - 1);
      const ny = clamp(this.cursor.y + dy, 0, BGRID_H - 1);
      if (nx !== this.cursor.x || ny !== this.cursor.y) Audio.sfx('menuMove');
      this.cursor = { x: nx, y: ny };
    }
  }

  menuOptions() {
    const u = this.active;
    return [
      { id: 'attack', label: 'ATTACK', ok: true },
      { id: 'skills', label: u.cls === 'Mage' || u.cls === 'Cleric' ? 'SPELLS' : 'SKILLS', ok: u.abilities.length > 0 },
      { id: 'items', label: 'ITEMS', ok: this.battleItems().length > 0 },
      { id: 'defend', label: 'DEFEND', ok: true },
      { id: 'flee', label: 'FLEE', ok: !this.opts.boss },
      { id: 'wait', label: 'WAIT', ok: true },
    ];
  }

  updateMenu() {
    const opts = this.menuOptions();
    this.menuNav(opts.length, 'menuIdx');
    // mouse over right panel rows
    const baseY = 78;
    for (let i = 0; i < opts.length; i++) {
      if (Input.mouseIn(210, baseY + i * 10, 168, 10)) {
        if (Input.mouseMoved) this.menuIdx = i;
        if (Input.mouseHit) { this.menuIdx = i; this.selectMenu(opts[i]); return; }
      }
    }
    if (Input.pressed('cancel') && !this.moved) {
      Audio.sfx('menuBack');
      this.state = 'move';
      return;
    }
    if (Input.pressed('confirm')) this.selectMenu(opts[this.menuIdx]);
  }

  selectMenu(opt) {
    if (!opt.ok) { Audio.sfx('error'); return; }
    Audio.sfx('menuPick');
    const u = this.active;
    switch (opt.id) {
      case 'attack':
        this.startTargeting({ kind: 'attack', range: u.range || 1, shape: 'single', targets: 'enemy' });
        break;
      case 'skills': this.state = 'skills'; this.subIdx = 0; break;
      case 'items': this.state = 'items'; this.subIdx = 0; break;
      case 'defend':
        u.defending = true;
        addStatus(u, { id: 'guard', turns: 1 });
        this.addLog(`${u.name} guards.`, PAL.TEXT_DIM);
        this.endTurn();
        break;
      case 'flee': {
        const pSpd = this.aliveParty().reduce((s, v) => s + v.spd, 0) / this.aliveParty().length;
        const eSpd = this.aliveEnemies().reduce((s, v) => s + v.spd, 0) / this.aliveEnemies().length;
        const ch = clamp(0.55 + (pSpd - eSpd) * 0.03, 0.25, 0.9);
        if (rng.f() < ch) {
          Audio.sfx('flee');
          Scenes.pop({ fled: true });
        } else {
          this.addLog('No escape!', C.RED);
          this.endTurn();
        }
        break;
      }
      case 'wait': this.endTurn(); break;
    }
  }

  updateSkills() {
    const u = this.active;
    const list = u.abilities.map(id => ABILITIES[id]);
    this.menuNav(list.length, 'subIdx');
    const baseY = 78;
    for (let i = 0; i < list.length; i++) {
      if (Input.mouseIn(210, baseY + i * 10, 168, 10)) {
        if (Input.mouseMoved) this.subIdx = i;
        if (Input.mouseHit) { this.subIdx = i; }
      }
    }
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); this.state = 'menu'; return; }
    if (Input.pressed('confirm') || (Input.mouseHit && Input.mouseIn(210, baseY + this.subIdx * 10, 168, 10))) {
      const ab = list[this.subIdx];
      const abId = u.abilities[this.subIdx];
      if (hasStatus(u, 'silence')) { Audio.sfx('error'); this.addLog('Silenced! The words fail.', C.PURPLE); return; }
      if (u.mp < ab.mp) { Audio.sfx('error'); this.addLog('Not enough MP.', PAL.TEXT_DIM); return; }
      Audio.sfx('menuPick');
      if (ab.shape === 'self' || ab.shape === 'ring') {
        this.animAbility(u, abId, u.x, u.y);
        this.runQueue(() => this.endTurn());
      } else {
        this.startTargeting({
          kind: 'ability', abId, ab, range: ab.range, shape: ab.shape,
          targets: ab.targets, losFree: ab.losFree,
          downedOnly: ab.kind === 'revive',
        });
      }
    }
  }

  battleItems() {
    return Game.invList(it => it.kind === 'consumable' &&
      (it.heal || it.mpHeal || it.cure || it.dmg || it.revive));
  }

  updateItems() {
    const list = this.battleItems();
    if (!list.length) { this.state = 'menu'; return; }
    this.menuNav(list.length, 'subIdx');
    if (this.subIdx >= list.length) this.subIdx = 0;
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); this.state = 'menu'; return; }
    if (Input.pressed('confirm')) {
      Audio.sfx('menuPick');
      const entry = list[this.subIdx];
      this.pendingItem = entry;
      if (entry.item.dmg) {
        this.startTargeting({ kind: 'item', range: 3, shape: 'single', targets: 'enemy', losFree: true });
      } else if (entry.item.revive) {
        this.startTargeting({ kind: 'item', range: 2, shape: 'single', targets: 'ally', losFree: true, downedOnly: true });
      } else {
        this.startTargeting({ kind: 'item', range: 2, shape: 'single', targets: 'ally', losFree: true });
      }
    }
  }

  startTargeting(spec) {
    const u = this.active;
    this.targeting = spec;
    // valid target list for single-target; free cursor for AoE shapes
    if (spec.shape === 'single' || spec.shape === 'arc') {
      const pool = this.units.filter(v => {
        if (spec.downedOnly ? !v.downed : v.downed) return false;
        if (spec.targets === 'enemy' && v.isEnemy === u.isEnemy) return false;
        if (spec.targets === 'ally' && v.isEnemy !== u.isEnemy) return false;
        if (manhattan(u.x, u.y, v.x, v.y) > spec.range) return false;
        if (spec.range > 1 && !spec.losFree && !this.losBetween(u, v)) return false;
        return true;
      });
      if (!pool.length) {
        Audio.sfx('error');
        this.addLog('No target in reach.', PAL.TEXT_DIM);
        this.targeting = null;
        this.state = spec.kind === 'attack' ? 'menu' : this.state;
        return;
      }
      this.targeting.pool = pool;
      this.targeting.idx = 0;
      this.cursor = { x: pool[0].x, y: pool[0].y };
    } else {
      this.cursor = { x: u.x, y: u.y };
    }
    this.state = 'target';
  }

  losBetween(a, b) { return losClear(this.sight, a.x, a.y, b.x, b.y); }

  updateTarget() {
    const u = this.active;
    const spec = this.targeting;
    if (Input.pressed('cancel')) {
      Audio.sfx('menuBack');
      this.targeting = null;
      this.state = spec.kind === 'attack' ? 'menu' : spec.kind === 'item' ? 'items' : 'skills';
      return;
    }
    if (spec.pool) {
      // cycle discrete targets
      if (Input.pressed('left') || Input.pressed('up')) {
        spec.idx = (spec.idx + spec.pool.length - 1) % spec.pool.length;
        Audio.sfx('menuMove');
      }
      if (Input.pressed('right') || Input.pressed('down')) {
        spec.idx = (spec.idx + 1) % spec.pool.length;
        Audio.sfx('menuMove');
      }
      const hov = this.cellHover();
      if (hov) {
        const i = spec.pool.findIndex(v => v.x === hov.x && v.y === hov.y);
        if (i >= 0) spec.idx = i;
      }
      const tgt = spec.pool[spec.idx];
      this.cursor = { x: tgt.x, y: tgt.y };
      const click = this.cellClicked();
      if (Input.pressed('confirm') || (click && click.x === tgt.x && click.y === tgt.y)) {
        this.commitAction(tgt.x, tgt.y);
      }
    } else {
      // free cursor within range
      this.moveCursor();
      const hov = this.cellHover();
      if (hov && manhattan(u.x, u.y, hov.x, hov.y) <= spec.range) this.cursor = hov;
      const inRange = manhattan(u.x, u.y, this.cursor.x, this.cursor.y) <= spec.range;
      const click = this.cellClicked();
      if ((Input.pressed('confirm') || (click && click.x === this.cursor.x && click.y === this.cursor.y)) && inRange) {
        if (!spec.losFree && !losClear(this.sight, u.x, u.y, this.cursor.x, this.cursor.y)) {
          Audio.sfx('error'); this.addLog('No clear path.', PAL.TEXT_DIM); return;
        }
        this.commitAction(this.cursor.x, this.cursor.y);
      }
    }
  }

  commitAction(tx, ty) {
    const u = this.active;
    const spec = this.targeting;
    this.targeting = null;
    if (spec.kind === 'attack') {
      const tgt = unitAt(this.units, tx, ty);
      this.animAttack(u, tgt);
      this.runQueue(() => this.endTurn());
    } else if (spec.kind === 'ability') {
      this.animAbility(u, spec.abId, tx, ty);
      this.runQueue(() => this.endTurn());
    } else if (spec.kind === 'item') {
      const entry = this.pendingItem;
      const it = entry.item;
      const tgt = spec.downedOnly
        ? this.units.find(v => v.downed && v.x === tx && v.y === ty)
        : unitAt(this.units, tx, ty);
      if (!tgt) { this.state = 'items'; return; }
      Game.takeItem(entry.id, 1);
      if (it.dmg) {
        Audio.sfx('fire');
        Gfx.shake(2, 0.2);
        this.addLog(`${u.name} hurls a ${it.name}!`, C.ORANGE);
        this.flashes.push({ x: tx, y: ty, t: 0 });
        this.hurt(tgt, it.dmg + rng.i(-3, 3), {});
      } else if (it.revive) {
        Audio.sfx('levelup');
        tgt.downed = false;
        tgt.hp = Math.max(1, Math.round(tgt.maxHp * it.revive));
        this.floats.push({ x: tgt.x, y: tgt.y, txt: 'UP!', t: 0, color: C.YELLOW });
        this.addLog(`${tgt.name} rises again!`, C.YELLOW);
      } else {
        Audio.sfx('heal');
        if (it.heal) { this.heal(tgt, it.heal); this.addLog(`${tgt.name} drinks a ${it.name}. +${it.heal} HP`, C.GREEN); }
        if (it.mpHeal) { tgt.mp = Math.min(tgt.maxMp, tgt.mp + it.mpHeal); this.addLog(`${tgt.name} recovers ${it.mpHeal} MP.`, C.BLUE); }
        if (it.cure) { tgt.statuses = tgt.statuses.filter(s => s.id !== 'poison' && s.id !== 'blind'); this.addLog(`${tgt.name} is cleansed.`, C.GREEN); }
      }
      this.runQueue(() => this.endTurn());
      this.pushWait(0.3);
    }
  }

  menuNav(n, field) {
    if (!n) return;
    if (Input.pressed('up')) { this[field] = (this[field] + n - 1) % n; Audio.sfx('menuMove'); }
    if (Input.pressed('down')) { this[field] = (this[field] + 1) % n; Audio.sfx('menuMove'); }
  }

  // --- enemy turn ---------------------------------------------------------
  doEnemyTurn() {
    const u = this.active;
    const plan = aiPlan({ units: this.units, blocked: this.blocked, sight: this.sight }, u);
    if (plan.moveTo) {
      if (plan.burrow) {
        // burrowers cross the field beneath it
        this.push({
          dur: 0.35,
          start: () => { this.addLog(`${u.name} dives beneath the ground!`, C.ORANGE); Gfx.shake(2, 0.3); },
          end: () => { u.x = plan.moveTo.x; u.y = plan.moveTo.y; Gfx.shake(3, 0.2); Audio.sfx('crit'); },
        });
      } else {
        const path = pathTo(this.blocked, this.units, u, plan.moveTo.x, plan.moveTo.y);
        if (path) this.animMove(u, path);
      }
    }
    if (plan.summon) {
      this.pushCall(() => {
        let n = 0;
        for (const sx of [11, 11, 10, 10]) {
          if (n >= plan.summon) break;
          for (const sy of [0, 7, 3, 4]) {
            if (n >= plan.summon) break;
            if (!this.blocked[sy][sx] && !unitAt(this.units, sx, sy)) {
              const e = makeEnemy(plan.summonType || 'bandit');
              e.x = sx; e.y = sy; e.facing = 'left';
              this.units.push(e);
              n++;
            }
          }
        }
        this.addLog(plan.summonText || 'Redmane roars — bandits pour in!', C.RED);
        Gfx.shake(3, 0.3);
      });
    }
    if (plan.action) {
      if (plan.action.type === 'attack') {
        this.pushCall(() => {
          const tgt = unitAt(this.units, plan.action.tx, plan.action.ty);
          if (tgt && !tgt.downed) this.animAttack(u, tgt);
        });
      } else if (plan.action.type === 'ability') {
        this.animAbility(u, plan.action.ability, plan.action.tx, plan.action.ty);
      }
    }
    if (!plan.moveTo && !plan.action) this.pushWait(0.25);
    this.runQueue(() => this.endTurn());
  }

  // --- rendering -----------------------------------------------------------
  render() {
    Gfx.clear(C.VOID);
    const shx = Gfx.shakeX, shy = Gfx.shakeY;
    this.renderGrid(shx, shy);
    this.renderUnits(shx, shy);
    this.renderFx(shx, shy);
    this.renderQueueStrip();
    this.renderSidePanel();
    this.renderLog();
    if (this.state === 'intro') {
      Gfx.panel(VIEW_W / 2 - 60, VIEW_H / 2 - 12, 120, 24);
      Gfx.textC(this.opts.boss ? 'A DEADLY FOE!' : 'AMBUSH!', VIEW_W / 2, VIEW_H / 2 - 6, C.RED);
      Gfx.textC('PREPARE FOR BATTLE', VIEW_W / 2, VIEW_H / 2 + 2, PAL.TEXT_DIM);
    }
    if (this.state === 'victory') {
      const ups = this.reward.ups;
      const h = 40 + ups.length * 9;
      const y0 = VIEW_H / 2 - h / 2;
      Gfx.panel(VIEW_W / 2 - 82, y0, 164, h);
      Gfx.textC('VICTORY!', VIEW_W / 2, y0 + 5, C.YELLOW);
      Gfx.textC(`${this.reward.xp} XP   ${this.reward.gold} GOLD`, VIEW_W / 2, y0 + 15, PAL.TEXT);
      for (let i = 0; i < ups.length; i++) {
        const up = ups[i];
        const txt = `${up.name} -> LV ${up.level}` + (up.learned.length ? `. ${ABILITIES[up.learned[0]].name}!` : '');
        Gfx.textC(txt, VIEW_W / 2, y0 + 25 + i * 9, C.GREEN);
      }
      Gfx.textC('Z TO CONTINUE', VIEW_W / 2, y0 + h - 12, PAL.TEXT_DIM);
    }
    if (this.state === 'defeat') {
      Gfx.ctx.fillStyle = `rgba(10,4,8,${clamp(this.stateT / 1.2, 0, 0.8)})`;
      Gfx.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      Gfx.textC('THE PARTY HAS FALLEN', VIEW_W / 2, VIEW_H / 2 - 8, C.RED);
      if (this.stateT > 1.2) Gfx.textC('PRESS Z', VIEW_W / 2, VIEW_H / 2 + 4, PAL.TEXT_DIM);
    }
  }

  renderGrid(shx, shy) {
    for (let y = 0; y < BGRID_H; y++) {
      for (let x = 0; x < BGRID_W; x++) {
        const px = BGX + x * BCELL + shx, py = BGY + y * BCELL + shy;
        const g = GROUND[this.groundArt[y][x]];
        Gfx.ctx.drawImage(tileFrame(g.spr, this.t), px, py);
        if ((x + y) % 2 === 0) {
          Gfx.ctx.fillStyle = 'rgba(0,0,0,0.07)';
          Gfx.ctx.fillRect(px, py, BCELL, BCELL);
        }
      }
    }
    // move range highlight
    if (this.state === 'move' && this.reach) {
      for (const k in this.reach.dist) {
        if (!this.reach.stopOk[k]) continue;
        const [x, y] = k.split(',').map(Number);
        Gfx.ctx.fillStyle = 'rgba(222,238,214,0.16)';
        Gfx.ctx.fillRect(BGX + x * BCELL + shx + 1, BGY + y * BCELL + shy + 1, BCELL - 2, BCELL - 2);
      }
    }
    // targeting overlay
    if (this.state === 'target' && this.targeting) {
      const u = this.active;
      const spec = this.targeting;
      if (!spec.pool) {
        for (let y = 0; y < BGRID_H; y++) {
          for (let x = 0; x < BGRID_W; x++) {
            if (manhattan(u.x, u.y, x, y) <= spec.range) {
              Gfx.ctx.fillStyle = 'rgba(109,194,202,0.13)';
              Gfx.ctx.fillRect(BGX + x * BCELL + shx + 1, BGY + y * BCELL + shy + 1, BCELL - 2, BCELL - 2);
            }
          }
        }
      }
      const cells = shapeCells(spec.shape, this.cursor.x, this.cursor.y, u);
      for (const c of cells) {
        Gfx.ctx.fillStyle = 'rgba(208,70,72,0.30)';
        Gfx.ctx.fillRect(BGX + c.x * BCELL + shx + 1, BGY + c.y * BCELL + shy + 1, BCELL - 2, BCELL - 2);
      }
    }
    // deco
    for (const d of this.deco) {
      Gfx.ctx.drawImage(tileFrame(OBJ[d.obj].spr, this.t), BGX + d.x * BCELL + shx, BGY + d.y * BCELL + shy);
    }
    // grid frame
    Gfx.frame(BGX - 1 + shx, BGY - 1 + shy, BGRID_W * BCELL + 2, BGRID_H * BCELL + 2, C.SLATE);
    // cursor
    if (this.state === 'move' || this.state === 'target') {
      const cx = BGX + this.cursor.x * BCELL + shx, cy = BGY + this.cursor.y * BCELL + shy;
      const blink = Math.floor(this.t * 5) % 2 === 0;
      Gfx.frame(cx - 1, cy - 1, BCELL + 2, BCELL + 2, blink ? C.YELLOW : C.WHITE);
    }
  }

  renderUnits(shx, shy) {
    const list = this.units.filter(u => !u.downed || !u.isEnemy).sort((a, b) => a.y - b.y);
    for (const u of list) {
      let px = BGX + u.x * BCELL + shx, py = BGY + u.y * BCELL + shy - 1;
      if (u._lunge) {
        const dx = Math.sign(u._lunge.tx - u.x), dy = Math.sign(u._lunge.ty - u.y);
        px += dx * 3; py += dy * 3;
      }
      const c = Gfx.ctx;
      if (u.downed) {
        c.save();
        c.globalAlpha = 0.55;
        c.translate(px + 8, py + 9);
        c.rotate(-Math.PI / 2);
        c.drawImage(u.sprites[u.facing][0], -8, -8);
        c.restore();
        continue;
      }
      // active marker
      if (u === this.active && this.state !== 'anim') {
        const bob = Math.floor(this.t * 4) % 2;
        Gfx.rect(px + 6, py - 5 + bob, 4, 2, C.YELLOW);
        Gfx.rect(px + 7, py - 3 + bob, 2, 1, C.YELLOW);
      }
      const frames = u.sprites[u.facing];
      c.drawImage(frames[0], px, py);
      // flash overlay on hit
      const fl = this.flashes.find(f => f.x === u.x && f.y === u.y);
      if (fl) {
        c.save();
        c.globalAlpha = 0.7 * (1 - fl.t / 0.18);
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = C.FLASH;
        c.fillRect(px, py, 16, 16);
        c.restore();
      }
      // hp pip bar
      const w = Math.max(1, Math.round(14 * u.hp / u.maxHp));
      const col = u.hp / u.maxHp > 0.5 ? C.GREEN : u.hp / u.maxHp > 0.25 ? C.YELLOW : C.RED;
      Gfx.rect(px + 1, py + 16, 14, 1, C.VOID);
      Gfx.rect(px + 1, py + 16, w, 1, col);
      // defending shield pixel
      if (u.defending) Gfx.rect(px + 13, py + 1, 2, 2, C.STEEL);
    }
  }

  renderFx(shx, shy) {
    // projectiles
    for (const b of this.bolts) {
      const t = clamp(b.t / b.dur, 0, 1);
      const x = BGX + lerp(b.x0, b.x1, t) * BCELL + 8 + shx;
      const y = BGY + lerp(b.y0, b.y1, t) * BCELL + 8 + shy;
      Gfx.rect(x - 1, y - 1, 3, 3, b.color);
      Gfx.rect(x - 2, y, 1, 1, C.WHITE);
    }
    // damage floats
    for (const f of this.floats) {
      const rise = f.t * 16;
      const x = BGX + f.x * BCELL + 8 + shx;
      const y = BGY + f.y * BCELL - 2 - rise + shy;
      if (f.big) {
        Gfx.textC(f.txt, x + 1, y + 1, C.VOID);
      }
      Gfx.textC(f.txt, x, y, f.color);
    }
  }

  renderQueueStrip() {
    const remaining = this.order.slice(this.orderIdx).filter(u => !u.downed).slice(0, 12);
    let x = BGX;
    Gfx.text('NEXT:', x, 6, PAL.TEXT_DIM);
    x += 24;
    for (let i = 0; i < remaining.length; i++) {
      const u = remaining[i];
      const w = 14;
      const bg = u.isEnemy ? C.MAROON : C.NAVY;
      Gfx.rect(x, 3, w, 11, bg);
      if (i === 0) Gfx.frame(x, 3, w, 11, C.YELLOW);
      Gfx.text(u.name[0] + (u.boss ? '!' : ''), x + 3, 6, i === 0 ? C.YELLOW : PAL.TEXT);
      x += w + 2;
    }
  }

  renderSidePanel() {
    const px = 206, pw = VIEW_W - px - 2;
    Gfx.panel(px, 20, pw, 128);
    const u = this.active;
    if (!u) return;
    // active unit card
    Gfx.text(u.name.toUpperCase(), px + 6, 26, u.isEnemy ? C.ORANGE : C.YELLOW);
    if (u.cls) Gfx.textR(u.cls, px + pw - 4, 26, PAL.TEXT_DIM);
    this.bar(px + 6, 36, pw - 12, u.hp, u.maxHp, PAL.HP, 'HP');
    if (u.maxMp > 0) this.bar(px + 6, 46, pw - 12, u.mp, u.maxMp, PAL.MP, 'MP');
    // statuses
    let sx = px + 6;
    for (const st of u.statuses) {
      const d = STATUS_DEFS[st.id];
      if (!d) continue;
      Gfx.text(d.name, sx, 56, d.color());
      sx += textWidth(d.name) + 6;
    }
    // context area
    const baseY = 78;
    if (this.state === 'menu') {
      const opts = this.menuOptions();
      for (let i = 0; i < opts.length; i++) {
        const sel = i === this.menuIdx;
        if (sel) Gfx.rect(px + 4, baseY + i * 10 - 1, pw - 8, 9, C.MAROON);
        Gfx.text((sel ? ICON.CURSOR : ' ') + opts[i].label, px + 6, baseY + i * 10,
          opts[i].ok ? (sel ? C.YELLOW : PAL.TEXT) : PAL.TEXT_DARK);
      }
    } else if (this.state === 'skills') {
      const list = this.active.abilities.map(id => ABILITIES[id]);
      for (let i = 0; i < list.length; i++) {
        const sel = i === this.subIdx;
        const can = u.mp >= list[i].mp;
        if (sel) Gfx.rect(px + 4, baseY + i * 10 - 1, pw - 8, 9, C.MAROON);
        Gfx.text((sel ? ICON.CURSOR : ' ') + list[i].name, px + 6, baseY + i * 10,
          can ? (sel ? C.YELLOW : PAL.TEXT) : PAL.TEXT_DARK);
        Gfx.textR(list[i].mp + 'MP', px + pw - 4, baseY + i * 10, can ? PAL.MP : PAL.TEXT_DARK);
      }
      const ab = list[this.subIdx];
      if (ab) Gfx.textWrap(ab.desc, px + 6, baseY + list.length * 10 + 4, pw - 12, PAL.TEXT_DIM);
    } else if (this.state === 'items') {
      const list = this.battleItems();
      for (let i = 0; i < list.length; i++) {
        const sel = i === this.subIdx;
        if (sel) Gfx.rect(px + 4, baseY + i * 10 - 1, pw - 8, 9, C.MAROON);
        Gfx.text((sel ? ICON.CURSOR : ' ') + list[i].item.name, px + 6, baseY + i * 10, sel ? C.YELLOW : PAL.TEXT);
        Gfx.textR('x' + list[i].count, px + pw - 4, baseY + i * 10, PAL.TEXT_DIM);
      }
      const it = list[this.subIdx];
      if (it) Gfx.textWrap(it.item.desc, px + 6, baseY + list.length * 10 + 4, pw - 12, PAL.TEXT_DIM);
    } else if (this.state === 'target') {
      const tgt = unitAt(this.units, this.cursor.x, this.cursor.y);
      if (tgt) {
        Gfx.text(tgt.name.toUpperCase(), px + 6, baseY, tgt.isEnemy ? C.ORANGE : C.GREEN);
        this.bar(px + 6, baseY + 10, pw - 12, tgt.hp, tgt.maxHp, PAL.HP, 'HP');
        if (!tgt.isEnemy === !u.isEnemy || this.targeting.kind === 'attack') {
          const fk = flankKind(u, tgt);
          if (tgt.isEnemy !== u.isEnemy) {
            Gfx.text(fk === 'back' ? 'BEHIND: +35%' : fk === 'side' ? 'FLANK: +15%' : 'HEAD-ON', px + 6, baseY + 22,
              fk === 'back' ? C.YELLOW : fk === 'side' ? C.CYAN : PAL.TEXT_DIM);
          }
        }
      } else {
        Gfx.text('CHOOSE TARGET', px + 6, baseY, PAL.TEXT_DIM);
      }
    } else if (this.state === 'move') {
      Gfx.text('MOVE ' + unitMove(u), px + 6, baseY, PAL.TEXT_DIM);
      Gfx.textWrap('PICK A CELL, THEN ACT. X TO STAND FAST.', px + 6, baseY + 10, pw - 12, PAL.TEXT_DARK);
    }
  }

  bar(x, y, w, val, max, color, label) {
    Gfx.text(label, x, y, PAL.TEXT_DIM);
    const bx = x + 14, bw = w - 14 - 34;
    Gfx.rect(bx, y + 1, bw, 4, C.VOID);
    Gfx.rect(bx, y + 1, Math.max(0, Math.round(bw * val / max)), 4, color);
    Gfx.frame(bx, y + 1, bw, 4, C.SLATE);
    Gfx.textR(val + '/' + max, x + w, y, PAL.TEXT);
  }

  renderLog() {
    Gfx.panel(BGX - 2, 152, 198, 62);
    const lines = this.log.slice(-8);
    for (let i = 0; i < lines.length; i++) {
      Gfx.text(lines[i].txt.toUpperCase().slice(0, 48), BGX + 4, 156 + i * 7, lines[i].color);
    }
    // help
    let help = '';
    switch (this.state) {
      case 'move': help = 'ARROWS/MOUSE: CELL   Z: GO   X: SKIP MOVE'; break;
      case 'menu': help = 'ARROWS: CHOOSE   Z: OK' + (this.moved ? '' : '   X: BACK'); break;
      case 'skills': case 'items': help = 'ARROWS: CHOOSE   Z: OK   X: BACK'; break;
      case 'target': help = 'ARROWS: TARGET   Z: CONFIRM   X: BACK'; break;
    }
    if (help) Gfx.textC(help, VIEW_W / 2, VIEW_H - 8, PAL.TEXT_DARK);
  }
}

class GameOverScene {
  constructor() { this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.t > 1 && Input.pressed('confirm')) {
      Scenes.reset(new TitleScene());
    }
  }
  render() {
    Gfx.clear(C.VOID);
    Gfx.textC('THE EMBER FADES...', VIEW_W / 2, VIEW_H / 2 - 20, C.RED);
    Gfx.textC('YOUR TALE ENDS HERE', VIEW_W / 2, VIEW_H / 2 - 6, PAL.TEXT_DIM);
    if (this.t > 1) Gfx.textC('PRESS Z FOR THE TITLE', VIEW_W / 2, VIEW_H / 2 + 14, PAL.TEXT);
  }
}
