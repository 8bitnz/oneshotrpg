// towns.js — town specifications and the town-map builder. Willowbrook and
// Emberhold ship with the towns milestone; the rest arrive in the content
// pass using the same builder.
'use strict';

// Building types decide furniture + keeper placement.
//   inn: counter, tables, beds     weapon/armor/item/magic: counter + props
//   temple: altar, pillars         house: bed/table/stove
function bldg(type, x, y, w, h, name) { return { type, x, y, w, h, name }; }

const TOWNS = {
  willowbrook: {
    name: 'Willowbrook', w: 42, h: 30, ground: GT.GRASS,
    buildings: [
      bldg('inn', 4, 4, 10, 8, 'THE DRY BOOT'),
      bldg('item', 17, 4, 7, 6, 'PELL\'S GOODS'),
      bldg('weapon', 27, 4, 8, 6, 'HARL\'S FORGE'),
      bldg('temple', 31, 14, 8, 7, 'CHAPEL'),
      bldg('house', 5, 16, 7, 6, ''),
      bldg('house', 15, 18, 7, 6, ''),
      bldg('house', 24, 16, 6, 6, ''),
    ],
    well: { x: 20, y: 13 },
    npcs: [
      {
        id: 'marla', name: 'Marla', look: { hair: C.ORANGE, tunic: C.MAROON }, in: 0,
        lines: ['"Welcome to the Dry Boot. Only dry thing in town, some years."'],
        action: { type: 'inn', price: 8 },
        rumors: true,
      },
      {
        id: 'bram_npc', name: 'Bram', look: { hair: C.WOOD, tunic: C.BLUE, trim: C.YELLOW, beard: true }, in: 0,
        recruit: 'bram',
      },
      {
        id: 'pell', name: 'Pell', look: { hair: C.VOID, tunic: C.DGREEN }, in: 1,
        lines: ['"Rope, lamps, dried meat. Everything a corpse forgot to bring."'],
        action: { type: 'shop', stock: ['potion', 'tonic', 'torch', 'tent', 'clothes'] },
      },
      {
        id: 'harl', name: 'Harl', look: { hair: C.SLATE, tunic: C.STONE, beard: true }, in: 2,
        lines: ['"Bandits on the north road snapped three blades last week. Good for business. Bad for everything else."'],
        action: { type: 'shop', stock: ['rustysword', 'shortsword', 'dagger', 'buckler', 'leather'] },
      },
      {
        id: 'ivena', name: 'Sister Ivena', look: { hair: C.YELLOW, robe: true, tunic: C.WHITE, robeCol: C.STEEL }, in: 3,
        lines: ['"The dead in the barrow do not rest. We stopped sending flowers. The flowers came back."'],
        action: { type: 'temple', healPrice: 10 },
      },
      {
        id: 'maud', name: 'Elder Maud', look: { hair: C.WHITE, tunic: C.MAROON }, in: 4,
        lines: [
          '"You feel it too, or you would not be walking with a sword."',
          '"The mountain in the northeast used to sing. Now it growls. The old fire is waking, child."',
          '"Emberhold keeps the First Ember behind its walls. Ask at the keep. Tell them Maud still remembers."',
        ],
        journal: 'Elder Maud: the old fire wakes in the northeast mountain. Ask at Emberhold keep about the First Ember.',
      },
      {
        id: 'odd', name: 'Farmer Odd', wander: true, look: { hair: C.ORANGE, tunic: C.BROWN, pants: C.DGREEN },
        lines: () => {
          if (Game.flags.boss_barrowdown_dead && !Game.flags.odd_paid) {
            Game.flags.odd_paid = true;
            Game.gold += 25;
            return { pages: ['"The barrow\'s QUIET? First time in my whole life."', '"Here. Goat money. The goats would want you to have it."'] };
          }
          if (Game.flags.boss_barrowdown_dead) return { pages: ['"Got new goats. Named one after you. The stubborn one."'] };
          return { pages: ['"Lost two goats by the old barrow southeast. Found hoofprints going IN. Nothing came out."'] };
        },
        nightLines: ['"Lock your door tonight. The barrow lights are green again."'],
        journal: 'Farmer Odd: goats vanished into the barrow southeast of town.',
      },
      {
        id: 'tam', name: 'Tam', wander: true, look: { hair: C.WOOD, tunic: C.CYAN, pants: C.BROWN },
        lines: ['"When I grow up I want to be a bandit! ...A NICE one."'],
        nightLines: ['"Ma says the fireflies are ghosts. I collect them anyway."'],
      },
      {
        id: 'finn', name: 'Finn', wander: true, look: { hair: C.RED, tunic: C.SLATE },
        lines: () => {
          if (Game.countItem('hunters_pack') && !Game.flags.finn_pack) {
            Game.flags.finn_pack = true;
            Game.takeItem('hunters_pack', 1);
            Game.gold += 30;
            return { pages: ['Finn goes pale. "That\'s Garl\'s pack. He drank here every seventh day for twenty years."', '"Gloomroot, was it. Aye. We wondered." He presses coins on you and buys the house a quiet round.'] };
          }
          return { pages: ['"The crypt? Empty. Looted it myself as a lad. Unless it was a cellar. It was dark, mind."'] };
        },
        nightLines: ['"Shh. The well listens. Always has. *hic*"'],
      },
      {
        id: 'wren_npc', name: 'Wren', wander: true, look: { hood: C.SLATE, tunic: C.DGREEN, pants: C.VOID },
        recruit: 'wren',
      },
    ],
  },

  emberhold: {
    name: 'Emberhold', w: 50, h: 38, ground: GT.GRASS, walled: true,
    buildings: [
      bldg('keep', 18, 3, 14, 9, 'THE KEEP'),
      bldg('inn', 4, 16, 10, 8, 'THE CINDER CUP'),
      bldg('weapon', 17, 16, 7, 6, 'GRIMSHAW ARMS'),
      bldg('armor', 26, 16, 7, 6, 'BULWARK & SON'),
      bldg('item', 36, 16, 8, 6, 'PROVISIONER'),
      bldg('magic', 36, 25, 8, 7, 'THE LYCEUM ANNEX'),
      bldg('temple', 4, 26, 11, 8, 'TEMPLE OF DAWN'),
      bldg('house', 18, 26, 6, 6, ''),
      bldg('house', 26, 26, 6, 6, ''),
    ],
    well: { x: 24, y: 13 },
    npcs: [
      {
        id: 'castellan', name: 'Castellan Vane', look: { helmet: C.STEEL, tunic: C.MAROON, trim: C.YELLOW }, in: 0,
        lines: () => {
          const shards = ['ember_shard1', 'ember_shard2', 'ember_shard3'].filter(s => Game.countItem(s)).length;
          if (Game.flags.got_first_ember) {
            return { pages: ['"The Ember rides with you now. The shrine roads are open - touch a shrine and they will carry you."', '"Mount Cinder, northeast. End this. And come back. Emberhold owes you a very large dinner."'] };
          }
          if (shards >= 3) {
            Game.flags.got_first_ember = true;
            Game.addItem('first_ember', 1);
            Game.addJournal('Vane opened the vault. The First Ember is whole again, and it rides with us. The shrine roads are open. Mount Cinder waits.');
            return {
              pages: [
                'Vane sets the three shards on the vault stone. They lean toward each other like old friends.',
                'The vault opens on a light with a heartbeat. "Three hundred years," Vane says quietly. "Take it."',
                '"The First Ember can still the heart of the mountain. Carry it to Mount Cinder, northeast, past the peaks."',
                '"One more thing: the Ember knows the shrine roads. Touch any shrine and it will carry you between them."',
              ],
            };
          }
          if (Game.flags.heard_vane) {
            const lines = ['"The shards. The barrow keeps one. The deep keeps one. The wind keeps one."'];
            if (shards > 0) lines.push(`"You carry ${shards} of the three. I can hear it. So can the mountain."`);
            return { pages: lines };
          }
          Game.flags.heard_vane = true;
          return {
            pages: [
              '"Maud sent you? That name opens one door and it is this one."',
              '"The First Ember sleeps in our vault. It has burned low for three hundred years. Last month it flared."',
              '"Something beneath Mount Cinder is calling it home. Embers answer embers. It must be carried there WHOLE - and it is not whole. It was split, long ago. Three shards, three hiding places."',
              '"Redmane\'s rabble on the south road carry a stolen barrow key. Start there. The dead kept the first shard honest."',
            ],
            journal: 'Castellan Vane: the First Ember must be made whole. Three shards - the barrow keeps one, the deep a second, the wind a third. Redmane\'s key opens the barrow.',
          };
        },
      },
      {
        id: 'guard1', name: 'Gate Guard', look: { helmet: C.STEEL, tunic: C.SLATE, trim: C.RED }, at: 'gate',
        lines: ['"Keep your blade sheathed and your coin visible. Welcome to Emberhold."'],
        nightLines: ['"Gates stay open. Orders. The dark out there is worse than any thief in here."'],
      },
      {
        id: 'innes', name: 'Innes', look: { hair: C.VOID, tunic: C.MAROON }, in: 1,
        lines: ['"The Cinder Cup. Best ale within a wall, worst within two."'],
        action: { type: 'inn', price: 15 },
        rumors: true,
      },
      {
        id: 'maro_npc', name: 'Maro', look: { hood: C.PURPLE, robe: true, tunic: C.PURPLE }, in: 1,
        recruit: 'maro',
      },
      {
        id: 'grimshaw', name: 'Grimshaw', look: { hair: C.SLATE, tunic: C.STONE, beard: true }, in: 2,
        lines: ['"Steel from the Emberdeep, before it went quiet. Stock like this won\'t come again."'],
        action: { type: 'shop', stock: ['shortsword', 'ironsword', 'mace', 'huntingbow', 'stiletto', 'warhammer'] },
      },
      {
        id: 'bulwark', name: 'Old Bulwark', look: { hair: C.WHITE, tunic: C.STONE, beard: true }, in: 3,
        lines: ['"My boy hammers, I sell. Between us we are one whole blacksmith."'],
        action: { type: 'shop', stock: ['leather', 'studded', 'chainmail', 'buckler', 'kiteshield', 'robes'] },
      },
      {
        id: 'prov', name: 'Provisioner Ada', look: { hair: C.ORANGE, tunic: C.DGREEN }, in: 4,
        lines: ['"Stock up. The roads eat the unprepared, and I do not do refunds to ghosts."'],
        action: { type: 'shop', stock: ['potion', 'hipotion', 'ether', 'tonic', 'bomb', 'tent', 'torch', 'phoenixash'] },
      },
      {
        id: 'lyceum', name: 'Magister Corvin', look: { hood: C.NAVY, robe: true, tunic: C.NAVY }, in: 5,
        lines: ['"The Annex sells to those the Lyceum expelled, refused, or fears. You qualify somewhere, surely."'],
        action: { type: 'shop', stock: ['oakstaff', 'emberstaff', 'holyrod', 'magerobe', 'templerobe', 'focuscharm', 'speedboots'] },
      },
      {
        id: 'sela_npc', name: 'Sela', look: { hair: C.YELLOW, robe: true, tunic: C.WHITE, robeCol: C.STEEL }, in: 6,
        recruit: 'sela',
      },
      {
        id: 'abbess', name: 'Abbess Ruth', look: { hair: C.WHITE, robe: true, tunic: C.WHITE, robeCol: C.STEEL }, in: 6,
        lines: ['"The Dawn watches over the fallen. For a donation, it watches harder."'],
        action: { type: 'temple', healPrice: 20 },
      },
      {
        id: 'scribe', name: 'Scribe Ottol', wander: true, look: { hair: C.VOID, tunic: C.NAVY },
        lines: () => {
          if (Game.countItem('old_lens') && !Game.flags.ottol_lens) {
            Game.flags.ottol_lens = true;
            Game.takeItem('old_lens', 1);
            Game.gold += 80;
            return { pages: ['"The LENS. The actual lens." Ottol holds it to the window with shaking hands.', '"It\'s warm. Maps don\'t prepare you for warm." He pays you 80 gold and doesn\'t haggle, which frightens you both.'], journal: 'Gave the old lens to Scribe Ottol. "The lighthouse kept something OUT," he says. "And someone turned it off."' };
          }
          return { pages: ['"I copy the old maps. The Howling Tower in the far northwest? Every map older than my grandfather calls it a LIGHTHOUSE. For what sea, I wonder."'] };
        },
        journal: 'Scribe Ottol: the Howling Tower in the far northwest was once drawn as a lighthouse.',
      },
      {
        id: 'urchin', name: 'Urchin', wander: true, look: { hair: C.WOOD, tunic: C.SLATE, pants: C.BROWN },
        lines: ['"Psst. The shrine folk leave bread at the standing stones. The stones never eat it. I do."'],
        nightLines: ['"The moon gates open when the moon forgets to watch. Everyone knows that."'],
      },
      {
        id: 'widow', name: 'Widow Karst', wander: true, look: { hair: C.WHITE, tunic: C.VOID },
        lines: () => {
          if (Game.countItem('wedding_ring') && !Game.flags.karst_ring) {
            Game.flags.karst_ring = true;
            Game.takeItem('wedding_ring', 1);
            Game.addItem('vitamulet', 1);
            return { pages: ['You hold out the ring. Widow Karst does not take it at first. Then she does, with both hands.', '"He kept it polished. Even down there. Even after." She breathes once, carefully.', '"His amulet. He\'d want it walking around, not in a drawer. Go on."'], journal: 'Returned the miner\'s ring to Widow Karst. Some debts the dark pays back.' };
          }
          if (Game.flags.karst_ring) return { pages: ['"I sleep through the night now. Mostly. Thank you for mostly."'] };
          return { pages: ['"My husband mined the Emberdeep. The day the singing stopped, half the men came up. He was the other half."'] };
        },
        journal: 'Widow Karst: miners were lost in the Emberdeep when "the singing stopped."',
      },
      {
        id: 'drunk2', name: 'Merry Pike', wander: true, look: { hair: C.RED, tunic: C.ORANGE },
        lines: ['"Saltmere fish have started swimming AWAY from the sea. Fish know things. Nobody asks the fish."'],
      },
    ],
  },

  thornfield: {
    name: 'Thornfield', w: 40, h: 28, ground: GT.GRASS,
    buildings: [
      bldg('inn', 4, 4, 9, 7, 'THE PLOUGH & STARS'),
      bldg('item', 16, 4, 7, 6, 'SEED & SUNDRY'),
      bldg('weapon', 26, 4, 7, 6, 'FIELDFORGE'),
      bldg('house', 5, 15, 7, 6, ''),
      bldg('house', 15, 16, 6, 6, ''),
      bldg('house', 25, 15, 7, 6, ''),
    ],
    well: { x: 19, y: 12 },
    npcs: [
      {
        id: 'plough', name: 'Old Ash', look: { hair: C.WHITE, tunic: C.DGREEN, beard: true }, in: 0,
        lines: ['"Beds are clean, ale is cloudy, gossip is free."'], action: { type: 'inn', price: 10 }, rumors: true,
      },
      {
        id: 'dorn_npc', name: 'Dorn', look: { hair: C.ORANGE, tunic: C.DGREEN, pants: C.BROWN, beard: true }, in: 0,
        recruit: 'dorn', recruitCond: 'wolves_culled',
        recruitCondText: '"Wolves took the herd. Their den is northeast of the fields. Empty it, and my hammer is yours."',
      },
      {
        id: 'seed', name: 'Perl', look: { hair: C.ORANGE, tunic: C.TAN }, in: 1,
        lines: ['"Seed, twine, lamp oil. And potions, for when the scarecrows move."'],
        action: { type: 'shop', stock: ['potion', 'tonic', 'torch', 'tent', 'bomb'] },
      },
      {
        id: 'fieldforge', name: 'Smith Anya', look: { hair: C.VOID, tunic: C.STONE }, in: 2,
        lines: ['"Ploughshares, mostly. But the wolves changed some minds about swords."'],
        action: { type: 'shop', stock: ['shortsword', 'ironsword', 'mace', 'buckler', 'studded', 'huntingbow'] },
      },
      {
        id: 'hobb', name: 'Farmer Hobb',
        lines: () => {
          if (Game.flags.wolves_culled && !Game.flags.hobb_paid) {
            Game.flags.hobb_paid = true;
            Game.gold += 40;
            return { pages: ['"The den? EMPTY? Ha! HA!"', 'Hobb presses 40 gold into your hands and does a small, terrible dance.'] };
          }
          if (Game.flags.wolves_culled) return { pages: ['"Fields feel bigger with the howling gone."'] };
          return { pages: ['"Hear them at night? The den is northeast, in the treeline. Somebody ought to."'] };
        },
        wander: true, look: { hair: C.WOOD, tunic: C.BROWN },
        journal: 'Farmer Hobb: a wolf den northeast of Thornfield, in the treeline.',
      },
      {
        id: 'miller', name: 'Miller Wick', wander: true, look: { hair: C.SLATE, tunic: C.TAN },
        lines: ['"Grain goes to Emberhold, coin comes back. Roads do the living around here."'],
        nightLines: ['"Mill wheel turns at night sometimes. Nobody grinding. We let it be."'],
      },
      {
        id: 'granny', name: 'Granny Fen', wander: true, look: { hair: C.WHITE, tunic: C.MAROON },
        lines: ['"East of here, past Mirefen, the Shrine of Gales. I danced there as a girl. The wind clapped."'],
      },
      {
        id: 'boy', name: 'Pip', wander: true, look: { hair: C.ORANGE, tunic: C.CYAN, pants: C.BROWN },
        lines: ['"I found a coin with a face NOBODY knows! Miller says it\'s from before the realm. Before is my favorite place."'],
      },
    ],
  },

  saltmere: {
    name: 'Saltmere', w: 42, h: 28, ground: GT.GRASS,
    buildings: [
      bldg('inn', 4, 4, 10, 7, 'THE BRINY MAID'),
      bldg('item', 17, 4, 7, 6, 'CHANDLERY'),
      bldg('weapon', 27, 4, 8, 6, 'HOOK & EDGE'),
      bldg('house', 5, 15, 7, 6, ''),
      bldg('house', 16, 16, 7, 6, ''),
      bldg('house', 27, 15, 7, 6, ''),
    ],
    well: { x: 20, y: 12 },
    npcs: [
      {
        id: 'maid', name: 'Nan', look: { hair: C.RED, tunic: C.NAVY }, in: 0,
        lines: ['"The Briny Maid. Named for my mother. She\'d have hated that."'],
        action: { type: 'inn', price: 12 }, rumors: true,
      },
      {
        id: 'ivy_npc', name: 'Ivy', look: { hair: C.RED, tunic: C.NAVY, pants: C.SLATE }, in: 0,
        recruit: 'ivy',
      },
      {
        id: 'chandler', name: 'Chandler Sorn', look: { hair: C.VOID, tunic: C.DGREEN }, in: 1,
        lines: ['"Rope, tar, lamp oil, courage in bottles."'],
        action: { type: 'shop', stock: ['potion', 'hipotion', 'tonic', 'torch', 'tent', 'ether'] },
      },
      {
        id: 'hooker', name: 'Edge-Wife Marta', look: { hair: C.SLATE, tunic: C.STONE }, in: 2,
        lines: ['"Harpoons for the sea, the rest for what the sea spits back."'],
        action: { type: 'shop', stock: ['harpoon', 'ironsword', 'dagger', 'coralmail', 'leather', 'kiteshield'] },
      },
      {
        id: 'harbor', name: 'Harbormaster Quill',
        lines: () => {
          if (Game.flags.hasSkiff) return { pages: ['"She\'s moored where you left her. Boats remember. It\'s people who forget."'] };
          return {
            pages: ['"That skiff there? Sound hull, honest sail. 150 gold and she answers to you."'],
            action: { type: 'buyskiff', price: 150 },
          };
        },
        look: { hair: C.WHITE, tunic: C.NAVY, beard: true },
        journal: 'Harbormaster Quill sells a skiff in Saltmere. The islands are somebody\'s business then.',
      },
      {
        id: 'fishwife', name: 'Fishwife Doone', wander: true, look: { hair: C.ORANGE, tunic: C.CYAN },
        lines: () => {
          if (Game.flags.buoy_cleared) return { pages: ['"You SAILED PAST THE BUOY? And collected? Saints. First one ever."'] };
          return { pages: ['"Double pay to any soul who sails past the drowned buoy west of here. Nobody collects twice. Nobody\'s collected once, mind."'] };
        },
        journal: 'Fishwife Doone: something waits at the drowned buoy west of Saltmere.',
      },
      {
        id: 'oldsalt', name: 'Old Salt Kerrigan', wander: true, look: { hair: C.WHITE, tunic: C.SLATE, beard: true },
        lines: ['"Three isles worth landing on. Southwest one, dig ABOVE the tideline. That\'s all I\'ll say sober."'],
        nightLines: ['"The east isle light? No lighthouse there. Never was. *drinks*"'],
      },
      {
        id: 'dockhand', name: 'Dockhand Pol', wander: true, look: { hair: C.WOOD, tunic: C.BROWN },
        lines: ['"Fish are off. Even the gulls went quiet. Sea knows something we don\'t."'],
      },
    ],
  },

  duskwell: {
    name: 'Duskwell', w: 40, h: 28, ground: GT.DESERT,
    buildings: [
      bldg('inn', 4, 4, 10, 7, 'THE LAST SHADE'),
      bldg('item', 17, 4, 7, 6, 'WATER & WARES'),
      bldg('weapon', 27, 4, 7, 6, 'THE WHETTED MOON'),
      bldg('temple', 5, 15, 8, 7, 'WELLSHRINE'),
      bldg('house', 16, 16, 6, 6, ''),
      bldg('house', 25, 15, 7, 6, ''),
    ],
    well: { x: 19, y: 12 },
    npcs: [
      {
        id: 'shade', name: 'Amal', look: { hair: C.VOID, tunic: C.ORANGE, skin: C.WOOD }, in: 0,
        lines: ['"Shade is the only honest currency out here. The beds are a formality."'],
        action: { type: 'inn', price: 12 }, rumors: true,
      },
      {
        id: 'zash_npc', name: 'Zash', look: { hood: C.SAND, robe: true, tunic: C.ORANGE, skin: C.WOOD }, in: 0,
        recruit: 'zash', recruitCond: 'boss_serpentmaw_dead',
        recruitCondText: '"The sand still hungers. Feed it its wyrm - the Maw, southwest - and then we will talk about lightning."',
      },
      {
        id: 'water', name: 'Water-Keeper Sef', look: { hair: C.VOID, tunic: C.CYAN, skin: C.WOOD }, in: 1,
        lines: ['"Water first. Everything else is decoration."'],
        action: { type: 'shop', stock: ['potion', 'hipotion', 'tonic', 'tent', 'torch', 'hiether'] },
      },
      {
        id: 'whetted', name: 'Bladewife Orun', look: { hair: C.SLATE, tunic: C.STONE, skin: C.WOOD }, in: 2,
        lines: ['"The desert curves everything eventually. We just start the blades that way."'],
        action: { type: 'shop', stock: ['scimitar', 'stiletto', 'longbow', 'studded', 'buckler', 'speedboots'] },
      },
      {
        id: 'wellpriest', name: 'Deep-Sister Naila', look: { hair: C.VOID, robe: true, tunic: C.CYAN, skin: C.WOOD }, in: 3,
        lines: ['"The well under the shrine has never gone dry. It asks only patience, and that we do not look down it after dark."'],
        action: { type: 'temple', healPrice: 18 },
      },
      {
        id: 'caravan', name: 'Caravan-Master Jeht',
        lines: () => {
          if (Game.flags.wreck_found && !Game.flags.caravan_paid) {
            Game.flags.caravan_paid = true;
            Game.gold += 60;
            return { pages: ['"You found them. And brought back... anything at all."', 'Jeht is quiet a long moment. "Sixty gold. It is not thanks enough. It is what I have."'] };
          }
          if (Game.flags.wreck_found) return { pages: ['"The route is cursed. I say it now with evidence."'] };
          return { pages: ['"My cousin\'s caravan never reached the Maw road. Southwest, between here and the stone mouth. If you pass that way... look."'] };
        },
        wander: true, look: { hair: C.WOOD, tunic: C.MAROON, skin: C.WOOD },
        journal: 'Caravan-Master Jeht: a caravan vanished southwest of Duskwell, toward the Serpent\'s Maw.',
      },
      {
        id: 'nomad', name: 'Nomad Essa', wander: true, look: { hood: C.SAND, tunic: C.TAN, skin: C.WOOD },
        lines: ['"We throw silver into the Maw and walk away quickly. Cheap, as tolls go."'],
        nightLines: ['"The dunes move at night. Not the wind. The dunes."'],
      },
      {
        id: 'child2', name: 'Small Iri', wander: true, look: { hair: C.VOID, tunic: C.YELLOW, skin: C.WOOD },
        lines: ['"I raced a sand-cat once! It let me win. That\'s what winning IS."'],
      },
    ],
  },

  frosthollow: {
    name: 'Frosthollow', w: 40, h: 28, ground: GT.SNOW,
    buildings: [
      bldg('inn', 4, 4, 10, 7, 'THE BANKED FIRE'),
      bldg('item', 17, 4, 7, 6, 'THE LAMP HOUSE'),
      bldg('weapon', 27, 4, 7, 6, 'COLDSTEEL'),
      bldg('temple', 5, 15, 8, 7, 'SHRINEHALL'),
      bldg('house', 16, 16, 6, 6, ''),
      bldg('house', 25, 15, 7, 6, ''),
    ],
    well: { x: 19, y: 12 },
    npcs: [
      {
        id: 'banked', name: 'Hearth-Keeper Ulla', look: { hair: C.YELLOW, tunic: C.MAROON }, in: 0,
        lines: ['"Fire\'s banked, never out. House rule. Town rule. Only rule."'],
        action: { type: 'inn', price: 14 }, rumors: true,
      },
      {
        id: 'edda_npc', name: 'Edda', look: { hood: C.CYAN, robe: true, tunic: C.NAVY }, in: 3,
        recruit: 'edda', recruitCond: 'boss_howlingtower_dead',
        recruitCondText: '"The tower still screams, northwest, over the ice. Quiet it, and I will follow you anywhere."',
      },
      {
        id: 'lamps', name: 'Lamplighter Brand',
        lines: () => {
          if (Game.flags.frost_lights_dead && !Game.flags.brand_paid) {
            Game.flags.brand_paid = true;
            Game.addItem('wardcharm', 1);
            return { pages: ['"You met them. At the gate. And the lamps held."', '"Take this ward. I made it for my rounds. Yours are darker."'] };
          }
          return { pages: ['"We burn lamps all day. Not for the dark - for the things that MIND the light. Come after dusk, you\'ll see. Pray you don\'t."'] };
        },
        wander: true, look: { hair: C.ORANGE, tunic: C.SLATE },
        journal: 'Lamplighter Brand: Frosthollow\'s lamps hold something off. It comes to the gate at night.',
      },
      {
        id: 'lamphouse', name: 'Wick-Seller Om', look: { hair: C.WHITE, tunic: C.DGREEN }, in: 1,
        lines: ['"Torches by the dozen. In Frosthollow, light is bread."'],
        action: { type: 'shop', stock: ['torch', 'potion', 'hipotion', 'tonic', 'tent', 'phoenixash'] },
      },
      {
        id: 'coldsteel', name: 'Smith Halvar', look: { hair: C.WHITE, tunic: C.STONE, beard: true }, in: 2,
        lines: ['"Steel goes brittle in the cold unless you ask it nicely. I ask nicely with a hammer."'],
        action: { type: 'shop', stock: ['frostbrand', 'warhammer', 'furarmor', 'chainmail', 'towershield', 'vitamulet'] },
      },
      {
        id: 'shrinehall', name: 'Keeper Signe', look: { hair: C.WHITE, robe: true, tunic: C.WHITE, robeCol: C.NAVY }, in: 3,
        lines: ['"The northern shrines sleep under snow. The Shrine of Stone is southwest of the old tower. Wake it gently."'],
        action: { type: 'temple', healPrice: 22 },
      },
      {
        id: 'hunter', name: 'Hunter Skeld', wander: true, look: { hair: C.WOOD, tunic: C.BROWN, beard: true },
        lines: ['"Something big denned up in the high snow. Tracks like a bear that learned to be sorry about nothing."'],
        nightLines: ['"Stay in the lamplight, traveler. I mean it kindly."'],
      },
      {
        id: 'elder2', name: 'Elder Ros', wander: true, look: { hair: C.WHITE, tunic: C.NAVY },
        lines: ['"My father mined the Emberdeep. He said the deep vein SANG, and the song was a lullaby, and mountains should not know lullabies."'],
      },
    ],
  },

  mirefen: {
    name: 'Mirefen', w: 40, h: 28, ground: GT.DIRT,
    buildings: [
      bldg('inn', 4, 4, 10, 7, 'THE LEANING EEL'),
      bldg('item', 17, 4, 7, 6, 'MUDWARES'),
      bldg('weapon', 27, 4, 7, 6, 'BONE & BARB'),
      bldg('temple', 5, 15, 8, 7, 'THE WITCH\'S PORCH'),
      bldg('house', 16, 16, 6, 6, ''),
      bldg('house', 25, 15, 7, 6, ''),
    ],
    well: { x: 19, y: 12 },
    npcs: [
      {
        id: 'eel', name: 'Eel-Mother Brack', look: { hair: C.SLATE, tunic: C.SWAMPY }, in: 0,
        lines: ['"The Eel leans because the mire wants it. We let the mire have its opinions."'],
        action: { type: 'inn', price: 10 }, rumors: true,
      },
      {
        id: 'mudwares', name: 'Sog', look: { hair: C.VOID, tunic: C.BROWN }, in: 1,
        lines: ['"Everything\'s a little damp. Discount reflects."'],
        action: { type: 'shop', stock: ['potion', 'tonic', 'tonic', 'torch', 'ether', 'bomb'] },
      },
      {
        id: 'boneandbarb', name: 'Barb', look: { hair: C.RED, tunic: C.SWAMPY }, in: 2,
        lines: ['"Bone knives. Don\'t ask whose. THEIR knives now, that\'s the joke."'],
        action: { type: 'shop', stock: ['boneknife', 'dagger', 'huntingbow', 'leather', 'robes', 'luckcoin'] },
      },
      {
        id: 'witch', name: 'The Bog Witch', look: { hood: C.SWAMPY, robe: true, tunic: C.SWAMPY }, in: 3,
        lines: ['"Sit. Breathe the smoke. The mire takes aches like it takes boots: completely."'],
        action: { type: 'temple', healPrice: 16 },
      },
      {
        id: 'stiltwalker', name: 'Stilt-Walker Ame',
        lines: () => {
          if (Game.flags.mire_below_dead && !Game.flags.ame_paid) {
            Game.flags.ame_paid = true;
            Game.addItem('wardcharm', 1);
            return { pages: ['"It\'s quiet under the houses. First quiet night in nine years."', '"Here. A ward, from the whole fen. We argued about who\'d give it. I won."'] };
          }
          if (Game.flags.mire_below_dead) return { pages: ['"The children sleep on the FLOORS now. Out of spite. Beautiful."'] };
          return { pages: ['"Come at night and you\'ll hear it under the walkways. Come armed and maybe the hearing stops."'] };
        },
        wander: true, look: { hair: C.WOOD, tunic: C.DGREEN },
        journal: 'Stilt-Walker Ame: something walks under Mirefen\'s houses at night.',
      },
      {
        id: 'eelcatcher', name: 'Eel-Catcher Dob', wander: true, look: { hair: C.SLATE, tunic: C.NAVY },
        lines: ['"Sunken Keep\'s bell rings before storms. Bells need ringers. Think about it. I try not to."'],
        journal: 'Eel-Catcher Dob: the Sunken Keep\'s bell rings before storms.',
      },
      {
        id: 'frogkid', name: 'Newt', wander: true, look: { hair: C.DGREEN, tunic: C.YELLOW },
        lines: ['"I got seventeen frogs! Mum says one more and I sleep outside! EIGHTEEN then!"'],
      },
      {
        id: 'ferrier', name: 'Ferrier Lots', wander: true, look: { hair: C.WOOD, tunic: C.SLATE },
        lines: ['"I pole folk across the deep fen. Used to be busy. Now everyone asks if the water\'s SAFE first. Ruins the mystery."'],
        nightLines: ['"No crossings after dark. The pole touched something once that touched it back."'],
      },
    ],
  },
};

