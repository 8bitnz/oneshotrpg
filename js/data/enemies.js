// enemies.js — enemy type definitions and encounter composition.
// AI archetypes: brute (charge), archer (kite), shaman (support),
// wolf (flank), boss (scripted). Stats are pre-M4 baseline; the balance
// pass revisits every number here.
'use strict';

const ENEMY_TYPES = {
  rat: {
    name: 'Giant Rat', ai: 'brute', tier: 0,
    hp: 12, str: 5, dex: 8, int: 2, def: 2, spd: 10, move: 4,
    xp: 6, gold: [0, 2],
    sprite: () => beastSprites({ body: C.BROWN, belly: C.TAN, eye: C.RED, size: 0 }),
  },
  wolf: {
    name: 'Wolf', ai: 'wolf', tier: 0,
    hp: 16, str: 7, dex: 10, int: 3, def: 3, spd: 13, move: 6,
    xp: 10, gold: [0, 0],
    sprite: () => beastSprites({ body: C.GRAY, belly: C.STEEL, eye: C.YELLOW }),
  },
  slime: {
    name: 'Marsh Slime', ai: 'brute', tier: 0,
    hp: 20, str: 5, dex: 4, int: 2, def: 5, spd: 5, move: 3,
    xp: 8, gold: [0, 3],
    sprite: () => blobSprites({ body: C.SWAMPY, hi: C.GREEN }),
  },
  bandit: {
    name: 'Bandit', ai: 'brute', tier: 1,
    hp: 24, str: 9, dex: 8, int: 4, def: 5, spd: 9, move: 4,
    xp: 14, gold: [3, 9],
    sprite: () => charSprites({ hair: C.VOID, tunic: C.MAROON, pants: C.SLATE, beard: true }),
  },
  banditArcher: {
    name: 'Bandit Archer', ai: 'archer', tier: 1,
    hp: 18, str: 7, dex: 11, int: 4, def: 3, spd: 11, move: 4, range: 5,
    xp: 16, gold: [3, 8], abilities: ['e_powershot'],
    sprite: () => charSprites({ hood: C.DGREEN, tunic: C.BROWN, pants: C.WOOD }),
  },
  mireShaman: {
    name: 'Mire Shaman', ai: 'shaman', tier: 1,
    hp: 20, str: 5, dex: 7, int: 11, def: 3, spd: 8, move: 3, mp: 20,
    xp: 20, gold: [4, 10], abilities: ['e_heal', 'e_bless', 'e_zap'],
    sprite: () => charSprites({ hood: C.SWAMPY, robe: true, tunic: C.SWAMPY, skin: C.GREEN }),
  },
  boss_redmane: {
    name: 'Capt. Redmane', ai: 'boss_redmane', tier: 1, boss: true,
    hp: 70, str: 12, dex: 9, int: 5, def: 7, spd: 10, move: 4, mp: 10,
    xp: 80, gold: [40, 60], abilities: ['cleave', 'e_enrage'],
    sprite: () => charSprites({ hair: C.RED, tunic: C.BLOOD, trim: C.YELLOW, pants: C.VOID, beard: true }),
  },
  // --- Barrowdown Crypt (undead) ---------------------------------------------
  skeleton: {
    name: 'Skeleton', ai: 'brute', tier: 1, undead: true,
    hp: 22, str: 9, dex: 7, int: 2, def: 6, spd: 8, move: 4,
    xp: 15, gold: [2, 8],
    sprite: () => skeletonSprites(),
  },
  boneArcher: {
    name: 'Bone Archer', ai: 'archer', tier: 1, undead: true,
    hp: 17, str: 8, dex: 10, int: 2, def: 4, spd: 10, move: 4, range: 5,
    xp: 17, gold: [2, 8], abilities: ['e_powershot'],
    sprite: () => skeletonSprites({ eye: C.CYAN, dark: C.SLATE }),
  },
  wraith: {
    name: 'Wraith', ai: 'shaman', tier: 2, undead: true,
    hp: 26, str: 6, dex: 9, int: 12, def: 4, spd: 11, move: 5, mp: 24,
    xp: 26, gold: [5, 14], abilities: ['e_zap', 'e_bless', 'e_heal'],
    sprite: () => charSprites({ hood: C.SLATE, robe: true, tunic: C.SLATE, skin: C.VOID }),
  },
  boss_barrowking: {
    name: 'The Barrow King', ai: 'boss_barrowking', tier: 2, boss: true, undead: true,
    hp: 110, str: 13, dex: 8, int: 10, def: 9, spd: 9, move: 4, mp: 30,
    xp: 150, gold: [80, 120], abilities: ['e_zap', 'e_enrage'],
    sprite: () => charSprites({ helmet: C.YELLOW, tunic: C.SLATE, trim: C.YELLOW, skin: C.WHITE, pants: C.VOID }),
  },
  // --- Gloomroot Cave (beasts) --------------------------------------------------
  spiderling: {
    name: 'Spiderling', ai: 'brute', tier: 1,
    hp: 10, str: 6, dex: 11, int: 2, def: 2, spd: 13, move: 6,
    xp: 8, gold: [0, 2],
    sprite: () => spiderSprites({ size: 0 }),
  },
  caveSpider: {
    name: 'Cave Spider', ai: 'wolf', tier: 1,
    hp: 24, str: 9, dex: 11, int: 3, def: 4, spd: 12, move: 6,
    xp: 20, gold: [0, 5], poisonBite: true,
    sprite: () => spiderSprites({}),
  },
  shrieker: {
    name: 'Shrieker Bat', ai: 'wolf', tier: 1,
    hp: 14, str: 7, dex: 13, int: 2, def: 2, spd: 15, move: 7,
    xp: 12, gold: [0, 0],
    sprite: () => beastSprites({ body: C.SLATE, belly: C.STEEL, eye: C.YELLOW, size: 0, tail: false }),
  },
  boss_broodmother: {
    name: 'The Broodmother', ai: 'boss_broodmother', tier: 2, boss: true,
    hp: 95, str: 12, dex: 10, int: 4, def: 7, spd: 9, move: 5, mp: 20,
    xp: 140, gold: [50, 90],
    sprite: () => spiderSprites({ body: C.MAROON, mark: C.YELLOW, eye: C.YELLOW }),
  },
  // --- tier 2: wider wilds ------------------------------------------------------
  bogLurker: {
    name: 'Bog Lurker', ai: 'brute', tier: 2,
    hp: 46, str: 12, dex: 6, int: 3, def: 8, spd: 6, move: 3,
    xp: 26, gold: [4, 12],
    sprite: () => blobSprites({ body: C.SWAMPY, hi: C.CYAN }),
  },
  frostWolf: {
    name: 'Frost Wolf', ai: 'wolf', tier: 2,
    hp: 36, str: 14, dex: 12, int: 3, def: 5, spd: 14, move: 6,
    xp: 24, gold: [0, 0],
    sprite: () => beastSprites({ body: C.STEEL, belly: C.WHITE, eye: C.CYAN }),
  },
  duneStalker: {
    name: 'Dune Stalker', ai: 'wolf', tier: 2,
    hp: 34, str: 14, dex: 12, int: 4, def: 4, spd: 13, move: 6, poisonBite: true,
    xp: 25, gold: [0, 6],
    sprite: () => beastSprites({ body: C.TAN, belly: C.SAND, eye: C.RED }),
  },
  scarab: {
    name: 'Brass Scarab', ai: 'brute', tier: 2,
    hp: 30, str: 10, dex: 8, int: 2, def: 12, spd: 7, move: 4,
    xp: 24, gold: [6, 16],
    sprite: () => spiderSprites({ body: C.ORANGE, mark: C.YELLOW, eye: C.VOID }),
  },
  marauder: {
    name: 'Marauder', ai: 'brute', tier: 2,
    hp: 40, str: 12, dex: 9, int: 4, def: 7, spd: 9, move: 4,
    xp: 26, gold: [8, 20],
    sprite: () => charSprites({ helmet: C.WOOD, tunic: C.STONE, pants: C.VOID, beard: true }),
  },
  hexer: {
    name: 'Hexer', ai: 'shaman', tier: 2,
    hp: 32, str: 6, dex: 8, int: 13, def: 4, spd: 9, move: 4, mp: 26,
    xp: 30, gold: [8, 18], abilities: ['e_zap', 'e_bless', 'e_heal'],
    sprite: () => charSprites({ hood: C.MAROON, robe: true, tunic: C.MAROON, skin: C.TAN }),
  },
  // --- tier 3: deep wilds & dungeons -----------------------------------------
  iceShade: {
    name: 'Ice Shade', ai: 'archer', tier: 3, undead: true,
    hp: 45, str: 14, dex: 13, int: 8, def: 5, spd: 12, move: 5, range: 5,
    xp: 40, gold: [6, 16], abilities: ['e_powershot'],
    sprite: () => charSprites({ hood: C.CYAN, robe: true, tunic: C.NAVY, skin: C.VOID }),
  },
  yetiBrute: {
    name: 'Rimehulk', ai: 'brute', tier: 3,
    hp: 85, str: 21, dex: 6, int: 2, def: 9, spd: 7, move: 4,
    xp: 54, gold: [10, 24],
    sprite: () => beastSprites({ body: C.WHITE, belly: C.STEEL, eye: C.NAVY }),
  },
  mireDrake: {
    name: 'Mire Drake', ai: 'brute', tier: 3,
    hp: 70, str: 17, dex: 9, int: 6, def: 8, spd: 10, move: 5, mp: 12,
    xp: 50, gold: [12, 26], abilities: ['e_zap'],
    sprite: () => beastSprites({ body: C.DGREEN, belly: C.GREEN, eye: C.YELLOW }),
  },
  deepCrawler: {
    name: 'Deep Crawler', ai: 'wolf', tier: 3, poisonBite: true,
    hp: 55, str: 15, dex: 13, int: 3, def: 6, spd: 13, move: 6,
    xp: 44, gold: [0, 10],
    sprite: () => spiderSprites({ body: C.STONE, mark: C.RED, eye: C.YELLOW }),
  },
  emberGolem: {
    name: 'Ember Golem', ai: 'brute', tier: 3,
    hp: 85, str: 19, dex: 5, int: 2, def: 14, spd: 5, move: 3,
    xp: 58, gold: [14, 30],
    sprite: () => skeletonSprites({ bone: C.STONE, dark: C.ORANGE, eye: C.ORANGE }),
  },
  stormCaller: {
    name: 'Storm Caller', ai: 'shaman', tier: 3, undead: true,
    hp: 52, str: 8, dex: 10, int: 18, def: 5, spd: 10, move: 4, mp: 30,
    xp: 52, gold: [10, 26], abilities: ['e_zap', 'e_bless', 'e_heal'],
    sprite: () => charSprites({ hood: C.NAVY, robe: true, tunic: C.PURPLE, skin: C.VOID }),
  },
  deepMaw: {
    name: 'Deep Maw', ai: 'brute', tier: 3,
    hp: 85, str: 18, dex: 8, int: 3, def: 7, spd: 9, move: 5,
    xp: 60, gold: [20, 45],
    sprite: () => blobSprites({ body: C.DEEPSEA, hi: C.CYAN }),
  },
  // --- tier 4: the mountain ------------------------------------------------------
  cinderCultist: {
    name: 'Cinder Cultist', ai: 'brute', tier: 4,
    hp: 80, str: 21, dex: 10, int: 6, def: 8, spd: 10, move: 4,
    xp: 65, gold: [15, 32],
    sprite: () => charSprites({ hood: C.BLOOD, robe: true, tunic: C.BLOOD, skin: C.TAN }),
  },
  cinderAcolyte: {
    name: 'Cinder Acolyte', ai: 'shaman', tier: 4,
    hp: 60, str: 8, dex: 9, int: 19, def: 6, spd: 10, move: 4, mp: 34,
    xp: 70, gold: [16, 34], abilities: ['e_zap', 'e_bless', 'e_heal'],
    sprite: () => charSprites({ hood: C.ORANGE, robe: true, tunic: C.MAROON, skin: C.TAN }),
  },
  flameRevenant: {
    name: 'Flame Revenant', ai: 'archer', tier: 4, undead: true,
    hp: 65, str: 17, dex: 14, int: 10, def: 6, spd: 13, move: 5, range: 5,
    xp: 72, gold: [12, 30], abilities: ['e_powershot'],
    sprite: () => skeletonSprites({ bone: C.ORANGE, dark: C.RED, eye: C.YELLOW }),
  },
  // --- dungeon bosses -------------------------------------------------------------
  boss_drownedknight: {
    name: 'The Drowned Knight', ai: 'boss_drownedknight', tier: 3, boss: true, undead: true,
    hp: 190, str: 19, dex: 7, int: 6, def: 12, spd: 8, move: 4, mp: 20,
    xp: 220, gold: [100, 160], abilities: ['e_enrage'],
    sprite: () => charSprites({ helmet: C.SWAMPY, tunic: C.NAVY, trim: C.CYAN, skin: C.SWAMPY, pants: C.VOID }),
  },
  boss_forgewight: {
    name: 'The Forge-Wight', ai: 'boss_forgewight', tier: 3, boss: true, undead: true,
    hp: 210, str: 21, dex: 6, int: 12, def: 11, spd: 8, move: 4, mp: 30,
    xp: 260, gold: [120, 180], abilities: ['e_zap'],
    sprite: () => skeletonSprites({ bone: C.SLATE, dark: C.ORANGE, eye: C.ORANGE }),
  },
  boss_stormheart: {
    name: 'Stormheart', ai: 'boss_stormheart', tier: 3, boss: true, undead: true,
    hp: 180, str: 10, dex: 12, int: 22, def: 8, spd: 12, move: 5, mp: 60,
    xp: 260, gold: [110, 170], abilities: ['e_zap', 'e_bless'],
    sprite: () => charSprites({ hood: C.CYAN, robe: true, tunic: C.NAVY, skin: C.VOID, trim: C.CYAN }),
  },
  boss_sandwyrm: {
    name: 'The Sand-Wyrm', ai: 'boss_sandwyrm', tier: 3, boss: true,
    hp: 220, str: 20, dex: 10, int: 4, def: 10, spd: 11, move: 8,
    xp: 280, gold: [130, 200],
    sprite: () => beastSprites({ body: C.SAND, belly: C.TAN, eye: C.RED, ears: false }),
  },
  boss_cindertyrant: {
    name: 'The Cinder Tyrant', ai: 'boss_cindertyrant', tier: 5, boss: true,
    hp: 320, str: 23, dex: 11, int: 14, def: 13, spd: 11, move: 5, mp: 60,
    xp: 600, gold: [300, 400], abilities: ['e_zap', 'e_enrage'],
    sprite: () => charSprites({ helmet: C.ORANGE, tunic: C.BLOOD, trim: C.YELLOW, skin: C.VOID, pants: C.BLOOD }),
  },
};

