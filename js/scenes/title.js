// title.js — title screen, hero creation, load entry. The fancy version
// (theme music, credits) arrives in the polish milestone; the bones live here.
'use strict';

class TitleScene {
  constructor() {
    this.idx = 0;
    this.t = 0;
    if (!Game.world) Game.world = generateWorld();
    this.bg = bakeWorldMap(Game.world);
    // drifting embers
    this.embers = [];
    for (let i = 0; i < 26; i++) {
      this.embers.push({
        x: Math.random() * VIEW_W, y: Math.random() * VIEW_H,
        vy: 6 + Math.random() * 14, vx: (Math.random() - 0.5) * 6,
        c: [C.ORANGE, C.YELLOW, C.RED][i % 3], ph: Math.random() * 6,
      });
    }
  }
  enter() { Audio.playMusic('title'); }
  options() {
    const hasSaves = listSaves().some(s => s.label);
    const opts = ['NEW GAME'];
    if (hasSaves) opts.push('LOAD GAME');
    opts.push('CONTROLS', 'CREDITS');
    return opts;
  }
  update(dt) {
    this.t += dt;
    for (const e of this.embers) {
      e.y -= e.vy * dt;
      e.x += (e.vx + Math.sin(this.t * 2 + e.ph) * 4) * dt;
      if (e.y < -2) { e.y = VIEW_H + 2; e.x = Math.random() * VIEW_W; }
    }
    const opts = this.options();
    listNav(this, 'idx', opts.length);
    if (this.idx >= opts.length) this.idx = 0;
    if (Input.pressed('confirm')) {
      Audio.sfx('menuPick');
      switch (opts[this.idx]) {
        case 'NEW GAME': Scenes.push(new NewGameScene()); break;
        case 'LOAD GAME': Scenes.push(new SaveScene(null, true)); break;
        case 'CONTROLS': Scenes.push(new ControlsScene()); break;
        case 'CREDITS': Scenes.push(new CreditsScene()); break;
      }
    }
  }
  render() {
    Gfx.clear(C.VOID);
    const c = Gfx.ctx;
    c.save();
    c.globalAlpha = 0.28;
    c.drawImage(this.bg, VIEW_W / 2 - this.bg.width / 2, VIEW_H / 2 - this.bg.height / 2);
    c.restore();
    // embers behind the logo
    for (const e of this.embers) {
      const flick = Math.sin(this.t * 6 + e.ph) > -0.4;
      if (flick) Gfx.rect(e.x, e.y, 1, 1, e.c);
    }
    Gfx.textBig('EMBERVALE', VIEW_W / 2 + 1, 33, C.MAROON, 4);
    Gfx.textBig('EMBERVALE', VIEW_W / 2, 32, C.YELLOW, 4);
    Gfx.textC('THE OLD FIRE WAKES', VIEW_W / 2, 64, PAL.TEXT_DIM);
    const opts = this.options();
    for (let i = 0; i < opts.length; i++) {
      const sel = i === this.idx;
      Gfx.textC((sel ? ICON.CURSOR + ' ' : '') + opts[i], VIEW_W / 2, 104 + i * 13,
        sel ? C.YELLOW : PAL.TEXT);
    }
    Gfx.textC('A TALE OF THE EMBER  -  V1.0', VIEW_W / 2, VIEW_H - 10, PAL.TEXT_DARK);
  }
}

class ControlsScene {
  update(dt) {
    if (Input.pressed('cancel') || Input.pressed('confirm')) {
      Input.eat('cancel'); Input.eat('confirm');
      Audio.sfx('menuBack');
      Scenes.pop();
    }
  }
  render() {
    Gfx.clear(C.VOID);
    Gfx.textC('CONTROLS', VIEW_W / 2, 12, PAL.UI_HILITE);
    const rows = [
      ['ARROWS / WASD', 'MOVE, SAIL, AIM'],
      ['Z / ENTER / SPACE', 'TALK, SEARCH, CONFIRM'],
      ['X / ESC', 'CANCEL, MENU BACK'],
      ['C / TAB', 'CAMP MENU (PARTY, ITEMS, SAVE)'],
      ['J', 'JOURNAL'],
      ['M', 'CLOTH MAP'],
      ['MOUSE', 'MENUS AND BATTLE CELLS'],
      ['', ''],
      ['IN BATTLE', 'PICK A CELL TO MOVE, THEN ACT.'],
      ['', 'FLANKS AND BACKS TAKE MORE HURT.'],
      ['', 'FIRE DOES NOT CHOOSE ITS FRIENDS.'],
    ];
    let y = 30;
    for (const [k, v] of rows) {
      if (k) Gfx.text(k, 60, y, C.CYAN);
      if (v) Gfx.text(v, 170, y, PAL.TEXT);
      y += 13;
    }
    Gfx.textC('Z / X - BACK', VIEW_W / 2, VIEW_H - 14, PAL.TEXT_DARK);
  }
}

