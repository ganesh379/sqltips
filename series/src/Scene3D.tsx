/**
 * "three" scene: real 3D objects (lit, shaded, moving) drawn with Three.js inside Remotion.
 * Everything is driven by the voice timing, like the 2D scenes:
 *   objects appear on their line (`at`), `moves` fly an object to a new spot, `flows` stream
 *   glowing packets between two objects, `pulses` make an object glow.
 * Labels are normal 2D text pinned to the projected 3D position, so they stay sharp and readable.
 */
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C, FONT, STAGE, W, accent } from "./theme";
import { pop, rise, useTiming } from "./timing";
import type { Obj3D, Scene } from "./types";

type S3 = Extract<Scene, { type: "three" }>;
type V3 = [number, number, number];

const CANVAS_TOP_HEADING = STAGE.top + 120;
const CANVAS_TOP_PLAIN = STAGE.top + 20;
const FOV = 38;

/** camera position for time t (seconds); orbit sways gently so labels stay readable */
const camPos = (mode: S3["camera"], t: number): V3 => {
  if (mode === "high") return [0, 5.6, 6.6];
  if (mode === "orbit") {
    const a = 0.2 * Math.sin(t * 0.3);
    return [8.4 * Math.sin(a), 1.7, 8.4 * Math.cos(a)];
  }
  return [0, 1.5, 8.4];
};
const LOOK: V3 = [0, 0.05, 0];

/** how tall each kind is (world units), to place labels above it */
const HEIGHT: Record<Obj3D["kind"], number> = {
  db: 1.35, disk: 0.45, server: 1.6, memory: 0.5, page: 0.62, process: 0.7, user: 1.2, log: 0.5, box: 0.9,
};

const CameraRig: React.FC<{ pos: V3 }> = ({ pos }) => {
  const { camera } = useThree();
  camera.position.set(...pos);
  camera.lookAt(...LOOK);
  camera.updateProjectionMatrix();
  return null;
};

const Mat: React.FC<{ color: string; glow: number; metal?: number }> = ({ color, glow, metal = 0.25 }) => (
  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18 + glow} metalness={metal} roughness={0.38} />
);

/** one object's geometry, centred on its base at (0,0,0) */
const Shape: React.FC<{ kind: Obj3D["kind"]; color: string; glow: number; t: number }> = ({ kind, color, glow, t }) => {
  switch (kind) {
    case "db":
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.22 + i * 0.45, 0]}>
              <cylinderGeometry args={[0.78, 0.78, 0.4, 64]} />
              <Mat color={color} glow={glow} />
            </mesh>
          ))}
        </group>
      );
    case "disk":
      return (
        <group>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.95, 0.95, 0.4, 64]} />
            <Mat color={color} glow={glow * 0.8} metal={0.6} />
          </mesh>
          <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, t * 0.8]}>
            <ringGeometry args={[0.25, 0.75, 48, 1, 0, Math.PI * 1.4]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.15} transparent opacity={0.35} />
          </mesh>
        </group>
      );
    case "server":
      return (
        <group>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[1.1, 1.6, 0.9]} />
            <Mat color="#1b2c52" glow={glow * 0.5} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, 0.3 + i * 0.36, 0.46]}>
              <boxGeometry args={[0.85, 0.08, 0.02]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9 + 0.5 * Math.max(0, Math.sin(t * 3 + i))} />
            </mesh>
          ))}
        </group>
      );
    case "memory":
      return (
        <group>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[2.4, 0.24, 1.0]} />
            <Mat color="#16305e" glow={glow * 0.5} />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[-0.98 + i * 0.28, 0.33, 0]}>
              <boxGeometry args={[0.2, 0.18, 0.7]} />
              <Mat color={color} glow={glow + 0.25 * Math.max(0, Math.sin(t * 2.2 - i * 0.6))} />
            </mesh>
          ))}
        </group>
      );
    case "page":
      return (
        <mesh position={[0, 0.31, 0]} rotation={[0.15, 0.35, 0]}>
          <boxGeometry args={[0.46, 0.62, 0.05]} />
          <Mat color={color} glow={0.55 + glow} />
        </mesh>
      );
    case "process":
      return (
        <mesh position={[0, 0.35, 0]}>
          <icosahedronGeometry args={[0.35, 3]} />
          <Mat color={color} glow={0.45 + glow} />
        </mesh>
      );
    case "user":
      return (
        <group>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.24, 32, 32]} />
            <Mat color={color} glow={glow} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.2, 0.42, 0.72, 32]} />
            <Mat color={color} glow={glow} />
          </mesh>
        </group>
      );
    case "log":
      return (
        <group>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[-0.9 + i * 0.45, 0.22, 0]}>
              <boxGeometry args={[0.38, 0.44, 0.7]} />
              <Mat color={color} glow={glow + (i === Math.floor(t * 1.5) % 5 ? 0.6 : 0)} />
            </mesh>
          ))}
        </group>
      );
    default:
      return (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <Mat color={color} glow={glow} />
        </mesh>
      );
  }
};

