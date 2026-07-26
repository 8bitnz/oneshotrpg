// town.js — town exploration, NPC dialogue, shops, inns, temples,
// recruitment, rumors. Exiting any map border returns to the overworld.
'use strict';

class TownScene extends MapScene {
  constructor(townId, worldPos) {
    const built = buildTown(townId);
    const heroSprites = Game.party.length ? Game.party[0].sprites : SPRITE_PRESETS.hero();
    super(built.map, new Walker(built.spawn.x, built.spawn.y, heroSprites));
    this.townId = townId;
    this.built = built;
    this.worldPos = worldPos;      // overworld tile we entered from
    this.placeNpcs();
  }

  enter() { Audio.playMusic('town'); }
  resume(result) { super.resume(result); Audio.playMusic('town'); }

  placeNpcs() {
    const spec = this.built.spec;
    const r = RNG(0x7A1E + this.townId.length);
    for (const nd of spec.npcs) {
      if (nd.recruit && Game.flags['recruited_' + nd.recruit]) continue;
      let x, y;
      if (nd.in !== undefined) {
        const spot = this.built.keepers[nd.in];
        const b = spec.buildings[nd.in];
        x = spot.x; y = spot.y;
        // second NPC in same building: shift right/down until free
        while (this.entities.some(e => e.walker.x === x && e.walker.y === y) || !this.map.walkable(x, y)) {
          x++;
          if (x >= b.x + b.w - 1) { x = b.x + 1; y++; }
          if (y >= b.y + b.h - 1) break;
        }
      } else if (nd.at === 'gate') {
        x = Math.floor(this.map.w / 2) - 2; y = this.map.h - 3;
        while (!this.map.walkable(x, y)) x++;
      } else {
        // outdoor wanderer
        for (let tries = 0; tries < 200; tries++) {
          x = r.i(3, this.map.w - 4); y = r.i(3, this.map.h - 4);
          if (this.map.walkable(x, y) && this.map.g(x, y) !== GT.FLOOR_WOOD &&
              this.map.g(x, y) !== GT.FLOOR_STONE) break;
        }
      }
      const look = nd.recruit ? COMPANIONS.find(c => c.id === nd.recruit).look : nd.look;
      const w = new Walker(x, y, charSprites(look || {}));
      this.entities.push({ walker: w, data: nd, homeX: x, homeY: y, wanderT: Math.random() * 3 });
    }
  }

  updateEntity(e, dt) {
    e.walker.update(dt, 1);
    if (!e.data.wander) return;
    e.wanderT -= dt;
    if (!e.walker.moving && e.wanderT <= 0) {
      e.wanderT = 1.5 + Math.random() * 3;
      const dir = DIR_LIST[rng.i(0, 3)];
      const d = DIRS[dir];
      const nx = e.walker.x + d.dx, ny = e.walker.y + d.dy;
      const g = this.map.g(nx, ny);
      if (manhattan(nx, ny, e.homeX, e.homeY) <= 4 &&
          this.map.walkable(nx, ny) &&
          g !== GT.FLOOR_WOOD && g !== GT.FLOOR_STONE &&
          !(nx === this.player.x && ny === this.player.y) &&
          !this.entities.some(o => o !== e && o.walker.x === nx && o.walker.y === ny)) {
        e.walker.tryStep(dir, this.map);
      }
    }
  }

  onArrive(x, y) {
    Game.tickTime(1);
    if (x <= 0 || y <= 0 || x >= this.map.w - 1 || y >= this.map.h - 1) {
      Audio.sfx('stairs');
      Transition.start(() => Scenes.pop({ leftTown: true }));
    }
  }

  npcAt(x, y) {
    return this.entities.find(e => e.walker.x === x && e.walker.y === y ||
      (e.walker.moving && e.walker.tx === x && e.walker.ty === y));
  }

