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
`kalpit_en_edtech`). Remotion is free for individuals and teams of up to 3.
