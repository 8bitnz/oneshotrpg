// battle.js — combat rules: damage, hit rolls, LoS, movement, initiative,
// and enemy AI planning. Pure logic; combat.js animates what this decides.
'use strict';

const BGRID_W = 12, BGRID_H = 8;

// --- math ---------------------------------------------------------------
function attackPower(u) { return (u.atk !== undefined ? u.atk : u.str) + statusPower(u, 'bless'); }
function defensePower(u) {
  let d = u.def + statusPower(u, 'shield') - statusPower(u, 'sunder');
  return Math.max(0, d) * (u.defending ? 1.6 : 1);
}

// Relation of attack direction to target facing: 'back' | 'side' | 'front'
function flankKind(att, tgt) {
  const dx = Math.sign(tgt.x - att.x), dy = Math.sign(tgt.y - att.y);
  const f = DIRS[tgt.facing];
  // attacker->target direction vs target facing: same = attack from behind
  const dot = dx * f.dx + dy * f.dy;
  if (dot > 0) return 'back';
  if (dot < 0) return 'front';
  return 'side';
}

function rollPhys(att, tgt, pow, opts) {
  opts = opts || {};
  const aDex = att.effDex !== undefined ? att.effDex : att.dex;
  const tDex = tgt.effDex !== undefined ? tgt.effDex : tgt.dex;
  let hitCh = 0.9 + (aDex - tDex) * 0.02;
  if (hasStatus(att, 'blind')) hitCh -= 0.35;
  hitCh = clamp(hitCh, 0.35, 0.99);
  if (rng.f() > hitCh) return { miss: true, dmg: 0, crit: false, flank: 'front' };
  const flank = opts.noFlank ? 'front' : flankKind(att, tgt);
  const fMult = flank === 'back' ? 1.35 : flank === 'side' ? 1.15 : 1;
  let critCh = 0.07 + aDex * 0.005 + (flank === 'back' ? 0.12 : 0);
  if (hasStatus(tgt, 'mark')) critCh += 0.30;
  const crit = rng.f() < critCh;
  let dmg = attackPower(att) * 1.6 + (pow || 0) * 2 - defensePower(tgt);
  dmg *= 0.85 + rng.f() * 0.3;
  if (crit) dmg *= 1.6;
  dmg *= fMult;
  if (opts.execute && tgt.hp < tgt.maxHp * 0.3) dmg *= 2;
  return { miss: false, dmg: Math.max(1, Math.round(dmg)), crit, flank };
}

function rollMagic(att, tgt, ab) {
  const aInt = att.effInt !== undefined ? att.effInt : att.int;
  let dmg = (ab.pow || 0) * 2 + aInt * 1.3 - defensePower(tgt) * 0.5;
  dmg *= 0.85 + rng.f() * 0.3;
  if (ab.vsUndead && tgt.undead) dmg *= ab.vsUndead;
  return { miss: false, dmg: Math.max(1, Math.round(dmg)), crit: false, flank: 'front' };
}

function rollHeal(att, ab) {
  const aInt = att.effInt !== undefined ? att.effInt : att.int;
  return Math.round((ab.pow || 0) + aInt * 0.8 * (0.9 + rng.f() * 0.2));
}

function unitMove(u) {
  let m = u.move - (hasStatus(u, 'slow') ? 2 : 0) + statusPower(u, 'haste');
  return Math.max(1, m);
}

// --- grid helpers ---------------------------------------------------------
function cellKey(x, y) { return x + ',' + y; }

function unitAt(units, x, y) {
  return units.find(u => !u.downed && u.x === x && u.y === y) || null;
}

