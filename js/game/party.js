// party.js — party members, classes, XP/levels, equipment, derived stats.
// Members are also battle units: battle code reads hp/mp/atk/def/spd/move
// directly, so refreshMember() must run after any equip or level change.
'use strict';

const XP_CAP_LEVEL = 20;
function xpForLevel(lvl) {          // total XP needed to REACH lvl
  if (lvl <= 1) return 0;
  return Math.round(30 * Math.pow(lvl - 1, 1.8) + 20 * (lvl - 1));
}

function makeMember(o) {
  // o: {id, name, clsId, level, look}
  const cls = CLASSES[o.clsId];
  const m = {
    id: o.id, name: o.name, clsId: o.clsId, cls: cls.name,
    isEnemy: false, undead: false, boss: false, ai: null,
    level: 1, xp: 0,
    // core stats (floats; growth accumulates)
    str: cls.stats.str, dex: cls.stats.dex, int: cls.stats.int,
    vit: cls.stats.vit, spd: cls.stats.spd,
    equip: { weapon: null, armor: null, shield: null, acc: null },
    abilities: [],
    look: o.look || {},
    sprites: charSprites(o.look || {}),
    // derived (refreshMember)
    maxHp: 1, hp: 1, maxMp: 0, mp: 0, atk: 1, def: 0, move: cls.move, range: 1,
    // battle state
    x: 0, y: 0, facing: 'right', downed: false, defending: false, statuses: [],
  };
  learnAbilitiesFor(m);
  refreshMember(m);
  m.hp = m.maxHp; m.mp = m.maxMp;
  const target = Math.max(1, o.level || 1);
  while (m.level < target) grantLevel(m, true);
  return m;
}

function equipBonus(m, field) {
  let sum = 0;
  for (const slot of ['weapon', 'armor', 'shield', 'acc']) {
    const id = m.equip[slot];
    if (id && ITEMS[id] && ITEMS[id][field]) sum += ITEMS[id][field];
  }
  return sum;
}

function refreshMember(m) {
  const cls = CLASSES[m.clsId];
  const hpFrac = m.maxHp > 0 ? m.hp / m.maxHp : 1;
  const mpFrac = m.maxMp > 0 ? m.mp / m.maxMp : 1;
  m.maxHp = Math.round(cls.hp + m.vit * 3 + (m.level - 1) * cls.hpL);
  m.maxMp = Math.round(cls.mp + m.int * 2 + (m.level - 1) * cls.mpL + equipBonus(m, 'mp'));
  m.hp = clamp(Math.round(m.maxHp * hpFrac), 0, m.maxHp);
  m.mp = clamp(Math.round(m.maxMp * mpFrac), 0, m.maxMp);
  const eInt = equipBonus(m, 'int'), eStr = equipBonus(m, 'str');
  m.atk = Math.round(m.str + eStr + equipBonus(m, 'atk'));
  m.def = Math.round(m.vit * 0.5 + equipBonus(m, 'def') + equipBonus(m, 'vit') * 0.5);
  m.effInt = Math.round(m.int + eInt);
  m.effDex = Math.round(m.dex + equipBonus(m, 'dex'));
  m.effSpd = Math.round(m.spd + equipBonus(m, 'spd'));
  m.range = Math.max(1, equipBonus(m, 'range') + 1);
  m.move = cls.move + (equipBonus(m, 'spd') >= 2 ? 1 : 0);
}

function learnAbilitiesFor(m) {
  const learned = [];
  const table = CLASSES[m.clsId].learn;
  for (const lvl in table) {
    if (m.level >= Number(lvl)) {
      for (const ab of table[lvl]) {
        if (!m.abilities.includes(ab)) { m.abilities.push(ab); learned.push(ab); }
      }
    }
  }
  return learned;
}

// Returns {level, gains, learned} or null if no level was gained.
function grantLevel(m, silent) {
  if (m.level >= XP_CAP_LEVEL) return null;
  const cls = CLASSES[m.clsId];
  m.level++;
  for (const s of ['str', 'dex', 'int', 'vit', 'spd']) m[s] += cls.growth[s];
  const learned = learnAbilitiesFor(m);
  refreshMember(m);
  if (!silent) { m.hp = m.maxHp; m.mp = m.maxMp; }   // level-up refill
  return { level: m.level, learned };
}

