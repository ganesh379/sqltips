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
if not kinds & {"diagram", "terminal", "compare", "three"}:
    warn("no diagram, terminal, compare or three scene; most topics teach better with one")
if "three" not in kinds:
    warn("no 3D (three) scene. If something moves or is stored somewhere in this topic (pages, memory, "
         "disk, WAL, processes, replication, row versions), one 20-40 s three scene makes it easier to picture")

# 3D object sizes in world units: half width, height (keep in step with src/Scene3D.tsx)
KIND3D = {"db": (0.8, 1.35), "disk": (0.95, 0.45), "server": (0.55, 1.6), "memory": (1.2, 0.5),
          "page": (0.25, 0.62), "process": (0.35, 0.7), "user": (0.45, 1.2), "log": (1.1, 0.5), "box": (0.45, 0.9)}
SMALL3D = {"page", "process"}  # may sit on or fly into other objects


def in_bounds3d(x, y, z):
    return -2.8 <= x <= 2.8 and -2.0 <= y <= 1.4 and -1.5 <= z <= 1.5


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
            if len(tl["text"]) + max(0, len(tl.get("prompt", "$ ")) - 2) > 40:
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
    elif t == "three":
        objs = s["objects"]
        ids = [o["id"] for o in objs]
        if len(objs) > 7:
            err(f"scene {k} (three): {len(objs)} objects, max 7")
        if len(set(ids)) != len(ids):
            err(f"scene {k} (three): object ids must be unique")
        if s.get("camera", "front") not in ("front", "high", "orbit"):
            err(f"scene {k} (three): camera must be front, high or orbit")
        for o in objs:
            if o["kind"] not in KIND3D:
                err(f"scene {k} (three): unknown kind {o['kind']!r}; use one of {sorted(KIND3D)}")
                continue
            if not in_bounds3d(o["x"], o["y"], o.get("z", 0)):
                err(f"scene {k} (three): {o['id']} at ({o['x']}, {o['y']}, {o.get('z', 0)}) is outside "
                    f"x -2.8..2.8, y -2.0..1.4, z -1.5..1.5")
            if not 0.6 <= o.get("scale", 1) <= 1.4:
                err(f"scene {k} (three): {o['id']} scale must be 0.6 to 1.4")
            if len(o.get("label", "")) > 16:
                err(f"scene {k} (three): label of {o['id']} longer than 16 characters: {o['label']!r}")
            if len(o.get("sub", "")) > 22:
                err(f"scene {k} (three): sub of {o['id']} longer than 22 characters: {o['sub']!r}")
            check_common(k, s, o)
        big = [o for o in objs if o["kind"] in KIND3D and o["kind"] not in SMALL3D]
        for i, a in enumerate(big):
            for b in big[i + 1:]:
                (wa, ha), (wb, hb) = KIND3D[a["kind"]], KIND3D[b["kind"]]
                sa, sb = a.get("scale", 1), b.get("scale", 1)
                if (abs(a["x"] - b["x"]) < wa * sa + wb * sb + 0.25 and
                        a["y"] < b["y"] + hb * sb + 0.55 and b["y"] < a["y"] + ha * sa + 0.55 and
                        abs(a.get("z", 0) - b.get("z", 0)) < 1.2):
                    err(f"scene {k} (three): {a['id']} and {b['id']} overlap or leave no room for labels; move them apart")
        for m in s.get("moves", []):
            if m["id"] not in ids:
                err(f"scene {k} (three): move of unknown object {m['id']!r}")
            if not in_bounds3d(m["x"], m["y"], m.get("z", 0)):
                err(f"scene {k} (three): move of {m['id']} goes outside the 3D stage")
            check_common(k, s, m)
        for f in s.get("flows", []):
            for end in (f["from"], f["to"]):
                if end not in ids:
                    err(f"scene {k} (three): flow refers to unknown object {end!r}")
            check_common(k, s, f)
        for pl in s.get("pulses", []):
            if pl["id"] not in ids:
                err(f"scene {k} (three): pulse on unknown object {pl['id']!r}")
            check_common(k, s, pl)
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
        for key in ("items", "nodes", "edges", "lines", "objects", "moves", "flows", "pulses"):
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
    secs3d = sum(B[s["to"] - 1] - A[s["from"]] for s in scenes if s["type"] == "three")
    if secs3d > 45:
        err(f"3D scenes run {secs3d:.0f} s in total; keep them to 45 s or less (3D frames render slower)")
    if not 85 <= timing["total"] <= 185:
        err(f"voice is {timing['total']:.1f} s; keep 85 to 185 s")

for w in warns:
    print("WARN ", w)
for x in errors:
    print("ERROR", x)
print(f"check_episode ep{ep:03d}: {len(errors)} errors, {len(warns)} warnings"
      + ("" if timing else " (pacing not checked yet: no timing.json)"))
sys.exit(1 if errors else 0)
