// worldgen.js — deterministic overworld generation. Same seed, same world,
// every playthrough. Layout is authored (continent lobes, location sites,
// road network); noise only roughens the edges.
'use strict';

const WORLD_SEED = 0xE3B7A21;
const WORLD_W = 208, WORLD_H = 208;

// Authored location sites (fractions of map size; snapped to fitting land).
const WORLD_SITES = [
  { id: 'willowbrook', name: 'Willowbrook', sub: 'a quiet village', type: 'town', obj: 'HOUSE', fx: 0.47, fy: 0.66 },
  { id: 'emberhold', name: 'Emberhold', sub: 'the last city', type: 'city', obj: 'CASTLE', fx: 0.50, fy: 0.47 },
  { id: 'thornfield', name: 'Thornfield', sub: 'farms and fences', type: 'town', obj: 'HOUSE', fx: 0.66, fy: 0.55 },
  { id: 'saltmere', name: 'Saltmere', sub: 'smells of fish and tar', type: 'town', obj: 'HOUSE', fx: 0.24, fy: 0.52, coast: true },
  { id: 'duskwell', name: 'Duskwell', sub: 'an oasis in the waste', type: 'town', obj: 'HOUSE', fx: 0.30, fy: 0.74 },
  { id: 'frosthollow', name: 'Frosthollow', sub: 'huddled against the cold', type: 'town', obj: 'HOUSE', fx: 0.45, fy: 0.16 },
  { id: 'mirefen', name: 'Mirefen', sub: 'houses on stilts', type: 'town', obj: 'HOUSE', fx: 0.71, fy: 0.72 },
  { id: 'barrowdown', name: 'Barrowdown Crypt', sub: 'the dead are restless', type: 'dungeon', obj: 'RUINS', fx: 0.54, fy: 0.71 },
  { id: 'gloomroot', name: 'Gloomroot Cave', sub: 'a dark mouth in the hill', type: 'dungeon', obj: 'CAVE', fx: 0.36, fy: 0.58 },
  { id: 'sunkenkeep', name: 'The Sunken Keep', sub: 'drowned stones', type: 'dungeon', obj: 'RUINS', fx: 0.78, fy: 0.79 },
  { id: 'emberdeep', name: 'Emberdeep Mine', sub: 'echoes below', type: 'dungeon', obj: 'CAVE', fx: 0.56, fy: 0.28 },
  { id: 'howlingtower', name: 'The Howling Tower', sub: 'wind screams through it', type: 'dungeon', obj: 'TOWER', fx: 0.30, fy: 0.13 },
  { id: 'serpentmaw', name: "The Serpent's Maw", sub: 'swallowed by sand', type: 'dungeon', obj: 'RUINS', fx: 0.22, fy: 0.82 },
  { id: 'mtcinder', name: 'Mount Cinder', sub: 'the old fire wakes', type: 'dungeon', obj: 'CAVE', fx: 0.78, fy: 0.20 },
  { id: 'shrine_dawn', name: 'Shrine of Dawn', sub: '', type: 'shrine', obj: 'SHRINE', fx: 0.41, fy: 0.44 },
  { id: 'shrine_gale', name: 'Shrine of Gales', sub: '', type: 'shrine', obj: 'SHRINE', fx: 0.69, fy: 0.40 },
  { id: 'shrine_stone', name: 'Shrine of Stone', sub: '', type: 'shrine', obj: 'SHRINE', fx: 0.29, fy: 0.30 },
  { id: 'shrine_dusk', name: 'Shrine of Dusk', sub: '', type: 'shrine', obj: 'SHRINE', fx: 0.61, fy: 0.76 },
];

const WORLD_ROADS = [
  ['willowbrook', 'emberhold'],
  ['emberhold', 'thornfield'],
  ['emberhold', 'saltmere'],
  ['willowbrook', 'barrowdown'],
  ['thornfield', 'mirefen'],
  ['saltmere', 'duskwell'],
];

