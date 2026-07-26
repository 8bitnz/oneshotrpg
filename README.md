# EMBERVALE

A retro party RPG in the browser. No frameworks, no assets, no build step —
every sprite, map, and note of music is generated in code.

The old fire is waking beneath Mount Cinder. Make the First Ember whole,
carry it home, and still the heart of the mountain.

## Run it

Open `index.html` in a browser, or serve the folder:

```
python tools/serve.py 8471      # then http://localhost:8471
```

(The dev server also accepts screenshots from the test harness; any static
server — or plain file:// — works for just playing.)

## Controls

| Key | Action |
| --- | --- |
| Arrows / WASD | move, sail, aim |
| Z / Enter / Space | talk, search, confirm |
| X / Esc | cancel / back |
| C / Tab | camp menu (party, items, journal, save, options) |
| J | journal |
| M | cloth map |
| Mouse | menus and battle cells |

## What's in the box

- A fixed 208×208 overworld: 6 towns + one city, 7 multi-floor dungeons,
  roads, rivers, biomes, day/night, a buyable skiff, and moongate fast
  travel earned late.
- A hero (4 classes) + 8 recruitable companions, party of 4, levels 1–20,
  35 learnable spells/abilities, ~70 items with uniques and lore.
- Tactical grid battles: initiative, movement, flanking and back-attacks,
  AoE templates with friendly fire, line-of-sight, 37 enemy types across
  4 AI archetypes, 8 bosses with phases.
- Rumors that point at real places, a verbatim journal, 15+ side quests
  discovered by playing, and a 7-beat main thread to a final boss.
- 4-channel chiptune soundtrack (7 themes) and ~20 SFX, all Web Audio.
- 3 save slots + autosave (versioned, defensive).

STATUS.md tracks how it was built, milestone by milestone.
