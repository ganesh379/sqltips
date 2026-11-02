import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BADGE_Y, C, CAPTION_Y, FONT, W } from "./theme";
import { rise, useTiming } from "./timing";
import type { Episode } from "./types";

/** Animated dark background: gradient, slow-drifting glows and a faint grid. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const gx = 540 + Math.sin(t * 0.25) * 180;
  const gy = 700 + Math.cos(t * 0.2) * 220;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 70%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(620px 620px at ${gx}px ${gy}px, rgba(79,157,255,0.20), transparent 70%),
                       radial-gradient(520px 520px at ${1080 - gx * 0.6}px ${1500 - gy * 0.4}px, rgba(255,138,42,0.10), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(142,163,196,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(142,163,196,0.07) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: `0px ${(t * 12) % 60}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Top: series badge + episode number + phase, and a progress bar. */
export const TopBar: React.FC<{ ep: Episode }> = ({ ep }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = frame / durationInFrames;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 0, left: 0, width: W, height: 10, background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: W * p, height: 10, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})` }} />
      <div
        style={{
          position: "absolute", top: 70, left: 0, width: W, display: "flex", justifyContent: "center", gap: 18,
          fontFamily: FONT, fontSize: 30, fontWeight: 700, letterSpacing: 2, color: C.mute,
        }}
      >
        <span style={{ color: C.blue }}>POSTGRESQL DBA SERIES</span>
        <span>·</span>
        <span style={{ color: C.ink }}>EP {String(ep.ep).padStart(2, "0")}/{ep.total}</span>
      </div>
      <div style={{ position: "absolute", top: 122, left: 0, width: W, textAlign: "center", fontFamily: FONT, fontSize: 26, color: C.mute, letterSpacing: 1 }}>
        {ep.phase}
      </div>
    </AbsoluteFill>
  );
};

/** The @daily_sql_notes badge, centred above the captions; short pulse every 12 s. */
export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const ph = (t % 12) / 12;
  const p = ph < 0.08 ? Math.sin((ph / 0.08) * Math.PI) : 0;
  return (
    <div
      style={{
        position: "absolute", left: 0, width: W, top: BADGE_Y - 38, display: "flex", justifyContent: "center",
      }}
    >
      <div
        style={{
          scale: String(1 + 0.07 * p),
          display: "flex", alignItems: "center", gap: 16, padding: "14px 34px", borderRadius: 999,
          background: "rgba(8,12,22,0.86)", border: `3px solid rgba(255,138,42,${0.25 + 0.75 * p})`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)", fontFamily: FONT, fontSize: 40, fontWeight: 800, color: "#fff",
        }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth={2.4} strokeLinecap="round">
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
          <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
        </svg>
        @daily_sql_notes
      </div>
    </div>
  );
};

/** Captions: up to 3 words at a time, *starred* words in orange. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const { T } = useTiming();
  const chunks: { words: string[]; a: number; b: number }[] = [];
  T.lines.forEach((l, li) => {
    const words = l.cap.split(" ");
    const groups: string[][] = [];
    for (let i = 0; i < words.length; ) {
      const left = words.length - i;
      const k = left === 4 ? 2 : Math.min(3, left);
      groups.push(words.slice(i, i + k));
      i += k;
    }
    const tot = groups.reduce((s, g) => s + g.join(" ").length, 0);
    let acc = l.a;
    groups.forEach((g) => {
      const d = ((l.b - l.a) * g.join(" ").length) / tot;
      chunks.push({ words: g, a: acc, b: acc + d });
      acc += d;
    });
    const next = T.lines[li + 1];
    chunks[chunks.length - 1].b = next ? next.a : l.b + 0.3;
  });
  const c = chunks.find((x) => t >= x.a && t < x.b);
  if (!c) return null;
  const k = rise(t, c.a, 0.12);
  return (
    <div style={{ position: "absolute", left: 40, width: W - 80, top: CAPTION_Y - 50, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
      {c.words.map((w, i) => {
        const hl = w.includes("*");
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT, fontSize: 60, fontWeight: 900, color: hl ? C.orange : "#fff",
              WebkitTextStroke: "10px rgba(4,8,16,0.85)", paintOrder: "stroke fill",
              opacity: 0.4 + 0.6 * k, scale: String(0.9 + 0.1 * k),
            }}
          >
            {w.replace(/\*/g, "")}
          </span>
        );
      })}
    </div>
  );
};
