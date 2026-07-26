// world.js — the overworld scene: exploration, day/night, encounters,
// location discovery, and the cloth-map screen.
'use strict';

class WorldScene extends MapScene {
  constructor(world) {
    const spawn = world.spawn;
    const heroSprites = Game.party.length ? Game.party[0].sprites : SPRITE_PRESETS.hero();
    super(world.map, new Walker(spawn.x, spawn.y, heroSprites));
    this.world = world;
    this.banner = null;        // {title, sub, t}
    this.encounterCooldown = 8; // grace steps after spawn/flee
    this.onBoat = false;
  }

  onStep(from, dir) {
    Game.tickTime(1);
    Game.steps++;
    this.lastLand = this.onBoat ? this.lastLand : { x: from.x, y: from.y };
    this.lastTile = { x: from.x, y: from.y };
  }

  // --- skiff -----------------------------------------------------------------
  canWalk(x, y) {
    const g = GROUND[this.map.g(x, y)];
    if (this.onBoat) {
      if (g.boat) {
        const o = this.map.o(x, y);
        return !o || OBJ[o].walk;
      }
      return this.map.walkable(x, y);   // stepping ashore disembarks
    }
    return this.map.walkable(x, y);
  }

  onBlocked(x, y, dir) {
    // board the skiff
    const bp = Game.flags.boatPos;
    if (!this.onBoat && bp && bp.x === x && bp.y === y) {
      this.onBoat = true;
      Audio.sfx('stairs');
      this.player.x = this.player.tx = x;
      this.player.y = this.player.ty = y;
      this.player.px = x * TILE; this.player.py = y * TILE;
      this.banner = { title: 'You board the skiff.', sub: 'Sail with the arrows. Step ashore to land.', t: 3 };
      return;
    }
    super.onBlocked(x, y, dir);
  }

