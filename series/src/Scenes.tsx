import React from "react";
import { C, FONT, MONO, STAGE, W, accent } from "./theme";
import { Icon } from "./icons";
import { pop, rise, useTiming } from "./timing";
import type { DiagramNode, Item, Scene } from "./types";

type P<S> = { s: S; t: number };

const Heading: React.FC<{ text?: string; t: number; at: number }> = ({ text, t, at }) =>
  text ? (
    <div
      style={{
        position: "absolute", top: STAGE.top + 10, left: 60, width: W - 120, textAlign: "center",
        fontFamily: FONT, fontSize: 56, fontWeight: 800, color: C.ink, lineHeight: 1.15,
        opacity: rise(t, at, 0.4), translate: `0px ${(1 - rise(t, at, 0.4)) * 20}px`,
      }}
    >
      {text}
    </div>
  ) : null;

const glowBox = (color: string, on: number): React.CSSProperties => ({
  background: `linear-gradient(180deg, ${C.panel2}, ${C.panel})`,
  border: `3px solid ${on > 0 ? color : C.line}`,
  borderRadius: 28,
  boxShadow: on > 0 ? `0 0 ${40 * on}px ${color}55, 0 12px 30px rgba(0,0,0,0.4)` : "0 12px 30px rgba(0,0,0,0.4)",
});

