"""Make one voice clip per script line with Sarvam TTS, then a timed voice track.
Usage: python3 make_voice.py <reel_folder> [lang] [speaker]   (folder must contain script.json)
Writes <folder>/voice/NN.wav, <folder>/voice.wav and <folder>/timing.json
"""
import json, os, subprocess, sys
from pathlib import Path

from sarvamai import SarvamAI
from sarvamai.play import save

HERE = Path(__file__).parent
env_file = HERE / ".env"   # local fallback only; scheduled runs set SARVAM_API_KEY in the environment
for line in (env_file.read_text().splitlines() if env_file.exists() else []):
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

folder = Path(sys.argv[1])
LANG = sys.argv[2] if len(sys.argv) > 2 else "en-IN"
SPEAKER = sys.argv[3] if len(sys.argv) > 3 else "kalpit_en_edtech"
lines = json.loads((folder / "script.json").read_text())
vdir = folder / "voice"
vdir.mkdir(exist_ok=True)
client = SarvamAI(api_subscription_key=os.environ["SARVAM_API_KEY"])

LEAD, GAP = 0.25, 0.18          # silence before first line, between lines (s)
timing, t, parts = [], LEAD, []
for i, ln in enumerate(lines):
    wav = vdir / f"{i:02d}.wav"
    if not wav.exists():
        audio = client.text_to_speech.convert(
            text=ln.get("say", ln.get("te")), language_code=LANG, model="bulbul:v4-flash",
            speaker=SPEAKER, pace=float(os.environ.get("TTS_PACE", "1.1")), speech_sample_rate=44100)
        save(audio, str(wav))
    dur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)]))
    entry = {"cap": ln["cap"], "a": round(t, 3), "b": round(t + dur, 3)}
    if ln.get("cue"):  # approx. moment the cue word is spoken: its position in the text
        say = ln.get("say", ln.get("te"))
        entry["cue"] = round(t + dur * say.index(ln["cue"]) / len(say), 3)
    timing.append(entry)
    parts.append((wav, dur))
    t += dur + GAP

# join clips with silences into one 44.1 kHz mono track
inputs, filt = [], []
for i, (wav, dur) in enumerate(parts):
    inputs += ["-i", str(wav)]
    delay = int(timing[i]["a"] * 1000)
    filt.append(f"[{i}:a]aresample=44100,adelay={delay}:all=1[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(parts)))
filt.append(f"{mix}amix=inputs={len(parts)}:normalize=0,apad=pad_dur=0.6[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt),
                "-map", "[out]", "-ac", "1", "-ar", "44100", str(folder / "voice.wav")], check=True)
(folder / "timing.json").write_text(json.dumps({"total": round(t - GAP + 0.6, 3), "lines": timing}, indent=1, ensure_ascii=False))
print(f"{len(lines)} lines, voice length {t - GAP:.1f}s")
for x in timing:
    print(f'{x["a"]:6.2f}-{x["b"]:6.2f}  {x["cap"]}')
