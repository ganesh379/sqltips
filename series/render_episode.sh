#!/usr/bin/env bash
# Build one series episode: voice (Sarvam) -> timing -> Remotion render -> loudness pass.
# Usage: SARVAM_API_KEY=... ./render_episode.sh episodes/ep001 [stills t1 t2 ...]
# Needs: pipeline/make_voice.py next to this folder (../pipeline) or MAKE_VOICE set.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DIR="$(cd "$1" && pwd)"; shift || true
MODE="${1:-video}"; shift || true
MAKE_VOICE="${MAKE_VOICE:-$HERE/../pipeline/make_voice.py}"
EP=$(python3 -c "import json,sys;print(json.load(open('$DIR/episode.json'))['ep'])")
TAG=$(printf "ep%03d" "$EP")

# 1. voice + timing (cached per line in $DIR/voice/)
python3 - "$DIR" <<'PY'
import json, os, shutil, sys
d = sys.argv[1]
e = json.load(open(f"{d}/episode.json"))
new = json.dumps(e["lines"], ensure_ascii=False, indent=1)
old = open(f"{d}/script.json").read() if os.path.exists(f"{d}/script.json") else None
if old is not None and old != new:
    # the spoken script changed: voice clips are cached per line index, so start fresh
    shutil.rmtree(f"{d}/voice", ignore_errors=True)
    for f in ("timing.json", "voice.wav"):
        if os.path.exists(f"{d}/{f}"):
            os.remove(f"{d}/{f}")
open(f"{d}/script.json", "w").write(new)
PY
if [ ! -f "$DIR/timing.json" ] || [ "$DIR/episode.json" -nt "$DIR/timing.json" ]; then
  TTS_PACE="${TTS_PACE:-1.15}" python3 "$MAKE_VOICE" "$DIR" en-IN kalpit_en_edtech
fi

# 2. props for Remotion
mkdir -p "$HERE/public"
cp "$DIR/voice.wav" "$HERE/public/$TAG.wav"
python3 - "$DIR" "$TAG" <<'PY'
import json, sys
d, tag = sys.argv[1], sys.argv[2]
json.dump({"episode": json.load(open(f"{d}/episode.json")), "timing": json.load(open(f"{d}/timing.json")), "audio": f"{tag}.wav"},
          open(f"{d}/props.json", "w"), ensure_ascii=False)
PY

cd "$HERE"
if [ "$MODE" = "stills" ]; then
  mkdir -p "$DIR/stills"
  for s in "$@"; do
    f=$(python3 -c "print(round($s*30))")
    npx remotion still src/index.ts Episode "$DIR/stills/f_$(printf '%06.2f' "$s").jpg" --props="$DIR/props.json" --frame="$f" --image-format=jpeg --log=error
  done
  exit 0
fi

# 3. render, then normalise loudness for phone speakers (video stream copied untouched)
npx remotion render src/index.ts Episode "$DIR/render.mp4" --props="$DIR/props.json" --concurrency="${CONCURRENCY:-2}" --log=error
ffmpeg -v error -y -i "$DIR/render.mp4" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$DIR/final.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$DIR/final.mp4"