  onArrive(x, y) {
    // Disembark bookkeeping
    if (this.onBoat) {
      const g = GROUND[this.map.g(x, y)];
      if (!g.boat) {
        this.onBoat = false;
        Game.flags.boatPos = this.lastTile ? { x: this.lastTile.x, y: this.lastTile.y } : Game.flags.boatPos;
        Audio.sfx('stairs');
      } else {
        // sea encounters + the drowned buoy
        if (this.map.o(x, y) === OT.BUOY && !Game.flags.buoy_cleared) {
          Audio.sfx('encounter');
          Scenes.push(new BattleScene({
            enemies: ['deepMaw', 'deepMaw'], biome: 'sea',
            intro: 'The buoy tolls once. The water answers.',
            onWin: () => {
              Game.flags.buoy_cleared = true;
              Game.gold += 120;
              Game.addItem('greatbow', 1);
              Game.addJournal('Past the drowned buoy: collected what nobody collected twice. 120 gold and a greatbow.');
            },
          }));
          return;
        }
        if (this.encounterCooldown > 0) { this.encounterCooldown--; }
        else if (rng.chance(0.006)) {
          this.encounterCooldown = 10;
          Audio.sfx('encounter');
          Scenes.push(new BattleScene({ enemies: rollEncounter('sea'), biome: 'sea' }));
          return;
        }
      }
    }
    // Quest markers
    const obj = this.map.o(x, y);
    if (obj === OT.WOLFDEN && !Game.flags.wolves_culled) {
      Audio.sfx('encounter');
      Scenes.push(new BattleScene({
        enemies: ['wolf', 'wolf', 'frostWolf', 'wolf'], biome: 'forest',
        intro: 'Yellow eyes, all at once.',
        onWin: () => {
          Game.flags.wolves_culled = true;
          Game.mutateMap(x, y, OT.NONE);
          Game.addJournal('Cleared the wolf den near Thornfield. Dorn will want to hear it.');
        },
      }));
      return;
    }
    if (obj === OT.WRECK && !Game.flags.wreck_found) {
      Audio.sfx('encounter');
      Scenes.push(new BattleScene({
        enemies: ['scarab', 'scarab', 'duneStalker'], biome: 'desert',
        intro: 'The wreck is not as empty as it looks.',
        onWin: () => {
          Game.flags.wreck_found = true;
          Game.gold += 40;
          Game.addJournal('Found the lost caravan, picked clean by brass scarabs. Took back what was left. Duskwell should know.');
        },
      }));
      return;
    }
    const wc = (this.world.worldChests || []).find(c => c.x === x && c.y === y);
    if (wc && !Game.flags['wchest_' + wc.id]) {
      Game.flags['wchest_' + wc.id] = true;
      Game.mutateMap(x, y, OT.CHEST_OPEN);
      Audio.sfx('gold');
      const loot = {
        isle_sw: { gold: 150, items: ['blackflag'], txt: 'A pirate cache: a corsair\'s band and 150 gold, under a foot of sand.' },
        isle_e: { gold: 80, items: ['phoenixash', 'phoenixash'], txt: 'A watertight cask: phoenix ash, twice over, and 80 gold.' },
        isle_nw: { gold: 60, items: ['hermitcloak'], txt: 'A mantle folded on a rock, as if someone knew you were coming. And 60 gold, wrapped inside.' },
      }[wc.id];
      Game.gold += loot.gold;
      for (const id of loot.items) Game.addItem(id, 1);
      Game.addJournal(loot.txt);
      this.banner = { title: 'A CACHE!', sub: loot.txt.slice(0, 46) + '...', t: 4 };
      return;
    }
    // Location discovery + banner
    const loc = this.locationAt(x, y);
    if (loc) {
      if (!Game.flags['seen_' + loc.id]) Game.flags['seen_' + loc.id] = true;
      this.banner = { title: loc.name, sub: loc.sub, t: 3 };
      if ((loc.type === 'town' || loc.type === 'city') && typeof TOWNS !== 'undefined' && TOWNS[loc.id]) {
        // night ambush set-pieces at the marsh and the frozen north
        if (loc.id === 'mirefen' && Game.isNight() && !Game.flags.mire_below_dead) {
          Audio.sfx('encounter');
          Scenes.push(new BattleScene({
            enemies: ['bogLurker', 'bogLurker', 'mireDrake'], biome: 'swamp',
            intro: 'At night you finally see what walks under the houses.',
            onWin: () => {
              Game.flags.mire_below_dead = true;
              Game.addJournal('Killed what walks below Mirefen. The stilts stand easier.');
            },
          }));
          return;
        }
        if (loc.id === 'frosthollow' && Game.isNight() && !Game.flags.frost_lights_dead) {
          Audio.sfx('encounter');
          Scenes.push(new BattleScene({
            enemies: ['iceShade', 'iceShade', 'frostWolf'], biome: 'snow',
            intro: 'The lamps gutter. The things that mind the light mind YOU.',
            onWin: () => {
              Game.flags.frost_lights_dead = true;
              Game.addJournal('Drove off the light-hating things at Frosthollow\'s gate.');
            },
          }));
          return;
        }
        Audio.sfx('stairs');
        Transition.start(() => Scenes.push(new TownScene(loc.id, { x, y })));
      } else if (loc.type === 'dungeon' && typeof DUNGEONS !== 'undefined' && DUNGEONS[loc.id]) {
        const def = DUNGEONS[loc.id];
        if (def.needKey && !Game.countItem(def.needKey)) {
          this.banner = { title: loc.name, sub: def.lockedText, t: 4 };
        } else if (def.needFlag && !Game.flags[def.needFlag]) {
          this.banner = { title: loc.name, sub: def.lockedText, t: 4 };
        } else {
          Audio.sfx('door');
          Transition.start(() => Scenes.push(new DungeonScene(loc.id, 1, { x, y }, 'entry')));
        }
      }
      return;   // no ambushes on a doorstep
    }
    // Bandit camp set-piece (M3 boss)
    if (this.map.o(x, y) === OT.CAMP && !Game.flags.redmane_dead) {
      Audio.sfx('encounter');
      Gfx.shake(2, 0.3);
      Scenes.push(new BattleScene({
        enemies: ['boss_redmane', 'bandit', 'banditArcher'],
        biome: this.biomeHere(x, y), boss: true,
        intro: 'Redmane: "Wrong road, friends."',
        onWin: () => {
          Game.flags.redmane_dead = true;
          Game.mutateMap(x, y, OT.NONE);
          Game.addItem('crypt_key', 1);
        },
      }));
      return;
    }
    // Random encounters
    if (this.encounterCooldown > 0) { this.encounterCooldown--; return; }
    const g = this.map.groundDef(x, y);
    const o = this.map.objDef(x, y);
    let rate = (g.enc || 0) * (o && o.enc ? o.enc : 1);
    if (rate <= 0) return;
    if (Game.isNight()) rate *= 1.8;
    const chance = 0.010 * rate;
    if (rng.chance(chance)) {
      this.encounterCooldown = 6;
      Audio.sfx('encounter');
      Gfx.shake(2, 0.25);
      const tier = dangerAt(this.world, x, y);
      const biome = this.biomeHere(x, y);
      Scenes.push(new BattleScene({
        enemies: rollEncounter(tier, biome),
        biome,
      }));
    }
  }