// ---------------------------------------------------------------- hook
export const Hook: React.FC<P<Extract<Scene, { type: "hook" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const t0 = Math.min(A(s.from), 0); // the hook is on screen from frame 0
  const words = s.text.split(" ");
  return (
    <div style={{ position: "absolute", top: STAGE.top + 120, left: 70, width: W - 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 50 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 22px" }}>
        {words.map((w, i) => {
          const k = rise(t, t0 + i * 0.05, 0.3);
          const hl = w.includes("*");
          return (
            <span key={i} style={{ fontFamily: FONT, fontSize: 96, fontWeight: 900, lineHeight: 1.08, color: hl ? C.orange : C.ink, opacity: 0.7 + 0.3 * k, translate: `0px ${(1 - k) * 18}px` }}>
              {w.replace(/\*/g, "")}
            </span>
          );
        })}
      </div>
      {s.sub ? (
        <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 600, color: C.cyan, padding: "16px 36px", borderRadius: 999, border: `3px solid ${C.cyan}66`, background: "rgba(63,213,232,0.08)", opacity: rise(t, t0 + 0.8, 0.5) }}>
          {s.sub}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- title
export const Title: React.FC<P<Extract<Scene, { type: "title" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const a = A(s.from);
  return (
    <div style={{ position: "absolute", top: STAGE.top + 180, left: 80, width: W - 160, textAlign: "center" }}>
      {s.kicker ? <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 800, letterSpacing: 4, color: C.blue, opacity: rise(t, a, 0.4) }}>{s.kicker}</div> : null}
      <div style={{ marginTop: 30, fontFamily: FONT, fontSize: 92, fontWeight: 900, color: C.ink, lineHeight: 1.05, opacity: rise(t, a + 0.15, 0.5), scale: String(pop(t, a + 0.15)) }}>{s.title}</div>
      <div style={{ margin: "40px auto 0", width: 220 * rise(t, a + 0.4, 0.6), height: 8, borderRadius: 8, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})` }} />
      {s.sub ? <div style={{ marginTop: 40, fontFamily: FONT, fontSize: 42, color: C.mute, lineHeight: 1.3, opacity: rise(t, a + 0.6, 0.5) }}>{s.sub}</div> : null}
    </div>
  );
};

// ---------------------------------------------------------------- cards (role map, feature grid)
export const Cards: React.FC<P<Extract<Scene, { type: "cards" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const cols = s.columns ?? 2;
  const top = STAGE.top + (s.heading ? 130 : 30);
  const gap = 26;
  const cw = cols === 2 ? (W - 120 - gap) / 2 : W - 120;
  const rows = Math.ceil(s.items.length / cols);
  const ch = Math.min(cols === 2 ? 300 : 190, (STAGE.bottom - top - gap * (rows - 1)) / rows);
  const ats = s.items.map((it, i) => A(it.at ?? s.from) + (it.at === undefined ? i * 0.12 : 0));
  // the most recently revealed card is "active"
  const activeIdx = ats.reduce((best, a, i) => (t >= a && (best < 0 || a >= ats[best]) ? i : best), -1);
  return (
    <>
      <Heading text={s.heading} t={t} at={A(s.from)} />
      {s.items.map((it: Item, i) => {
        const a = ats[i];
        const k = rise(t, a, 0.45);
        const col = accent(it.color);
        const on = s.highlight !== false && i === activeIdx ? 1 : 0;
        const x = 60 + (i % cols) * (cw + gap);
        const y = top + Math.floor(i / cols) * (ch + gap);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: cw, height: ch, ...glowBox(col, on), opacity: k, scale: String(0.9 + 0.1 * k), padding: cols === 2 ? "30px 30px" : "26px 34px", boxSizing: "border-box", display: "flex", flexDirection: cols === 2 ? "column" : "row", gap: cols === 2 ? 16 : 30, alignItems: cols === 2 ? "flex-start" : "center" }}>
            <div style={{ width: 84, height: 84, flex: "0 0 84px", borderRadius: 22, background: `${col}22`, display: "flex", alignItems: "center", justifyContent: "center", color: col }}>
              <Icon name={it.icon} size={54} />
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 42, fontWeight: 800, color: C.ink, lineHeight: 1.1 }}>{it.title}</div>
              {it.text ? <div style={{ marginTop: 10, fontFamily: FONT, fontSize: 32, color: C.mute, lineHeight: 1.3 }}>{it.text}</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- diagram (architecture, flows)
const nodeBox = (n: DiagramNode) => ({ w: n.w ?? 300, h: n.h ?? 130 });
const edgePoint = (n: DiagramNode, toward: DiagramNode) => {
  // point on the node border in the direction of the other node
  const { w, h } = nodeBox(n);
  const dx = toward.x - n.x, dy = toward.y - n.y;
  const sx = dx === 0 ? Infinity : (w / 2 + 8) / Math.abs(dx);
  const sy = dy === 0 ? Infinity : (h / 2 + 8) / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: n.x + dx * s, y: n.y + dy * s };
};

export const Diagram: React.FC<P<Extract<Scene, { type: "diagram" }>>> = ({ s, t }) => {
  const { A, Cue } = useTiming();
  const byId = Object.fromEntries(s.nodes.map((n) => [n.id, n]));
  const focusId = (s.focus ?? []).filter((f) => t >= Cue(f.at, 0.2)).map((f) => f.id).pop();
  return (
    <>
      <Heading text={s.heading} t={t} at={A(s.from)} />
      <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill={C.mute} />
          </marker>
        </defs>
        {s.edges.map((e, i) => {
          const a = byId[e.from], b = byId[e.to];
          if (!a || !b) return null;
          const p1 = edgePoint(a, b), p2 = edgePoint(b, a);
          const ta = A(e.at ?? s.from) + 0.25;
          const k = rise(t, ta, 0.6);
          const col = e.color ? accent(e.color) : C.mute;
          const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const packets = e.flow && k >= 1 ? [0, 1, 2].map((j) => ((t * 0.55 + j / 3) % 1)) : [];
          return (
            <g key={i} opacity={Math.min(1, k * 1.5)}>
              <line x1={p1.x} y1={p1.y} x2={p1.x + (p2.x - p1.x) * k} y2={p1.y + (p2.y - p1.y) * k} stroke={col} strokeWidth={5} strokeDasharray={e.dashed ? "14 12" : undefined} markerEnd={k > 0.95 ? "url(#arrow)" : undefined} />
              {packets.map((f, j) => (
                <circle key={j} cx={p1.x + (p2.x - p1.x) * f} cy={p1.y + (p2.y - p1.y) * f} r={10} fill={accent(e.color ?? "cyan")} opacity={Math.sin(f * Math.PI)} />
              ))}
              {e.label && len > 0 ? (
                <text x={(p1.x + p2.x) / 2 + (Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x) ? 18 : 0)} y={(p1.y + p2.y) / 2 - (Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x) ? 0 : 16)} fill={C.mute} fontFamily={FONT} fontSize={28} fontWeight={600} textAnchor={Math.abs(p2.y - p1.y) > Math.abs(p2.x - p1.x) ? "start" : "middle"} opacity={rise(t, ta + 0.4, 0.4)}>
                  {e.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {s.nodes.map((n) => {
        const { w, h } = nodeBox(n);
        const a = A(n.at ?? s.from);
        const k = rise(t, a, 0.45);
        const col = accent(n.color);
        const on = focusId === n.id ? 1 : 0;
        const radius = n.shape === "pill" ? h / 2 : n.shape === "db" ? 36 : 24;
        return (
          <div key={n.id} style={{ position: "absolute", left: n.x - w / 2, top: n.y - h / 2, width: w, height: h, ...glowBox(col, on), borderRadius: radius, borderColor: on ? col : `${col}88`, opacity: k, scale: String(pop(t, a) * (1 + 0.04 * on)), display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 18px", boxSizing: "border-box" }}>
            {n.icon ? <div style={{ color: col, flex: "0 0 auto" }}><Icon name={n.icon} size={Math.min(56, h * 0.42)} /></div> : null}
            <div style={{ textAlign: n.icon ? "left" : "center" }}>
              <div style={{ fontFamily: FONT, fontSize: Math.min(38, h * 0.3), fontWeight: 800, color: C.ink, lineHeight: 1.1 }}>{n.label}</div>
              {n.sub ? <div style={{ marginTop: 6, fontFamily: FONT, fontSize: Math.min(28, h * 0.22), color: C.mute, lineHeight: 1.2 }}>{n.sub}</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- terminal
export const Terminal: React.FC<P<Extract<Scene, { type: "terminal" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const top = STAGE.top + (s.heading ? 140 : 40);
  let lastAt = -1;
  let offset = 0;
  return (
    <>
      <Heading text={s.heading} t={t} at={A(s.from)} />
      <div style={{ position: "absolute", left: 50, top, width: W - 100, ...glowBox(C.blue, 0), borderRadius: 26, overflow: "hidden", opacity: rise(t, A(s.from), 0.4) }}>
        <div style={{ height: 66, background: "#0a1222", display: "flex", alignItems: "center", gap: 14, padding: "0 26px" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
          <div style={{ marginLeft: 20, fontFamily: MONO, fontSize: 26, color: C.mute }}>{s.title ?? "postgres@db1: ~"}</div>
        </div>
        <div style={{ padding: "26px 30px 34px", background: "#060b16", minHeight: 300 }}>
          {s.lines.map((l, i) => {
            const at = l.at ?? s.from;
            offset = at === lastAt ? offset + 0.5 : 0;
            lastAt = at;
            const a = A(at) + offset;
            const typeDur = l.kind === "cmd" ? Math.min(1.4, 0.03 * l.text.length + 0.2) : 0.15;
            const k = rise(t, a, typeDur);
            if (t < a) return null;
            const shown = l.kind === "cmd" ? l.text.slice(0, Math.ceil(l.text.length * k)) : l.text;
            const color = l.kind === "cmd" ? C.ink : l.kind === "comment" ? C.mute : C.green;
            return (
              <div key={i} style={{ fontFamily: MONO, fontSize: 36, lineHeight: 1.45, color, whiteSpace: "pre-wrap", wordBreak: "break-word", opacity: l.kind === "cmd" ? 1 : k }}>
                {l.kind === "cmd" ? <span style={{ color: C.orange }}>{"$ "}</span> : null}
                {shown}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------- compare
export const Compare: React.FC<P<Extract<Scene, { type: "compare" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const top = STAGE.top + (s.heading ? 140 : 40);
  const cw = (W - 120 - 26) / 2;
  const side = (d: { title: string; color?: string; rows: string[] }, x: number, sideIdx: number) => {
    const col = accent(d.color ?? (sideIdx ? "orange" : "blue"));
    return (
      <div style={{ position: "absolute", left: x, top, width: cw, ...glowBox(col, 0), borderColor: `${col}99`, padding: "28px 26px", boxSizing: "border-box", opacity: rise(t, A(s.from) + sideIdx * 0.2, 0.45) }}>
        <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 900, color: col, marginBottom: 18 }}>{d.title}</div>
        {d.rows.map((r, i) => {
          const at = s.at?.[i] !== undefined ? A(s.at[i]) : A(s.from) + 0.3 + i * 0.25;
          return (
            <div key={i} style={{ fontFamily: FONT, fontSize: 34, color: C.ink, lineHeight: 1.3, padding: "14px 0", borderTop: `2px solid ${C.line}`, opacity: rise(t, at + sideIdx * 0.15, 0.4) }}>
              {r}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <>
      <Heading text={s.heading} t={t} at={A(s.from)} />
      {side(s.left, 60, 0)}
      {side(s.right, 60 + cw + 26, 1)}
    </>
  );
};

// ---------------------------------------------------------------- steps
export const Steps: React.FC<P<Extract<Scene, { type: "steps" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const top = STAGE.top + (s.heading ? 150 : 40);
  const n = s.items.length;
  const rowH = Math.min(200, (STAGE.bottom - top) / n);
  const ats = s.items.map((it, i) => A(it.at ?? s.from) + (it.at === undefined ? i * 0.3 : 0));
  const progress = ats.filter((a) => t >= a).length;
  return (
    <>
      <Heading text={s.heading} t={t} at={A(s.from)} />
      <div style={{ position: "absolute", left: 118, top: top + 45, width: 6, height: (n - 1) * rowH, background: C.line, borderRadius: 3 }} />
      <div style={{ position: "absolute", left: 118, top: top + 45, width: 6, height: Math.max(0, progress - 1) * rowH, background: C.blue, borderRadius: 3 }} />
      {s.items.map((it, i) => {
        const k = rise(t, ats[i], 0.45);
        const col = accent(it.color);
        const active = i === progress - 1;
        return (
          <div key={i} style={{ position: "absolute", left: 76, top: top + i * rowH, width: W - 140, display: "flex", gap: 34, alignItems: "flex-start", opacity: 0.25 + 0.75 * k, translate: `${(1 - k) * 40}px 0px` }}>
            <div style={{ width: 90, height: 90, flex: "0 0 90px", borderRadius: 45, background: k > 0.5 ? col : C.panel, border: `4px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 42, fontWeight: 900, color: k > 0.5 ? C.bg0 : col, boxShadow: active ? `0 0 36px ${col}88` : "none" }}>
              {i + 1}
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 800, color: C.ink, lineHeight: 1.1 }}>{it.title}</div>
              {it.text ? <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 32, color: C.mute, lineHeight: 1.3 }}>{it.text}</div> : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- callout
