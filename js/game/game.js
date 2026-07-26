// game.js — global run state: clock, flags, party, inventory, world map
// mutations. Everything here must survive save/load (see save.js).
'use strict';

const Game = {
  clock: 8 * 60,          // minutes since midnight
  day: 1,
  flags: {},              // quest/world flags
  gold: 0,
  steps: 0,
  party: [],              // active members (max 4), first is the hero
  roster: [],             // everyone recruited (includes party)
  inv: {},                // itemId -> count
  mapMuts: [],            // {x,y,o} object-layer changes to reapply after gen
  world: null,            // generated world (not serialized; same seed)

  // Fresh run. Hero comes from the creation scene.
  startRun(hero) {
    this.clock = 8 * 60;
    this.day = 1;
    this.flags = {};
    this.gold = 30;
    this.steps = 0;
    this.party = [hero];
    this.roster = [hero];
    this.inv = {};
    this.mapMuts = [];
    this.journal = [];
    this.addItem('potion', 3);
    this.addItem('tonic', 1);
    this.addItem('rustysword', 1);
    this.addItem('clothes', 1);
  },

  // Back-compat shim for scenes that reset the run (game over).
  newGame() { this.startRun(makeHero('Wanderer', 'fighter')); },

  // --- inventory ------------------------------------------------------------
  addItem(id, n) { this.inv[id] = (this.inv[id] || 0) + (n || 1); },
  countItem(id) { return this.inv[id] || 0; },
  takeItem(id, n) {
    n = n || 1;
    if ((this.inv[id] || 0) < n) return false;
    this.inv[id] -= n;
    if (this.inv[id] <= 0) delete this.inv[id];
    return true;
  },
  invList(filter) {
    return Object.keys(this.inv)
      .filter(id => ITEMS[id] && (!filter || filter(ITEMS[id])))
      .map(id => ({ id, item: ITEMS[id], count: this.inv[id] }));
  },

  // Recruit a companion into roster (and party if there is room).
  recruit(compId) {
    if (this.roster.some(m => m.id === compId)) return null;
    const heroLvl = this.party[0] ? this.party[0].level : 1;
    const c = COMPANIONS.find(x => x.id === compId);
    const m = makeCompanion(compId, Math.max(c.joinLvl, heroLvl - 1));
    this.roster.push(m);
    if (this.party.length < 4) this.party.push(m);
    return m;
  },

  addJournal(text) {
    this.journal = this.journal || [];
    if (this.journal.some(j => j.text === text)) return;
    this.journal.push({ day: this.day, text });
  },

  // Record an object-layer change so saves can reapply it to the fixed world.
  mutateMap(x, y, o) {
    this.world.map.setO(x, y, o);
    this.mapMuts = this.mapMuts.filter(m => m.x !== x || m.y !== y);
    this.mapMuts.push({ x, y, o });
  },

  // --- clock ------------------------------------------------------------
  tickTime(mins) {
    this.clock += mins;
    while (this.clock >= 1440) { this.clock -= 1440; this.day++; }
  },

  hour() { return Math.floor(this.clock / 60); },

  isNight() { const h = this.hour(); return h >= 20 || h < 5; },

  clockText() {
    const h = this.hour(), m = Math.floor(this.clock % 60);
    const ap = h < 12 ? 'AM' : 'PM';
    const hh = ((h + 11) % 12) + 1;
    return `${hh}:${m < 10 ? '0' : ''}${m}${ap}`;
  },

  // 0 = full day, 1 = full night, smooth ramps at dusk/dawn.
  darkness() {
    const t = this.clock / 60;
    if (t >= 6 && t < 19) return 0;
    if (t >= 19 && t < 21) return (t - 19) / 2;
    if (t >= 21 || t < 4) return 1;
    return 1 - (t - 4) / 2;   // 4-6 dawn
  },
};