export const Three: React.FC<{ s: S3; t: number }> = ({ s, t }) => {
  const { A, Cue } = useTiming();
  const top = s.heading ? CANVAS_TOP_HEADING : CANVAS_TOP_PLAIN;
  const height = STAGE.bottom - top;
  const cam = camPos(s.camera, t);
  const start = A(s.from);

  // position of each object at time t (base point), following its moves in order
  const posOf = (o: Obj3D): V3 => {
    let p: V3 = [o.x, o.y, o.z ?? 0];
    const mv = (s.moves ?? []).filter((m) => m.id === o.id).sort((a, b) => a.at - b.at);
    for (const m of mv) {
      const t0 = Cue(m.at, 0.3);
      const k = rise(t, t0, 1.0);
      if (k <= 0) break;
      const q: V3 = [m.x, m.y, m.z ?? 0];
      const arc = Math.sin(k * Math.PI) * 0.7;
      p = [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k + arc, p[2] + (q[2] - p[2]) * k];
    }
    return p;
  };

  const objs = s.objects.map((o) => {
    const t0 = o.at !== undefined ? Cue(o.at, 0.2) : start + 0.2;
    const k = rise(t, t0, 0.55);
    const pulse = (s.pulses ?? []).filter((p) => p.id === o.id).map((p) => Cue(p.at, 0.3));
    const glow = pulse.reduce((g, p0) => Math.max(g, t >= p0 ? Math.max(0, 1 - (t - p0) / 1.6) : 0), 0);
    const [x, y, z] = posOf(o);
    const bob = Math.sin(t * 1.6 + o.x) * 0.04;
    return { o, k, glow, pos: [x, y + bob, z] as V3, scale: (o.scale ?? 1) * pop(t, t0, 0.55) * (k > 0 ? 1 : 0) * (1 + 0.08 * glow) };
  });
  const byId = Object.fromEntries(objs.map((x) => [x.o.id, x]));

  // project label anchors with the same camera the canvas uses
  const projector = useMemo(() => new THREE.PerspectiveCamera(FOV, W / height, 0.1, 100), [height]);
  projector.aspect = W / height;
  projector.position.set(...cam);
  projector.lookAt(...LOOK);
  projector.updateMatrixWorld();
  projector.updateProjectionMatrix();
  const toScreen = (p: V3) => {
    const v = new THREE.Vector3(...p).project(projector);
    return { x: ((v.x + 1) / 2) * W, y: top + ((1 - v.y) / 2) * height };
  };

  return (
    <>
      {s.heading ? (
        <div style={{ position: "absolute", top: STAGE.top + 10, left: 60, width: W - 120, textAlign: "center", fontFamily: FONT, fontSize: 56, fontWeight: 800, color: C.ink, lineHeight: 1.15, opacity: rise(t, start, 0.4) }}>
          {s.heading}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top, width: W, height }}>
        <ThreeCanvas width={W} height={height} camera={{ fov: FOV, position: cam, near: 0.1, far: 100 }}>
          <CameraRig pos={cam} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 8, 6]} intensity={2.2} />
          <pointLight position={[-6, 3, 4]} intensity={45} color={C.blue} />
          <pointLight position={[6, 1, 3]} intensity={25} color={C.orange} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.3, 0]}>
            <circleGeometry args={[7.5, 96]} />
            <meshStandardMaterial color="#0a1530" roughness={0.9} transparent opacity={0.9} />
          </mesh>
          <gridHelper args={[15, 30, "#1e3766", "#13264a"]} position={[0, -2.29, 0]} />
          {objs.map(({ o, pos, scale, glow }) =>
            scale > 0.001 ? (
              <group key={o.id} position={pos} scale={[scale, scale, scale]}>
                <Shape kind={o.kind} color={accent(o.color ?? "blue")} glow={glow} t={t} />
              </group>
            ) : null,
          )}
          {(s.flows ?? []).map((f, i) => {
            const a = byId[f.from], b = byId[f.to];
            if (!a || !b) return null;
            const t0 = Cue(f.at, 0.3);
            const vis = rise(t, t0, 0.5);
            if (vis <= 0) return null;
            const pa: V3 = [a.pos[0], a.pos[1] + HEIGHT[a.o.kind] * 0.5, a.pos[2]];
            const pb: V3 = [b.pos[0], b.pos[1] + HEIGHT[b.o.kind] * 0.5, b.pos[2]];
            const col = accent(f.color ?? "cyan");
            return (
              <group key={i}>
                {Array.from({ length: 7 }).map((_, j) => {
                  const u = ((t - t0) * 0.55 + j / 7) % 1;
                  const p: V3 = [pa[0] + (pb[0] - pa[0]) * u, pa[1] + (pb[1] - pa[1]) * u + Math.sin(u * Math.PI) * 0.8, pa[2] + (pb[2] - pa[2]) * u];
                  return (
                    <mesh key={j} position={p} scale={vis * Math.sin(u * Math.PI) * 1 + 0.001}>
                      <sphereGeometry args={[0.1, 16, 16]} />
                      <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.6} />
                    </mesh>
                  );
                })}
              </group>
            );
          })}
        </ThreeCanvas>
      </div>
      {(() => {
        // place labels above their objects; a label that would overlap an earlier one moves up
        const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
        return objs
          .filter(({ o, k }) => o.label && k > 0)
          .map((x) => ({ ...x, t0: x.o.at !== undefined ? Cue(x.o.at, 0.2) : start + 0.2, moving: (s.moves ?? []).some((m) => m.id === x.o.id) }))
          // fixed objects keep their label spot; moving ones give way
          .sort((a, b) => Number(a.moving) - Number(b.moving) || a.t0 - b.t0)
          .map(({ o, pos, glow, scale, t0 }) => {
            const p = toScreen([pos[0], pos[1] + HEIGHT[o.kind] * scale + 0.22, pos[2]]);
            const w = Math.max((o.label ?? "").length * 21, (o.sub ?? "").length * 15) + 56;
            const h = o.sub ? 86 : 60;
            let r = { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y - h, y1: p.y };
            for (let pass = 0; pass < 6; pass++) {
              const hit = placed.find((q) => r.x0 < q.x1 + 8 && q.x0 < r.x1 + 8 && r.y0 < q.y1 + 8 && q.y0 < r.y1 + 8);
              if (!hit) break;
              const dy = r.y1 - (hit.y0 - 10);
              r = { ...r, y0: r.y0 - dy, y1: r.y1 - dy };
            }
            placed.push(r);
            const col = accent(o.color ?? "blue");
            return (
              <div key={`l-${o.id}`} style={{ position: "absolute", left: (r.x0 + r.x1) / 2 - 240, top: r.y0, width: 480, textAlign: "center", opacity: rise(t, t0 + 0.25, 0.4) }}>
                <span style={{ display: "inline-block", padding: "8px 22px", borderRadius: 18, background: "rgba(10,20,44,0.86)", border: `3px solid ${glow > 0.05 ? col : `${col}77`}`, boxShadow: glow > 0.05 ? `0 0 ${30 * glow}px ${col}88` : undefined }}>
                  <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 800, color: C.ink, lineHeight: 1.1, whiteSpace: "nowrap" }}>{o.label}</div>
                  {o.sub ? <div style={{ fontFamily: FONT, fontSize: 26, color: C.mute, lineHeight: 1.2, whiteSpace: "nowrap" }}>{o.sub}</div> : null}
                </span>
              </div>
            );
          });
      })()}
    </>
  );
};
