// abilities.js — spells & martial abilities as data. The battle engine
// interprets these generically: kind + shape + status cover everything.
//
// range: 0 self, 1 melee, N ranged (needs LoS unless losFree)
// shape: 'single' | 'blast1' (3x3) | 'cross' | 'line' (3 cells toward target)
// targets: 'enemy' | 'ally' | 'any' — who the cursor may pick (AoE ignores
//          sides: fireballs burn friends. That's the puzzle.)
'use strict';

const ABILITIES = {
  // --- Fighter -------------------------------------------------------------
  cleave: {
    name: 'Cleave', mp: 3, kind: 'phys', pow: 4, range: 1, shape: 'arc',
    targets: 'enemy', fx: 'slash', sfx: 'hit',
    desc: 'Strike three cells in a sweeping arc.',
  },
  shieldbash: {
    name: 'Shield Bash', mp: 4, kind: 'phys', pow: 2, range: 1, shape: 'single',
    targets: 'enemy', status: { id: 'stun', turns: 1 }, statusChance: 0.8,
    fx: 'slash', sfx: 'hit', desc: 'Slam. May stun for a turn.',
  },
  warcry: {
    name: 'War Cry', mp: 4, kind: 'buff', pow: 0, range: 0, shape: 'self',
    targets: 'self', status: { id: 'bless', turns: 3, power: 4 },
    fx: 'buff', sfx: 'magic', desc: 'Steel yourself: +ATK for 3 turns.',
  },
  // --- Rogue ---------------------------------------------------------------
  quickstab: {
    name: 'Quick Stab', mp: 3, kind: 'phys', pow: -1, range: 1, shape: 'single',
    hits: 2, targets: 'enemy', fx: 'slash', sfx: 'hit',
    desc: 'Two fast cuts.',
  },
  smokebomb: {
    name: 'Smoke Bomb', mp: 5, kind: 'debuff', pow: 0, range: 4, shape: 'blast1',
    targets: 'enemy', status: { id: 'blind', turns: 2 }, statusChance: 1,
    losFree: true, fx: 'burst', sfx: 'magic',
    desc: 'Blind everything in the cloud, 2 turns.',
  },
  poisonblade: {
    name: 'Venom Edge', mp: 4, kind: 'phys', pow: 1, range: 1, shape: 'single',
    targets: 'enemy', status: { id: 'poison', turns: 3, power: 3 }, statusChance: 0.9,
    fx: 'slash', sfx: 'hit', desc: 'A coated blade. Poisons 3 turns.',
  },
  // --- Mage ----------------------------------------------------------------
  firebolt: {
    name: 'Firebolt', mp: 3, kind: 'magic', pow: 7, range: 5, shape: 'single',
    targets: 'enemy', fx: 'bolt', sfx: 'fire', desc: 'A dart of flame.',
  },
  emberburst: {
    name: 'Ember Burst', mp: 7, kind: 'magic', pow: 5, range: 4, shape: 'blast1',
    targets: 'any', fx: 'burst', sfx: 'fire',
    desc: 'Explodes in a 3x3 blast. Burns friend and foe.',
  },
  frostsnap: {
    name: 'Frost Snap', mp: 4, kind: 'magic', pow: 4, range: 4, shape: 'single',
    targets: 'enemy', status: { id: 'slow', turns: 2 }, statusChance: 1,
    fx: 'bolt', sfx: 'magic', desc: 'Chills: -2 move, 2 turns.',
  },
  // --- Cleric --------------------------------------------------------------
  mend: {
    name: 'Mend', mp: 4, kind: 'heal', pow: 10, range: 3, shape: 'single',
    targets: 'ally', losFree: true, fx: 'heal', sfx: 'heal',
    desc: 'Close wounds.',
  },
  bless: {
    name: 'Bless', mp: 4, kind: 'buff', pow: 0, range: 3, shape: 'single',
    targets: 'ally', status: { id: 'bless', turns: 3, power: 3 }, losFree: true,
    fx: 'buff', sfx: 'magic', desc: '+ATK for 3 turns.',
  },
  smite: {
    name: 'Smite', mp: 5, kind: 'magic', pow: 6, range: 2, shape: 'single',
    targets: 'enemy', fx: 'bolt', sfx: 'magic',
    desc: 'A hammer of light. Undead take double.',
    vsUndead: 2,
  },
  // --- Fighter (later levels) ------------------------------------------------
  sunder: {
    name: 'Sunder', mp: 5, kind: 'phys', pow: 2, range: 1, shape: 'single',
    targets: 'enemy', status: { id: 'sunder', turns: 3, power: 4 }, statusChance: 1,
    fx: 'slash', sfx: 'hit', desc: 'Crush armor: -DEF for 3 turns.',
  },
  whirlwind: {
    name: 'Whirlwind', mp: 8, kind: 'phys', pow: 2, range: 0, shape: 'ring',
    targets: 'self', fx: 'slash', sfx: 'crit', desc: 'Strike every adjacent cell.',
  },
  rally: {
    name: 'Rally', mp: 8, kind: 'buff', pow: 0, range: 3, shape: 'blast1',
    targets: 'ally', status: { id: 'bless', turns: 3, power: 3 }, losFree: true,
    fx: 'buff', sfx: 'magic', desc: 'Bolster allies nearby: +ATK.',
  },
  ironhide: {
    name: 'Iron Hide', mp: 5, kind: 'buff', pow: 0, range: 0, shape: 'self',
    targets: 'self', status: { id: 'shield', turns: 3, power: 5 },
    fx: 'buff', sfx: 'magic', desc: 'Grit teeth: +DEF for 3 turns.',
  },
  execute: {
    name: 'Execute', mp: 7, kind: 'phys', pow: 3, range: 1, shape: 'single',
    targets: 'enemy', execute: true, fx: 'slash', sfx: 'crit',
    desc: 'Twice the pain to a wounded foe.',
  },
  // --- Rogue (later levels) --------------------------------------------------
  mark: {
    name: 'Mark Prey', mp: 3, kind: 'debuff', pow: 0, range: 4, shape: 'single',
    targets: 'enemy', status: { id: 'mark', turns: 3 }, statusChance: 1, losFree: true,
    fx: 'buff', sfx: 'magic', desc: 'Expose a weakness: +CRIT against it.',
  },
  fanknives: {
    name: 'Fan of Knives', mp: 6, kind: 'phys', pow: 1, range: 1, shape: 'arc',
    targets: 'enemy', fx: 'slash', sfx: 'hit', desc: 'Blades across three cells.',
  },
  garrote: {
    name: 'Garrote', mp: 6, kind: 'phys', pow: 1, range: 1, shape: 'single',
    targets: 'enemy', status: { id: 'stun', turns: 1 }, statusChance: 0.9,
    fx: 'slash', sfx: 'hit', desc: 'Silent chokehold. Stuns.',
  },
  eviscerate: {
    name: 'Eviscerate', mp: 8, kind: 'phys', pow: 5, range: 1, shape: 'single',
    targets: 'enemy', hits: 2, fx: 'slash', sfx: 'crit',
    desc: 'Two savage cuts. Loves an exposed back.',
  },
  // --- Mage (later levels) -----------------------------------------------------
  chainspark: {
    name: 'Chain Spark', mp: 6, kind: 'magic', pow: 5, range: 4, shape: 'line',
    targets: 'any', fx: 'bolt', sfx: 'magic', desc: 'Lightning in a line of three.',
  },
  drain: {
    name: 'Soul Drain', mp: 6, kind: 'magic', pow: 5, range: 3, shape: 'single',
    targets: 'enemy', drain: true, fx: 'bolt', sfx: 'magic',
    desc: 'Steal life: heal half the harm.',
  },
  stonefist: {
    name: 'Stone Fist', mp: 7, kind: 'magic', pow: 7, range: 3, shape: 'single',
    targets: 'enemy', status: { id: 'stun', turns: 1 }, statusChance: 0.5,
    fx: 'bolt', sfx: 'hit', desc: 'A boulder from nowhere. May stun.',
  },
  blizzard: {
    name: 'Blizzard', mp: 10, kind: 'magic', pow: 6, range: 4, shape: 'blast1',
    targets: 'any', status: { id: 'slow', turns: 2 }, statusChance: 1,
    fx: 'burst', sfx: 'magic', desc: 'A frozen burst. Slows all it touches.',
  },
  arcshield: {
    name: 'Arc Shield', mp: 6, kind: 'buff', pow: 0, range: 2, shape: 'single',
    targets: 'ally', status: { id: 'shield', turns: 3, power: 6 }, losFree: true,
    fx: 'buff', sfx: 'magic', desc: 'Woven lightning: +DEF.',
  },
  meteor: {
    name: 'Meteor', mp: 16, kind: 'magic', pow: 12, range: 5, shape: 'blast1',
    targets: 'any', losFree: true, fx: 'burst', sfx: 'fire',
    desc: 'The sky falls where you point.',
  },
  // --- Cleric (later levels) --------------------------------------------------
  sanctuary: {
    name: 'Sanctuary', mp: 7, kind: 'buff', pow: 0, range: 3, shape: 'blast1',
    targets: 'ally', status: { id: 'shield', turns: 3, power: 4 }, losFree: true,
    fx: 'buff', sfx: 'magic', desc: 'Hallowed ground: +DEF nearby.',
  },
  silence: {
    name: 'Still Tongue', mp: 5, kind: 'debuff', pow: 0, range: 4, shape: 'single',
    targets: 'enemy', status: { id: 'silence', turns: 2 }, statusChance: 0.9, losFree: true,
    fx: 'buff', sfx: 'magic', desc: 'Words fail them: no abilities.',
  },
  radiance: {
    name: 'Radiance', mp: 9, kind: 'heal', pow: 8, range: 3, shape: 'blast1',
    targets: 'ally', losFree: true, fx: 'heal', sfx: 'heal',
    desc: 'Warm light mends all allies in it.',
  },
  quicken: {
    name: 'Quicken', mp: 6, kind: 'buff', pow: 0, range: 3, shape: 'single',
    targets: 'ally', status: { id: 'haste', turns: 3, power: 2 }, losFree: true,
    fx: 'buff', sfx: 'magic', desc: 'Borrowed time: +2 MOVE.',
  },
  revive: {
    name: 'Breath of Dawn', mp: 12, kind: 'revive', pow: 0, range: 2, shape: 'single',
    targets: 'ally', losFree: true, fx: 'heal', sfx: 'levelup',
    desc: 'Call a fallen ally back to their feet.',
  },
  banish: {
    name: 'Banish', mp: 10, kind: 'magic', pow: 8, range: 3, shape: 'single',
    targets: 'enemy', vsUndead: 2.5, fx: 'bolt', sfx: 'magic',
    desc: 'Unmake the unnatural. Undead suffer greatly.',
  },
  holynova: {
    name: 'Holy Nova', mp: 14, kind: 'magic', pow: 9, range: 0, shape: 'ring',
    targets: 'self', vsUndead: 2, fx: 'burst', sfx: 'magic',
    desc: 'A ring of daybreak around you.',
  },
  // --- Enemy-only ----------------------------------------------------------
  e_heal: {
    name: 'Murk Mending', mp: 4, kind: 'heal', pow: 8, range: 4, shape: 'single',
    targets: 'ally', losFree: true, fx: 'heal', sfx: 'heal', desc: '',
  },
  e_bless: {
    name: 'Bone Chant', mp: 4, kind: 'buff', pow: 0, range: 4, shape: 'single',
    targets: 'ally', status: { id: 'bless', turns: 3, power: 3 }, losFree: true,
    fx: 'buff', sfx: 'magic', desc: '',
  },
  e_zap: {
    name: 'Marsh Spark', mp: 3, kind: 'magic', pow: 5, range: 4, shape: 'single',
    targets: 'enemy', fx: 'bolt', sfx: 'magic', desc: '',
  },
  e_powershot: {
    name: 'Power Shot', mp: 4, kind: 'phys', pow: 4, range: 5, shape: 'single',
    targets: 'enemy', fx: 'bolt', sfx: 'hit', desc: '',
  },
  e_howl: {
    name: 'Howl', mp: 3, kind: 'buff', pow: 0, range: 0, shape: 'self',
    targets: 'self', status: { id: 'bless', turns: 2, power: 3 },
    fx: 'buff', sfx: 'magic', desc: '',
  },
  e_enrage: {
    name: 'Redmane Rage', mp: 0, kind: 'buff', pow: 0, range: 0, shape: 'self',
    targets: 'self', status: { id: 'bless', turns: 99, power: 5 },
    fx: 'buff', sfx: 'crit', desc: '',
  },
};

const STATUS_DEFS = {
  stun:    { name: 'STUN', color: () => C.YELLOW },
  slow:    { name: 'SLOW', color: () => C.CYAN },
  blind:   { name: 'BLIND', color: () => C.SLATE },
  bless:   { name: 'ATK+', color: () => C.ORANGE },
  poison:  { name: 'PSN', color: () => C.GREEN },
  guard:   { name: 'DEF+', color: () => C.STEEL },
  shield:  { name: 'DEF+', color: () => C.STEEL },
  sunder:  { name: 'DEF-', color: () => C.RED },
  mark:    { name: 'MARK', color: () => C.YELLOW },
  silence: { name: 'MUTE', color: () => C.PURPLE },
  haste:   { name: 'FAST', color: () => C.CYAN },
};