function generateWorld() {
  const W = WORLD_W, H = WORLD_H;
  const map = new GameMap(W, H);
  const elevN = FractalNoise(WORLD_SEED, 5, 0.012);
  const moistN = FractalNoise(WORLD_SEED + 999, 4, 0.02);
  const forestN = FractalNoise(WORLD_SEED + 5555, 4, 0.05);
  const r = RNG(WORLD_SEED);

  // --- elevation from authored lobes + noise -------------------------------
  const lobes = [
    { x: 0.52, y: 0.50, rx: 0.40, ry: 0.38, h: 0.62 },   // main continent
    { x: 0.30, y: 0.28, rx: 0.20, ry: 0.18, h: 0.55 },
    { x: 0.76, y: 0.24, rx: 0.17, ry: 0.15, h: 0.58 },
    { x: 0.28, y: 0.72, rx: 0.19, ry: 0.16, h: 0.55 },
    { x: 0.72, y: 0.74, rx: 0.17, ry: 0.15, h: 0.52 },
    { x: 0.09, y: 0.86, rx: 0.06, ry: 0.05, h: 0.50 },   // islands
    { x: 0.91, y: 0.55, rx: 0.05, ry: 0.05, h: 0.50 },
    { x: 0.11, y: 0.11, rx: 0.05, ry: 0.05, h: 0.50 },
  ];
  const ridges = [
    { x: 0.40, y: 0.30, rx: 0.10, ry: 0.06, h: 0.34 },
    { x: 0.54, y: 0.26, rx: 0.11, ry: 0.06, h: 0.38 },
    { x: 0.68, y: 0.23, rx: 0.09, ry: 0.06, h: 0.36 },
    { x: 0.78, y: 0.20, rx: 0.055, ry: 0.05, h: 0.52 },  // Mount Cinder
    { x: 0.20, y: 0.42, rx: 0.06, ry: 0.09, h: 0.30 },   // west ridge
    { x: 0.60, y: 0.62, rx: 0.05, ry: 0.05, h: 0.26 },   // central hills
  ];

  const elev = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const fx = x / W, fy = y / H;
      let e = 0;
      for (const b of lobes) {
        const dx = (fx - b.x) / b.rx, dy = (fy - b.y) / b.ry;
        const d = dx * dx + dy * dy;
        if (d < 1.6) e = Math.max(e, b.h * (1 - d * 0.62));
      }
      e += (elevN(x, y) - 0.5) * 0.34;
      for (const b of ridges) {
        const dx = (fx - b.x) / b.rx, dy = (fy - b.y) / b.ry;
        const d = dx * dx + dy * dy;
        if (d < 1) e += b.h * (1 - d) * (0.7 + 0.6 * elevN(x * 3 + 900, y * 3));
      }
      elev[y * W + x] = e;
    }
  }

  // --- terrain bands --------------------------------------------------------
  const SEA = 0.30, COAST = 0.335, BEACH = 0.36;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const e = elev[y * W + x];
      const fy = y / H;
      const moist = moistN(x, y);
      let g;
      if (e < SEA) g = GT.DEEP;
      else if (e < COAST) g = GT.WATER;
      else if (e < BEACH) g = GT.SAND;
      else {
        // land biomes
        const wob = (elevN(x * 2 + 4000, y * 2) - 0.5) * 0.35;   // roughen biome edges
        const snow = fy < 0.20 + (elevN(x + 4000, y) - 0.5) * 0.05;
        const desert = inLobe(fx2(x, W), fy2(y, H), 0.28, 0.74, 0.16 * (1 + wob), 0.13 * (1 + wob)) && moist < 0.62;
        const swamp = inLobe(fx2(x, W), fy2(y, H), 0.72, 0.75, 0.13 * (1 + wob), 0.11 * (1 + wob)) && moist > 0.35 && e < 0.52;
        if (e > 0.88) g = GT.GRASS;         // peaks placed as objects below
        else if (snow) g = GT.SNOW;
        else if (desert) g = GT.DESERT;
        else if (swamp) g = GT.SWAMP;
        else if (moist > 0.72 && e < 0.45) g = GT.SWAMP;
        else if (moist < 0.30 && fy > 0.55) g = GT.DESERT;
        else g = GT.GRASS;
      }
      map.setG(x, y, g);
      // mountains & peaks as blocking objects
      if (e >= 0.72 && g !== GT.DEEP && g !== GT.WATER) {
        map.setO(x, y, e >= 0.86 ? OT.PEAK : OT.MTN);
      }
    }
  }

  // Volcano crater: lava at the very top of Mount Cinder
  const vc = { x: Math.round(0.78 * W), y: Math.round(0.20 * H) };
  for (let y = vc.y - 3; y <= vc.y + 3; y++) {
    for (let x = vc.x - 3; x <= vc.x + 3; x++) {
      if (dist2(x, y, vc.x, vc.y) <= 6 && map.inBounds(x, y)) {
        map.setG(x, y, GT.LAVA); map.setO(x, y, OT.NONE);
      }
    }
  }

  // --- rivers: descend from mountain sources to the sea ---------------------
  const riverSrcs = [];
  for (let tries = 0; tries < 400 && riverSrcs.length < 7; tries++) {
    const x = r.i(10, W - 11), y = r.i(10, H - 11);
    if (elev[y * W + x] > 0.68 && map.g(x, y) !== GT.LAVA) riverSrcs.push({ x, y });
  }
  for (const src of riverSrcs) {
    let { x, y } = src;
    for (let steps = 0; steps < 400; steps++) {
      const g = map.g(x, y);
      if (g === GT.DEEP || g === GT.WATER) break;
      map.setG(x, y, GT.WATER);
      map.setO(x, y, OT.NONE);
      // flow to the lowest neighbor (noise-jittered); join water if adjacent
      let best = null, bestE = Infinity;
      for (const d of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = x + d[0], ny = y + d[1];
        if (!map.inBounds(nx, ny)) { best = null; break; }
        const ng = map.g(nx, ny);
        if ((ng === GT.WATER || ng === GT.DEEP) && steps > 2) { best = { x: nx, y: ny }; break; }
        const ne = elev[ny * W + nx] + (r.f() - 0.5) * 0.04;
        if (ne < bestE) { bestE = ne; best = { x: nx, y: ny }; }
      }
      if (!best) break;
      x = best.x; y = best.y;
    }
  }

  // --- coastline sand -------------------------------------------------------
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const g = map.g(x, y);
      if (g === GT.GRASS || g === GT.DESERT || g === GT.SNOW || g === GT.SWAMP) {
        const adjWater =
          isWater(map.g(x + 1, y)) || isWater(map.g(x - 1, y)) ||
          isWater(map.g(x, y + 1)) || isWater(map.g(x, y - 1));
        if (adjWater && map.g(x, y) !== GT.SWAMP && elevN(x + 7777, y) > 0.35) map.setG(x, y, GT.SAND);
      }
    }
  }

  // --- place location sites -------------------------------------------------
  const locations = [];
  for (const site of WORLD_SITES) {
    const want = { x: Math.round(site.fx * W), y: Math.round(site.fy * H) };
    const spot = findSpot(map, want.x, want.y, site.coast);
    const loc = { id: site.id, name: site.name, sub: site.sub, type: site.type, x: spot.x, y: spot.y };
    // clear a small courtyard, then drop the marker object
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const gx = spot.x + dx, gy = spot.y + dy;
        if (!map.inBounds(gx, gy)) continue;
        if (!GROUND[map.g(gx, gy)].walk) map.setG(gx, gy, GT.GRASS);
        map.setO(gx, gy, OT.NONE);
      }
    }
    map.setO(spot.x, spot.y, OT[site.obj]);
    locations.push(loc);
  }
  const locById = {};
  for (const l of locations) locById[l.id] = l;

  // --- roads (A* with terrain costs; bridges over water) --------------------
  for (const [a, b] of WORLD_ROADS) {
    const path = roadPath(map, elev, locById[a], locById[b]);
    if (!path) continue;
    for (const p of path) {
      const o = map.o(p.x, p.y);
      if (o !== OT.NONE && !OBJ[o].enter) map.setO(p.x, p.y, OT.NONE);
      const g = map.g(p.x, p.y);
      if (g === GT.WATER || g === GT.DEEP) map.setG(p.x, p.y, GT.BRIDGE);
      else if (g !== GT.BRIDGE) map.setG(p.x, p.y, GT.ROAD);
    }
  }

  // --- vegetation & decoration ----------------------------------------------
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (map.o(x, y) !== OT.NONE) continue;
      const g = map.g(x, y);
      const f = forestN(x, y);
      const fy = y / H;
      if (g === GT.GRASS) {
        if (f > 0.76) map.setO(x, y, OT.THICK);
        else if (f > 0.60) map.setO(x, y, fy < 0.30 ? OT.PINES : (f > 0.68 ? OT.TREE : (r.chance(0.7) ? OT.TREE : OT.BUSH)));
        else if (f < 0.24 && r.chance(0.05)) map.setO(x, y, OT.ROCK);
        else if (r.chance(0.012)) map.setO(x, y, OT.BUSH);
        else if (f > 0.45 && f < 0.55 && r.chance(0.02)) map.setG(x, y, GT.MEADOW);
      } else if (g === GT.SNOW) {
        if (f > 0.64) map.setO(x, y, OT.SNOWTREE);
        else if (r.chance(0.02)) map.setO(x, y, OT.ROCK);
      } else if (g === GT.DESERT) {
        if (r.chance(0.03)) map.setO(x, y, OT.CACTUS);
        else if (r.chance(0.015)) map.setO(x, y, OT.ROCK);
        else if (r.chance(0.004)) map.setO(x, y, OT.BONES);
      } else if (g === GT.SWAMP) {
        if (f > 0.66) map.setO(x, y, OT.DEADTREE);
        else if (r.chance(0.02)) map.setO(x, y, OT.MUSHROOM);
      }
    }
  }

  // Handful of overworld curiosities (graves, statues, standing stones).
  scatter(map, r, OT.GRAVE, 8, (g) => g === GT.GRASS || g === GT.SWAMP);
  scatter(map, r, OT.STATUE, 5, (g) => g === GT.GRASS || g === GT.DESERT || g === GT.SNOW);
  scatter(map, r, OT.PILLAR, 6, (g) => g === GT.DESERT || g === GT.GRASS);

  // Bandit camp set-piece beside the Willowbrook-Emberhold road, ~2/3 along.
  {
    const a = locById.willowbrook, b = locById.emberhold;
    const mx = Math.round(lerp(a.x, b.x, 0.66)), my = Math.round(lerp(a.y, b.y, 0.66));
    let placed = false;
    outer:
    for (let rad = 0; rad < 20 && !placed; rad++) {
      for (let dy = -rad; dy <= rad && !placed; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const x = mx + dx, y = my + dy;
          if (map.g(x, y) === GT.ROAD) {
            // put the camp on a walkable tile next to the road
            for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const cx = x + d[0], cy = y + d[1];
              if (map.walkable(cx, cy) && map.o(cx, cy) === OT.NONE && map.g(cx, cy) !== GT.ROAD) {
                map.setO(cx, cy, OT.CAMP);
                placed = true;
                break outer;
              }
            }
          }
        }
      }
    }
  }

  // --- quest markers & secrets ------------------------------------------------
  const placeNear = (cx, cy, obj, opts) => {
    for (let rad = 2; rad < 26; rad++) {
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const x = cx + dx, y = cy + dy;
          if (!map.inBounds(x, y)) continue;
          if (opts && opts.water) {
            if (map.g(x, y) !== GT.DEEP && map.g(x, y) !== GT.WATER) continue;
          } else {
            if (!map.walkable(x, y) || map.o(x, y) !== OT.NONE) continue;
            if (map.g(x, y) === GT.ROAD) continue;
          }
          map.setO(x, y, obj);
          return { x, y };
        }
      }
    }
    return null;
  };

  const markers = {};
  markers.wolfden = placeNear(locById.thornfield.x + 5, locById.thornfield.y - 5, OT.WOLFDEN);
  markers.wreck = placeNear(
    Math.round((locById.duskwell.x + locById.serpentmaw.x) / 2),
    Math.round((locById.duskwell.y + locById.serpentmaw.y) / 2), OT.WRECK);
  markers.buoy = placeNear(locById.saltmere.x - 6, locById.saltmere.y, OT.BUOY, { water: true });

  // island caches (reachable only by skiff)
  const worldChests = [];
  const isleSpots = [
    { fx: 0.09, fy: 0.86, id: 'isle_sw' },
    { fx: 0.91, fy: 0.55, id: 'isle_e' },
    { fx: 0.11, fy: 0.11, id: 'isle_nw' },
  ];
  for (const s of isleSpots) {
    const spot = findSpot(map, Math.round(s.fx * W), Math.round(s.fy * H), false);
    if (spot) {
      map.setO(spot.x, spot.y, OT.CHEST);
      worldChests.push({ x: spot.x, y: spot.y, id: s.id });
    }
  }

  // the standing stones (a trio; they are fed at night)
  const stones = findSpot(map, Math.round(0.57 * W), Math.round(0.55 * H), false);
  if (stones) {
    map.setO(stones.x, stones.y, OT.PILLAR);
    if (map.walkable(stones.x + 1, stones.y + 1)) map.setO(stones.x + 1, stones.y + 1, OT.PILLAR);
    if (map.walkable(stones.x - 1, stones.y + 1)) map.setO(stones.x - 1, stones.y + 1, OT.PILLAR);
  }

  // Spawn: just south of Willowbrook's gate
  const wb = locById.willowbrook;
  const spawn = findSpot(map, wb.x, wb.y + 2, false);

  return { map, elev, locations, locById, spawn, markers, worldChests, stones };
}

