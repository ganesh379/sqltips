import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { EpisodeVideo } from "./Episode";
import type { Props } from "./types";
import { FPS, H, W } from "./theme";

const calculateMetadata: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: Math.max(30, Math.ceil(props.timing.total * FPS)),
});

const defaultProps: Props = {
  episode: { ep: 0, total: 140, title: "Preview", phase: "Preview", lines: [{ say: "Preview", cap: "Preview" }], scenes: [{ type: "hook", from: 0, to: 1, text: "Render with --props" }] },
  timing: { total: 3, lines: [{ cap: "Render with --props", a: 0.2, b: 2.5 }] },
  audio: "silence.wav",
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Episode"
    component={EpisodeVideo}
    durationInFrames={90}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={defaultProps}
    calculateMetadata={calculateMetadata}
  />
);
