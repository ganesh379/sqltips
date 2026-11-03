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