class CreditsScene {
  constructor() { this.t = 0; }
  update(dt) {
    this.t += dt;
    if (Input.pressed('cancel') || Input.pressed('confirm')) {
      Input.eat('cancel'); Input.eat('confirm');
      Audio.sfx('menuBack');
      Scenes.pop();
    }
  }
  render() {
    Gfx.clear(C.VOID);
    Gfx.textBig('EMBERVALE', VIEW_W / 2, 20, C.YELLOW, 2);
    const rows = [
      ['A RETRO PARTY RPG', PAL.TEXT_DIM],
      ['', 0],
      ['DESIGN, CODE, PIXELS & TUNES', C.CYAN],
      ['CLAUDE', PAL.TEXT],
      ['', 0],
      ['MADE WITH', C.CYAN],
      ['CANVAS, WEB AUDIO, AND A 3X5 FONT', PAL.TEXT],
      ['NO ASSETS WERE HARMED (NONE WERE USED)', PAL.TEXT_DIM],
      ['', 0],
      ['IN THE TRADITION OF', C.CYAN],
      ['ULTIMA - SHADOWLANDS - AND EVERY', PAL.TEXT],
      ['CRPG THAT LET YOU GET PROPERLY LOST', PAL.TEXT],
      ['', 0],
      ['THANK YOU FOR PLAYING', C.YELLOW],
    ];
    let y = 48;
    for (const [txt, col] of rows) {
      if (txt) Gfx.textC(txt, VIEW_W / 2, y, col);
      y += 11;
    }
    Gfx.textC('Z / X - BACK', VIEW_W / 2, VIEW_H - 12, PAL.TEXT_DARK);
  }
}

// Shown when the Cinder Tyrant falls. The polish pass adds music/credits.
class VictoryScene {
  constructor() { this.t = 0; }
  enter() { Audio.playMusic('victory'); }
  update(dt) {
    this.t += dt;
    if (this.t > 3 && Input.pressed('confirm')) {
      Scenes.reset(new TitleScene());
    }
  }
  render() {
    Gfx.clear(C.VOID);
    const rows = [
      ['THE EMBER RETURNS TO THE MOUNTAIN', C.YELLOW, 30],
      ['The heart stills. The growl fades to a hum,', PAL.TEXT, 52],
      ['the hum to the old, patient song.', PAL.TEXT, 62],
      ['Emberhold\'s vault stands open and empty,', PAL.TEXT_DIM, 80],
      ['and nobody minds at all.', PAL.TEXT_DIM, 90],
    ];
    for (const [txt, col, y] of rows) Gfx.textC(txt, VIEW_W / 2, y, col);
    const hero = Game.party[0];
    if (hero) {
      Gfx.textC(`${hero.name.toUpperCase()} THE ${hero.cls.toUpperCase()}  -  LV ${hero.level}`, VIEW_W / 2, 116, C.CYAN);
      Gfx.textC(`DAYS ${Game.day}   STEPS ${Game.steps}   GOLD ${Game.gold}`, VIEW_W / 2, 128, PAL.TEXT_DIM);
      const others = Game.roster.filter(m => !m.isHero).map(m => m.name).join(', ');
      if (others) Gfx.textC('WITH: ' + others.toUpperCase(), VIEW_W / 2, 140, PAL.TEXT_DIM);
    }
    Gfx.textBig('THE END', VIEW_W / 2, 158, C.RED, 2);
    if (this.t > 3) Gfx.textC('Z - TITLE', VIEW_W / 2, VIEW_H - 14, PAL.TEXT);
  }
}

