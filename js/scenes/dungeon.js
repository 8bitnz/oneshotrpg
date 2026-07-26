// dungeon.js — dungeon exploration: darkness + light sources, traps, chests,
// levers/locked vaults, grave-wakes, bosses, multi-floor stairs.
'use strict';

class DungeonScene extends MapScene {
  // at: 'entry' (stairs up / ladder) or 'exit' (the stairs-down tile)
  constructor(dgId, floor, worldPos, at) {
    const built = buildDungeonFloor(dgId, floor);
    const start = (at === 'exit' && built.exit) ? built.exit : built.entry;
    const heroSprites = Game.party.length ? Game.party[0].sprites : SPRITE_PRESETS.hero();
    super(built.map, new Walker(start.x, start.y, heroSprites));
    this.dgId = dgId;
    this.def = DUNGEONS[dgId];
    this.floor = floor;
    this.built = built;
    this.worldPos = worldPos;
    this.encounterCooldown = 5;
    this.trapsSprung = {};        // scene-local; traps re-arm on revisit
    this.notice = null;           // {txt, t}
    this.tideHigh = false;
    this.tideSteps = 0;
    this.tremorSteps = 0;
    this.windSteps = 0;
    this.applyFlags();
    this.collectLights();
    // a torch from the satchel burns for this delve
    this.lightBonus = 0;
    if (floor === 1 && at !== 'exit') {
      if (Game.takeItem('torch', 1)) {
        this.lightBonus = 2.2;
        Game.flags['torchlit_' + dgId] = true;
        this.say('You light a torch. The dark leans away.');
      } else if (Game.flags['torchlit_' + dgId]) {
        this.lightBonus = 2.2;    // still burning from this delve
      } else {
        this.say('No torch. The dark leans in.');
      }
    } else if (Game.flags['torchlit_' + dgId]) {
      this.lightBonus = 2.2;
    }
  }

  enter() { Audio.playMusic('dungeon'); }
  exit() { Audio.playMusic('overworld'); }

  flagKey(kind, idx) { return `dg_${this.dgId}_${this.floor}_${kind}_${idx}`; }

  applyFlags() {
    const b = this.built;
    if (b.secretChest && Game.flags.bell_rung) {
      b.chests.push({ x: b.secretChest.x, y: b.secretChest.y, idx: 'bell' });
      this.map.setO(b.secretChest.x, b.secretChest.y, OT.CHEST);
    }
    for (const ch of b.chests) {
      if (Game.flags[this.flagKey('chest', ch.idx)]) this.map.setO(ch.x, ch.y, OT.CHEST_OPEN);
    }
    if (b.lever && Game.flags[this.flagKey('lever', 0)]) {
      this.map.setO(b.lever.x, b.lever.y, OT.SWITCH_ON);
      if (b.vaultDoor) this.map.setO(b.vaultDoor.x, b.vaultDoor.y, OT.NONE);
    }
    if (b.boss && !Game.flags['boss_' + this.dgId + '_dead']) {
      const t = ENEMY_TYPES[this.def.boss.type];
      const w = new Walker(b.boss.x, b.boss.y, t.sprite());
      w.dir = 'down';
      this.entities.push({ walker: w, isBoss: true });
    }
  }

  collectLights() {
    this.lights = [];
    for (let y = 0; y < this.map.h; y++) {
      for (let x = 0; x < this.map.w; x++) {
        const o = this.map.o(x, y);
        if (o) {
          const od = OBJ[o];
          if (od && od.light) { this.lights.push({ x, y, r: od.light }); continue; }
          if (o === OT.MUSHROOM) { this.lights.push({ x, y, r: 2.6 }); continue; }
        }
        if (this.map.g(x, y) === GT.LAVA) this.lights.push({ x, y, r: 2.8 });
      }
    }
  }

  say(txt) { this.notice = { txt, t: 3.5 }; }

  playerLightR() { return (this.def.lightRadius || 4.5) + this.lightBonus; }