function fx2(x, w) { return x / w; }
function fy2(y, h) { return y / h; }
function inLobe(fx, fy, cx, cy, rx, ry) {
  const dx = (fx - cx) / rx, dy = (fy - cy) / ry;
  return dx * dx + dy * dy < 1;
}
function isWater(g) { return g === GT.WATER || g === GT.DEEP; }

// Spiral-search the nearest tile suitable for a site marker.
function findSpot(map, x0, y0, wantCoast) {
  for (let rad = 0; rad < 30; rad++) {
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
        const x = x0 + dx, y = y0 + dy;
        if (!map.inBounds(x, y)) continue;
        const g = map.g(x, y);
        if (!GROUND[g].walk) continue;
        if (map.o(x, y) !== OT.NONE && !OBJ[map.o(x, y)].walk) continue;
        if (wantCoast) {
          const nearWater = isWater(map.g(x + 1, y)) || isWater(map.g(x - 1, y)) ||
            isWater(map.g(x, y + 1)) || isWater(map.g(x, y - 1)) ||
            isWater(map.g(x + 2, y)) || isWater(map.g(x - 2, y));
          if (!nearWater) continue;
        }
        return { x, y };
      }
    }
  }
  return { x: x0, y: y0 };
}

function scatter(map, r, obj, count, groundOk) {
  for (let placed = 0, tries = 0; placed < count && tries < 500; tries++) {
    const x = r.i(4, map.w - 5), y = r.i(4, map.h - 5);
    if (map.o(x, y) === OT.NONE && groundOk(map.g(x, y)) && GROUND[map.g(x, y)].walk) {
      map.setO(x, y, obj); placed++;
    }
  }
}