  interact() {
    const p = this.player;
    const d = DIRS[p.dir];
    let tx = p.x + d.dx, ty = p.y + d.dy;
    let e = this.npcAt(tx, ty);
    // talking across a counter
    if (!e && this.map.o(tx, ty) === OT.COUNTER) e = this.npcAt(tx + d.dx, ty + d.dy);
    if (e) {
      // face each other
      const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
      e.walker.dir = opp[p.dir];
      startNpcDialogue(this, e);
      return;
    }
    const o = this.map.o(tx, ty);
    const od = o ? OBJ[o] : null;
    if (o === OT.SIGN) {
      const b = this.nearestBuilding(tx, ty);
      Scenes.push(new DialogueScene('SIGN', [b && b.name ? b.name : this.built.spec.name.toUpperCase()], {}));
    } else if (o === OT.WELL || o === OT.FOUNTAIN) {
      Scenes.push(new DialogueScene('', ['You look in. Water looks back. Neither of you blinks first.'], {}));
    } else if (o === OT.SHELF) {
      Scenes.push(new DialogueScene('BOOKSHELF', [rng.pick(BOOK_LINES)], {}));
    } else if (o === OT.ALTAR) {
      Scenes.push(new DialogueScene('', ['The altar is warm, like a hand just left it.'], {}));
    } else if (o === OT.THRONE) {
      Scenes.push(new DialogueScene('', ['An old throne. The cushion is newer than the crown that sat here.'], {}));
    }
  }

