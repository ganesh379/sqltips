# PostgreSQL DBA Series: video template

Remotion 4 + React + TypeScript + SVG/CSS. Every episode is data, not code:
`episodes/epNNN/episode.json` holds the voiced script (`lines`) and the `scenes`,
which reference line indexes so the visuals change exactly when the voice moves on.

Scene types (see `src/types.ts` and `src/Scenes.tsx`): hook, title, cards, diagram,
terminal, compare, steps, callout, stat, checklist, outro. Icons: `src/icons.tsx`.

Global overlays (do not change per episode): background, top series bar with EP NN/140
and a progress bar, the @daily_sql_notes badge (centre, y 1462), captions (y 1580).
Scene content must stay inside y 300 to 1390.

Build one episode (1080x1920, 30 fps, H.264 + AAC):

```bash
cd series && npm ci
SARVAM_API_KEY=... ./render_episode.sh episodes/ep001 stills 0.1 20 40   # check frames
SARVAM_API_KEY=... ./render_episode.sh episodes/ep001                    # final.mp4
```

The voice comes from `../pipeline/make_voice.py` (Sarvam `bulbul:v4-flash`, voice
`kalpit_en_edtech`, pace 1.05, 0.3 s breath between lines). Remotion is free for
individuals and teams of up to 3.

Pronunciation: before a line goes to the voice, `../pipeline/pronounce.py` respells
database words so they are said the way a DBA says them (PostgreSQL -> "Postgres-Q-L",
psql -> "P-S-Q-L", DBA -> "D-B-A", WAL -> "wall", pg_hba.conf -> "P-G H-B-A dot conf",
shared_buffers -> "shared buffers"). Captions keep the real spelling. So in "say", write
the real names (PostgreSQL, psql, pg_stat_activity, VACUUM); do not invent your own
spellings. Check what the voice will receive with
`python3 ../pipeline/pronounce.py "your line"`. If a line uses a database word or
acronym that is not in `WORDS` there, add it (spell acronyms with hyphens, e.g. "L-S-N")
and commit the change with the episode. Raw "psql", "DBA", "WAL" and "PostgreSQL" were
misread by the voice ("E Sukal", "Dabba", "Bhal", "Postgres sequel"), so never bypass it.
Brackets are spoken as pauses (the voice used to stop mid-sentence at a bracket).

Quality gate: `render_episode.sh` runs `check_episode.py` twice and stops on any ERROR:
before the voice (script length, hook, "Next up" ending, scene order and coverage, layout
limits per scene, diagram overlaps and stage bounds, icon and colour names, and any word
the voice may misread) and after it (no scene may sit more than 11 s with nothing new on
screen; over 7 s is a WARN). Fix every ERROR and as many WARN lines as you can: split long
lines, reveal items on the line that mentions them (`at`), and use diagram `focus`.
Run it alone with `python3 check_episode.py episodes/epNNN`.

## 3D scenes ("three")

Real 3D objects with lighting and motion, drawn by Three.js inside the same render
(`src/Scene3D.tsx`). Use ONE three scene of 20 to 40 seconds in an episode when the topic has
something that moves or is stored somewhere: pages between disk and shared_buffers, WAL
records, a backend per connection, replication to a standby, row versions (MVCC), checkpoints.
Keep exact text (commands, settings, output, error messages) in 2D scenes: it reads better flat.
check_episode.py stops a render if 3D scenes add up to more than 45 s.

Render cost (measured on the 2-CPU run machine): 2D frames about 0.14 s, 3D frames about 0.23 s.
Do not pass `--gl=swangle`: it made every frame about 3 to 4 times slower.

Fields (see `Obj3D`, `Move3D`, `Flow3D`, `Pulse3D` in src/types.ts):
- `camera`: "front" (default), "high" (looking down) or "orbit" (gentle sway).
- `objects` (max 7): `kind` is one of db, disk, server, memory (has 8 buffer slots), page
  (8 kB page tile), process (glowing sphere), user (client), log (WAL segments), box.
  Position `x` -2.8..2.8, `y` -2.0..1.4, `z` -1.5..1.5 (the object's base point). `label` up to
  16 characters, `sub` up to 22, `color` an accent name, `at` the line it appears on,
  `scale` 0.6..1.4. Leave space: big objects side by side need about 2.5 units between centres
  (memory and log are wide), and about 1.9 units up/down.
- `moves`: fly an object to a new spot on line `at` (it lands on that line's `cue` word).
- `flows`: a stream of glowing packets from one object to another from line `at`.
- `pulses`: make an object glow on line `at`.
Labels are 2D text pinned above each object and move out of each other's way automatically.
A good layout: clients and processes on the top row (y 0.5 to 0.9), memory on the right of the
top row, storage (disk, log) on the bottom row (y -1.8). See `examples/three-scene.json`.
Check the stills like any other scene: labels readable, nothing cut off at the stage edges.
