# EMBERVALE — Build Status

## Milestone 10: Hardening — DONE (2026-07-07) — FINAL

**Full critical-path playthrough (scripted, real fights)**
Title → name/class creation → Willowbrook (recruit Bram, Wren; Maud's
beat) → Emberhold (Vane's beat; recruit Maro, Sela; inn autosave; manual
save + corrupt/restore check) → Redmane camp **fought and won at L2-3**
(7 rounds, one member downed) → Barrowdown with a bought torch (stairs,
lever→vault, **Barrow King won in 9 rounds**, shard 1 + Barrowblade) →
Emberdeep (in-dungeon save lands at entrance; **Forge-Wight won**, shard 2
+ maul; widow's ring found) → Howling Tower (**Stormheart won**, shard 3 +
lens) → Vane forges the First Ember → Mount Cinder (gate honors the
Ember; 3 floors; **Cinder Tyrant won in 8 rounds with phase 2 firing**) →
VictoryScene → title. Random road/tremor ambushes fought as they came.

**Bugs found & fixed**
- Dungeon corner torches could overwrite placed chests (ate the
  Forge-Wight's vault chest). Torches now respect occupied tiles; RNG
  order preserved so layouts didn't shift.
- Stale deferred scene-transitions could pop the last scene: the stack is
  now guarded (empty-render safe; empty-pop resets to the title).

**Edge cases verified**
- Rich save/load roundtrip (shards, boat position, journal, flags, levels).
- Downed member excluded at battle start, limps back at 1 HP on victory.
- Whole-party-dead battle start → immediate defeat → game over → title →
  LOAD works and restores play.
- 24-item inventory scrolls; fleeing; tide floods AND recedes; wind
  pushes; quicksand drops; options persist.
- Performance: 2.6 ms/frame (≈60fps with big headroom), no console
  errors anywhere in the battery.

**Definition of Done accounting**
- Title → final-boss victory without crash/soft-lock: simulated ✓
- Nothing stubbed; all systems interact ✓
- 10+ unprompted discoveries: 3 island caches, standing-stones pendant,
  drowned-bell cache, hunter's pack, miner's ring, shrine inscriptions ×4,
  gravestone/statue/bookshelf lore, Maw silver, ruins — ✓
- New enemies/abilities still appearing at hour 4 (tiers 3–4, spells to
  L19) ✓ · Music + SFX everywhere ✓ · Data-driven code, this file ✓

## Milestone 9: Polish & juice — DONE (2026-07-07)

**What's done**
- Fade transitions on every map change (town/dungeon enter+exit, stairs,
  quicksand falls, moongate travel); scene updates pause during fades.
- Title screen: drifting ember particles, drop-shadow logo, CONTROLS and
  CREDITS entries; V1.0.
- Controls screen (title + one-screen battle primer); credits screen.
- First-run key hint overlay for the first 30 steps of a new game.
- Options with persisted volumes (from M8) reachable in camp menu.
- **Balance pass** via scripted battle sims (basic-attack baseline):
  - L1 solo vs tier-0: 100% win, 80% HP left. Wolves: 83%, 27% (spicy).
  - L3 trio vs tier-1: 100%, 82%. L6 four vs tier-2: 100%, 83%.
  - Tiers 3–4 were trivial (95% HP left) → raised HP ~35% and attack
    stats +3..4 str across tiers 3/4 and all late bosses, XP up ~20%.
  - After: L10 vs tier-3 = 84% HP left; L14 vs tier-4 = 86%;
    final Tyrant fight at L16 = 8.3 rounds, 55% HP left. Right shape.

**Verified**
- Title/controls/credits screenshots; fade active during town entry and
  scene lands correctly; sims above; zero console errors.

## Milestone 8: Audio — DONE (2026-07-07)

**What's done**
- Chiptune sequencer (`js/core/music.js`): 4 channels — square lead,
  25%-duty pulse arp (PeriodicWave), triangle bass, noise drums (kick/
  snare/hat with filters). 16-step patterns, per-song order lists,
  lookahead scheduling driven from the game loop, idempotent play().
- 7 themes composed as data: title (Am, arpeggio shimmer), overworld
  (C-major march), town (gentle F-major), dungeon (sparse D-minor drones),
  combat (driving E-minor 144bpm), victory fanfare, game-over dirge.
- Theme routing: scene enter/resume re-asserts its theme (battles return
  to the right one in towns/dungeons); defeat switches to the dirge;
  battle victory plays the fanfare.
- Pre-unlock requests are honored the moment the first input unlocks
  WebAudio. Pattern-length validator warns on malformed songs (clean).
- Options menu (camp > OPTIONS): music/sound 0–10 sliders, persisted to
  localStorage separately from saves.
- SFX set from M1 (~20 effects) already covers menus, hits, spells,
  steps, level-up, gold, doors, saves.

**Verified**
- AudioContext unlocks and runs; sequencer steps advance; theme switches
  title→overworld→combat→overworld verified; options slider persists;
  zero console warnings (all patterns exactly 16 steps).

## Milestone 7: Content pass — DONE (2026-07-07)

**What's done**
- **All 7 settlements live**: Willowbrook, Emberhold (city), Thornfield,
  Saltmere, Duskwell (desert), Frosthollow (snow), Mirefen (marsh) — themed
  grounds/deco, 8–14 NPCs each, regional shop stock, inns, temples.
- **All 7 dungeons live** with distinct gimmicks: Barrowdown (grave-wakes),
  Gloomroot (webs+dark), Sunken Keep (tide floods corridors; drowned bell
  reveals a cache), Emberdeep (tremors + lava light; the widow's husband),
  Howling Tower (wind shoves you; the old lens), Serpent's Maw (quicksand
  pitfalls to the floor below), Mount Cinder (finale, gated by the Ember).
- **Main thread, 7 beats**: Maud → Vane → Redmane's key → Barrow shard →
  Deep shard (Forge-Wight) → Wind shard (Stormheart) → Vane forges the
  First Ember (unlocks moongate fast travel) → Mount Cinder →
  Cinder Tyrant (phase 2: reignites, +ATK, revenant summons) → THE END.
- **8 companions** with join conditions (Dorn needs the wolf den cleared,
  Edda the tower silenced, Zash the wyrm fed to the sand).
- **37 enemy types + 8 bosses** across tier/biome encounter tables
  (deserts, snows, swamps, caves, the sea).
- **~70 items** incl. 9 lore uniques and quest keys.
- **15+ side quests/secrets**: wolf den, drowned buoy, night ambushes at
  Mirefen/Frosthollow, lost caravan, widow's ring, scribe's lens, hunter's
  pack, bell cache, standing-stones pendant (night), 3 skiff-only island
  caches, shrine pilgrimage, goat money, and the rumor web pointing at all
  of it.
- **The skiff**: buy at Saltmere, board/sail/land anywhere, boat stays
  moored where you left it; rare sea encounters; sea battle biome.
- **Moongates**: with the First Ember, touched shrines teleport between
  each other.

**Verified**
- All towns and all dungeon floors construct clean; Vane's full dialogue
  chain; conditional recruiting; skiff purchase/boarding/landing; moongate
  travel; Mt Cinder gate (blocked/open); final boss + phase 2 + VictoryScene.
  No console errors.

**Deferred to M9/M10**
- Balance audit (levels vs. regions, gold economy).
- Sand-Wyrm burrow anim eyeballed in code only — playtest in hardening.

## Milestone 6: Dungeons — DONE (2026-07-07)

**What's done**
- Deterministic rooms+corridors floor generator (per-dungeon seed); opened
  chests / pulled levers / woken graves / dead bosses persist as flags and
  are reapplied on rebuild. Traps re-arm per visit (scene-local).
- Chunky stepped darkness with light sources: player radius (bigger with a
  torch — one is consumed per delve), wall torches, glowing mushrooms.
- Traps (spike, lead takes damage, revealed as rubble), chests with loot
  tables, locked vault doors opened by levers elsewhere, flavor-text bones,
  stairs between floors, ladder exit to the overworld.
- **Barrowdown Crypt** (needs the Barrow Key from Redmane): undead roster
  (skeleton, bone archer, wraith), grave-wake gimmick (walking past graves
  can raise the dead), boss **The Barrow King** — raises an honor guard at
  60% HP, enrages at 25%. Vault chest: Barrowblade (unique).
- **Gloomroot Cave**: webs (slow), deepest darkness (r 3.6) with mushroom
  light pockets, spiders that poison on hit and flank like wolves, boss
  **The Broodmother** — lays a clutch of spiderlings each quarter of HP
  lost. Vault chest: Gloomsilk Cloak (unique).
- Entity collision fix: players can no longer walk through NPCs/bosses.
- Saves from towns/dungeons record the overworld entry tile.

**Verified**
- Key gate blocks entry until crypt_key held; torch consumption + light
  radius; stairs down/up; lever→vault opens; Barrow King fight incl. raise
  phase; boss chest yields Barrowblade; floor rebuild shows opened chest,
  open vault, no boss; trap damages the lead and reveals; Gloomroot builds
  with mushrooms/webs. Zero console errors.

**Known issues / deferred**
- Traps have no rogue-detect roll yet (balance pass).
- Boss rooms are ordinary rooms; dressing pass in M7 polish if time.

## Milestone 5: Towns & dialogue — DONE (2026-07-07)

**What's done**
- Town builder (`buildTown`): grounds, paths, wells/fountains, city walls
  with gates, buildings (inn/shops/temple/keep/houses) with floors, walls,
  doors, signs, and per-type furniture; keeper spots per building.
- Willowbrook (10 NPCs) and Emberhold city (14 NPCs) fully populated;
  remaining 5 towns use the same builder in the content pass.
- Dialogue: paged text with speaker names, choice menus, day/night line
  variants, companion interjections (22% chance, pulled from banter data),
  auto journal entries for load-bearing lore.
- Shops: buy/sell tabs (sell at half), stock per keeper, owned-count hints.
- Inn: rest to 7 AM, full restore, costs gold, writes the AUTOSAVE slot.
- Temple: full party restore for gold. Rumors: 10-entry pool pointing at
  real map sites, tracked so you hear fresh ones first, journaled.
- Recruitment: Bram & Wren (Willowbrook), Maro & Sela (Emberhold) join via
  dialogue choice; NPC leaves town; party/camp roster handles overflow.
- Journal scene (J / camp menu): day-stamped clues verbatim.
- Interact cooldown so closing a dialogue can't instantly reopen it.
- Main-thread beats planted: Maud (Willowbrook) → Castellan Vane
  (Emberhold keep) → barrow key → Mount Cinder arc.

**Verified**
- Enter/exit both towns from the overworld; shop buy+sell math; inn rest
  (clock → 7 AM next day, autosave written); temple heal; rumor → journal;
  Bram/Wren/Maro/Sela recruitment; castellan 4-page beat; no console errors.

**Known issues / deferred**
- NPCs have no schedules (out at night); fine for scope.
- Temple does not sell phoenix ash / revival (party wipes handled by ash
  item + battle revive spell; temples heal).

## Milestone 4: Party & RPG systems — DONE (2026-07-07)

**What's done**
- 4 classes (Fighter/Rogue/Mage/Cleric) with base stats, fractional growth,
  and learn tables to level 20. Hero creation: name entry + class carousel.
- 35 player abilities total (20 spells, 15 martial) incl. new mechanics:
  revive, drain, execute-bonus, silence, haste, mark, shield/sunder.
- XP curve `30*(L-1)^1.8 + 20*(L-1)`; per-member XP on victory (downed get
  half), level-up refills, ability-learned notices on the victory panel.
- Item registry (~40 items): weapons/armor/shields/accessories with class
  restrictions and stat bonuses; consumables incl. bombs (enemy-targeted),
  phoenix ash (battle revive), camp kit (hooked later).
- Equipment slots with derived stats (atk/def/effInt/effDex/effSpd/range —
  bows give ranged basic attacks); refreshMember keeps battle fields live.
- 8-companion cast defined as data (personas, banter, join sites) — 
  recruitment wires up in M5/M7; party of 4 active + camp roster with swap UI.
- Menus: camp menu (C), party list, character sheet (stats/equip/abilities),
  equip picker with stat preview, inventory with use-on-member.
- Saves: versioned schema, 3 slots + autosave slot, defensive load
  (bad/old/future data rejected, abilities re-derived from class tables),
  world mutations (mapMuts) reapplied over the fixed-seed map. Title screen
  with NEW GAME / LOAD GAME over the cloth map.

**Verified**
- Creation flow end-to-end (typed name, class pick, spawn in world).
- gainXp(200) → LV3 + learns Venom Edge; stiletto/leather change atk/def;
  fighters can't equip rogue steel; save→corrupt state→load restores gold,
  flags, hp, position, and map mutation. Victory panel shows XP/gold. No
  console errors anywhere.

**Known issues / deferred**
- Camp kit item has no overworld use yet (rest system lands with towns).
- Options menu stub; autosave slot written only by later milestones.

## Milestone 3: Combat vertical slice — DONE (2026-07-07)

**What's done**
- Dedicated battle scene: 12×8 tactical grid with biome terrain (field/
  forest/desert/swamp/snow/cave recipes — obstacles block movement, tall
  ones block sight, swamp water blocks movement only).
- Initiative order by SPD+roll, visible queue strip, rounds.
- Player turns: move (BFS range shown, cursor or mouse), then Attack /
  Skills / Items / Defend / Flee / Wait. Target cycling for single-target,
  free cursor + template for AoE, LoS checks, MP costs.
- Facing & flanking: side +15%, back +35% & +12% crit; the side panel
  shows the bonus before you commit.
- 12 party abilities (Fighter/Rogue/Mage/Cleric ×3) + enemy kit; statuses:
  stun, slow, blind, bless, poison, guard — with per-turn ticks.
- Enemy AI archetypes verified in play: brute charges, archer kites and
  advances when it can't shoot, shaman heals/buffs/zaps, wolf hunts the
  weakest and circles behind, boss (Capt. Redmane) enrages at 50% and
  summons reinforcements.
- Bandit-camp set-piece on the Willowbrook–Emberhold road; victory clears
  the camp and sets a world flag.
- Juice: damage floats, crit pops, hit flash (source-atop), lunges,
  projectile bolts, screen shake, per-action SFX.
- Victory (XP→pool, gold), defeat (game over scene), flee (speed-based).
- Fallen party members limp on at 1 HP post-battle until temples exist.

**Verified via scripted auto-battles**
- Win, lose, flee, defend, boss phase-2 summons, AoE friendly-fire kill,
  poison/status application, item use, camp trigger/cleanup. No console
  errors; log ordering fixed (hit line before "falls" line).

**Known issues / deferred**
- Numbers need the real stat/level framework (M4) before deep tuning.
- Downed-unit status cleanup is cosmetic-only (they can be poisoned).
- Mouse support present for cells/menus but not polished (M9).

## Milestone 2: Overworld — DONE (2026-07-07)

**What's done**
- Deterministic 208×208 world from `WORLD_SEED`: authored continent lobes +
  fractal noise; sea/coast/beach bands; snow north, desert SW, swamp SE
  (noise-roughened edges); mountain ridges + Mount Cinder volcano w/ lava.
- Rivers descend from mountain sources and join the sea; coastline sand.
- 18 authored sites snapped to fitting land: 6 towns + Emberhold city,
  7 dungeons, 4 shrines. 3×3 courtyard cleared around each.
- Road network via A* (terrain costs, elevation penalty, avalanche-hash
  jitter so roads wander; roads reuse existing trunks; bridges supported).
- Vegetation by biome noise (trees/pines/thick forest/cactus/dead trees),
  scattered curiosities (graves, statues, pillars).
- Day/night: game clock (steps + slow ambient), darkness ramp dusk/dawn,
  night tint overlay, clock chip HUD. Night multiplies encounter rate.
- Step-based random encounters by terrain enc rates → stub scene (M3 wires
  real combat). `dangerAt()` gives 0–4 danger tier by distance + biome.
- Cloth-map screen (M): baked terrain, discovered-sites-only markers,
  blinking player blip.

**Verified**
- 60 FPS on full map, zero console errors; location banner, night tint,
  encounter trigger, map screen all screenshot-verified via harness.
- Fixed A* bug: weak jitter hash left whole columns equally cheap → ruler
  roads. Replaced with imul avalanche hash; also fixed inadmissible
  heuristic (min step cost is 0.4, so h = 0.4×manhattan).

**Known issues**
- 0 bridges in current seed (roads found dry routes) — rivers can wall off
  off-road areas; revisit if playtests hit walls.
- Buildings/dungeons not enterable yet (M5/M6).

## Milestone 1: Skeleton — DONE (2026-07-06)

**What's done**
- Fixed 384×216 internal resolution, integer-scaled canvas, crisp pixels.
- Game loop (rAF, dt-clamped) + scene stack with transparent-scene support.
- Input: WASD/arrows + Z/X/Enter/Esc actions, mouse position/click plumbing,
  audio unlock on first interaction.
- 3×5 bitmap font (atlas-cached per color), word wrap, centered/right text.
- 24-color DB16-extended palette (`js/data/palette.js`).
- Two-layer tile engine (ground + object overlays), ~20 ground types and
  ~55 object types with procedural pixel art, animated water/lava/torches.
- Procedural character sprite generator (4 dirs × 2 frames; hair/tunic/robe/
  helmet/hood options) shared by hero, NPCs, companions.
- Walkable test map with terrain variety, a wandering NPC, tweened grid
  movement, camera clamp, terrain slow-downs (swamp), beeper SFX set.
- Test harness (`EV_TEST`): deterministic frame stepping, simulated input,
  screenshot POST to `tools/serve.py` (saved in `.shots/`). Needed because
  hidden preview tabs never fire rAF.

**Verified**
- Boots with zero console errors; 60 FPS; movement, collision (water/trees
  block, sand ring reachable), camera clamping, entity wander all confirmed
  via scripted harness + screenshots.

**Next: Milestone 2 — Overworld**
- Fixed-seed 200×200+ world gen (continents, biomes, rivers, roads, coasts).
- Day/night cycle, terrain-aware random encounters (hook only until combat).
- Chunked culling already effectively free (visible-rect render).

**Known issues**
- Grass/terrain tiles repeat visibly (single variant each) — add variants in
  polish pass if it bothers.
- Music engine is a stub; SFX beeper only (full chiptunes are Milestone 8).