  nearestBuilding(x, y) {
    let best = null, bd = 1e9;
    for (const b of this.built.spec.buildings) {
      const d = Math.abs(x - (b.x + b.w / 2)) + Math.abs(y - b.y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  renderOverlay(ox, oy) {
    const dark = Game.darkness();
    if (dark > 0.01) {
      Gfx.ctx.fillStyle = `rgba(16, 14, 48, ${(dark * 0.5).toFixed(3)})`;
      Gfx.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    const label = this.built.spec.name.toUpperCase() + '   ' + Game.clockText();
    Gfx.rect(VIEW_W - textWidth(label) - 8, 2, textWidth(label) + 6, 10, PAL.UI_BG);
    Gfx.textR(label, VIEW_W - 2, 4, PAL.TEXT_DIM);
  }

  update(dt) {
    super.update(dt);
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
}

const BOOK_LINES = [
  '"...and so the First Flame was divided: one ember to the city, one to the deep, one to the keeping of the winds..."',
  'A ledger. Someone owed someone four goats and "the usual silence."',
  '"ON MOONGATES: they are doors. The moon is not the key. The moon is the LOCK."',
  'A cookbook. Every recipe ends with "add more butter than feels wise."',
  '"The lighthouse kept no ships. It kept something OUT." The rest is torn away.',
];

// --- dialogue -------------------------------------------------------------------
function startNpcDialogue(townScene, e) {
  const nd = e.data;
  if (nd.recruit) {
    const comp = COMPANIONS.find(c => c.id === nd.recruit);
    if (nd.recruitCond && !Game.flags[nd.recruitCond]) {
      Scenes.push(new DialogueScene(comp.name.toUpperCase(),
        [nd.recruitCondText || comp.greeting], {}));
      return;
    }
    Scenes.push(new DialogueScene(comp.name.toUpperCase(), [comp.greeting, comp.persona], {
      action: { type: 'recruit', id: nd.recruit, entity: e, townScene },
    }));
    return;
  }
  // Dynamic (quest-aware) dialogue: lines may be a function returning
  // {pages, action?, journal?} based on current flags.
  let dynAction = null;
  let pages;
  if (typeof nd.lines === 'function') {
    const res = nd.lines();
    pages = res.pages.slice();
    dynAction = res.action || null;
    if (res.journal) Game.addJournal(res.journal);
  } else {
    pages = (Game.isNight() && nd.nightLines) ? nd.nightLines.slice() : (nd.lines || ['...']).slice();
  }
  if (nd.journal) Game.addJournal(nd.journal);
  // companion interjection
  if (Game.party.length > 1 && rng.chance(0.22)) {
    const others = Game.party.slice(1);
    const m = rng.pick(others);
    const comp = COMPANIONS.find(c => c.id === m.id);
    if (comp && comp.banter.length) pages.push(comp.name + ': ' + rng.pick(comp.banter));
  }
  Scenes.push(new DialogueScene(nd.name.toUpperCase(), pages, {
    action: dynAction || nd.action, rumors: nd.rumors, worldPos: townScene.worldPos,
  }));
}

class DialogueScene {
  constructor(speaker, pages, opts) {
    this.transparent = true;
    this.speaker = speaker;
    this.pages = pages;
    this.page = 0;
    this.opts = opts || {};
    this.mode = 'text';       // text | choice
    this.choiceIdx = 0;
    this.choices = [];
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.mode === 'text') {
      if (Input.pressed('confirm') || Input.pressed('cancel')) {
        Input.eat('confirm'); Input.eat('cancel');
        Audio.sfx('menuMove');
        this.page++;
        if (this.page >= this.pages.length) this.finishText();
      }
    } else {
      listNav(this, 'choiceIdx', this.choices.length);
      if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
      if (Input.pressed('confirm')) {
        Input.eat('confirm');
        this.choices[this.choiceIdx].fn();
      }
    }
  }

  finishText() {
    const a = this.opts.action;
    if (this.opts.rumors) {
      // rumor as bonus choice alongside any action
      this.mode = 'choice';
      this.choices = [];
      if (a && a.type === 'inn') this.choices.push({ label: `REST (${a.price} GOLD)`, fn: () => this.doInn(a) });
      this.choices.push({ label: 'ANY NEWS?', fn: () => this.doRumor() });
      this.choices.push({ label: 'LEAVE', fn: () => Scenes.pop() });
      return;
    }
    if (!a) { Scenes.pop(); return; }
    switch (a.type) {
      case 'shop':
        Scenes.pop();
        Scenes.push(new ShopScene(a.stock, this.speaker));
        break;
      case 'inn':
        this.mode = 'choice';
        this.choices = [
          { label: `REST (${a.price} GOLD)`, fn: () => this.doInn(a) },
          { label: 'LEAVE', fn: () => Scenes.pop() },
        ];
        break;
      case 'temple':
        this.mode = 'choice';
        this.choices = [
          { label: `RESTORE THE PARTY (${a.healPrice} GOLD)`, fn: () => this.doTemple(a) },
          { label: 'LEAVE', fn: () => Scenes.pop() },
        ];
        break;
      case 'recruit':
        this.mode = 'choice';
        this.choices = [
          { label: 'JOIN ME.', fn: () => this.doRecruit(a) },
          { label: 'NOT YET.', fn: () => Scenes.pop() },
        ];
        break;
      case 'buyskiff':
        this.mode = 'choice';
        this.choices = [
          { label: `BUY THE SKIFF (${a.price} GOLD)`, fn: () => this.doSkiff(a) },
          { label: 'NOT TODAY.', fn: () => Scenes.pop() },
        ];
        break;
      default:
        Scenes.pop();
    }
  }

  doInn(a) {
    if (Game.gold < a.price) { Audio.sfx('error'); this.pages = ['"Coin first. Beds are honest that way."']; this.page = 0; this.mode = 'text'; return; }
    Game.gold -= a.price;
    for (const m of Game.roster) {
      m.hp = m.maxHp; m.mp = m.maxMp; m.statuses = [];
    }
    // sleep to 7am
    const mins = Game.clock < 7 * 60 ? (7 * 60 - Game.clock) : (24 * 60 - Game.clock + 7 * 60);
    Game.tickTime(mins);
    Audio.sfx('save');
    if (this.opts.worldPos) saveGame('auto', this.opts.worldPos);
    this.pages = ['You sleep. For a few dark hours the world manages without you.', 'You wake rested. (AUTOSAVED)'];
    this.page = 0; this.mode = 'text'; this.opts = {};
  }

  doTemple(a) {
    if (Game.gold < a.healPrice) { Audio.sfx('error'); this.pages = ['"The Dawn gives freely. The roof, alas, does not."']; this.page = 0; this.mode = 'text'; this.opts = {}; return; }
    Game.gold -= a.healPrice;
    for (const m of Game.roster) { m.hp = m.maxHp; m.mp = m.maxMp; m.statuses = []; }
    Audio.sfx('levelup');
    this.pages = ['Light pours through you like water through cupped hands.', 'The party is restored.'];
    this.page = 0; this.mode = 'text'; this.opts = {};
  }

  doRecruit(a) {
    const m = Game.recruit(a.id);
    Game.flags['recruited_' + a.id] = true;
    if (a.townScene && a.entity) {
      a.townScene.entities = a.townScene.entities.filter(x => x !== a.entity);
    }
    Audio.sfx('levelup');
    const comp = COMPANIONS.find(c => c.id === a.id);
    Game.addJournal(`${comp.name} the ${CLASSES[comp.cls].name} joined the company.`);
    const inParty = Game.party.includes(m);
    this.pages = [
      `${comp.name} joins the company!`,
      inParty ? `${comp.name} falls in beside you.` : `The party is full. ${comp.name} will wait with the camp roster. (C > PARTY to swap.)`,
    ];
    this.page = 0; this.mode = 'text'; this.opts = {};
  }

  doSkiff(a) {
    if (Game.gold < a.price) {
      Audio.sfx('error');
      this.pages = ['"Come back when your purse floats."'];
      this.page = 0; this.mode = 'text'; this.opts = {};
      return;
    }
    Game.gold -= a.price;
    Game.flags.hasSkiff = true;
    Game.addItem('skiff', 1);
    // moor her on the water nearest Saltmere
    const sm = Game.world.locById.saltmere;
    outer:
    for (let rad = 1; rad < 15; rad++) {
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
          const x = sm.x + dx, y = sm.y + dy;
          const g = Game.world.map.g(x, y);
          if (g === GT.WATER || g === GT.DEEP) {
            Game.flags.boatPos = { x, y };
            break outer;
          }
        }
      }
    }
    Audio.sfx('gold');
    Game.addJournal('Bought a skiff at Saltmere. The sea is a road now.');
    this.pages = ['"She\'s yours. Moored just off the strand, west side."', '"Walk into her to board. Step ashore to land. The sea does the rest, mostly TO you."'];
    this.page = 0; this.mode = 'text'; this.opts = {};
  }

  doRumor() {
    const heard = Game.flags.rumorsHeard || [];
    const fresh = RUMORS.filter(r => !heard.includes(r.id));
    const pick = fresh.length ? rng.pick(fresh) : rng.pick(RUMORS);
    if (fresh.length) {
      heard.push(pick.id);
      Game.flags.rumorsHeard = heard;
      Game.addJournal('Rumor: ' + pick.text.replace(/"/g, ''));
    }
    this.pages = [pick.text];
    this.page = 0; this.mode = 'text'; this.opts = {};
  }

  render() {
    const h = 52;
    const y0 = VIEW_H - h - 4;
    Gfx.panel(6, y0, VIEW_W - 12, h);
    if (this.speaker) Gfx.text(this.speaker, 12, y0 + 4, PAL.UI_HILITE);
    if (this.mode === 'text') {
      const txt = this.pages[Math.min(this.page, this.pages.length - 1)] || '';
      Gfx.textWrap(txt, 12, y0 + (this.speaker ? 14 : 8), VIEW_W - 28, PAL.TEXT);
      if (Math.floor(this.t * 2) % 2 === 0) Gfx.textR('Z', VIEW_W - 12, y0 + h - 9, PAL.TEXT_DIM);
    } else {
      for (let i = 0; i < this.choices.length; i++) {
        const sel = i === this.choiceIdx;
        Gfx.text((sel ? ICON.CURSOR : ' ') + this.choices[i].label, 16, y0 + 15 + i * 10,
          sel ? C.YELLOW : PAL.TEXT);
      }
    }
  }
}

// --- shop -----------------------------------------------------------------------
class ShopScene {
  constructor(stock, keeper) {
    this.transparent = true;
    this.stock = stock.filter(id => ITEMS[id]);
    this.keeper = keeper;
    this.tab = 0;             // 0 buy, 1 sell
    this.idx = 0;
  }
  sellList() {
    return Game.invList(it => it.kind !== 'key' && it.price > 0);
  }
  update(dt) {
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
    if (Input.pressed('left') || Input.pressed('right')) {
      this.tab = 1 - this.tab; this.idx = 0; Audio.sfx('menuMove');
    }
    const list = this.tab === 0 ? this.stock : this.sellList();
    listNav(this, 'idx', Math.max(1, list.length));
    if (this.idx >= list.length) this.idx = Math.max(0, list.length - 1);
    if (Input.pressed('confirm') && list.length) {
      if (this.tab === 0) {
        const id = this.stock[this.idx];
        const it = ITEMS[id];
        if (Game.gold >= it.price) {
          Game.gold -= it.price;
          Game.addItem(id, 1);
          Audio.sfx('gold');
        } else {
          Audio.sfx('error');
        }
      } else {
        const e = this.sellList()[this.idx];
        Game.takeItem(e.id, 1);
        Game.gold += Math.floor(e.item.price / 2);
        Audio.sfx('gold');
      }
    }
  }
  render() {
    dimBehind();
    Gfx.panel(30, 12, VIEW_W - 60, VIEW_H - 24);
    Gfx.text(this.keeper, 38, 18, PAL.UI_HILITE);
    Gfx.textR(ICON.COIN + ' ' + Game.gold, VIEW_W - 38, 18, PAL.GOLD);
    Gfx.text(this.tab === 0 ? '[BUY]  SELL' : ' BUY  [SELL]', 38, 28, PAL.TEXT);
    const list = this.tab === 0 ? this.stock : this.sellList();
    if (!list.length) Gfx.textC(this.tab === 0 ? 'SOLD OUT.' : 'NOTHING TO SELL.', VIEW_W / 2, 70, PAL.TEXT_DIM);
    const top = Math.max(0, Math.min(this.idx - 8, list.length - 11));
    for (let i = top; i < Math.min(list.length, top + 11); i++) {
      const y = 40 + (i - top) * 10;
      const sel = i === this.idx;
      if (sel) Gfx.rect(36, y - 2, VIEW_W - 72, 10, C.MAROON);
      if (this.tab === 0) {
        const it = ITEMS[list[i]];
        Gfx.text((sel ? ICON.CURSOR : ' ') + it.name, 38, y, sel ? C.YELLOW : PAL.TEXT);
        const owned = Game.countItem(list[i]);
        if (owned) Gfx.text('(' + owned + ')', 170, y, PAL.TEXT_DARK);
        Gfx.textR(it.price + 'G', VIEW_W - 38, y, Game.gold >= it.price ? PAL.GOLD : C.RED);
      } else {
        const e = list[i];
        Gfx.text((sel ? ICON.CURSOR : ' ') + e.item.name + ' x' + e.count, 38, y, sel ? C.YELLOW : PAL.TEXT);
        Gfx.textR(Math.floor(e.item.price / 2) + 'G', VIEW_W - 38, y, PAL.GOLD);
      }
    }
    // description
    let desc = '';
    if (this.tab === 0 && list[this.idx]) desc = ITEMS[list[this.idx]].desc;
    if (this.tab === 1 && list[this.idx]) desc = list[this.idx].item.desc;
    Gfx.textWrap(desc, 38, VIEW_H - 42, VIEW_W - 76, PAL.TEXT_DIM);
    Gfx.textC('</>: BUY/SELL   Z: TRADE   X: LEAVE', VIEW_W / 2, VIEW_H - 20, PAL.TEXT_DARK);
  }
}

// --- journal ---------------------------------------------------------------------
class JournalScene {
  constructor() { this.transparent = true; this.top = 0; }
  update(dt) {
    const n = (Game.journal || []).length;
    if (Input.pressed('up')) this.top = Math.max(0, this.top - 1);
    if (Input.pressed('down')) this.top = Math.min(Math.max(0, n - 6), this.top + 1);
    if (Input.pressed('cancel') || Input.pressed('journal')) {
      Input.eat('cancel'); Input.eat('journal');
      Audio.sfx('menuBack');
      Scenes.pop();
    }
  }
  render() {
    dimBehind();
    Gfx.panel(20, 10, VIEW_W - 40, VIEW_H - 20);
    Gfx.textC('JOURNAL', VIEW_W / 2, 16, PAL.UI_HILITE);
    const j = Game.journal || [];
    if (!j.length) Gfx.textC('NO ENTRIES. GO OVERHEAR SOMETHING.', VIEW_W / 2, 70, PAL.TEXT_DIM);
    let y = 30;
    for (let i = this.top; i < j.length && y < VIEW_H - 42; i++) {
      Gfx.text('DAY ' + j[i].day, 28, y, PAL.TEXT_DARK);
      const lines = Gfx.textWrap(j[i].text, 28, y + 8, VIEW_W - 66, PAL.TEXT);
      y += 10 + lines * 7;
    }
    Gfx.textC('UP/DOWN: SCROLL   X/J: CLOSE', VIEW_W / 2, VIEW_H - 18, PAL.TEXT_DARK);
  }
}
