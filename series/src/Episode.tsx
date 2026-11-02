import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Background, Captions, TopBar, Watermark } from "./Overlays";
import { SceneView } from "./Scenes";
import { TimingCtx, rise } from "./timing";
import type { Props, Scene } from "./types";

/** Scene i is on screen from the start of its first line until the start of line `to`. */
const sceneWindow = (s: Scene, idx: number, timing: Props["timing"]) => {
  const n = timing.lines.length;
  const a = idx === 0 ? 0 : (timing.lines[Math.min(s.from, n - 1)]?.a ?? 0) - 0.15;
  const b = s.to >= n ? timing.total + 1 : timing.lines[s.to].a - 0.05;
  return { a, b };
};

export const EpisodeVideo: React.FC<Props> = ({ episode, timing, audio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <TimingCtx.Provider value={timing}>
      <AbsoluteFill style={{ backgroundColor: "#070d1a" }}>
        <Background />
        {episode.scenes.map((s, i) => {
          const { a, b } = sceneWindow(s, i, timing);
          if (t < a - 0.05 || t > b + 0.4) return null;
          const kin = i === 0 ? 1 : rise(t, a, 0.35);
          const kout = 1 - rise(t, b, 0.3);
          return (
            <AbsoluteFill
              key={i}
              style={{
                opacity: Math.min(kin, kout),
                translate: `0px ${(1 - kin) * 40 - (1 - kout) * 40}px`,
              }}
            >
              <SceneView s={s} t={t} />
            </AbsoluteFill>
          );
        })}
        <TopBar ep={episode} />
        <Watermark />
        <Captions />
        <Audio src={staticFile(audio)} />
      </AbsoluteFill>
    </TimingCtx.Provider>
  );
};
