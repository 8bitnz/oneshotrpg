// menus.js — out-of-battle UI: party menu, character sheets, equipment,
// inventory, save slots. All keyboard-first with basic mouse hover/click.
'use strict';

// Small helper: navigable list state.
function listNav(scene, field, n) {
  if (!n) return;
  if (Input.pressed('up')) { scene[field] = (scene[field] + n - 1) % n; Audio.sfx('menuMove'); }
  if (Input.pressed('down')) { scene[field] = (scene[field] + 1) % n; Audio.sfx('menuMove'); }
}

function dimBehind() {
  Gfx.ctx.fillStyle = 'rgba(10,6,16,0.72)';
  Gfx.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

// --- Party menu (C on the map) ------------------------------------------------
class PartyMenuScene {
  constructor(worldScene) {
    this.transparent = true;
    this.worldScene = worldScene;
    this.idx = 0;
    this.options = ['PARTY', 'ITEMS', 'JOURNAL', 'SAVE', 'OPTIONS', 'CLOSE'];
  }
  update(dt) {
    listNav(this, 'idx', this.options.length);
    if (Input.pressed('cancel') || Input.pressed('menu')) {
      Input.eat('cancel'); Input.eat('menu');
      Audio.sfx('menuBack');
      Scenes.pop();
      return;
    }
    if (Input.pressed('confirm')) {
      Audio.sfx('menuPick');
      switch (this.options[this.idx]) {
        case 'PARTY': Scenes.push(new PartyListScene()); break;
        case 'ITEMS': Scenes.push(new InventoryScene()); break;
        case 'JOURNAL': Scenes.push(new JournalScene()); break;
        case 'SAVE': Scenes.push(new SaveScene(this.worldScene)); break;
        case 'OPTIONS': Scenes.push(new OptionsScene()); break;
        case 'CLOSE': Scenes.pop(); break;
      }
    }
  }
  render() {
    dimBehind();
    Gfx.panel(10, 10, 92, 20 + this.options.length * 12);
    Gfx.text('CAMP', 16, 15, PAL.UI_HILITE);
    for (let i = 0; i < this.options.length; i++) {
      const sel = i === this.idx;
      Gfx.text((sel ? ICON.CURSOR : ' ') + this.options[i], 16, 28 + i * 12, sel ? C.YELLOW : PAL.TEXT);
    }
    // gold/time chip
    Gfx.panel(VIEW_W - 120, 10, 110, 30);
    Gfx.text(ICON.COIN + ' ' + Game.gold + ' GOLD', VIEW_W - 112, 16, PAL.GOLD);
    Gfx.text(`DAY ${Game.day}  ${Game.clockText()}`, VIEW_W - 112, 26, PAL.TEXT_DIM);
    // party strip
    let y = 60;
    for (const m of Game.party) {
      Gfx.panel(110, y, 180, 24);
      Gfx.ctx.drawImage(m.sprites.down[0], 114, y + 4);
      Gfx.text(m.name.toUpperCase(), 134, y + 4, PAL.TEXT);
      Gfx.text(`${m.cls} ${m.level}`, 134, y + 13, PAL.TEXT_DIM);
      Gfx.textR(`HP ${m.hp}/${m.maxHp}`, 286, y + 4, m.hp < m.maxHp * 0.3 ? C.RED : PAL.TEXT);
      Gfx.textR(`MP ${m.mp}/${m.maxMp}`, 286, y + 13, PAL.MP);
      y += 28;
    }
  }
}

// --- Party list → character sheet ---------------------------------------------
class PartyListScene {
  constructor() { this.transparent = true; this.idx = 0; }
  update(dt) {
    listNav(this, 'idx', Game.roster.length);
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
    if (Input.pressed('confirm')) {
      Audio.sfx('menuPick');
      Scenes.push(new CharSheetScene(Game.roster[this.idx]));
    }
    // Swap active party membership with 'next' (E)
    if (Input.pressed('next')) {
      const m = Game.roster[this.idx];
      if (m.isHero) { Audio.sfx('error'); return; }
      const inParty = Game.party.includes(m);
      if (inParty) {
        Game.party = Game.party.filter(x => x !== m);
        Audio.sfx('menuBack');
      } else if (Game.party.length < 4) {
        Game.party.push(m);
        Audio.sfx('menuPick');
      } else {
        Audio.sfx('error');
      }
    }
  }
  render() {
    dimBehind();
    Gfx.panel(30, 8, VIEW_W - 60, VIEW_H - 16);
    Gfx.textC('THE COMPANY', VIEW_W / 2, 14, PAL.UI_HILITE);
    Gfx.textC('Z: SHEET   E: SWAP IN/OUT   X: BACK', VIEW_W / 2, VIEW_H - 18, PAL.TEXT_DARK);
    let y = 26;
    for (let i = 0; i < Game.roster.length; i++) {
      const m = Game.roster[i];
      const sel = i === this.idx;
      const active = Game.party.includes(m);
      if (sel) Gfx.rect(36, y - 2, VIEW_W - 72, 22, C.MAROON);
      Gfx.ctx.drawImage(m.sprites.down[0], 40, y);
      Gfx.text(m.name.toUpperCase() + (m.isHero ? ' *' : ''), 62, y, sel ? C.YELLOW : PAL.TEXT);
      Gfx.text(`${m.cls} ${m.level}`, 62, y + 9, PAL.TEXT_DIM);
      Gfx.text(active ? 'ACTIVE' : 'CAMP', 150, y, active ? C.GREEN : PAL.TEXT_DARK);
      Gfx.textR(`HP ${m.hp}/${m.maxHp}  MP ${m.mp}/${m.maxMp}`, VIEW_W - 40, y, PAL.TEXT_DIM);
      const need = xpForLevel(m.level + 1);
      Gfx.textR(m.level >= XP_CAP_LEVEL ? 'MAX' : `XP ${m.xp}/${need}`, VIEW_W - 40, y + 9, PAL.XP);
      y += 24;
    }
  }
}

class CharSheetScene {
  constructor(m) {
    this.transparent = true;
    this.m = m;
    this.section = 0;      // 0=equip slots, 1=abilities
    this.idx = 0;
    this.slotNames = ['weapon', 'armor', 'shield', 'acc'];
  }
  update(dt) {
    const m = this.m;
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
    if (Input.pressed('left') || Input.pressed('right')) {
      this.section = 1 - this.section; this.idx = 0; Audio.sfx('menuMove');
    }
    const n = this.section === 0 ? 4 : Math.max(1, m.abilities.length);
    listNav(this, 'idx', n);
    if (Input.pressed('confirm') && this.section === 0) {
      Audio.sfx('menuPick');
      Scenes.push(new EquipPickScene(m, this.slotNames[this.idx]));
    }
  }
  render() {
    dimBehind();
    const m = this.m;
    Gfx.panel(20, 8, VIEW_W - 40, VIEW_H - 16);
    Gfx.ctx.drawImage(m.sprites.down[0], 28, 14);
    Gfx.text(m.name.toUpperCase() + '  ' + m.cls.toUpperCase() + ' LV' + m.level, 48, 16, PAL.UI_HILITE);
    const need = xpForLevel(m.level + 1);
    Gfx.textR(m.level >= XP_CAP_LEVEL ? 'MAX LEVEL' : `XP ${m.xp} / ${need}`, VIEW_W - 28, 16, PAL.XP);
    // stats column
    const sx = 28, sy = 36;
    const rows = [
      ['HP', `${m.hp}/${m.maxHp}`], ['MP', `${m.mp}/${m.maxMp}`],
      ['STR', Math.floor(m.str)], ['DEX', Math.floor(m.dex)], ['INT', Math.floor(m.int)],
      ['VIT', Math.floor(m.vit)], ['SPD', Math.floor(m.spd)],
      ['ATK', m.atk], ['DEF', m.def], ['MOVE', m.move], ['RANGE', m.range],
    ];
    for (let i = 0; i < rows.length; i++) {
      Gfx.text(String(rows[i][0]), sx, sy + i * 9, PAL.TEXT_DIM);
      Gfx.textR(String(rows[i][1]), sx + 52, sy + i * 9, PAL.TEXT);
    }
    // equipment column
    const ex = 100, ey = 36;
    Gfx.text('EQUIPMENT', ex, ey - 9, this.section === 0 ? C.YELLOW : PAL.TEXT_DIM);
    const slotLabels = ['WEAPON', 'ARMOR', 'SHIELD', 'CHARM'];
    for (let i = 0; i < 4; i++) {
      const sel = this.section === 0 && this.idx === i;
      if (sel) Gfx.rect(ex - 2, ey + i * 12 - 2, 118, 11, C.MAROON);
      Gfx.text(slotLabels[i], ex, ey + i * 12, PAL.TEXT_DIM);
      const id = m.equip[this.slotNames[i]];
      Gfx.text(id ? ITEMS[id].name : '--', ex + 34, ey + i * 12, id ? PAL.TEXT : PAL.TEXT_DARK);
    }
    // abilities column
    const ax = 232, ay = 36;
    Gfx.text(m.clsId === 'mage' || m.clsId === 'cleric' ? 'SPELLS' : 'SKILLS', ax, ay - 9,
      this.section === 1 ? C.YELLOW : PAL.TEXT_DIM);
    for (let i = 0; i < m.abilities.length; i++) {
      const ab = ABILITIES[m.abilities[i]];
      const sel = this.section === 1 && this.idx === i;
      if (sel) Gfx.rect(ax - 2, ay + i * 10 - 2, 124, 10, C.MAROON);
      Gfx.text(ab.name, ax, ay + i * 10, sel ? C.YELLOW : PAL.TEXT);
      Gfx.textR(ab.mp + 'MP', ax + 120, ay + i * 10, PAL.MP);
    }
    // description strip
    let desc = '';
    if (this.section === 1 && m.abilities[this.idx]) desc = ABILITIES[m.abilities[this.idx]].desc;
    if (this.section === 0) {
      const id = m.equip[this.slotNames[this.idx]];
      desc = id ? ITEMS[id].desc : 'Nothing equipped. Z to choose.';
    }
    Gfx.textWrap(desc, 28, VIEW_H - 34, VIEW_W - 56, PAL.TEXT_DIM);
    Gfx.textC('ARROWS: MOVE   </>: COLUMN   Z: CHANGE   X: BACK', VIEW_W / 2, VIEW_H - 16, PAL.TEXT_DARK);
  }
}

class EquipPickScene {
  constructor(m, slot) {
    this.transparent = true;
    this.m = m;
    this.slot = slot;
    this.idx = 0;
  }
  choices() {
    const kind = this.slot;
    const list = Game.invList(it => it.kind === kind).filter(e => canEquip(this.m, e.id));
    return [{ id: null, item: { name: '(REMOVE)', desc: 'Unequip this slot.' }, count: 0 }, ...list];
  }
  update(dt) {
    const list = this.choices();
    listNav(this, 'idx', list.length);
    if (this.idx >= list.length) this.idx = 0;
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
    if (Input.pressed('confirm')) {
      const pick = list[this.idx];
      if (pick.id === null) {
        unequipItem(this.m, this.slot);
        Audio.sfx('menuBack');
      } else {
        equipItem(this.m, pick.id);
        Audio.sfx('menuPick');
      }
      Scenes.pop();
    }
  }
  render() {
    Scenes.stack[Scenes.stack.length - 2].render();   // char sheet behind
    const list = this.choices();
    const h = 24 + list.length * 10;
    Gfx.panel(120, 30, 150, h);
    Gfx.textC('CHOOSE ' + this.slot.toUpperCase(), 195, 35, PAL.UI_HILITE);
    for (let i = 0; i < list.length; i++) {
      const sel = i === this.idx;
      const e = list[i];
      if (sel) Gfx.rect(124, 46 + i * 10 - 2, 142, 10, C.MAROON);
      let label = e.item.name + (e.count > 1 ? ` x${e.count}` : '');
      Gfx.text((sel ? ICON.CURSOR : ' ') + label, 126, 46 + i * 10, sel ? C.YELLOW : PAL.TEXT);
      // stat preview
      if (e.id) {
        const it = ITEMS[e.id];
        const gain = (it.atk || 0) + (it.def || 0);
        Gfx.textR((it.atk ? `ATK${it.atk >= 0 ? '+' : ''}${it.atk}` : '') + (it.def ? ` DEF+${it.def}` : ''),
          264, 46 + i * 10, PAL.GOOD);
      }
    }
  }
}

// --- Inventory (out of battle) --------------------------------------------------
class InventoryScene {
  constructor() { this.transparent = true; this.idx = 0; this.picking = null; this.pickIdx = 0; }
  update(dt) {
    const list = Game.invList();
    if (this.picking) {
      listNav(this, 'pickIdx', Game.party.length);
      if (Input.pressed('cancel')) { Audio.sfx('menuBack'); this.picking = null; return; }
      if (Input.pressed('confirm')) {
        const m = Game.party[this.pickIdx];
        const it = this.picking.item;
        let used = false;
        if (it.heal && m.hp > 0 && m.hp < m.maxHp) { m.hp = Math.min(m.maxHp, m.hp + it.heal); used = true; }
        if (it.mpHeal && m.mp < m.maxMp) { m.mp = Math.min(m.maxMp, m.mp + it.mpHeal); used = true; }
        if (it.cure && m.statuses.some(s => s.id === 'poison' || s.id === 'blind')) {
          m.statuses = m.statuses.filter(s => s.id !== 'poison' && s.id !== 'blind'); used = true;
        }
        if (it.revive && m.hp <= 0) { m.hp = Math.max(1, Math.round(m.maxHp * it.revive)); used = true; }
        if (used) {
          Game.takeItem(this.picking.id, 1);
          Audio.sfx('heal');
        } else {
          Audio.sfx('error');
        }
        this.picking = null;
      }
      return;
    }
    listNav(this, 'idx', list.length);
    if (this.idx >= list.length) this.idx = Math.max(0, list.length - 1);
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
    if (Input.pressed('confirm') && list.length) {
      const e = list[this.idx];
      if (e.item.kind === 'consumable' && (e.item.heal || e.item.mpHeal || e.item.cure || e.item.revive)) {
        Audio.sfx('menuPick');
        this.picking = e;
        this.pickIdx = 0;
      } else {
        Audio.sfx('error');
      }
    }
  }
  render() {
    dimBehind();
    const list = Game.invList();
    Gfx.panel(40, 8, VIEW_W - 80, VIEW_H - 16);
    Gfx.textC('SATCHEL', VIEW_W / 2, 14, PAL.UI_HILITE);
    Gfx.textR(ICON.COIN + ' ' + Game.gold, VIEW_W - 48, 14, PAL.GOLD);
    if (!list.length) Gfx.textC('EMPTY. THE ROAD PROVIDES... EVENTUALLY.', VIEW_W / 2, 60, PAL.TEXT_DIM);
    const top = Math.max(0, Math.min(this.idx - 7, list.length - 14));
    for (let i = top; i < Math.min(list.length, top + 14); i++) {
      const e = list[i];
      const y = 26 + (i - top) * 10;
      const sel = i === this.idx;
      if (sel) Gfx.rect(46, y - 2, VIEW_W - 92, 10, C.MAROON);
      Gfx.text((sel ? ICON.CURSOR : ' ') + e.item.name, 48, y, sel ? C.YELLOW : PAL.TEXT);
      Gfx.textR('x' + e.count, VIEW_W - 48, y, PAL.TEXT_DIM);
    }
    const cur = list[this.idx];
    if (cur) Gfx.textWrap(cur.item.desc + (cur.item.lore ? ' ' + cur.item.lore : ''), 48, VIEW_H - 36, VIEW_W - 96, PAL.TEXT_DIM);
    Gfx.textC('Z: USE   X: BACK', VIEW_W / 2, VIEW_H - 16, PAL.TEXT_DARK);
    if (this.picking) {
      Gfx.panel(130, 60, 130, 20 + Game.party.length * 12);
      Gfx.textC('ON WHOM?', 195, 65, PAL.UI_HILITE);
      for (let i = 0; i < Game.party.length; i++) {
        const m = Game.party[i];
        const sel = i === this.pickIdx;
        Gfx.text((sel ? ICON.CURSOR : ' ') + m.name, 136, 78 + i * 12, sel ? C.YELLOW : PAL.TEXT);
        Gfx.textR(`${m.hp}/${m.maxHp}`, 254, 78 + i * 12, m.hp <= 0 ? C.RED : PAL.TEXT_DIM);
      }
    }
  }
}

// --- Options (volumes; persisted separately from saves) --------------------------
const OPTS_KEY = 'embervale_opts';
function loadOptions() {
  try {
    const o = JSON.parse(localStorage.getItem(OPTS_KEY) || '{}');
    if (typeof o.music === 'number') Audio.setMusicVol(clamp(o.music, 0, 1));
    if (typeof o.sfx === 'number') Audio.setSfxVol(clamp(o.sfx, 0, 1));
  } catch (e) { /* defaults stand */ }
}
function saveOptions() {
  try {
    localStorage.setItem(OPTS_KEY, JSON.stringify({ music: Audio.musicVol, sfx: Audio.sfxVol }));
  } catch (e) { /* browser said no */ }
}

class OptionsScene {
  constructor() { this.transparent = true; this.idx = 0; }
  rows() {
    return [
      { label: 'MUSIC', get: () => Audio.musicVol, set: (v) => Audio.setMusicVol(v) },
      { label: 'SOUND', get: () => Audio.sfxVol, set: (v) => Audio.setSfxVol(v) },
    ];
  }
  update(dt) {
    const rows = this.rows();
    listNav(this, 'idx', rows.length);
    const r = rows[this.idx];
    if (Input.pressed('left')) {
      r.set(clamp(Math.round((r.get() - 0.1) * 10) / 10, 0, 1));
      saveOptions();
      if (r.label === 'SOUND') Audio.sfx('menuMove');
    }
    if (Input.pressed('right')) {
      r.set(clamp(Math.round((r.get() + 0.1) * 10) / 10, 0, 1));
      saveOptions();
      if (r.label === 'SOUND') Audio.sfx('menuPick');
    }
    if (Input.pressed('cancel') || Input.pressed('confirm')) {
      Input.eat('cancel'); Input.eat('confirm');
      Audio.sfx('menuBack');
      Scenes.pop();
    }
  }
  render() {
    dimBehind();
    const rows = this.rows();
    Gfx.panel(100, 60, 184, 40 + rows.length * 16);
    Gfx.textC('OPTIONS', VIEW_W / 2, 66, PAL.UI_HILITE);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const sel = i === this.idx;
      const y = 80 + i * 16;
      Gfx.text((sel ? ICON.CURSOR : ' ') + r.label, 108, y, sel ? C.YELLOW : PAL.TEXT);
      const steps = Math.round(r.get() * 10);
      let bar = '';
      for (let b = 0; b < 10; b++) bar += b < steps ? '#' : '-';
      Gfx.textR(bar, 276, y, sel ? C.CYAN : PAL.TEXT_DIM);
    }
    Gfx.textC('</>: ADJUST   X: DONE', VIEW_W / 2, 84 + rows.length * 16, PAL.TEXT_DARK);
  }
}

