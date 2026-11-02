import { createContext, useContext } from "react";
import { Easing, interpolate } from "remotion";
import type { Timing } from "./types";

export const TimingCtx = createContext<Timing>({ total: 1, lines: [] });
export const useTiming = () => {
  const T = useContext(TimingCtx);
  const n = T.lines.length;
  const clampI = (i: number) => Math.max(0, Math.min(n - 1, i));
  /** start (s) of voice line i; i === n means end of audio */
  const A = (i: number) => (i >= n ? T.total : T.lines[clampI(i)].a);
  /** end (s) of voice line i */
  const B = (i: number) => (i >= n ? T.total : T.lines[clampI(i)].b);
  /** cue time (s) of line i, or its start + fallback */
  const Cue = (i: number, fb = 0.4) => {
    const l = T.lines[clampI(i)];
    return l.cue !== undefined ? l.cue : l.a + fb;
  };
  return { T, A, B, Cue, n };
};

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 -> 1 between t0 and t0+dur (seconds), eased */
export const rise = (t: number, t0: number, dur = 0.5) =>
  interpolate(t, [t0, t0 + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });

/** visible window with fade in/out (seconds) */
export const windowed = (t: number, a: number, b: number, f = 0.35) =>
  Math.min(rise(t, a, f), 1 - rise(t, b - f, f));

/** springy pop scale 0.85 -> 1 */
export const pop = (t: number, t0: number, dur = 0.45) =>
  interpolate(t, [t0, t0 + dur], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });
