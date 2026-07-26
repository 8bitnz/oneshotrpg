// dungeons.js — dungeon definitions + deterministic floor generator.
// Every floor regenerates identically from its seed; opened chests, pulled
// levers, woken graves and dead bosses persist as Game.flags entries.
'use strict';

const DUNGEONS = {
  barrowdown: {
    name: 'Barrowdown Crypt', floors: 2, seed: 0xDEAD01,
    needKey: 'crypt_key',
    lockedText: 'An iron gate, older than the town it guards against. It wants a key.',
    encounters: [['skeleton', 'skeleton'], ['skeleton', 'boneArcher'], ['boneArcher', 'boneArcher', 'skeleton'], ['skeleton', 'skeleton', 'wraith']],
    boss: { type: 'boss_barrowking', adds: ['skeleton', 'boneArcher'], intro: 'A crowned thing rises from the stone throne.' },
    bossChest: { gold: [90, 140], items: ['barrowblade', 'ember_shard1', 'phoenixash'] },
    graves: true,          // gimmick: passing graves can wake the dead
    lightRadius: 4.5,
    chestLoot: [
      { gold: [15, 40] }, { gold: [10, 25], items: ['potion'] },
      { items: ['ether', 'tonic'] }, { gold: [20, 50] }, { items: ['hipotion'] },
    ],
    flavor: [
      'Coffin nails, bent outward.',
      'Scratches on the wall. Tallies. Hundreds.',
      'The dust here holds footprints. Bare, and wrong.',
    ],
  },
  gloomroot: {
    name: 'Gloomroot Cave', floors: 2, seed: 0x6100F,
    encounters: [['spiderling', 'spiderling', 'spiderling'], ['caveSpider', 'spiderling'], ['caveSpider', 'caveSpider'], ['shrieker', 'shrieker', 'spiderling']],
    boss: { type: 'boss_broodmother', adds: ['caveSpider', 'spiderling'], intro: 'The ceiling moves. It has been her all along.' },
    bossChest: { gold: [70, 110], items: ['silkcloak', 'hipotion'] },
    webs: true,            // gimmick: webbing everywhere, deeper dark,
    lightRadius: 3.6,      // glowing mushrooms as safe light pockets
    chestLoot: [
      { gold: [12, 30] }, { items: ['potion', 'potion'] }, { gold: [18, 40] },
      { items: ['ether'] }, { items: ['tonic', 'bomb'] },
    ],
    flavor: [
      'A hunter\'s pack, webbed to the wall. Its owner is not inside it.',
      'The mushrooms hum faintly. Almost a lullaby.',
      'Old torch stubs. Whoever came before you brought many. Left none.',
    ],
    flavorPickup: { idx: 0, item: 'hunters_pack' },
  },
  sunkenkeep: {
    name: 'The Sunken Keep', floors: 2, seed: 0x5EA5, ground: GT.FLOOR_STONE,
    encounters: [['bogLurker', 'bogLurker'], ['bogLurker', 'mireShaman'], ['mireDrake', 'bogLurker'], ['skeleton', 'skeleton', 'mireShaman']],
    boss: { type: 'boss_drownedknight', adds: ['bogLurker', 'mireShaman'], intro: 'Armor rises from the black water. Something is still inside it.' },
    bossChest: { gold: [110, 170], items: ['tidebrand', 'coralmail'] },
    tide: true,          // gimmick: the water rises and recedes as you walk
    bell: true,          // ring the tower bell: a hidden cache reveals itself
    lightRadius: 4.6,
    chestLoot: [
      { gold: [25, 55] }, { items: ['hipotion', 'ether'] }, { gold: [30, 60] },
      { items: ['harpoon'] }, { items: ['phoenixash'] },
    ],
    flavor: [
      'A banner, drowned so long its sigil is only a stain.',
      'High-water marks on the wall. The highest is above your head.',
      'A knight\'s gauntlet, still gripping a rail. Just the gauntlet.',
    ],
  },
  emberdeep: {
    name: 'Emberdeep Mine', floors: 3, seed: 0x3B1D, ground: GT.DFLOOR,
    encounters: [['deepCrawler', 'deepCrawler'], ['emberGolem'], ['deepCrawler', 'emberGolem'], ['skeleton', 'skeleton', 'deepCrawler']],
    boss: { type: 'boss_forgewight', adds: ['emberGolem'], intro: 'At the anvil, something keeps working. It never heard the evacuation bell.' },
    bossChest: { gold: [130, 190], items: ['forgehammer', 'ember_shard2'] },
    tremors: true,       // gimmick: the mountain shrugs; rubble and ambushes
    lava: true,          // lava veins light the deep floors
    minerBones: true,    // Widow Karst's husband is down here
    lightRadius: 4.2,
    chestLoot: [
      { gold: [30, 70] }, { items: ['hipotion', 'hipotion'] }, { gold: [40, 80] },
      { items: ['hiether'] }, { items: ['emberamulet'] },
    ],
    flavor: [
      'A lunch pail, rusted shut. Packed for a shift that never ended.',
      'Chalk on the wall: "DO NOT SING". Underlined twice.',
      'Pick-marks stop mid-swing, all at once, all facing the same way.',
    ],
  },
  howlingtower: {
    name: 'The Howling Tower', floors: 3, seed: 0x40A1, tower: true,
    encounters: [['iceShade', 'iceShade'], ['stormCaller', 'iceShade'], ['shrieker', 'shrieker', 'iceShade'], ['skeleton', 'boneArcher', 'stormCaller']],
    boss: { type: 'boss_stormheart', adds: ['iceShade', 'iceShade'], intro: 'At the top, the wind has a shape. It has been waiting to be heard.' },
    bossChest: { gold: [120, 180], items: ['stormheart_staff', 'ember_shard3', 'old_lens'] },
    wind: true,          // gimmick: gusts shove you a tile between rooms
    lightRadius: 5.0,
    chestLoot: [
      { gold: [25, 60] }, { items: ['stormrobe'] }, { gold: [30, 65] },
      { items: ['hiether', 'tonic'] },
    ],
    flavor: [
      'Bird bones. Hundreds. All facing the stairs.',
      'A logbook: "No ships again today. It is not for ships." The hand is steady.',
      'Scratched into the sill: "the light keeps it OUT keeps it OUT keeps it"',
    ],
  },
  serpentmaw: {
    name: "The Serpent's Maw", floors: 2, seed: 0x5A9D, ground: GT.SAND,
    encounters: [['duneStalker', 'duneStalker'], ['scarab', 'scarab'], ['duneStalker', 'scarab', 'hexer'], ['scarab', 'scarab', 'scarab']],
    boss: { type: 'boss_sandwyrm', adds: ['duneStalker'], intro: 'The floor is not floor. It never was.' },
    bossChest: { gold: [140, 200], items: ['wyrmfang', 'serpentring'] },
    quicksand: true,     // gimmick: pits of soft sand drop you to the floor below
    lightRadius: 5.2,
    chestLoot: [
      { gold: [35, 75] }, { items: ['scimitar'] }, { gold: [40, 80] },
      { items: ['hipotion', 'tonic'] },
    ],
    flavor: [
      'Silver coins, half-swallowed by the sand. You know better now.',
      'A nomad\'s marker: a warning, or a prayer. Possibly both.',
      'The walls are smooth. Polished. By what passes through.',
    ],
  },
  mtcinder: {
    name: 'Mount Cinder', floors: 3, seed: 0xF1AE, ground: GT.DFLOOR,
    needFlag: 'got_first_ember',
    lockedText: 'The mountain\'s throat is sealed in cooled slag. Only the First Ember can open the way.',
    encounters: [['cinderCultist', 'cinderCultist'], ['cinderCultist', 'cinderAcolyte'], ['flameRevenant', 'cinderAcolyte'], ['emberGolem', 'flameRevenant'], ['cinderCultist', 'flameRevenant', 'cinderAcolyte']],
    boss: { type: 'boss_cindertyrant', adds: ['cinderAcolyte', 'flameRevenant'], intro: '"You carried it HOME," the Tyrant says, delighted. "Give it here."' },
    bossChest: { gold: [200, 300], items: [] },
    lava: true, tremors: true,
    finale: true,        // victory here ends the tale
    lightRadius: 5.5,
    chestLoot: [
      { gold: [50, 100] }, { items: ['hipotion', 'phoenixash'] }, { gold: [60, 110] },
      { items: ['hiether', 'hiether'] },
    ],
    flavor: [
      'Cultist graffiti: a crude sun with too many teeth.',
      'The heat has opinions. All of them about you.',
      'Old shrine stones, repurposed as kindling. Someone should answer for that.',
    ],
  },
};

// Generated floor: { map, rooms, entry:{x,y}, exit:{x,y}|null, traps:[{x,y}],
//                    chests:[{x,y,idx}], graves:[{x,y,idx}], boss:{x,y}|null,
//                    vaultDoor:{x,y}|null, lever:{x,y}|null, flavors:[{x,y,txt}] }
function buildDungeonFloor(dgId, floor) {
  const def = DUNGEONS[dgId];
  const r = RNG(def.seed + floor * 7717);
  const W = def.tower ? 30 : 44, H = def.tower ? 24 : 34;
  const roomTarget = def.tower ? 5 : 8;
  const fg = def.ground || GT.DFLOOR;
  const m = new GameMap(W, H);
  // solid rock
  for (let i = 0; i < m.ground.length; i++) { m.ground[i] = fg; m.obj[i] = OT.DWALL; }

  // carve rooms
  const rooms = [];
  for (let tries = 0; tries < 80 && rooms.length < roomTarget; tries++) {
    const w = r.i(5, 9), h = r.i(4, 7);
    const x = r.i(2, W - w - 2), y = r.i(2, H - h - 2);
    if (rooms.some(o => x < o.x + o.w + 2 && o.x < x + w + 2 && y < o.y + o.h + 2 && o.y < y + h + 2)) continue;
    rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) m.setO(xx, yy, OT.NONE);
  }
  // connect with L corridors in placement order
  rooms.sort((a, b) => a.cx - b.cx);
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    let x = a.cx, y = a.cy;
    while (x !== b.cx) { m.setO(x, y, OT.NONE); x += Math.sign(b.cx - x); }
    while (y !== b.cy) { m.setO(x, y, OT.NONE); y += Math.sign(b.cy - y); }
    m.setO(x, y, OT.NONE);
  }

  const entryRoom = rooms[0];
  const farRoom = rooms[rooms.length - 1];
  const entry = { x: entryRoom.cx, y: entryRoom.cy };
  m.setO(entry.x, entry.y, floor === 1 ? OT.LADDER : OT.STAIRS_UP);

  const out = {
    map: m, rooms, entry, exit: null, traps: [], chests: [], graves: [],
    boss: null, vaultDoor: null, lever: null, flavors: [], mushrooms: [],
  };

  const freeIn = (room, avoid) => {
    for (let tries = 0; tries < 40; tries++) {
      const x = r.i(room.x, room.x + room.w - 1), y = r.i(room.y, room.y + room.h - 1);
      if (m.o(x, y) !== OT.NONE) continue;
      if (avoid && avoid.some(p => p.x === x && p.y === y)) continue;
      if (x === entry.x && y === entry.y) continue;
      return { x, y };
    }
    return null;
  };

  const lastFloor = floor === def.floors;
  if (!lastFloor) {
    // stairs down in the far room
    out.exit = { x: farRoom.cx, y: farRoom.cy };
    m.setO(out.exit.x, out.exit.y, OT.STAIRS_DN);
  } else {
    // boss in the far room behind a locked vault door on its corridor
    out.boss = { x: farRoom.cx, y: farRoom.cy };
    // vault door: first corridor tile leading out of the far room westward
    let dx = farRoom.x - 1, dy = farRoom.cy;
    while (dx > 1 && m.o(dx, dy) !== OT.NONE) dx--;
    if (m.o(dx, dy) === OT.NONE) {
      out.vaultDoor = { x: dx, y: dy };
      m.setO(dx, dy, OT.DDOOR_LOCK);
    }
    // lever hidden in a middle room
    const levRoom = rooms[Math.floor(rooms.length / 2)];
    const lev = freeIn(levRoom);
    if (lev) { out.lever = lev; m.setO(lev.x, lev.y, OT.LEVER); }
    // boss treasure behind the boss
    const bc = freeIn(farRoom, [out.boss]);
    if (bc) {
      out.chests.push({ x: bc.x, y: bc.y, idx: 'boss' });
      m.setO(bc.x, bc.y, OT.CHEST);
    }
  }

  // chests
  let chestIdx = 0;
  for (const room of rooms.slice(1, -1)) {
    if (!r.chance(0.6) || chestIdx >= def.chestLoot.length) continue;
    const c = freeIn(room);
    if (!c) continue;
    out.chests.push({ x: c.x, y: c.y, idx: chestIdx++ });
    m.setO(c.x, c.y, OT.CHEST);
  }

  // traps in corridors (tiles outside all rooms)
  const inRoom = (x, y) => rooms.some(o => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h);
  const corridorTiles = [];
  for (let y = 2; y < H - 2; y++) {
    for (let x = 2; x < W - 2; x++) {
      if (m.o(x, y) === OT.NONE && !inRoom(x, y) && !(x === entry.x && y === entry.y)) {
        corridorTiles.push({ x, y });
      }
    }
  }
  r.shuffle(corridorTiles);
  let ci = 0;
  for (let placed = 0; placed < 5 + floor * 2 && ci < corridorTiles.length; ci++) {
    const c = corridorTiles[ci];
    out.traps.push({ x: c.x, y: c.y });
    placed++;
  }

  // gimmick: tide — corridor stretches that flood and drain
  if (def.tide) {
    out.floodTiles = [];
    for (let n = 0; n < 14 && ci < corridorTiles.length; ci++, n++) {
      out.floodTiles.push(corridorTiles[ci]);
    }
  }

  // gimmick: quicksand pits (drop to the next floor down)
  if (def.quicksand && floor < def.floors) {
    out.pits = [];
    for (const room of rooms.slice(1)) {
      if (!r.chance(0.6) || out.pits.length >= 3) continue;
      const p = freeIn(room);
      if (p) {
        out.pits.push(p);
        m.setG(p.x, p.y, GT.GRAVEL);    // a shade off — the observant survive
      }
    }
  }

  // gimmick: lava pools light the deep floors
  if (def.lava) {
    out.lavaTiles = [];
    for (const room of rooms) {
      if (!r.chance(floor >= 2 ? 0.6 : 0.3)) continue;
      const lx = r.chance(0.5) ? room.x : room.x + room.w - 2;
      const ly = r.chance(0.5) ? room.y : room.y + room.h - 2;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        if (m.o(lx + dx, ly + dy) === OT.NONE &&
            !(lx + dx === entry.x && ly + dy === entry.y)) {
          m.setG(lx + dx, ly + dy, GT.LAVA);
          out.lavaTiles.push({ x: lx + dx, y: ly + dy });
        }
      }
    }
  }

  // the drowned bell (floor 2 of the keep)
  if (def.bell && floor === 2) {
    const bellRoom = rooms[1];
    const b = freeIn(bellRoom);
    if (b) { out.bell = b; m.setO(b.x, b.y, OT.STATUE); }
    const sc = freeIn(rooms[2] || bellRoom);
    if (sc) out.secretChest = sc;      // revealed when the bell tolls
  }

  // the widow's husband (floor 2 of the mine)
  if (def.minerBones && floor === 2) {
    const room = rooms[r.i(1, rooms.length - 2)];
    const b = freeIn(room);
    if (b) { out.minerBones = b; m.setO(b.x, b.y, OT.BONES); }
  }

  // theme decoration
  for (const room of rooms) {
    // torches at room corners sometimes (never on top of placed features)
    if (r.chance(0.65) && m.o(room.x, room.y) === OT.NONE) m.setO(room.x, room.y, OT.TORCH);
    if (r.chance(0.4) && m.o(room.x + room.w - 1, room.y) === OT.NONE) m.setO(room.x + room.w - 1, room.y, OT.TORCH);
    if (def.graves) {
      const n = r.i(1, 3);
      for (let i = 0; i < n; i++) {
        const g = freeIn(room);
        if (g) { out.graves.push({ x: g.x, y: g.y, idx: out.graves.length }); m.setO(g.x, g.y, OT.GRAVE); }
      }
      if (r.chance(0.5)) { const b = freeIn(room); if (b) m.setO(b.x, b.y, OT.BONES); }
    }
    if (def.webs) {
      const n = r.i(1, 4);
      for (let i = 0; i < n; i++) {
        const w = freeIn(room);
        if (w) m.setO(w.x, w.y, OT.WEB);
      }
      if (r.chance(0.7)) {
        const mu = freeIn(room);
        if (mu) { m.setO(mu.x, mu.y, OT.MUSHROOM); out.mushrooms.push(mu); }
      }
      if (r.chance(0.3)) { const b = freeIn(room); if (b) m.setO(b.x, b.y, OT.BONES); }
    }
    if (r.chance(0.3)) { const rb = freeIn(room); if (rb) m.setO(rb.x, rb.y, OT.RUBBLE); }
  }

  // flavor inspection points on bones
  let fi = 0;
  for (let y = 0; y < H && fi < def.flavor.length; y++) {
    for (let x = 0; x < W && fi < def.flavor.length; x++) {
      if (m.o(x, y) === OT.BONES) out.flavors.push({ x, y, txt: def.flavor[fi++] });
    }
  }

  return out;
}
