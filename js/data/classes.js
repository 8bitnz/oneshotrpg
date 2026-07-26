// classes.js — class definitions (stats, growth, ability learn tables) and
// the companion cast. Recruitment is wired in the town/content milestones;
// the data lives here so every system can reference it.
'use strict';

const CLASSES = {
  fighter: {
    name: 'Fighter', hp: 30, mp: 6, hpL: 5, mpL: 1, move: 4,
    stats: { str: 9, dex: 7, int: 4, vit: 9, spd: 8 },
    growth: { str: 1.2, dex: 0.6, int: 0.3, vit: 1.0, spd: 0.5 },
    learn: { 1: ['cleave'], 3: ['shieldbash'], 5: ['warcry'], 6: ['ironhide'], 8: ['sunder'], 11: ['whirlwind'], 14: ['rally'], 17: ['execute'] },
    desc: 'Steel and stubbornness. Holds the line.',
  },
  rogue: {
    name: 'Rogue', hp: 24, mp: 10, hpL: 4, mpL: 1, move: 5,
    stats: { str: 7, dex: 12, int: 6, vit: 6, spd: 12 },
    growth: { str: 0.8, dex: 1.2, int: 0.5, vit: 0.6, spd: 0.9 },
    learn: { 1: ['quickstab'], 3: ['poisonblade'], 5: ['smokebomb'], 8: ['mark'], 11: ['fanknives'], 14: ['garrote'], 17: ['eviscerate'] },
    desc: 'Strikes from the side you forgot to watch.',
  },
  mage: {
    name: 'Mage', hp: 18, mp: 24, hpL: 3, mpL: 3, move: 4,
    stats: { str: 4, dex: 7, int: 13, vit: 5, spd: 8 },
    growth: { str: 0.3, dex: 0.5, int: 1.3, vit: 0.4, spd: 0.5 },
    learn: { 1: ['firebolt'], 3: ['frostsnap'], 5: ['emberburst'], 8: ['chainspark'], 9: ['drain'], 11: ['stonefist'], 14: ['blizzard'], 17: ['arcshield'], 19: ['meteor'] },
    desc: 'Burns books, then enemies.',
  },
  cleric: {
    name: 'Cleric', hp: 24, mp: 18, hpL: 4, mpL: 2, move: 4,
    stats: { str: 7, dex: 6, int: 11, vit: 7, spd: 7 },
    growth: { str: 0.6, dex: 0.4, int: 1.1, vit: 0.8, spd: 0.4 },
    learn: { 1: ['mend'], 3: ['bless'], 5: ['smite'], 6: ['silence'], 8: ['sanctuary'], 9: ['quicken'], 11: ['radiance'], 14: ['revive'], 17: ['banish'], 19: ['holynova'] },
    desc: 'The light listens. Sometimes it answers.',
  },
};

