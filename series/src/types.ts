// Episode data model. An episode is a voiced script (lines) plus scenes that
// reference line indexes, so visuals change exactly when the voice moves on.

export type Line = { say: string; cap: string; cue?: string };

export type TimingLine = { cap: string; a: number; b: number; cue?: number };
export type Timing = { total: number; lines: TimingLine[] };

// `at` = index of the voice line at which an element appears (default: scene start).
export type Item = {
  at?: number;
  icon?: string;
  title: string;
  text?: string;
  color?: string;
};

export type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  x: number; // centre x in px (0-1080)
  y: number; // centre y in px, inside the stage (300-1390)
  w?: number;
  h?: number;
  icon?: string;
  color?: string;
  shape?: "box" | "db" | "pill";
  at?: number;
};
export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  at?: number;
  flow?: boolean; // animated packets along the edge
  color?: string;
  dashed?: boolean;
};

// prompt: optional prompt shown before a "cmd" line instead of "$ " (e.g. "appdb=# " for psql)
export type TermLine = { kind: "cmd" | "out" | "comment"; text: string; at?: number; prompt?: string };

export type Scene =
  | { type: "hook"; from: number; to: number; text: string; sub?: string }
  | { type: "title"; from: number; to: number; kicker?: string; title: string; sub?: string }
  | { type: "cards"; from: number; to: number; heading?: string; columns?: 1 | 2; items: Item[]; highlight?: boolean }
  | { type: "diagram"; from: number; to: number; heading?: string; nodes: DiagramNode[]; edges: DiagramEdge[]; focus?: { at: number; id: string }[] }
  | { type: "terminal"; from: number; to: number; heading?: string; title?: string; lines: TermLine[] }
  | { type: "compare"; from: number; to: number; heading?: string; left: { title: string; color?: string; rows: string[] }; right: { title: string; color?: string; rows: string[] }; at?: number[] }
  | { type: "steps"; from: number; to: number; heading?: string; items: Item[] }
  | { type: "callout"; from: number; to: number; kind: "warning" | "tip" | "fact" | "myth"; title: string; text: string }
  | { type: "stat"; from: number; to: number; value: string; label: string; text?: string; color?: string }
  | { type: "checklist"; from: number; to: number; heading?: string; items: Item[] }
  | { type: "outro"; from: number; to: number; next?: string };

export type Episode = {
  ep: number;
  total: number; // episodes in the series
  title: string;
  phase: string;
  lines: Line[];
  scenes: Scene[];
};

export type Props = { episode: Episode; timing: Timing; audio: string };