// --- A* road routing ---------------------------------------------------------
function roadPath(map, elev, from, to) {
  const W = map.w, H = map.h;
  const open = new MinHeap();
  const gScore = new Float32Array(W * H).fill(Infinity);
  const cameFrom = new Int32Array(W * H).fill(-1);
  const start = from.y * W + from.x, goal = to.y * W + to.x;
  gScore[start] = 0;
  open.push(start, 0);
  const stepCost = (x, y) => {
    const g = map.g(x, y);
    if (g === GT.ROAD || g === GT.BRIDGE) return 0.4;
    if (g === GT.GRASS || g === GT.MEADOW) return 1;
    if (g === GT.SAND || g === GT.DESERT || g === GT.SNOW || g === GT.DIRT) return 1.6;
    if (g === GT.SWAMP) return 4;
    if (g === GT.WATER) return 14;
    if (g === GT.DEEP) return 60;
    if (g === GT.LAVA) return 900;
    return 2;
  };
  const objCost = (x, y) => {
    const o = map.o(x, y);
    if (o === OT.NONE) return 0;
    const od = OBJ[o];
    if (od.enter) return 0;
    if (o === OT.MTN) return 24;
    if (o === OT.PEAK) return 120;
    return 1.5;
  };
  while (open.size()) {
    const cur = open.pop();
    if (cur === goal) {
      const path = [];
      let n = cur;
      while (n !== -1) { path.push({ x: n % W, y: (n / W) | 0 }); n = cameFrom[n]; }
      return path.reverse();
    }
    const cx = cur % W, cy = (cur / W) | 0;
    for (const d of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = cx + d[0], ny = cy + d[1];
      if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1) continue;
      const ni = ny * W + nx;
      // Deterministic per-tile jitter keeps roads from ruling straight lines.
      // Needs full avalanche mixing: weak hashes leave whole columns cheap.
      let jh = Math.imul(nx, 374761393) + Math.imul(ny, 668265263);
      jh = Math.imul(jh ^ (jh >>> 13), 1274126177);
      const jitter = (((jh ^ (jh >>> 16)) >>> 0) % 256) / 255 * 0.9;
      const cost = stepCost(nx, ny) + objCost(nx, ny) + jitter +
        Math.abs(elev[ni] - elev[cur]) * 12;
      const t = gScore[cur] + cost;
      if (t < gScore[ni]) {
        gScore[ni] = t;
        cameFrom[ni] = cur;
        open.push(ni, t + manhattan(nx, ny, to.x, to.y) * 0.4);
      }
    }
  }
  return null;
}