  onArrive(x, y) {
    Game.tickTime(1);
    // --- gimmick ticks -------------------------------------------------------
    if (this.def.tide && this.built.floodTiles) {
      if (++this.tideSteps >= 26) {
        this.tideSteps = 0;
        this.tideHigh = !this.tideHigh;
        for (const t of this.built.floodTiles) {
          if (t.x === x && t.y === y) continue;      // never under your feet
          this.map.setG(t.x, t.y, this.tideHigh ? GT.WATER_T : (this.def.ground || GT.DFLOOR));
        }
        Audio.sfx('stairs');
        this.say(this.tideHigh ? 'The water rises...' : 'The water recedes.');
      }
    }
    if (this.def.tremors) {
      if (++this.tremorSteps >= 24) {
        this.tremorSteps = 0;
        Gfx.shake(3, 0.6);
        Audio.sfx('bump');
        this.say('The mountain shudders.');
        if (rng.chance(0.35)) {
          this.encounterCooldown = 0;
          Scenes.push(new BattleScene({
            enemies: rng.pick(this.def.encounters).slice(),
            biome: 'cave', intro: 'The tremor shook something loose.',
          }));
          return;
        }
      }
    }
    if (this.def.wind && this.floor >= 2) {
      if (++this.windSteps >= 8) {
        this.windSteps = 0;
        const dir = rng.pick(DIR_LIST);
        const nx = x + DIRS[dir].dx, ny = y + DIRS[dir].dy;
        if (this.map.walkable(nx, ny) && !this.entityAt(nx, ny)) {
          this.say('The wind screams through the stones!');
          Audio.sfx('flee');
          this.player.x = this.player.tx = nx;
          this.player.y = this.player.ty = ny;
          this.player.px = nx * TILE; this.player.py = ny * TILE;
          x = nx; y = ny;
        }
      }
    }
    if (this.built.pits) {
      const pit = this.built.pits.find(p => p.x === x && p.y === y);
      if (pit) {
        const lead = Game.party[0];
        const dmg = rng.i(2, 5);
        lead.hp = Math.max(1, lead.hp - dmg);
        Audio.sfx('die');
        Gfx.shake(3, 0.4);
        const dgId = this.dgId, floor = this.floor, wp = this.worldPos;
        Transition.start(() => {
          Scenes.replace(new DungeonScene(dgId, floor + 1, wp, 'entry'));
          Scenes.top().say(`The sand drinks you! ${lead.name} takes ${dmg} in the fall.`);
        }, 9);
        return;
      }
    }
    const o = this.map.o(x, y);
    // stairs
    if (o === OT.LADDER || (o === OT.STAIRS_UP && this.floor === 1)) {
      Audio.sfx('stairs');
      Transition.start(() => Scenes.pop({ leftDungeon: true }));
      return;
    }
    if (o === OT.STAIRS_UP && this.floor > 1) {
      Audio.sfx('stairs');
      Transition.start(() => Scenes.replace(new DungeonScene(this.dgId, this.floor - 1, this.worldPos, 'exit')));
      return;
    }
    if (o === OT.STAIRS_DN) {
      Audio.sfx('stairs');
      Transition.start(() => Scenes.replace(new DungeonScene(this.dgId, this.floor + 1, this.worldPos, 'entry')));
      return;
    }
    // traps
    const trap = this.built.traps.find(t => t.x === x && t.y === y);
    if (trap && !this.trapsSprung[x + ',' + y]) {
      this.trapsSprung[x + ',' + y] = true;
      const lead = Game.party[0];
      const dmg = rng.i(3, 6) + this.floor * 2;
      lead.hp = Math.max(1, lead.hp - dmg);
      Audio.sfx('crit');
      Gfx.shake(3, 0.3);
      this.map.setO(x, y, OT.RUBBLE);
      this.say(`A spike trap! ${lead.name} takes ${dmg}.`);
      return;
    }
    // grave-wake gimmick
    if (this.def.graves) {
      for (const g of this.built.graves) {
        if (manhattan(x, y, g.x, g.y) === 1 && !Game.flags[this.flagKey('grave', g.idx)]) {
          Game.flags[this.flagKey('grave', g.idx)] = true;
          if (rng.chance(0.4)) {
            Audio.sfx('encounter');
            Gfx.shake(2, 0.3);
            Scenes.push(new BattleScene({
              enemies: rng.chance(0.5) ? ['skeleton', 'skeleton'] : ['skeleton', 'boneArcher'],
              biome: 'cave', intro: 'The earth shifts. Hands first.',
            }));
            return;
          }
        }
      }
    }
    // boss proximity
    const bossEnt = this.entities.find(e => e.isBoss);
    if (bossEnt && manhattan(x, y, bossEnt.walker.x, bossEnt.walker.y) <= 2) {
      this.startBossFight(bossEnt);
      return;
    }
    // random encounters
    if (this.encounterCooldown > 0) { this.encounterCooldown--; return; }
    if (rng.chance(0.030)) {
      this.encounterCooldown = 5;
      Audio.sfx('encounter');
      Gfx.shake(2, 0.25);
      Scenes.push(new BattleScene({
        enemies: rng.pick(this.def.encounters).slice(),
        biome: 'cave',
      }));
    }
  }