// Rumor pool for tavern keepers. Each points somewhere real.
const RUMORS = [
  { id: 'r_barrow', text: '"The Barrowdown crypt, southeast of Willowbrook? Sealed for a reason. Bandits have been digging at the lock."' },
  { id: 'r_gloomroot', text: '"A hunter chased a stag into Gloomroot Cave, west past the river. Came out three days later, white as chalk, rich as a lord."' },
  { id: 'r_mirefen', text: '"Mirefen folk build on stilts. Ask them what walks under the houses at low water. Go on, ask."' },
  { id: 'r_sunken', text: '"There is a keep drowned in the southeast swamp. The bell in its tower still rings when a storm comes."' },
  { id: 'r_cinder', text: '"Mount Cinder is smoking again. My gran said: when the mountain clears its throat, it means to speak."' },
  { id: 'r_serpent', text: '"Deep in the southwest sands there is a mouth of stone. The nomads throw silver in and never, ever fish it out."' },
  { id: 'r_shrines', text: '"Four shrines mark the old compass: dawn, dusk, gale, stone. Light all four and the world remembers a fifth road."' },
  { id: 'r_saltmere', text: '"Saltmere pays double for anyone willing to sail past the drowned buoy. Nobody collects twice."' },
  { id: 'r_frost', text: '"North past the pines, Frosthollow burns lamps all day. Not for the dark. For the things that mind the light."' },
  { id: 'r_emberdeep', text: '"The Emberdeep mine paid three fortunes and took thirty men. The vein is still down there. So are they."' },
];