const KIND = {
  warning: { color: C.red, icon: "alert", label: "WARNING" },
  tip: { color: C.green, icon: "check", label: "DBA TIP" },
  fact: { color: C.blue, icon: "book", label: "FACT" },
  myth: { color: C.amber, icon: "question", label: "MYTH VS FACT" },
} as const;
export const Callout: React.FC<P<Extract<Scene, { type: "callout" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const a = A(s.from);
  const k = KIND[s.kind];
  return (
    <div style={{ position: "absolute", left: 60, top: STAGE.top + 150, width: W - 120, ...glowBox(k.color, 1), padding: "50px 50px 56px", boxSizing: "border-box", opacity: rise(t, a, 0.4), scale: String(pop(t, a)) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, color: k.color, fontFamily: FONT, fontSize: 36, fontWeight: 900, letterSpacing: 3 }}>
        <Icon name={k.icon} size={60} /> {k.label}
      </div>
      <div style={{ marginTop: 30, fontFamily: FONT, fontSize: 60, fontWeight: 900, color: C.ink, lineHeight: 1.12 }}>{s.title}</div>
      <div style={{ marginTop: 26, fontFamily: FONT, fontSize: 40, color: C.mute, lineHeight: 1.35, opacity: rise(t, a + 0.5, 0.5) }}>{s.text}</div>
    </div>
  );
};

