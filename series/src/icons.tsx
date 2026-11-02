import React from "react";

// Simple stroke icons drawn on a 24x24 grid. Use by name in episode JSON.
const P: Record<string, React.ReactNode> = {
  database: (<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>),
  shield: (<><path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>),
  gauge: (<><path d="M4 18a8 8 0 1 1 16 0" /><path d="M12 18l4.5-6" /><circle cx="12" cy="18" r="1.4" /></>),
  backup: (<><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v4h4" /><path d="M12 8v4l3 2" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.6" /><path d="M16.5 14c3 .2 5 2.3 5 5.2" /></>),
  key: (<><circle cx="7.5" cy="12" r="4.5" /><path d="M12 12h10M18 12v3.5M21 12v2.5" /></>),
  chart: (<><path d="M3 20h18" /><path d="M6 16v-5M11 16V7M16 16v-8M21 16v-3" /></>),
  growth: (<><path d="M3 18l6-6 4 4 8-9" /><path d="M15 7h6v6" /></>),
  server: (<><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></>),
  terminal: (<><rect x="2.5" y="4" width="19" height="16" rx="2.5" /><path d="M6.5 9l3.5 3-3.5 3M12.5 15h5" /></>),
  alert: (<><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>),
  check: (<><circle cx="12" cy="12" r="9" /><path d="M7.5 12.5l3 3 6-6.5" /></>),
  wrench: (<><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z" /><path d="M14.5 6.5L17 4l3 3-2.5 2.5" /></>),
  disk: (<><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="15.5" cy="12" r="3" /><path d="M6.5 15.5h3" /></>),
  memory: (<><rect x="3" y="7" width="18" height="10" rx="1.5" /><path d="M7 7v10M11 7v10M15 7v10M5 4v3M19 4v3M5 17v3M19 17v3" /></>),
  cpu: (<><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" /><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>),
  network: (<><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" /><path d="M12 7.5v4.5M12 12l-5.5 5M12 12l5.5 5" /></>),
  lock: (<><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><path d="M12 14.5v2.5" /></>),
  file: (<><path d="M6 2h8l5 5v15H6z" /><path d="M14 2v5h5M9 13h6M9 17h6" /></>),
  folder: (<><path d="M3 6h6l2 2h10v11H3z" /></>),
  search: (<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>),
  flow: (<><circle cx="5" cy="12" r="2.5" /><circle cx="19" cy="12" r="2.5" /><path d="M7.5 12h9M13.5 9l3 3-3 3" /></>),
  layers: (<><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>),
  book: (<><path d="M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" /><path d="M20 4h-4a2 2 0 0 0-2 2" /><path d="M20 4v13.5h-6" /></>),
  table: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 9v11" /></>),
  bolt: (<><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></>),
  cloud: (<><path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18z" /></>),
  eye: (<><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  sync: (<><path d="M20 8a8 8 0 0 0-14.5-2M4 16a8 8 0 0 0 14.5 2" /><path d="M20 3v5h-5M4 21v-5h5" /></>),
  question: (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.5M12 17h.01" /></>),
};

export const Icon: React.FC<{ name?: string; size?: number; color?: string; stroke?: number }> = ({
  name = "database",
  size = 48,
  color = "currentColor",
  stroke = 1.8,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {P[name] ?? P.database}
  </svg>
);

export const ICON_NAMES = Object.keys(P);