class NewGameScene {
  constructor() {
    this.name = '';
    this.stage = 0;        // 0 = name, 1 = class
    this.clsIdx = 0;
    this.clsIds = ['fighter', 'rogue', 'mage', 'cleric'];
    this.previews = {};
    for (const id of this.clsIds) this.previews[id] = makeHero('X', id).sprites;
    this.t = 0;
  }
  update(dt) {
    this.t += dt;
    if (this.stage === 0) {
      for (const ch of Input.typed) {
        if (ch === '\b') this.name = this.name.slice(0, -1);
        else if (/[a-zA-Z ]/.test(ch) && this.name.length < 10) {
          this.name += this.name.length === 0 ? ch.toUpperCase() : ch.toLowerCase();
          Audio.sfx('menuMove');
        }
      }
      if (Input.pressed('cancel') && this.name.length === 0) { Scenes.pop(); return; }
      if (Input.pressed('confirm') && this.name.trim().length > 0) {
        Input.eat('confirm');
        Audio.sfx('menuPick');
        this.stage = 1;
      }
    } else {
      if (Input.pressed('cancel')) { Audio.sfx('menuBack'); this.stage = 0; return; }
      if (Input.pressed('left')) { this.clsIdx = (this.clsIdx + 3) % 4; Audio.sfx('menuMove'); }
      if (Input.pressed('right')) { this.clsIdx = (this.clsIdx + 1) % 4; Audio.sfx('menuMove'); }
      if (Input.pressed('confirm')) {
        Audio.sfx('levelup');
        const hero = makeHero(this.name.trim(), this.clsIds[this.clsIdx]);
        Game.startRun(hero);
        const ws = new WorldScene(Game.world);
        Scenes.reset(ws);
      }
    }
  }
  render() {
    Gfx.clear(C.VOID);
    if (this.stage === 0) {
      Gfx.textC('WHAT NAME DO THEY WHISPER?', VIEW_W / 2, 60, PAL.TEXT);
      const nm = this.name + (Math.floor(this.t * 2) % 2 === 0 ? '_' : ' ');
      Gfx.panel(VIEW_W / 2 - 50, 80, 100, 18);
      Gfx.textC(nm, VIEW_W / 2, 86, C.YELLOW);
      Gfx.textC('TYPE A NAME, THEN Z', VIEW_W / 2, 120, PAL.TEXT_DARK);
    } else {
      Gfx.textC('AND WHAT ARE THEY, ' + this.name.toUpperCase() + '?', VIEW_W / 2, 26, PAL.TEXT);
      const cls = CLASSES[this.clsIds[this.clsIdx]];
      // class carousel
      for (let i = 0; i < 4; i++) {
        const x = VIEW_W / 2 + (i - this.clsIdx) * 70;
        if (x < 20 || x > VIEW_W - 20) continue;
        const sel = i === this.clsIdx;
        const spr = this.previews[this.clsIds[i]].down[0];
        if (sel) Gfx.frame(x - 14, 44, 28, 28, C.YELLOW);
        Gfx.ctx.save();
        Gfx.ctx.globalAlpha = sel ? 1 : 0.45;
        Gfx.ctx.drawImage(spr, x - 8, 50);
        Gfx.ctx.restore();
      }
      Gfx.textC(cls.name.toUpperCase(), VIEW_W / 2, 80, C.YELLOW);
      Gfx.textC(cls.desc, VIEW_W / 2, 92, PAL.TEXT_DIM);
      const s = cls.stats;
      Gfx.textC(`STR ${s.str}  DEX ${s.dex}  INT ${s.int}  VIT ${s.vit}  SPD ${s.spd}`,
        VIEW_W / 2, 108, PAL.TEXT);
      Gfx.textC(`HP ${cls.hp + s.vit * 3}   MP ${cls.mp + s.int * 2}`, VIEW_W / 2, 120, PAL.TEXT_DIM);
      const learn = CLASSES[this.clsIds[this.clsIdx]].learn[1] || [];
      if (learn.length) Gfx.textC('KNOWS: ' + learn.map(a => ABILITIES[a].name).join(', '), VIEW_W / 2, 132, PAL.MAGIC);
      Gfx.textC('< >  CHOOSE   Z: BEGIN   X: BACK', VIEW_W / 2, VIEW_H - 20, PAL.TEXT_DARK);
    }
  }
}