// The recruitable cast. `where` hints the recruitment site (wired in M5/M7).
// Party of 4 active; the rest wait at the Emberhold tavern.
const COMPANIONS = [
  {
    id: 'bram', name: 'Bram', cls: 'fighter', joinLvl: 1,
    where: 'willowbrook', how: 'tavern',
    look: { hair: C.WOOD, tunic: C.BLUE, trim: C.YELLOW, beard: true },
    persona: 'Retired wall guard. Talks to his shield. Its name is Doris.',
    greeting: '"Roads are bad. You will want a shield between you and them."',
    banter: [
      'Doris creaks. Bram pats the shield. "Easy, girl."',
      '"I have been stabbed eleven times. Every one a lesson."',
      '"Four of us now. Doris says that is a proper shield wall."',
      '"My knees predict rain. My knees have never once been wrong."',
    ],
  },
  {
    id: 'wren', name: 'Wren', cls: 'rogue', joinLvl: 1,
    where: 'willowbrook', how: 'quest_rats',
    look: { hood: C.SLATE, tunic: C.DGREEN, pants: C.VOID },
    persona: 'Poacher, pickpocket, professionally unnoticed.',
    greeting: '"You did not see me. But fine, yes, I am for hire."',
    banter: [
      'Wren counts a purse. You did not see her take it.',
      '"Locks are just doors that want flattery."',
      '"I checked everyone for loose purses. Professionally. You all passed."',
      'Wren walks a coin over her knuckles. It vanishes. She looks as surprised as you.',
    ],
  },
  {
    id: 'maro', name: 'Maro', cls: 'mage', joinLvl: 2,
    where: 'emberhold', how: 'tavern',
    look: { hood: C.PURPLE, robe: true, tunic: C.PURPLE },
    persona: 'Expelled from the Emberhold Lyceum for "enthusiasm".',
    greeting: '"They said fire magic was a phase. HA."',
    banter: [
      'Maro smells faintly of smoke. Always.',
      '"The Lyceum will beg. I will consider it. Briefly."',
      '"Fireproof is a spectrum," Maro says, patting out a sleeve.',
      '"I have a theory about the shrines. I have nine theories. Pick a number."',
    ],
  },
  {
    id: 'sela', name: 'Sela', cls: 'cleric', joinLvl: 2,
    where: 'emberhold', how: 'temple',
    look: { hair: C.YELLOW, robe: true, tunic: C.WHITE, robeCol: C.STEEL },
    persona: 'Left the temple to find where the prayers actually go.',
    greeting: '"The light is thinner out there. Someone should carry it."',
    banter: [
      'Sela hums an old hymn. The night feels smaller.',
      '"I do not heal wounds. I argue with them."',
      '"I count the party\'s breaths at night. Habit. Keep breathing, please."',
      '"The dark is not empty. That is not always a bad thing."',
    ],
  },
  {
    id: 'dorn', name: 'Dorn', cls: 'fighter', joinLvl: 4,
    where: 'thornfield', how: 'quest_harvest',
    look: { hair: C.ORANGE, tunic: C.DGREEN, pants: C.BROWN, beard: true },
    persona: 'Farmer with a war hammer and a grudge against wolves.',
    greeting: '"Wolves took the herd. I aim to bill them for it."',
    banter: [
      'Dorn eyes the treeline. "Wolves," he says, to no one.',
      '"A hammer solves most things. The rest, a bigger hammer."',
      '"Good hammer weather," Dorn says. It is not clear what would not be.',
      '"The herd is avenged twice over. The THIRD time is for me."',
    ],
  },
  {
    id: 'ivy', name: 'Ivy', cls: 'rogue', joinLvl: 5,
    where: 'saltmere', how: 'tavern',
    look: { hair: C.RED, tunic: C.NAVY, pants: C.SLATE },
    persona: 'Ex-smuggler. Knows every cove and half the lies about them.',
    greeting: '"Passage? Ha. I only sail toward trouble now."',
    banter: [
      'Ivy whittles a little boat, frowns at it, starts over.',
      '"The sea keeps secrets. I kept the good ones."',
      '"If we die on land I will be furious. I promised the sea first claim."',
      'Ivy reads the clouds like a ledger. "Storm owes us two days yet."',
    ],
  },
  {
    id: 'edda', name: 'Edda', cls: 'cleric', joinLvl: 7,
    where: 'frosthollow', how: 'quest_howling',
    look: { hood: C.CYAN, robe: true, tunic: C.NAVY, robeCol: C.NAVY, skin: C.TAN },
    persona: 'Keeper of the northern shrines. Hears the wind too clearly.',
    greeting: '"The tower screams at night. You hear it too, now."',
    banter: [
      'Edda tilts her head, listening to something you cannot hear.',
      '"Cold preserves. That is not always a mercy."',
      '"The wind is quieter since the tower. It says thank you. Roughly."',
      'Edda leaves a pinch of salt at every crossroads. "Manners," she says.',
    ],
  },
  {
    id: 'zash', name: 'Zash', cls: 'mage', joinLvl: 8,
    where: 'duskwell', how: 'secret',
    look: { hood: C.SAND, robe: true, tunic: C.ORANGE, skin: C.WOOD },
    persona: 'Sand-witch of the dunes. Collects lightning in jars.',
    greeting: '"You walked the long way. The sand told me."',
    banter: [
      'One of Zash\'s jars flickers. She taps it approvingly.',
      '"Storms are just rivers that lost patience."',
      'A jar at Zash\'s hip crackles. "Not yet," she tells it, fondly.',
      '"The desert misses you already. It said so. It is a terrible liar."',
    ],
  },
];