// BFS reachable cells for a unit. Enemies block; allies passable, can't stop.
function reachableCells(blocked, units, u) {
  const maxD = unitMove(u);
  const dist = { [cellKey(u.x, u.y)]: 0 };
  const stopOk = { [cellKey(u.x, u.y)]: true };
  const q = [{ x: u.x, y: u.y, d: 0 }];
  while (q.length) {
    const c = q.shift();
    if (c.d >= maxD) continue;
    for (const d of DIR_LIST) {
      const nx = c.x + DIRS[d].dx, ny = c.y + DIRS[d].dy;
      if (nx < 0 || ny < 0 || nx >= BGRID_W || ny >= BGRID_H) continue;
      const k = cellKey(nx, ny);
      if (dist[k] !== undefined) continue;
      if (blocked[ny][nx]) continue;
      const occ = unitAt(units, nx, ny);
      if (occ && occ.isEnemy !== u.isEnemy) continue;   // enemies block
      dist[k] = c.d + 1;
      stopOk[k] = !occ;
      q.push({ x: nx, y: ny, d: c.d + 1 });
    }
  }
  return { dist, stopOk };
}

// Shortest path within a reachable set (for move animation).
function pathTo(blocked, units, u, tx, ty) {
  const from = {};
  const seen = { [cellKey(u.x, u.y)]: true };
  const q = [{ x: u.x, y: u.y }];
  while (q.length) {
    const c = q.shift();
    if (c.x === tx && c.y === ty) {
      const path = [];
      let k = cellKey(tx, ty);
      let cur = { x: tx, y: ty };
      while (cur) { path.push(cur); cur = from[cellKey(cur.x, cur.y)]; }
      return path.reverse().slice(1);
    }
    for (const d of DIR_LIST) {
      const nx = c.x + DIRS[d].dx, ny = c.y + DIRS[d].dy;
      if (nx < 0 || ny < 0 || nx >= BGRID_W || ny >= BGRID_H) continue;
      const k = cellKey(nx, ny);
      if (seen[k] || blocked[ny][nx]) continue;
      const occ = unitAt(units, nx, ny);
      if (occ && occ.isEnemy !== u.isEnemy) continue;
      seen[k] = true;
      from[k] = c;
      q.push({ x: nx, y: ny });
    }
  }
  return null;
}

// Bresenham LoS between cell centers; obstacles block, units don't.
function losClear(blocked, x0, y0, x1, y1) {
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  for (;;) {
    if (!(x === x0 && y === y0) && !(x === x1 && y === y1)) {
      if (blocked[y] && blocked[y][x]) return false;
    }
    if (x === x1 && y === y1) return true;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

// Cells covered by an ability aimed at (tx,ty) from unit u.
function shapeCells(shape, tx, ty, u) {
  const cells = [];
  const add = (x, y) => {
    if (x >= 0 && y >= 0 && x < BGRID_W && y < BGRID_H) cells.push({ x, y });
  };
  switch (shape) {
    case 'self': add(u.x, u.y); break;
    case 'single': add(tx, ty); break;
    case 'blast1':
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) add(tx + dx, ty + dy);
      break;
    case 'cross':
      add(tx, ty); add(tx + 1, ty); add(tx - 1, ty); add(tx, ty + 1); add(tx, ty - 1);
      break;
    case 'ring':
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (dx || dy) add(u.x + dx, u.y + dy);
      }
      break;
    case 'arc': {
      // three cells in front of the unit, facing the target
      const dx = Math.sign(tx - u.x), dy = Math.sign(ty - u.y);
      if (dx !== 0 && dy === 0) { add(u.x + dx, u.y - 1); add(u.x + dx, u.y); add(u.x + dx, u.y + 1); }
      else { const fy = dy || 1; add(u.x - 1, u.y + fy); add(u.x, u.y + fy); add(u.x + 1, u.y + fy); }
      break;
    }
    case 'line': {
      const dx = Math.sign(tx - u.x), dy = Math.sign(ty - u.y);
      for (let i = 1; i <= 3; i++) add(u.x + dx * i, u.y + dy * i);
      break;
    }
    default: add(tx, ty);
  }
  return cells;
}

function initiativeOrder(units) {
  return units
    .filter(u => !u.downed)
    .map(u => ({ u, roll: (u.effSpd !== undefined ? u.effSpd : u.spd) + rng.f() * 4 }))
    .sort((a, b) => b.roll - a.roll)
    .map(e => e.u);
}

function chebyshev(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }

