// save.js — localStorage saves: 3 manual slots + autosave. The world map is
// never serialized (fixed seed); only mutations, party, and progress are.
// Schema is versioned; loads are defensive against bad/old data.
'use strict';

const SAVE_VERSION = 1;
const SAVE_KEY = (slot) => 'embervale_v' + '_slot_' + slot;   // slot: auto|1|2|3
const SAVE_SLOTS = ['auto', '1', '2', '3'];

function serializeMember(m) {
  return {
    id: m.id, name: m.name, clsId: m.clsId, isHero: !!m.isHero,
    level: m.level, xp: m.xp,
    str: m.str, dex: m.dex, int: m.int, vit: m.vit, spd: m.spd,
    equip: Object.assign({}, m.equip),
    abilities: m.abilities.slice(),
    hp: m.hp, mp: m.mp,
    look: m.look,
  };
}

function deserializeMember(d) {
  const m = makeMember({ id: d.id, name: d.name, clsId: d.clsId, level: 1, look: d.look || {} });
  m.isHero = !!d.isHero;
  m.level = clamp(d.level || 1, 1, XP_CAP_LEVEL);
  m.xp = d.xp || 0;
  for (const s of ['str', 'dex', 'int', 'vit', 'spd']) {
    if (typeof d[s] === 'number') m[s] = d[s];
  }
  m.abilities = Array.isArray(d.abilities) ? d.abilities.filter(a => ABILITIES[a]) : [];
  learnAbilitiesFor(m);   // heal missing abilities from the class table
  m.equip = { weapon: null, armor: null, shield: null, acc: null };
  if (d.equip) {
    for (const slot of ['weapon', 'armor', 'shield', 'acc']) {
      if (d.equip[slot] && ITEMS[d.equip[slot]]) m.equip[slot] = d.equip[slot];
    }
  }
  refreshMember(m);
  m.hp = clamp(typeof d.hp === 'number' ? d.hp : m.maxHp, 0, m.maxHp);
  m.mp = clamp(typeof d.mp === 'number' ? d.mp : m.maxMp, 0, m.maxMp);
  return m;
}

function saveGame(slot, pos) {
  try {
    const data = {
      version: SAVE_VERSION,
      ts: Date.now(),
      label: `${Game.party[0].name} LV${Game.party[0].level}  DAY ${Game.day}`,
      gold: Game.gold, clock: Game.clock, day: Game.day, steps: Game.steps,
      flags: Game.flags, inv: Game.inv, mapMuts: Game.mapMuts,
      journal: Game.journal || [],
      roster: Game.roster.map(serializeMember),
      partyIds: Game.party.map(m => m.id),
      pos: pos,
    };
    localStorage.setItem(SAVE_KEY(slot), JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

function readSave(slot) {
  try {
    const raw = localStorage.getItem(SAVE_KEY(slot));
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;
    if (d.version > SAVE_VERSION) return null;         // from the future: refuse
    // version < current: migrations would go here
    if (!Array.isArray(d.roster) || !d.roster.length) return null;
    return d;
  } catch (e) {
    return null;
  }
}

// Apply a save to Game and return the position to restore.
function applySave(d) {
  Game.gold = d.gold || 0;
  Game.clock = typeof d.clock === 'number' ? d.clock : 8 * 60;
  Game.day = d.day || 1;
  Game.steps = d.steps || 0;
  Game.flags = d.flags || {};
  Game.journal = Array.isArray(d.journal) ? d.journal : [];
  Game.inv = {};
  for (const id in (d.inv || {})) if (ITEMS[id]) Game.inv[id] = d.inv[id];
  Game.roster = d.roster.map(deserializeMember);
  Game.party = (d.partyIds || []).map(id => Game.roster.find(m => m.id === id)).filter(Boolean);
  if (!Game.party.length) Game.party = [Game.roster[0]];
  Game.mapMuts = Array.isArray(d.mapMuts) ? d.mapMuts : [];
  for (const mut of Game.mapMuts) Game.world.map.setO(mut.x, mut.y, mut.o);
  return d.pos || { x: Game.world.spawn.x, y: Game.world.spawn.y };
}

function listSaves() {
  return SAVE_SLOTS.map(slot => {
    const d = readSave(slot);
    return d ? { slot, label: d.label, ts: d.ts } : { slot, label: null };
  });
}
