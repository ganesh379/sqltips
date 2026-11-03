"""Quality gate for one series episode. render_episode.sh runs it automatically:
before the voice (script, layout, pronunciation) and after it (pacing of the visuals).

Usage: python3 check_episode.py episodes/epNNN          # everything that can be checked
Exit code 1 = errors that must be fixed before rendering. WARN lines are worth fixing too.
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "pipeline"))
from pronounce import speakable  # noqa: E402

ICONS = set("database shield gauge backup clock users key chart growth server terminal alert check wrench "
            "disk memory cpu network lock file folder search flow layers book table bolt cloud eye sync question".split())
COLORS = {"blue", "cyan", "orange", "green", "red", "amber", "purple"}
STAGE_TOP, STAGE_BOTTOM = 300, 1390
STILL_WARN, STILL_ERROR = 7.0, 11.0     # seconds with no new reveal/focus/scene in the stage area
# all-caps words the voice reads correctly as they are
SAFE_CAPS = {"OK", "I", "A", "AM", "PM", "TV", "US", "UK", "AI"}

d = Path(sys.argv[1])
e = json.loads((d / "episode.json").read_text())
STATIC = "--static" in sys.argv   # before the voice exists: skip the pacing check
timing = None if STATIC or not (d / "timing.json").exists() else json.loads((d / "timing.json").read_text())
lines, scenes, ep = e["lines"], e["scenes"], e["ep"]
n = len(lines)
errors, warns = [], []
err = errors.append
warn = warns.append


def length(s):
    return len(re.sub(r"\*", "", s or ""))


# ---- script -------------------------------------------------------------------------------------
chars = sum(len(l["say"]) for l in lines)
if not 14 <= n <= 26:
    err(f"script has {n} lines; use 14 to 26")
if not 1400 <= chars <= 2600:
    err(f"script has {chars} spoken characters; use 1,400 to 2,600")
for i, l in enumerate(lines):
    if "—" in l["say"] or "—" in l["cap"]:
        err(f"line {i}: em dash; rewrite without it")
    w = len(l["cap"].replace("*", "").split())
    if not 3 <= w <= 13:
        warn(f"line {i}: caption has {w} words; aim for 4 to 12")
    if l.get("cue") and l["cue"] not in l["say"]:
        err(f"line {i}: cue {l['cue']!r} is not in say")
if len(lines[0]["say"].split()) > 12:
    err("line 0 (hook) is longer than 12 words")
if ep > 1 and re.search(r"\btomorrow\b", lines[-1]["say"], re.I):
    err('last line says "tomorrow"; say "Next up:" (two episodes go out each day)')

# ---- pronunciation: what the voice will actually receive -----------------------------------------
for i, l in enumerate(lines):
    spoken = speakable(l["say"])
    bad = set()
    bad.update(re.findall(r"\S*_\S*", spoken))                                  # identifiers left raw
    bad.update(t for t in re.findall(r"\b[A-Za-z]*[A-Z][A-Za-z]*[A-Z][A-Za-z]*\b", spoken)
               if t not in SAFE_CAPS and "-" not in t)                         # acronyms / camelCase
    bad.update(re.findall(r"\b[a-z]+\.(?:conf|sql|log|txt|json|yaml|yml|sh|py|ini|csv)\b", spoken))
    bad.update(t for t in re.findall(r"\b(?:pg\w+|\w+sql|\w+db|\w+ctl)\b", spoken, re.I)
               if t.lower() not in ("mysql", "nosql"))                            # tool names
    bad.update(re.findall(r"[<>=*/\\|{}\[\]#$%^&~`]", spoken))                  # symbols
    if bad:
        err(f"line {i}: the voice may misread {sorted(bad)}. Add them to WORDS in pipeline/pronounce.py "
            f"(spell acronyms with hyphens, e.g. \"L-S-N\") or write them as words. Voice gets: {spoken!r}")

# ---- scenes cover every line in order -----------------------------------------------------------
pos = 0
for k, s in enumerate(scenes):
    if s["from"] != pos:
        err(f"scene {k} ({s['type']}) starts at line {s['from']}, expected {pos} (gap or overlap)")
    if s["to"] <= s["from"]:
        err(f"scene {k} ({s['type']}) is empty (from {s['from']} to {s['to']})")
    pos = s["to"]
if pos != n:
    err(f"scenes end at line {pos}, but the script has {n} lines")
if scenes and scenes[0]["type"] != "hook":
    err("first scene must be the hook")
if len(scenes) > 1 and scenes[1]["type"] != "title":
    err("second scene must be the title")
if scenes and scenes[-1]["type"] != "outro":
    err("last scene must be the outro")
kinds = {s["type"] for s in scenes}
if not kinds & {"diagram", "terminal", "compare"}:
    warn("no diagram, terminal or compare scene; most topics teach better with one")


# ---- layout limits per scene --------------------------------------------------------------------
def check_items(k, s, items, max_n, title_max, text_max):
    if len(items) > max_n:
        err(f"scene {k} ({s['type']}): {len(items)} items, max {max_n}")
    for it in items:
        if length(it.get("title")) > title_max:
            err(f"scene {k}: item title too long ({length(it['title'])} > {title_max}): {it['title']!r}")
        if text_max and length(it.get("text")) > text_max:
            err(f"scene {k}: item text too long ({length(it['text'])} > {text_max}): {it['text']!r}")
        check_common(k, s, it)


def check_common(k, s, it):
    if it.get("icon") and it["icon"] not in ICONS:
        err(f"scene {k}: unknown icon {it['icon']!r}")
    if it.get("color") and it["color"] not in COLORS:
        err(f"scene {k}: unknown color {it['color']!r}")
    at = it.get("at")
    if at is not None and not s["from"] <= at < s["to"]:
        err(f"scene {k} ({s['type']}): at={at} is outside the scene's lines {s['from']}..{s['to'] - 1}")


for k, s in enumerate(scenes):
    t = s["type"]
    if t == "cards":
        cols = s.get("columns", 1)
        check_items(k, s, s["items"], 6 if cols == 2 else 4, 26, 70)
    elif t == "steps":
        check_items(k, s, s["items"], 5, 40, 70)
    elif t == "checklist":
        check_items(k, s, s["items"], 6, 34, 0)
    elif t == "terminal":
        if len(s["lines"]) > 11:
            err(f"scene {k} (terminal): {len(s['lines'])} lines, max 11")
        for tl in s["lines"]:
            if len(tl["text"]) > 40:
                err(f"scene {k} (terminal): line longer than 40 characters: {tl['text']!r}")
            check_common(k, s, tl)
    elif t == "compare":
        for side in ("left", "right"):
            rows = s[side]["rows"]
            if len(rows) > 5:
                err(f"scene {k} (compare {side}): {len(rows)} rows, max 5")
            for r in rows:
                if length(r) > 28:
                    err(f"scene {k} (compare {side}): row longer than 28 characters: {r!r}")
        for at in s.get("at", []):
            if not s["from"] <= at < s["to"]:
                err(f"scene {k} (compare): at={at} outside the scene")
    elif t == "diagram":
        nodes = {nd["id"]: nd for nd in s["nodes"]}
        if len(nodes) > 8:
            err(f"scene {k} (diagram): {len(nodes)} nodes, max 8")
        boxes = []
        for nd in s["nodes"]:
            w, h = nd.get("w", 300), nd.get("h", 140)
            x0, x1, y0, y1 = nd["x"] - w / 2, nd["x"] + w / 2, nd["y"] - h / 2, nd["y"] + h / 2
            if not (240 <= w <= 380 and 110 <= h <= 170):
                warn(f"scene {k}: node {nd['id']} size {w}x{h}; aim for w 240-380, h 110-170")
            if x0 < 24 or x1 > 1056 or y0 < 400 or y1 > STAGE_BOTTOM:
                err(f"scene {k}: node {nd['id']} box ({x0:.0f},{y0:.0f})-({x1:.0f},{y1:.0f}) leaves the stage "
                    f"(box must stay inside x 24-1056, y 400-{STAGE_BOTTOM})")
            elif x0 < 60 or x1 > 1020 or y0 < 430 or y1 > 1365:
                warn(f"scene {k}: node {nd['id']} is close to the stage edge")
            if len(nd["label"]) > 18:
                warn(f"scene {k}: node {nd['id']} label is long ({len(nd['label'])} characters)")
            check_common(k, s, nd)
            for oid, (a0, a1, b0, b1) in boxes:
                if x0 < a1 + 30 and a0 < x1 + 30 and y0 < b1 + 30 and b0 < y1 + 30:
                    err(f"scene {k}: nodes {oid} and {nd['id']} overlap or are closer than 30 px")
            boxes.append((nd["id"], (x0, x1, y0, y1)))
        for ed in s["edges"]:
            for end in (ed["from"], ed["to"]):
                if end not in nodes:
                    err(f"scene {k}: edge refers to unknown node {end!r}")
            if ed.get("label") and len(ed["label"].split()) > 3:
                err(f"scene {k}: edge label longer than 3 words: {ed['label']!r}")
            check_common(k, s, ed)
        for f in s.get("focus", []):
            if f["id"] not in nodes:
                err(f"scene {k}: focus on unknown node {f['id']!r}")
            if not s["from"] <= f["at"] < s["to"]:
                err(f"scene {k}: focus at={f['at']} outside the scene")
        if not s.get("focus"):
            warn(f"scene {k} (diagram): no focus; glow the node being talked about")
        if not any(ed.get("flow") for ed in s["edges"]):
            warn(f"scene {k} (diagram): no animated flow on any edge")
    elif t == "callout":
        if length(s["text"]) > 150:
            err(f"scene {k} (callout): text longer than 150 characters")

# ---- pacing: how long the stage stays without anything new ------------------------------------
if timing:
    A = [x["a"] for x in timing["lines"]]
    B = [x["b"] for x in timing["lines"]]
    cue = [x.get("cue") for x in timing["lines"]]
    for k, s in enumerate(scenes):
        start, end = A[s["from"]], B[s["to"] - 1]
        ev = {start}
        for key in ("items", "nodes", "edges", "lines"):
            for it in s.get(key, []) or []:
                if isinstance(it, dict) and it.get("at") is not None:
                    ev.add(A[it["at"]])
        for f in s.get("focus", []) or []:
            ev.add(cue[f["at"]] or A[f["at"]])
        for at in s.get("at", []) if isinstance(s.get("at"), list) else []:
            ev.add(A[at])
        ev = sorted(x for x in ev if start <= x <= end) + [end]
        gap = max(b - a for a, b in zip(ev, ev[1:]))
        if s["type"] in ("hook", "outro"):
            continue
        msg = (f"scene {k} ({s['type']}, lines {s['from']}-{s['to'] - 1}): {gap:.1f} s with nothing new on "
               f"screen. Split the scene, reveal items on more lines (at), add diagram focus, or shorten lines")
        if gap > STILL_ERROR:
            err(msg)
        elif gap > STILL_WARN:
            warn(msg)
    if not 85 <= timing["total"] <= 185:
        err(f"voice is {timing['total']:.1f} s; keep 85 to 185 s")

for w in warns:
    print("WARN ", w)
for x in errors:
    print("ERROR", x)
print(f"check_episode ep{ep:03d}: {len(errors)} errors, {len(warns)} warnings"
      + ("" if timing else " (pacing not checked yet: no timing.json)"))
sys.exit(1 if errors else 0)