// --- enemy AI ---------------------------------------------------------------
// Returns {moveTo:{x,y}|null, action:{type, ability?, tx, ty}|null}
function aiPlan(ctx, u) {
  const foes = ctx.units.filter(v => !v.downed && v.isEnemy !== u.isEnemy);
  const allies = ctx.units.filter(v => !v.downed && v.isEnemy === u.isEnemy && v !== u);
  if (!foes.length) return { moveTo: null, action: null };
  const reach = reachableCells(ctx.blocked, ctx.units, u);
  const cells = Object.keys(reach.dist)
    .filter(k => reach.stopOk[k])
    .map(k => { const [x, y] = k.split(',').map(Number); return { x, y, d: reach.dist[k] }; });

  const nearestFoe = (from) => {
    let best = null, bd = 1e9;
    for (const f of foes) {
      const d = manhattan(from.x, from.y, f.x, f.y);
      if (d < bd) { bd = d; best = f; }
    }
    return { foe: best, d: bd };
  };

  const attackFrom = (cell, foe, range) =>
    manhattan(cell.x, cell.y, foe.x, foe.y) <= range &&
    (range === 1 || losClear(ctx.blocked, cell.x, cell.y, foe.x, foe.y));

  switch (u.ai) {
    case 'archer': {
      const { foe } = nearestFoe(u);
      const range = u.range || 5;
      // Shoot from ideal range if possible; otherwise ADVANCE toward it
      // (standing pat forever is how archers get bored to death).
      let best = null, bestScore = -1e9;
      for (const c of cells) {
        const dFoe = nearestFoe(c).d;
        const canShoot = attackFrom(c, foe, range);
        let score = canShoot
          ? 100 + dFoe * 3 - c.d
          : -Math.abs(dFoe - (range - 1)) * 6 - c.d;
        if (dFoe <= 1) score -= 45;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      const from = best || u;
      if (attackFrom(from, foe, range)) {
        const useSkill = u.abilities.includes('e_powershot') && u.mp >= 4 && rng.chance(0.35);
        return {
          moveTo: best && (best.x !== u.x || best.y !== u.y) ? best : null,
          action: { type: useSkill ? 'ability' : 'attack', ability: 'e_powershot', tx: foe.x, ty: foe.y },
        };
      }
      return { moveTo: best && (best.x !== u.x || best.y !== u.y) ? best : null, action: null };
    }
    case 'shaman': {
      const hurt = allies.filter(a => a.hp < a.maxHp * 0.65).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      if (hurt.length && u.mp >= 4) {
        const tgt = hurt[0];
        const c = bestCellFor(cells, u, (cell) => manhattan(cell.x, cell.y, tgt.x, tgt.y) <= 4, foes);
        if (c) return { moveTo: mv(c, u), action: { type: 'ability', ability: 'e_heal', tx: tgt.x, ty: tgt.y } };
      }
      const unblessed = allies.filter(a => !hasStatus(a, 'bless') && a.ai !== 'shaman');
      if (unblessed.length && u.mp >= 4 && rng.chance(0.6)) {
        const tgt = rng.pick(unblessed);
        const c = bestCellFor(cells, u, (cell) => manhattan(cell.x, cell.y, tgt.x, tgt.y) <= 4, foes);
        if (c) return { moveTo: mv(c, u), action: { type: 'ability', ability: 'e_bless', tx: tgt.x, ty: tgt.y } };
      }
      if (u.mp >= 3) {
        const { foe } = nearestFoe(u);
        const c = bestCellFor(cells, u, (cell) =>
          manhattan(cell.x, cell.y, foe.x, foe.y) <= 4 && losClear(ctx.blocked, cell.x, cell.y, foe.x, foe.y), foes);
        if (c) return { moveTo: mv(c, u), action: { type: 'ability', ability: 'e_zap', tx: foe.x, ty: foe.y } };
      }
      // hang back
      const c = bestCellFor(cells, u, () => true, foes, true);
      return { moveTo: mv(c, u), action: null };
    }
    case 'wolf': {
      // prefer weakest foe; try to stand behind it
      const tgt = foes.slice().sort((a, b) => a.hp - b.hp)[0];
      const f = DIRS[tgt.facing];
      const behind = { x: tgt.x - f.dx, y: tgt.y - f.dy };
      const bk = cellKey(behind.x, behind.y);
      if (reach.dist[bk] !== undefined && reach.stopOk[bk]) {
        return { moveTo: behind, action: { type: 'attack', tx: tgt.x, ty: tgt.y } };
      }
      return brutePlan();
    }
    case 'boss_redmane': {
      if (!u.enraged && u.hp < u.maxHp * 0.5) {
        u.enraged = true;
        return { moveTo: null, action: { type: 'ability', ability: 'e_enrage', tx: u.x, ty: u.y }, summon: 2, summonType: 'bandit' };
      }
      // cleave when 2+ foes would be hit
      const adjFoes = foes.filter(f => manhattan(u.x, u.y, f.x, f.y) === 1);
      if (adjFoes.length >= 2 && u.mp >= 3) {
        const t = adjFoes[0];
        return { moveTo: null, action: { type: 'ability', ability: 'cleave', tx: t.x, ty: t.y } };
      }
      return brutePlan();
    }
    case 'boss_barrowking': {
      // Raise the honor guard at 60%, rage at 25%.
      if (!u.raised && u.hp < u.maxHp * 0.6) {
        u.raised = true;
        return { moveTo: null, action: null, summon: 2, summonType: 'skeleton', summonText: 'The Barrow King beckons. The floor gives up its dead!' };
      }
      if (!u.enraged && u.hp < u.maxHp * 0.25) {
        u.enraged = true;
        return { moveTo: null, action: { type: 'ability', ability: 'e_enrage', tx: u.x, ty: u.y } };
      }
      // dark bolt when out of reach
      const { foe, d } = nearestFoe(u);
      if (d > 1 && u.mp >= 3 && losClear(ctx.blocked, u.x, u.y, foe.x, foe.y) && d <= 4) {
        return { moveTo: null, action: { type: 'ability', ability: 'e_zap', tx: foe.x, ty: foe.y } };
      }
      return brutePlan();
    }
    case 'boss_broodmother': {
      // Lays a clutch each quarter of health lost.
      const band = Math.ceil((u.hp / u.maxHp) * 4);    // 4,3,2,1
      if (u.lastBand === undefined) u.lastBand = 4;
      if (band < u.lastBand) {
        u.lastBand = band;
        return { moveTo: null, action: null, summon: 2, summonType: 'spiderling', summonText: 'The Broodmother shudders — the eggs answer!' };
      }
      return brutePlan();
    }
    case 'boss_drownedknight': {
      // Slow, implacable; the tide answers him once.
      if (!u.tided && u.hp < u.maxHp * 0.5) {
        u.tided = true;
        return { moveTo: null, action: { type: 'ability', ability: 'e_enrage', tx: u.x, ty: u.y }, summon: 2, summonType: 'bogLurker', summonText: 'The water rises. Things rise with it.' };
      }
      return brutePlan();
    }
    case 'boss_forgewight': {
      if (!u.forged && u.hp < u.maxHp * 0.55) {
        u.forged = true;
        return { moveTo: null, action: null, summon: 1, summonType: 'emberGolem', summonText: 'The Forge-Wight strikes the anvil. The forge answers.' };
      }
      const { foe, d } = nearestFoe(u);
      if (d > 1 && d <= 4 && u.mp >= 3 && losClear(ctx.blocked, u.x, u.y, foe.x, foe.y)) {
        return { moveTo: null, action: { type: 'ability', ability: 'e_zap', tx: foe.x, ty: foe.y } };
      }
      return brutePlan();
    }
    case 'boss_stormheart': {
      // A caster boss: keeps range, hurls the storm, calls shades twice.
      u.stormCalls = u.stormCalls || 0;
      const band3 = Math.ceil((u.hp / u.maxHp) * 3);
      if (u.lastBand3 === undefined) u.lastBand3 = 3;
      if (band3 < u.lastBand3 && u.stormCalls < 2) {
        u.lastBand3 = band3; u.stormCalls++;
        return { moveTo: null, action: null, summon: 1, summonType: 'iceShade', summonText: 'The wind screams — and something screams back.' };
      }
      const { foe, d } = nearestFoe(u);
      let best = null, bestScore = -1e9;
      for (const c of cells) {
        const dFoe = nearestFoe(c).d;
        let score = -Math.abs(dFoe - 3) * 5 - c.d;
        if (dFoe <= 1) score -= 40;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      const from = best || u;
      if (u.mp >= 3 && manhattan(from.x, from.y, foe.x, foe.y) <= 4) {
        return { moveTo: mv(best, u), action: { type: 'ability', ability: 'e_zap', tx: foe.x, ty: foe.y } };
      }
      return { moveTo: mv(best, u), action: null };
    }
    case 'boss_sandwyrm': {
      // Burrows: crosses the field in a turn, erupting beside its prey.
      const tgt = rng.pick(foes);
      const spots = [];
      for (const d of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const x = tgt.x + d[0], y = tgt.y + d[1];
        if (x < 0 || y < 0 || x >= BGRID_W || y >= BGRID_H) continue;
        if (ctx.blocked[y][x] || unitAt(ctx.units, x, y)) continue;
        spots.push({ x, y });
      }
      if (spots.length && rng.chance(0.6)) {
        const s = rng.pick(spots);
        return { moveTo: { x: s.x, y: s.y }, burrow: true, action: { type: 'attack', tx: tgt.x, ty: tgt.y } };
      }
      return brutePlan();
    }
    case 'boss_cindertyrant': {
      // Phase 2 at half: reignites, calls revenants.
      if (!u.reignited && u.hp < u.maxHp * 0.5) {
        u.reignited = true;
        u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.2));
        addStatus(u, { id: 'bless', turns: 99, power: 6 });
        return { moveTo: null, action: null, summon: 2, summonType: 'flameRevenant', summonText: 'The Tyrant breathes in the mountain\'s fire — AND STANDS TALLER.' };
      }
      const adjFoes = foes.filter(f => manhattan(u.x, u.y, f.x, f.y) === 1);
      if (adjFoes.length >= 2 && u.mp >= 3) {
        return { moveTo: null, action: { type: 'ability', ability: 'cleave', tx: adjFoes[0].x, ty: adjFoes[0].y } };
      }
      const { foe, d } = nearestFoe(u);
      if (d > 1 && d <= 4 && u.mp >= 3 && losClear(ctx.blocked, u.x, u.y, foe.x, foe.y) && rng.chance(0.5)) {
        return { moveTo: null, action: { type: 'ability', ability: 'e_zap', tx: foe.x, ty: foe.y } };
      }
      return brutePlan();
    }
    case 'brute':
    default:
      return brutePlan();
  }

  function brutePlan() {
    // reach an adjacent cell of the nearest reachable foe, else close in
    let bestCell = null, bestScore = -1e9, bestFoe = null;
    for (const c of cells) {
      const { foe, d } = nearestFoe(c);
      let score = -d * 10 - c.d;
      if (d <= (u.range || 1)) score += 100;
      if (score > bestScore) { bestScore = score; bestCell = c; bestFoe = foe; }
    }
    if (!bestCell) return { moveTo: null, action: null };
    const act = manhattan(bestCell.x, bestCell.y, bestFoe.x, bestFoe.y) <= (u.range || 1)
      ? { type: 'attack', tx: bestFoe.x, ty: bestFoe.y } : null;
    return { moveTo: mv(bestCell, u), action: act };
  }

  function mv(c, u2) { return c && (c.x !== u2.x || c.y !== u2.y) ? { x: c.x, y: c.y } : null; }

  function bestCellFor(cells2, u2, ok, foes2, fleeBias) {
    let best = null, bestScore = -1e9;
    for (const c of cells2) {
      if (!ok(c)) continue;
      let dFoe = 1e9;
      for (const f of foes2) dFoe = Math.min(dFoe, manhattan(c.x, c.y, f.x, f.y));
      let score = (fleeBias ? dFoe * 6 : clamp(dFoe, 0, 3) * 4) - c.d;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    return best || { x: u2.x, y: u2.y, d: 0 };
  }
}