  biomeHere(x, y) {
    const o = this.map.o(x, y);
    const trees = o === OT.TREE || o === OT.PINES || o === OT.BUSH;
    return biomeForTile(this.map.g(x, y), trees);
  }

  enter() { Audio.playMusic('overworld'); }

  resume(result) {
    super.resume(result);
    Audio.playMusic('overworld');
    if (result && (result.fled || result.victory)) {
      this.encounterCooldown = result.fled ? 10 : 4;
    }
  }

  locationAt(x, y) {
    for (const l of this.world.locations) {
      if (l.x === x && l.y === y) return l;
    }
    return null;
  }

  interact() {
    const p = this.player;
    const d = DIRS[p.dir];
    const tx = p.x + d.dx, ty = p.y + d.dy;
    const o = this.map.o(tx, ty);
    // shrines: touch them; with the First Ember they become moongates
    const shrine = this.world.locations.find(l => l.type === 'shrine' && l.x === tx && l.y === ty);
    if (shrine || (o === OT.SHRINE)) {
      const s = shrine || this.locationAt(tx, ty);
      if (s && !Game.flags['touched_' + s.id]) {
        Game.flags['touched_' + s.id] = true;
        Game.addJournal(`Touched the ${s.name}. The stone was warm.`);
      }
      if (Game.flags.got_first_ember) {
        Scenes.push(new MoongateScene(this));
      } else {
        const SHRINE_WORDS = {
          shrine_dawn: '"FIRST LIGHT REMEMBERS." The stone hums against your palm.',
          shrine_gale: '"THE WIND CARRIES WHAT IT LOVES." Far off, something howls.',
          shrine_stone: '"PATIENCE OUTLIVES FIRE." The stone is very sure of this.',
          shrine_dusk: '"EVERY EMBER GOES HOME." It sounds like a warning.',
        };
        Scenes.push(new DialogueScene('SHRINE', [SHRINE_WORDS[s ? s.id : 'shrine_dawn'] || 'The shrine keeps its counsel.'], {}));
      }
      return;
    }
    // the standing stones
    const st = this.world.stones;
    if (st && o === OT.PILLAR && Math.abs(tx - st.x) <= 1 && Math.abs(ty - st.y) <= 1) {
      if (Game.isNight() && !Game.flags.stones_gift) {
        Game.flags.stones_gift = true;
        Game.addItem('moonpendant', 1);
        Audio.sfx('levelup');
        Game.addJournal('At night, the standing stones gave up a moonstone pendant. The bread crusts around them suddenly make sense.');
        Scenes.push(new DialogueScene('', ['Something pale gleams at the base of the stone: a moonstone pendant, left like bread for a bird.', 'You take it. The stones do not object. Probably.'], {}));
      } else {
        Scenes.push(new DialogueScene('', [Game.flags.stones_gift ?
          'The stones stand. The stones wait. The stones are fed.' :
          'Three old stones. Crusts of bread at their feet. By daylight they tell you nothing.'], {}));
      }
      return;
    }
    if (o === OT.GRAVE) {
      Scenes.push(new DialogueScene('', [rng.pick([
        '"HERE LIES PIP - THE WELL WAS DEEPER THAN ADVERTISED"',
        '"BELOVED, BRAVE, BRIEF."',
        '"I TOLD YOU I WAS ILL."',
        'The name is gone. The flowers are fresh. Someone remembers.',
      ])], {}));
      return;
    }
    if (o === OT.STATUE) {
      Scenes.push(new DialogueScene('', ['A weathered king, arm raised. Whatever he pointed at is gone.'], {}));
      return;
    }
    if (o === OT.RUINS && !this.locationAt(tx, ty)) {
      Scenes.push(new DialogueScene('', ['Old walls, older silence. The realm was larger once.'], {}));
    }
  }