// --- Save slots -----------------------------------------------------------------
class SaveScene {
  constructor(worldScene, loadMode) {
    this.transparent = true;
    this.worldScene = worldScene;
    this.loadMode = !!loadMode;
    this.idx = 0;
  }
  update(dt) {
    const saves = listSaves();
    const list = this.loadMode ? saves : saves.filter(s => s.slot !== 'auto');
    listNav(this, 'idx', list.length);
    if (Input.pressed('cancel')) { Audio.sfx('menuBack'); Scenes.pop(); return; }
    if (Input.pressed('confirm')) {
      const pick = list[this.idx];
      if (this.loadMode) {
        const d = readSave(pick.slot);
        if (!d) { Audio.sfx('error'); return; }
        Audio.sfx('save');
        const pos = applySave(d);
        const ws = new WorldScene(Game.world);
        ws.player.x = ws.player.tx = pos.x;
        ws.player.y = ws.player.ty = pos.y;
        ws.player.px = pos.x * TILE; ws.player.py = pos.y * TILE;
        Scenes.reset(ws);
      } else {
        // In towns/dungeons, record the overworld tile we entered from.
        const p = this.worldScene.worldPos || this.worldScene.player;
        if (saveGame(pick.slot, { x: p.x, y: p.y })) {
          Audio.sfx('save');
          this.saved = pick.slot;
          this.savedT = 1;
        } else {
          Audio.sfx('error');
        }
      }
    }
    if (this.savedT) {
      this.savedT -= dt;
      if (this.savedT <= 0) { this.savedT = 0; Scenes.pop(); }
    }
  }
  render() {
    dimBehind();
    const saves = listSaves();
    const list = this.loadMode ? saves : saves.filter(s => s.slot !== 'auto');
    Gfx.panel(70, 40, VIEW_W - 140, 40 + list.length * 16);
    Gfx.textC(this.loadMode ? 'LOAD WHICH TALE?' : 'RECORD YOUR TALE', VIEW_W / 2, 46, PAL.UI_HILITE);
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const sel = i === this.idx;
      const y = 60 + i * 16;
      if (sel) Gfx.rect(76, y - 2, VIEW_W - 152, 14, C.MAROON);
      const slotName = s.slot === 'auto' ? 'AUTO' : 'SLOT ' + s.slot;
      Gfx.text((sel ? ICON.CURSOR : ' ') + slotName, 80, y, sel ? C.YELLOW : PAL.TEXT);
      Gfx.textR(s.label || '-- EMPTY --', VIEW_W - 80, y, s.label ? PAL.TEXT : PAL.TEXT_DARK);
    }
    if (this.saved) Gfx.textC('SAVED.', VIEW_W / 2, 66 + list.length * 16, C.GREEN);
    Gfx.textC('Z: ' + (this.loadMode ? 'LOAD' : 'SAVE') + '   X: BACK', VIEW_W / 2, VIEW_H - 30, PAL.TEXT_DARK);
  }
}