// Award XP; returns array of level-up notices.
function gainXp(m, amount) {
  const ups = [];
  if (m.level >= XP_CAP_LEVEL) return ups;
  m.xp += amount;
  while (m.level < XP_CAP_LEVEL && m.xp >= xpForLevel(m.level + 1)) {
    const up = grantLevel(m, false);
    if (up) ups.push(up); else break;
  }
  return ups;
}

function canEquip(m, itemId) {
  const it = ITEMS[itemId];
  if (!it) return false;
  if (!['weapon', 'armor', 'shield', 'acc'].includes(it.kind)) return false;
  if (it.classes && !it.classes.includes(m.clsId)) return false;
  return true;
}

// Equip from inventory; previous item returns to inventory.
function equipItem(m, itemId) {
  const it = ITEMS[itemId];
  if (!canEquip(m, itemId)) return false;
  const slot = it.kind;
  if (!Game.takeItem(itemId, 1)) return false;
  if (m.equip[slot]) Game.addItem(m.equip[slot], 1);
  m.equip[slot] = itemId;
  refreshMember(m);
  return true;
}

function unequipItem(m, slot) {
  if (!m.equip[slot]) return false;
  Game.addItem(m.equip[slot], 1);
  m.equip[slot] = null;
  refreshMember(m);
  return true;
}

// --- enemies (unchanged shape from M3) --------------------------------------
function makeUnit(o) {
  return {
    name: o.name, cls: o.cls || '', isEnemy: !!o.isEnemy, undead: !!o.undead,
    boss: !!o.boss, ai: o.ai || null, poisonBite: !!o.poisonBite,
    maxHp: o.hp, hp: o.hp, maxMp: o.mp || 0, mp: o.mp || 0,
    str: o.str, atk: o.atk !== undefined ? o.atk : o.str,
    dex: o.dex, int: o.int, effInt: o.int, effDex: o.dex, effSpd: o.spd,
    def: o.def, spd: o.spd,
    move: o.move || 4, range: o.range || 1,
    abilities: (o.abilities || []).slice(),
    xp: o.xp || 0, gold: o.gold || [0, 0],
    sprites: o.sprites,
    x: 0, y: 0, facing: 'right', downed: false, defending: false, statuses: [],
  };
}

function hasStatus(u, id) { return u.statuses.some(s => s.id === id); }
function statusPower(u, id) {
  let p = 0;
  for (const s of u.statuses) if (s.id === id) p += (s.power || 0);
  return p;
}
function addStatus(u, st) {
  const cur = u.statuses.find(s => s.id === st.id);
  if (cur) { cur.turns = Math.max(cur.turns, st.turns); cur.power = Math.max(cur.power || 0, st.power || 0); }
  else u.statuses.push({ id: st.id, turns: st.turns, power: st.power || 0 });
}

function makeEnemy(typeId) {
  const t = ENEMY_TYPES[typeId];
  const u = makeUnit(Object.assign({}, t, {
    isEnemy: true, sprites: t.sprite(), mp: t.mp || 0,
  }));
  u.typeId = typeId;
  return u;
}

// --- roster helpers -----------------------------------------------------------
function makeCompanion(id, level) {
  const c = COMPANIONS.find(x => x.id === id);
  return makeMember({ id: c.id, name: c.name, clsId: c.cls, level: level || c.joinLvl, look: c.look });
}

function makeHero(name, clsId) {
  const looks = {
    fighter: { hair: C.WOOD, tunic: C.BLUE, trim: C.YELLOW },
    rogue: { hood: C.DGREEN, tunic: C.SLATE, pants: C.VOID },
    mage: { hair: C.VOID, robe: true, tunic: C.NAVY, robeCol: C.NAVY },
    cleric: { hair: C.TAN, robe: true, tunic: C.WHITE, robeCol: C.STEEL },
  };
  const m = makeMember({ id: 'hero', name, clsId, level: 1, look: looks[clsId] });
  m.isHero = true;
  return m;
}