  renderEntities(ox, oy) {
    if (this.onBoat) {
      const w = this.player;
      Gfx.ctx.drawImage(tileFrame(OBJ[OT.BOAT].spr, this.t), Math.round(w.px - ox), Math.round(w.py - oy - 1));
      return;
    }
    super.renderEntities(ox, oy);
    // moored skiff
    const bp = Game.flags.boatPos;
    if (bp && !this.onBoat) {
      Gfx.ctx.drawImage(tileFrame(OBJ[OT.BOAT].spr, this.t), bp.x * TILE - ox, bp.y * TILE - oy);
    }
  }

  update(dt) {
    super.update(dt);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    Game.tickTime(dt * 0.12);   // slow ambient time even when idle
    if (Input.pressed('map')) {
      Input.eat('map');
      Scenes.push(new WorldMapScene(this.world, this.player));
    }
    if (Input.pressed('menu')) {
      Input.eat('menu');
      Audio.sfx('menuPick');
      Scenes.push(new PartyMenuScene(this));
    }
  }

  renderOverlay(ox, oy) {
    // Night tint
    const dark = Game.darkness();
    if (dark > 0.01) {
      Gfx.ctx.fillStyle = `rgba(16, 14, 48, ${(dark * 0.55).toFixed(3)})`;
      Gfx.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    // Clock chip
    const label = `DAY ${Game.day}  ${Game.clockText()}`;
    Gfx.rect(VIEW_W - textWidth(label) - 8, 2, textWidth(label) + 6, 10, PAL.UI_BG);
    Gfx.textR(label, VIEW_W - 2, 4, PAL.TEXT_DIM);
    // First-steps key hint for a fresh run
    if (!Game.flags.hint_done && Game.steps < 30) {
      Gfx.panel(VIEW_W / 2 - 92, 16, 184, 22);
      Gfx.textC('Z: SEARCH/TALK   C: CAMP   J: JOURNAL   M: MAP', VIEW_W / 2, 21, PAL.TEXT);
      Gfx.textC('THE TAVERN IN TOWN HEARS THINGS.', VIEW_W / 2, 29, PAL.TEXT_DIM);
    } else if (!Game.flags.hint_done && Game.steps >= 30) {
      Game.flags.hint_done = true;
    }
    // Location banner
    if (this.banner) {
      const w = Math.max(textWidth(this.banner.title), textWidth(this.banner.sub || '')) + 14;
      const h = this.banner.sub ? 22 : 14;
      const x = (VIEW_W - w) / 2, y = VIEW_H - h - 8;
      Gfx.panel(x, y, w, h);
      Gfx.textC(this.banner.title, VIEW_W / 2, y + 4, PAL.UI_HILITE);
      if (this.banner.sub) Gfx.textC(this.banner.sub, VIEW_W / 2, y + 12, PAL.TEXT_DIM);
    }
    if (DEBUG.show) {
      Gfx.text(`FPS ${DEBUG.fps}`, 2, VIEW_H - 16, PAL.GOOD);
      Gfx.text(`${this.player.x},${this.player.y} T${dangerAt(this.world, this.player.x, this.player.y)}`, 2, VIEW_H - 8, PAL.TEXT_DIM);
    }
  }
}

// Moongate travel between touched shrines (needs the First Ember).
class MoongateScene {
  constructor(worldScene) {
    this.transparent = true;
    this.ws = worldScene;
    this.idx = 0;
    this.t = 0;
  }
  shrines() {
    return this.ws.world.locations.filter(l => l.type === 'shrine' && Game.flags['touched_' + l.id]);
  }
  update(dt) {
    this.t += dt;
    const list = this.shrines();
    listNav(this, 'idx', list.length);
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
    if (Input.pressed('confirm') && list.length) {
      const s = list[this.idx];
      Audio.sfx('magic');
      const ws = this.ws;
      Scenes.pop();
      Transition.start(() => {
        const spot = findSpot(ws.world.map, s.x, s.y + 1, false);
        const p = ws.player;
        p.x = p.tx = spot.x; p.y = p.ty = spot.y;
        p.px = spot.x * TILE; p.py = spot.y * TILE;
        ws.encounterCooldown = 6;
        Gfx.shake(2, 0.4);
      });
    }
  }
  render() {
    const list = this.shrines();
    Gfx.panel(VIEW_W / 2 - 80, 50, 160, 34 + list.length * 11);
    Gfx.textC('THE EMBER OPENS THE SHRINE ROADS', VIEW_W / 2, 56, PAL.MAGIC);
    for (let i = 0; i < list.length; i++) {
      const sel = i === this.idx;
      Gfx.textC((sel ? ICON.CURSOR + ' ' : '') + list[i].name.toUpperCase(), VIEW_W / 2, 70 + i * 11,
        sel ? C.YELLOW : PAL.TEXT);
    }
    if (list.length <= 1) Gfx.textC('(TOUCH MORE SHRINES TO OPEN MORE ROADS)', VIEW_W / 2, 74 + list.length * 11, PAL.TEXT_DIM);
    Gfx.textC('Z: TRAVEL   X: STAY', VIEW_W / 2, 78 + list.length * 11, PAL.TEXT_DARK);
  }
}

// Cloth-map view: terrain only, plus sites you have actually found.
class WorldMapScene {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.t = 0;
    if (!WorldMapScene.baked) WorldMapScene.baked = bakeWorldMap(world);
  }
  update(dt) {
    this.t += dt;
    if (Input.pressed('cancel') || Input.pressed('map')) {
      Input.eat('cancel'); Input.eat('map');
      Audio.sfx('menuBack');
      Scenes.pop();
    }
  }
  render() {
    Gfx.clear(C.VOID);
    const img = WorldMapScene.baked;
    const x0 = Math.floor((VIEW_W - img.width) / 2);
    const y0 = Math.floor((VIEW_H - img.height) / 2);
    Gfx.frame(x0 - 2, y0 - 2, img.width + 4, img.height + 4, C.WOOD);
    Gfx.sprite(img, x0, y0);
    // Discovered sites
    for (const l of this.world.locations) {
      if (!Game.flags['seen_' + l.id]) continue;
      const col = l.type === 'dungeon' ? C.RED : l.type === 'shrine' ? C.CYAN : C.YELLOW;
      Gfx.rect(x0 + l.x - 1, y0 + l.y - 1, 2, 2, col);
    }
    // Player blip (blinking)
    if (Math.floor(this.t * 3) % 2 === 0) {
      Gfx.rect(x0 + this.player.x - 1, y0 + this.player.y - 1, 3, 3, C.WHITE);
    }
    Gfx.textC('THE REALM OF EMBERVALE', VIEW_W / 2, 3, PAL.UI_HILITE);
    Gfx.textC('M / X TO CLOSE', VIEW_W / 2, VIEW_H - 9, PAL.TEXT_DIM);
  }
}

function bakeWorldMap(world) {
  const m = world.map;
  return drawnSprite(m.w, m.h, (c) => {
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const g = m.g(x, y);
        let col;
        switch (g) {
          case GT.DEEP: col = C.DEEPSEA; break;
          case GT.WATER: col = C.BLUE; break;
          case GT.SAND: col = C.SAND; break;
          case GT.ROAD: case GT.BRIDGE: col = C.TAN; break;
          case GT.SWAMP: col = C.SWAMPY; break;
          case GT.DESERT: col = C.SAND; break;
          case GT.SNOW: col = C.WHITE; break;
          case GT.LAVA: col = C.RED; break;
          case GT.MEADOW: case GT.GRASS: default: col = C.DGREEN; break;
        }
        const o = m.o(x, y);
        if (o === OT.MTN) col = C.GRAY;
        else if (o === OT.PEAK) col = C.STEEL;
        else if (o === OT.TREE || o === OT.PINES || o === OT.THICK) col = '#2a5220';
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    }
  });
}