// Encounter tables by danger tier. Entry: [weight, composition, biomeFilter?]
// biomeFilter (optional): only used when fighting in that battle biome.
const ENCOUNTER_TABLES = {
  0: [
    [3, ['rat', 'rat']],
    [3, ['wolf', 'wolf']],
    [2, ['rat', 'rat', 'rat']],
    [2, ['slime', 'slime']],
    [1, ['wolf', 'wolf', 'wolf']],
  ],
  1: [
    [3, ['bandit', 'bandit']],
    [3, ['bandit', 'banditArcher']],
    [2, ['wolf', 'wolf', 'bandit']],
    [2, ['bandit', 'bandit', 'banditArcher']],
    [2, ['slime', 'slime', 'mireShaman'], 'swamp'],
    [1, ['banditArcher', 'banditArcher', 'mireShaman']],
  ],
  2: [
    [3, ['marauder', 'marauder']],
    [2, ['marauder', 'banditArcher', 'hexer']],
    [2, ['wolf', 'wolf', 'frostWolf']],
    [3, ['bogLurker', 'bogLurker'], 'swamp'],
    [2, ['bogLurker', 'mireShaman', 'slime'], 'swamp'],
    [3, ['duneStalker', 'duneStalker'], 'desert'],
    [2, ['scarab', 'scarab', 'duneStalker'], 'desert'],
    [3, ['frostWolf', 'frostWolf'], 'snow'],
    [2, ['iceShade', 'frostWolf'], 'snow'],
    [2, ['skeleton', 'boneArcher', 'hexer']],
  ],
  3: [
    [3, ['marauder', 'marauder', 'hexer']],
    [2, ['yetiBrute', 'frostWolf', 'frostWolf'], 'snow'],
    [2, ['iceShade', 'iceShade', 'yetiBrute'], 'snow'],
    [3, ['mireDrake', 'bogLurker'], 'swamp'],
    [2, ['mireDrake', 'mireShaman', 'mireShaman'], 'swamp'],
    [3, ['duneStalker', 'duneStalker', 'scarab'], 'desert'],
    [2, ['scarab', 'scarab', 'hexer'], 'desert'],
    [2, ['deepCrawler', 'deepCrawler'], 'cave'],
    [2, ['emberGolem', 'deepCrawler'], 'cave'],
    [2, ['wraith', 'skeleton', 'skeleton', 'boneArcher']],
  ],
  4: [
    [3, ['cinderCultist', 'cinderCultist', 'cinderAcolyte']],
    [2, ['flameRevenant', 'flameRevenant', 'cinderAcolyte']],
    [2, ['emberGolem', 'emberGolem', 'cinderAcolyte']],
    [2, ['cinderCultist', 'flameRevenant', 'emberGolem']],
    [1, ['yetiBrute', 'yetiBrute', 'stormCaller'], 'snow'],
  ],
  sea: [
    [3, ['deepMaw']],
    [2, ['deepMaw', 'slime', 'slime']],
    [1, ['deepMaw', 'deepMaw']],
  ],
};

function rollEncounter(tier, biome) {
  let table = ENCOUNTER_TABLES[tier] || ENCOUNTER_TABLES[1];
  // prefer biome-tagged entries when they exist for this biome
  const tagged = table.filter(e => e[2] === biome);
  const untagged = table.filter(e => !e[2]);
  const pool = tagged.length ? tagged.concat(untagged.map(e => [Math.max(1, e[0] - 1), e[1]])) : untagged;
  let total = 0;
  for (const [w] of pool) total += w;
  let roll = rng.f() * total;
  for (const [w, comp] of pool) {
    roll -= w;
    if (roll <= 0) return comp.slice();
  }
  return pool[0][1].slice();
}
