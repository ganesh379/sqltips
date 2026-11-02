// Visual identity for the PostgreSQL DBA series (1080x1920, 30 fps).
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
  bg0: "#070d1a",
  bg1: "#0d1830",
  panel: "#111f3a",
  panel2: "#16284a",
  line: "#25406b",
  ink: "#eef3fb",
  mute: "#8ea3c4",
  blue: "#4f9dff", // PostgreSQL-style blue accent
  cyan: "#3fd5e8",
  orange: "#ff8a2a", // page accent (keywords, watermark icon)
  green: "#3ee08f",
  red: "#ff5a6e",
  amber: "#ffc23f",
  purple: "#a98bff",
};

export const accent = (name?: string) =>
  ({
    blue: C.blue,
    cyan: C.cyan,
    orange: C.orange,
    green: C.green,
    red: C.red,
    amber: C.amber,
    purple: C.purple,
  })[name ?? "blue"] ?? C.blue;

export const FONT = "Inter, 'DejaVu Sans', sans-serif";
export const MONO = "'DejaVu Sans Mono', monospace";

// Screen zones (y ranges). Scene content must stay inside STAGE.
export const STAGE = { top: 300, bottom: 1390 }; // scenes draw here
export const BADGE_Y = 1462; // @daily_sql_notes badge centre
export const CAPTION_Y = 1580; // captions centre