  startBossFight(bossEnt) {
    Audio.sfx('encounter');
    Gfx.shake(3, 0.4);
    const boss = this.def.boss;
    Scenes.push(new BattleScene({
      enemies: [boss.type, ...boss.adds],
      biome: 'cave', boss: true, intro: boss.intro,
      onWin: () => {
        Game.flags['boss_' + this.dgId + '_dead'] = true;
        this.entities = this.entities.filter(e => e !== bossEnt);
        Game.addJournal(`${ENEMY_TYPES[boss.type].name} destroyed in ${this.def.name}.`);
        if (this.def.finale) Game.flags.game_won = true;
      },
    }));
  }

  resume(result) {
    super.resume(result);
    if (Game.flags.game_won && !Game.flags.ending_shown) {
      Game.flags.ending_shown = true;
      Scenes.reset(new VictoryScene());
      return;
    }
    Audio.playMusic('dungeon');
    if (result && (result.fled || result.victory)) this.encounterCooldown = result.fled ? 8 : 4;
  }

  interact() {
    const p = this.player;
    const d = DIRS[p.dir];
    const tx = p.x + d.dx, ty = p.y + d.dy;
    const bossEnt = this.entities.find(e => e.isBoss && e.walker.x === tx && e.walker.y === ty);
    if (bossEnt) { this.startBossFight(bossEnt); return; }
    const o = this.map.o(tx, ty);
    // chest
    const chest = this.built.chests.find(c => c.x === tx && c.y === ty);
    if (chest && o === OT.CHEST) {
      const key = this.flagKey('chest', chest.idx);
      if (Game.flags[key]) return;
      Game.flags[key] = true;
      this.map.setO(tx, ty, OT.CHEST_OPEN);
      const loot = chest.idx === 'boss' ? this.def.bossChest
        : chest.idx === 'bell' ? { gold: [60, 100], items: ['mirrorshield'] }
        : this.def.chestLoot[chest.idx] || { gold: [5, 15] };
      const lines = [];
      if (loot.gold) {
        const g = rng.i(loot.gold[0], loot.gold[1]);
        Game.gold += g;
        lines.push(`${g} gold.`);
      }
      for (const id of (loot.items || [])) {
        Game.addItem(id, 1);
        lines.push(ITEMS[id].name + (ITEMS[id].lore ? ' - ' + ITEMS[id].lore : '.'));
        if (ITEMS[id].kind === 'key') Game.addJournal('Took ' + ITEMS[id].name + '. ' + (ITEMS[id].lore || ''));
      }
      Audio.sfx('gold');
      Scenes.push(new DialogueScene('CHEST', ['Inside: ' + lines.join(' ')], {}));
      return;
    }
    if (o === OT.CHEST_OPEN) {
      Scenes.push(new DialogueScene('', ['Empty. Someone was faster, and that someone was you.'], {}));
      return;
    }
    // lever
    if (o === OT.LEVER) {
      Game.flags[this.flagKey('lever', 0)] = true;
      this.map.setO(tx, ty, OT.SWITCH_ON);
      if (this.built.vaultDoor) this.map.setO(this.built.vaultDoor.x, this.built.vaultDoor.y, OT.NONE);
      Audio.sfx('open');
      Gfx.shake(1.5, 0.4);
      this.say('Somewhere, stone grinds against stone.');
      return;
    }
    if (o === OT.SWITCH_ON) { this.say('The lever has said all it has to say.'); return; }
    // locked vault door
    if (o === OT.DDOOR_LOCK) {
      Audio.sfx('bump');
      this.say('Sealed. Something else must move first.');
      return;
    }
    // the drowned bell
    if (this.built.bell && this.built.bell.x === tx && this.built.bell.y === ty) {
      if (!Game.flags.bell_rung) {
        Game.flags.bell_rung = true;
        Audio.sfx('levelup');
        Gfx.shake(2, 0.8);
        this.say('The drowned bell TOLLS. Somewhere, stone shifts.');
        if (this.built.secretChest) {
          this.map.setO(this.built.secretChest.x, this.built.secretChest.y, OT.CHEST);
          this.built.chests.push({ x: this.built.secretChest.x, y: this.built.secretChest.y, idx: 'bell' });
        }
        Game.addJournal('Rang the bell of the Sunken Keep. Something answered.');
      } else {
        this.say('The bell has said its piece.');
      }
      return;
    }
    // the widow's husband
    if (this.built.minerBones && this.built.minerBones.x === tx && this.built.minerBones.y === ty) {
      if (!Game.flags.found_miner) {
        Game.flags.found_miner = true;
        Game.addItem('wedding_ring', 1);
        Game.addJournal('Found quiet bones in the Emberdeep. A polished ring. Widow Karst should know.');
        Scenes.push(new DialogueScene('', ['Bones, arranged with care by the dark itself. A ring, still polished.', 'You take it gently. Someone is owed an ending.'], {}));
      } else {
        Scenes.push(new DialogueScene('', ['The bones rest easier now.'], {}));
      }
      return;
    }
    // flavor bones
    const fl = this.built.flavors.find(f => f.x === tx && f.y === ty);
    if (fl) {
      if (this.def.flavorPickup && this.built.flavors.indexOf(fl) === this.def.flavorPickup.idx &&
          !Game.flags['pickup_' + this.dgId]) {
        Game.flags['pickup_' + this.dgId] = true;
        Game.addItem(this.def.flavorPickup.item, 1);
        Game.addJournal('Took a dead hunter\'s pack from Gloomroot. Someone in Willowbrook drank with him.');
      }
      Scenes.push(new DialogueScene('', [fl.txt], {}));
      return;
    }
    if (o === OT.GRAVE) {
      Scenes.push(new DialogueScene('', ['A name, worn to a whisper. You leave it be.'], {}));
      return;
    }
    if (o === OT.CRYSTAL) {
      Scenes.push(new DialogueScene('', ['The crystal hums against your palm. Warm. Waiting.'], {}));
    }
  }

