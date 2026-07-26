// items.js — the item registry. kind: weapon | armor | shield | acc |
// consumable | key. `classes` restricts equipping (absent = anyone).
// `lore` marks uniques with a story; more uniques land in the content pass.
'use strict';

const ITEMS = {
  // --- weapons ---------------------------------------------------------------
  rustysword:  { name: 'Rusty Sword', kind: 'weapon', atk: 2, price: 15, desc: 'Better than fists. Barely.' },
  shortsword:  { name: 'Short Sword', kind: 'weapon', atk: 4, price: 60, desc: 'The honest classic.' },
  ironsword:   { name: 'Iron Sword', kind: 'weapon', atk: 7, price: 180, desc: 'Weight you can trust.' },
  steelsword:  { name: 'Steel Sword', kind: 'weapon', atk: 10, price: 450, desc: 'Sharp enough to shave with.' },
  dagger:      { name: 'Dagger', kind: 'weapon', atk: 3, spd: 1, price: 40, classes: ['rogue', 'mage'], desc: 'Quick and quiet.' },
  stiletto:    { name: 'Stiletto', kind: 'weapon', atk: 6, spd: 1, price: 220, classes: ['rogue'], desc: 'Finds the gap in any armor.' },
  huntingbow:  { name: 'Hunting Bow', kind: 'weapon', atk: 4, range: 4, price: 120, classes: ['rogue'], desc: 'Reach out and touch trouble.' },
  longbow:     { name: 'Longbow', kind: 'weapon', atk: 7, range: 5, price: 380, classes: ['rogue'], desc: 'Yew heartwood, far-seeing.' },
  mace:        { name: 'Mace', kind: 'weapon', atk: 5, price: 110, classes: ['fighter', 'cleric'], desc: 'Blunt theology.' },
  warhammer:   { name: 'War Hammer', kind: 'weapon', atk: 9, price: 400, classes: ['fighter'], desc: 'Argues with walls. Wins.' },
  oakstaff:    { name: 'Oak Staff', kind: 'weapon', atk: 2, int: 1, price: 45, classes: ['mage', 'cleric'], desc: 'Good for walking. Better for warding.' },
  emberstaff:  { name: 'Ember Staff', kind: 'weapon', atk: 4, int: 3, price: 320, classes: ['mage'], desc: 'Warm to the touch. Always.' },
  holyrod:     { name: 'Holy Rod', kind: 'weapon', atk: 3, int: 2, price: 260, classes: ['cleric'], desc: 'Hums near the wicked.' },
  // --- armor -----------------------------------------------------------------
  clothes:     { name: 'Traveling Clothes', kind: 'armor', def: 1, price: 10, desc: 'Road dust included.' },
  leather:     { name: 'Leather Armor', kind: 'armor', def: 3, price: 70, desc: 'Creaks, but holds.' },
  studded:     { name: 'Studded Leather', kind: 'armor', def: 5, price: 200, desc: 'Extra bite for the biter.' },
  chainmail:   { name: 'Chain Mail', kind: 'armor', def: 7, price: 420, classes: ['fighter', 'cleric'], desc: 'A thousand tiny shields.' },
  platemail:   { name: 'Plate Mail', kind: 'armor', def: 10, spd: -1, price: 900, classes: ['fighter'], desc: 'A walking fortress.' },
  robes:       { name: 'Robes', kind: 'armor', def: 1, mp: 4, price: 30, classes: ['mage', 'cleric'], desc: 'Pockets full of chalk.' },
  magerobe:    { name: 'Lyceum Robe', kind: 'armor', def: 3, int: 2, mp: 8, price: 350, classes: ['mage'], desc: 'Singed at the hem. Naturally.' },
  templerobe:  { name: 'Temple Vestment', kind: 'armor', def: 3, int: 1, mp: 6, price: 300, classes: ['cleric'], desc: 'Smells of candle smoke.' },
  // --- shields ---------------------------------------------------------------
  buckler:     { name: 'Buckler', kind: 'shield', def: 1, price: 40, classes: ['fighter', 'rogue', 'cleric'], desc: 'A polite disagreement.' },
  kiteshield:  { name: 'Kite Shield', kind: 'shield', def: 3, price: 180, classes: ['fighter', 'cleric'], desc: 'Covers what matters.' },
  towershield: { name: 'Tower Shield', kind: 'shield', def: 5, spd: -1, price: 500, classes: ['fighter'], desc: 'A door with opinions.' },
  // --- accessories -------------------------------------------------------------
  speedboots:  { name: 'Fleet Boots', kind: 'acc', spd: 2, price: 300, desc: 'The road feels shorter.' },
  powerring:   { name: 'Ring of Might', kind: 'acc', str: 2, price: 350, desc: 'Heavy little promise.' },
  focuscharm:  { name: 'Focus Charm', kind: 'acc', int: 2, price: 350, desc: 'The mind, sharpened.' },
  luckcoin:    { name: 'Lucky Coin', kind: 'acc', dex: 2, price: 320, desc: 'Heads, always.' },
  vitamulet:   { name: 'Hale Amulet', kind: 'acc', vit: 2, price: 340, desc: 'Steadies the heart.' },
  // --- consumables -------------------------------------------------------------
  potion:      { name: 'Potion', kind: 'consumable', heal: 18, price: 12, desc: 'Restores 18 HP. Tastes of moss.' },
  hipotion:    { name: 'Strong Potion', kind: 'consumable', heal: 45, price: 40, desc: 'Restores 45 HP. Tastes worse.' },
  ether:       { name: 'Ether', kind: 'consumable', mpHeal: 12, price: 30, desc: 'Restores 12 MP. Fizzes oddly.' },
  hiether:     { name: 'Strong Ether', kind: 'consumable', mpHeal: 30, price: 90, desc: 'Restores 30 MP.' },
  tonic:       { name: 'Tonic', kind: 'consumable', cure: true, price: 20, desc: 'Cures poison and blindness.' },
  bomb:        { name: 'Fire Bomb', kind: 'consumable', dmg: 20, throwable: true, price: 50, desc: 'Throw it. Duck.' },
  phoenixash:  { name: 'Phoenix Ash', kind: 'consumable', revive: 0.5, price: 250, desc: 'Wakes the fallen at half strength.' },
  tent:        { name: 'Camp Kit', kind: 'consumable', camp: true, price: 60, desc: 'Rest on the overworld. Restores the party.' },
  torch:       { name: 'Torch', kind: 'tool', price: 8, desc: 'Pushes back the dark of the deep places.' },
  // --- regional gear (content pass) ---------------------------------------------
  scimitar:    { name: 'Scimitar', kind: 'weapon', atk: 8, spd: 1, price: 300, classes: ['fighter', 'rogue'], desc: 'A curve the desert taught.' },
  boneknife:   { name: 'Bone Knife', kind: 'weapon', atk: 5, dex: 1, price: 150, classes: ['rogue'], desc: 'Mirefen make. Do not ask whose.' },
  harpoon:     { name: 'Harpoon', kind: 'weapon', atk: 8, range: 2, price: 340, classes: ['fighter'], desc: 'Reaches farther than manners allow.' },
  frostbrand:  { name: 'Frostbrand', kind: 'weapon', atk: 11, price: 700, classes: ['fighter'], desc: 'Cold enough to burn.' },
  stormstaff:  { name: 'Storm Staff', kind: 'weapon', atk: 5, int: 4, price: 600, classes: ['mage'], desc: 'It hums before thunder does.' },
  dawnmace:    { name: 'Dawn Mace', kind: 'weapon', atk: 8, int: 2, price: 550, classes: ['cleric'], desc: 'Sunrise, weaponized.' },
  greatbow:    { name: 'Greatbow', kind: 'weapon', atk: 10, range: 5, price: 750, classes: ['rogue'], desc: 'A ship mast with opinions.' },
  coralmail:   { name: 'Coral Mail', kind: 'armor', def: 6, price: 380, desc: 'The sea grows better armor than smiths forge.' },
  furarmor:    { name: 'Fur-Lined Coat', kind: 'armor', def: 5, vit: 1, price: 320, desc: 'Frosthollow winters demand it.' },
  scalearmor:  { name: 'Wyrmscale', kind: 'armor', def: 9, price: 800, classes: ['fighter', 'rogue'], desc: 'Shed, not taken. Probably.' },
  stormrobe:   { name: 'Stormcaller Robe', kind: 'armor', def: 4, int: 3, mp: 10, price: 650, classes: ['mage', 'cleric'], desc: 'Crackles when you are angry.' },
  mirrorshield:{ name: 'Mirror Shield', kind: 'shield', def: 4, price: 520, classes: ['fighter', 'cleric'], desc: 'Your enemies see the problem: themselves.' },
  wardcharm:   { name: 'Ward Charm', kind: 'acc', vit: 1, int: 1, price: 400, desc: 'Bad luck slides off it.' },
  serpentring: { name: 'Serpent Ring', kind: 'acc', dex: 2, spd: 1, price: 600, desc: 'It squeezes gently when danger is near.' },
  emberamulet: { name: 'Ember Amulet', kind: 'acc', str: 1, int: 2, price: 650, desc: 'Warm as a held coal.' },
  // --- uniques (lore items) ------------------------------------------------------
  barrowblade: { name: 'Barrowblade', kind: 'weapon', atk: 12, price: 800, desc: 'Grave-cold steel that never dulls.', lore: 'The Barrow King carried it into the earth. It carried him back out.' },
  silkcloak:   { name: 'Gloomsilk Cloak', kind: 'armor', def: 6, spd: 1, price: 700, classes: ['rogue', 'mage', 'cleric'], desc: 'Woven from the dark itself.', lore: 'Spun in Gloomroot by legs beyond counting.' },
  tidebrand:   { name: 'Tidebrand', kind: 'weapon', atk: 13, price: 900, classes: ['fighter'], desc: 'Wet, always. Sharp, always.', lore: 'The Drowned Knight would not let go. You insisted.' },
  wyrmfang:    { name: 'Wyrmfang', kind: 'weapon', atk: 11, dex: 2, price: 900, classes: ['rogue'], desc: 'Curved like the dune it slept under.', lore: 'One of the Sand-Wyrm\'s thousand teeth. The sharpest one.' },
  stormheart_staff: { name: 'Stormheart', kind: 'weapon', atk: 6, int: 6, price: 1000, classes: ['mage'], desc: 'A piece of weather on a stick.', lore: 'What screamed in the tower screams for you now.' },
  forgehammer: { name: 'Forge-Wight\'s Maul', kind: 'weapon', atk: 14, spd: -1, price: 1000, classes: ['fighter'], desc: 'Still warm from a fire three ages cold.', lore: 'It remembers every blade it ever made. It regrets some.' },
  hermitcloak: { name: 'Hermit\'s Mantle', kind: 'armor', def: 5, int: 2, mp: 8, price: 750, classes: ['mage', 'cleric'], desc: 'Patched with sailcloth and patience.', lore: 'Left folded on a rock, as if he knew you were coming.' },
  moonpendant: { name: 'Moonstone Pendant', kind: 'acc', int: 2, spd: 1, price: 800, desc: 'It waxes and wanes. Currently: waxing.', lore: 'Found where the standing stones eat their bread.' },
  blackflag:   { name: 'Corsair\'s Band', kind: 'acc', str: 2, dex: 1, price: 700, desc: 'Worn by someone the sea finally kept.', lore: 'From the pirate cache on the southern isle.' },
  // --- key/quest items --------------------------------------------------------
  crypt_key:   { name: 'Barrow Key', kind: 'key', price: 0, desc: 'Cold iron, colder teeth.', lore: 'Taken from a bandit who should not have had it.' },
  ember_shard1:{ name: 'Ember Shard (Barrow)', kind: 'key', price: 0, desc: 'A third of an old fire, cold as guilt.', lore: '"One of three. The deep keeps the second. The wind keeps the third."' },
  ember_shard2:{ name: 'Ember Shard (Deep)', kind: 'key', price: 0, desc: 'A third of an old fire. It hums like the mine once did.' },
  ember_shard3:{ name: 'Ember Shard (Wind)', kind: 'key', price: 0, desc: 'A third of an old fire. It flickers with each gust.' },
  first_ember: { name: 'The First Ember', kind: 'key', price: 0, desc: 'The old fire, whole. It knows the way home.', lore: 'Vane\'s vault kept it for three hundred years. Now it rides with you.' },
  skiff:       { name: 'Skiff', kind: 'key', price: 0, desc: 'A boat of your very own. The sea disagrees about "own."' },
  old_lens:    { name: 'The Old Lens', kind: 'key', price: 0, desc: 'Lighthouse glass, warm as a lie.', lore: 'From the top of the Howling Tower. It was a lighthouse. For what sea?' },
  hunters_pack:{ name: 'Hunter\'s Pack', kind: 'key', price: 0, desc: 'Webbed, weathered, someone\'s whole life.' },
  wedding_ring:{ name: 'Miner\'s Ring', kind: 'key', price: 0, desc: 'A plain band, kept polished by the dark.', lore: 'Found beside quiet bones in the Emberdeep.' },
};

function itemName(id) { return ITEMS[id] ? ITEMS[id].name : id; }