// ---------------------------------------------------------------- stat
export const Stat: React.FC<P<Extract<Scene, { type: "stat" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const a = A(s.from);
  const col = accent(s.color ?? "cyan");
  return (
    <div style={{ position: "absolute", left: 60, top: STAGE.top + 170, width: W - 120, textAlign: "center" }}>
      <div style={{ fontFamily: FONT, fontSize: 200, fontWeight: 900, color: col, lineHeight: 1, scale: String(pop(t, a, 0.6)), opacity: rise(t, a, 0.3), textShadow: `0 0 60px ${col}66` }}>{s.value}</div>
      <div style={{ marginTop: 30, fontFamily: FONT, fontSize: 54, fontWeight: 800, color: C.ink, opacity: rise(t, a + 0.3, 0.4) }}>{s.label}</div>
      {s.text ? <div style={{ marginTop: 26, fontFamily: FONT, fontSize: 38, color: C.mute, lineHeight: 1.35, opacity: rise(t, a + 0.6, 0.4) }}>{s.text}</div> : null}
    </div>
  );
};

// ---------------------------------------------------------------- checklist (recap)
export const Checklist: React.FC<P<Extract<Scene, { type: "checklist" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const top = STAGE.top + (s.heading ? 150 : 40);
  const rowH = Math.min(150, (STAGE.bottom - top) / s.items.length);
  return (
    <>
      <Heading text={s.heading} t={t} at={A(s.from)} />
      {s.items.map((it, i) => {
        const a = A(it.at ?? s.from) + (it.at === undefined ? 0.3 + i * 0.35 : 0);
        const k = rise(t, a, 0.4);
        return (
          <div key={i} style={{ position: "absolute", left: 80, top: top + i * rowH, width: W - 160, display: "flex", alignItems: "center", gap: 30, opacity: 0.2 + 0.8 * k }}>
            <div style={{ width: 70, height: 70, flex: "0 0 70px", borderRadius: 18, border: `4px solid ${C.green}`, background: k > 0.6 ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {k > 0.6 ? <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={C.bg0} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : null}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{it.title}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- outro
export const Outro: React.FC<P<Extract<Scene, { type: "outro" }>>> = ({ s, t }) => {
  const { A } = useTiming();
  const a = A(s.from);
  return (
    <div style={{ position: "absolute", left: 60, top: STAGE.top + 80, width: W - 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      {s.next ? (
        <div style={{ width: "100%", ...glowBox(C.blue, 1), padding: "40px 44px", boxSizing: "border-box", opacity: rise(t, a, 0.4), scale: String(pop(t, a)) }}>
          <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 800, letterSpacing: 3, color: C.blue }}>NEXT EPISODE</div>
          <div style={{ marginTop: 18, fontFamily: FONT, fontSize: 56, fontWeight: 900, color: C.ink, lineHeight: 1.12 }}>{s.next}</div>
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 26, opacity: rise(t, a + 0.6, 0.4), scale: String(pop(t, a + 0.6)) }}>
        <div style={{ padding: "26px 46px", borderRadius: 999, background: C.orange, fontFamily: FONT, fontSize: 46, fontWeight: 900, color: "#fff" }}>FOLLOW</div>
        <div style={{ padding: "26px 40px", borderRadius: 999, border: "4px solid #fff", fontFamily: FONT, fontSize: 42, fontWeight: 800, color: "#fff" }}>Send to a friend</div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 38, color: C.mute, textAlign: "center", lineHeight: 1.35, opacity: rise(t, a + 1.0, 0.4) }}>
        New PostgreSQL DBA episodes every day
      </div>
    </div>
  );
};

export const SceneView: React.FC<{ s: Scene; t: number }> = ({ s, t }) => {
  switch (s.type) {
    case "hook": return <Hook s={s} t={t} />;
    case "title": return <Title s={s} t={t} />;
    case "cards": return <Cards s={s} t={t} />;
    case "diagram": return <Diagram s={s} t={t} />;
    case "terminal": return <Terminal s={s} t={t} />;
    case "compare": return <Compare s={s} t={t} />;
    case "steps": return <Steps s={s} t={t} />;
    case "callout": return <Callout s={s} t={t} />;
    case "stat": return <Stat s={s} t={t} />;
    case "checklist": return <Checklist s={s} t={t} />;
    case "outro": return <Outro s={s} t={t} />;
  }
};