  update(dt) {
    super.update(dt);
    if (this.notice) {
      this.notice.t -= dt;
      if (this.notice.t <= 0) this.notice = null;
    }
    if (Input.pressed('menu')) {
      Input.eat('menu');
      Audio.sfx('menuPick');
      Scenes.push(new PartyMenuScene(this));
    }
    if (Input.pressed('journal')) {
      Input.eat('journal');
      Scenes.push(new JournalScene());
    }
  }

  renderOverlay(ox, oy) {
    // Chunky radial darkness: per-tile alpha from distance to nearest light.
    const pr = this.playerLightR();
    const px = this.player.px / TILE + 0.5, py = this.player.py / TILE + 0.5;
    const x0 = Math.floor(ox / TILE), y0 = Math.floor(oy / TILE);
    const x1 = Math.ceil((ox + VIEW_W) / TILE), y1 = Math.ceil((oy + VIEW_H) / TILE);
    const c = Gfx.ctx;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const cx = tx + 0.5, cy = ty + 0.5;
        // brightness 1 at light center → 0 at radius edge
        let br = Math.max(0, 1 - Math.sqrt(dist2(cx, cy, px, py)) / pr);
        for (const L of this.lights) {
          const d = Math.sqrt(dist2(cx, cy, L.x + 0.5, L.y + 0.5));
          if (d < L.r + 3) br = Math.max(br, Math.max(0, 1 - d / (L.r + 1.5)));
        }
        let alpha;
        if (br > 0.55) alpha = 0;
        else if (br > 0.38) alpha = 0.35;
        else if (br > 0.22) alpha = 0.65;
        else if (br > 0.08) alpha = 0.85;
        else alpha = 0.97;
        if (alpha > 0) {
          c.fillStyle = `rgba(8,5,12,${alpha})`;
          c.fillRect(tx * TILE - ox, ty * TILE - oy, TILE, TILE);
        }
      }
    }
    // HUD chip
    const label = `${this.def.name.toUpperCase()}  B${this.floor}`;
    Gfx.rect(VIEW_W - textWidth(label) - 8, 2, textWidth(label) + 6, 10, PAL.UI_BG);
    Gfx.textR(label, VIEW_W - 2, 4, PAL.TEXT_DIM);
    if (this.notice) {
      const w = textWidth(this.notice.txt) + 12;
      Gfx.panel((VIEW_W - w) / 2, VIEW_H - 22, w, 14);
      Gfx.textC(this.notice.txt, VIEW_W / 2, VIEW_H - 17, PAL.TEXT);
    }
  }
}