// --- builder -------------------------------------------------------------------
function buildTown(id) {
  const spec = TOWNS[id];
  const m = new GameMap(spec.w, spec.h);
  const r = RNG(0xB00B5 + id.length * 31 + id.charCodeAt(0));
  m.fillRect(0, 0, m.w, m.h, spec.ground);
  // scattered decoration, themed by ground
  const deco = spec.ground === GT.SNOW ? [OT.SNOWTREE, OT.ROCK]
    : spec.ground === GT.DESERT ? [OT.CACTUS, OT.PALM]
    : spec.ground === GT.DIRT ? [OT.DEADTREE, OT.MUSHROOM]
    : [OT.TREE, OT.BUSH];
  for (let i = 0; i < 40; i++) {
    const x = r.i(1, m.w - 2), y = r.i(1, m.h - 2);
    if (r.chance(0.5)) m.setO(x, y, r.chance(0.35) ? deco[1] : deco[0]);
  }
  // wall ring for the city
  if (spec.walled) {
    for (let x = 0; x < m.w; x++) { m.setO(x, 0, OT.WALL); m.setO(x, m.h - 1, OT.WALL); }
    for (let y = 0; y < m.h; y++) { m.setO(0, y, OT.WALL); m.setO(m.w - 1, y, OT.WALL); }
    // south gate opening
    const gx = Math.floor(m.w / 2);
    m.setO(gx - 1, m.h - 1, OT.NONE); m.setO(gx, m.h - 1, OT.NONE); m.setO(gx + 1, m.h - 1, OT.NONE);
    m.setG(gx - 1, m.h - 1, GT.ROAD); m.setG(gx, m.h - 1, GT.ROAD); m.setG(gx + 1, m.h - 1, GT.ROAD);
  }
  // main path from south entrance to the well
  const cx = spec.well.x, sy = m.h - 1;
  for (let y = spec.well.y; y <= sy; y++) { m.setG(cx, y, GT.ROAD); m.setO(cx, y, OT.NONE); m.setG(cx + 1, y, GT.ROAD); m.setO(cx + 1, y, OT.NONE); }
  m.setO(spec.well.x, spec.well.y, spec.walled ? OT.FOUNTAIN : OT.WELL);

  const keepers = [];   // {bIdx, x, y} keeper spots per building
  spec.buildings.forEach((b, bi) => {
    // clear zone
    for (let y = b.y - 1; y <= b.y + b.h; y++) {
      for (let x = b.x - 1; x <= b.x + b.w; x++) m.setO(x, y, OT.NONE);
    }
    // floor + walls
    const floorG = b.type === 'temple' || b.type === 'keep' ? GT.FLOOR_STONE : GT.FLOOR_WOOD;
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        m.setG(x, y, floorG);
        const edge = x === b.x || y === b.y || x === b.x + b.w - 1 || y === b.y + b.h - 1;
        if (edge) m.setO(x, y, OT.WALL);
      }
    }
    // door bottom-center (+ path stub)
    const dx = b.x + Math.floor(b.w / 2);
    m.setO(dx, b.y + b.h - 1, OT.DOOR);
    m.setG(dx, b.y + b.h, GT.ROAD); m.setO(dx, b.y + b.h, OT.NONE);
    if (b.name) { m.setO(dx + 1, b.y + b.h, OT.SIGN); }
    // furniture
    const ix = b.x + 1, iy = b.y + 1, iw = b.w - 2, ih = b.h - 2;
    const keeperSpot = { x: ix + Math.floor(iw / 2), y: iy };
    switch (b.type) {
      case 'inn':
        for (let x = ix; x < ix + iw - 3; x++) m.setO(x, iy + 1, OT.COUNTER);
        m.setO(ix + iw - 1, iy, OT.BED); m.setO(ix + iw - 3, iy, OT.BED);
        m.setO(ix + 1, iy + 3, OT.TABLE); m.setO(ix + 2, iy + 3, OT.CHAIR);
        m.setO(ix + 4, iy + 4, OT.TABLE); m.setO(ix + 5, iy + 4, OT.CHAIR);
        m.setO(ix, iy, OT.BARREL); m.setO(ix + 1, iy, OT.BARREL);
        keeperSpot.y = iy; keeperSpot.x = ix + 1;
        break;
      case 'weapon': case 'armor': case 'item': case 'magic':
        for (let x = ix; x < ix + iw; x++) if (x !== ix + Math.floor(iw / 2)) m.setO(x, iy + 1, OT.COUNTER);
        if (b.type === 'weapon') { m.setO(ix, iy, OT.ANVIL); m.setO(ix + iw - 1, iy, OT.STOVE); }
        if (b.type === 'armor') { m.setO(ix, iy, OT.SHELF); }
        if (b.type === 'item') { m.setO(ix, iy, OT.SHELF); m.setO(ix + iw - 1, iy, OT.POT); m.setO(ix + iw - 2, iy, OT.BARREL); }
        if (b.type === 'magic') { m.setO(ix, iy, OT.SHELF); m.setO(ix + iw - 1, iy, OT.CRYSTAL); }
        break;
      case 'temple':
        m.setO(ix + Math.floor(iw / 2), iy, OT.ALTAR);
        m.setO(ix, iy, OT.TORCH); m.setO(ix + iw - 1, iy, OT.TORCH);
        m.setO(ix, iy + ih - 1, OT.PILLAR); m.setO(ix + iw - 1, iy + ih - 1, OT.PILLAR);
        keeperSpot.y = iy + 1;
        break;
      case 'keep':
        m.setO(ix + Math.floor(iw / 2), iy, OT.THRONE);
        m.setO(ix, iy, OT.TORCH); m.setO(ix + iw - 1, iy, OT.TORCH);
        m.setO(ix + 1, iy + 2, OT.PILLAR); m.setO(ix + iw - 2, iy + 2, OT.PILLAR);
        m.setO(ix + 1, iy + 4, OT.PILLAR); m.setO(ix + iw - 2, iy + 4, OT.PILLAR);
        keeperSpot.y = iy + 1;
        break;
      case 'house':
        m.setO(ix, iy, OT.BED);
        m.setO(ix + 2, iy + 1, OT.TABLE);
        m.setO(ix + 3, iy + 1, OT.CHAIR);
        m.setO(ix + iw - 1, iy, OT.STOVE);
        break;
    }
    keepers.push(keeperSpot);
  });

  // spawn: at south path entrance
  const spawn = { x: cx, y: m.h - 2 };
  return { map: m, spec, keepers, spawn };
}