class MinHeap {
  constructor() { this.k = []; this.p = []; }
  size() { return this.k.length; }
  push(key, pri) {
    this.k.push(key); this.p.push(pri);
    let i = this.k.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (this.p[par] <= this.p[i]) break;
      this.swap(i, par); i = par;
    }
  }
  pop() {
    const top = this.k[0];
    const lk = this.k.pop(), lp = this.p.pop();
    if (this.k.length) {
      this.k[0] = lk; this.p[0] = lp;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < this.k.length && this.p[l] < this.p[m]) m = l;
        if (r < this.k.length && this.p[r] < this.p[m]) m = r;
        if (m === i) break;
        this.swap(i, m); i = m;
      }
    }
    return top;
  }
  swap(a, b) {
    [this.k[a], this.k[b]] = [this.k[b], this.k[a]];
    [this.p[a], this.p[b]] = [this.p[b], this.p[a]];
  }
}

// Danger tier 0..4 by distance from the starting village + biome.
function dangerAt(world, x, y) {
  const wb = world.locById.willowbrook;
  const d = Math.sqrt(dist2(x, y, wb.x, wb.y));
  let tier = d < 26 ? 0 : d < 55 ? 1 : d < 90 ? 2 : 3;
  const g = world.map.g(x, y);
  if (g === GT.SWAMP || g === GT.SNOW) tier += 1;
  const vc = world.locById.mtcinder;
  if (dist2(x, y, vc.x, vc.y) < 900) tier = 4;
  return clamp(tier, 0, 4);
}
