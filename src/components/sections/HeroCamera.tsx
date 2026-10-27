"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CameraModel } from "@/components/showcase/CameraModel";
import { StudioLights } from "@/components/showcase/CameraCanvas";
import type { ShowcaseState } from "@/components/showcase/state";

/** Resting pose: straight on and a touch from above, like the old product shot. */
const HERO_POSE = { rotX: 0.16, rotY: 0 };

/** Model size inside the canvas (the canvas overhangs the hero's image box). */
const MODEL_SCALE = 1.1;
const TURN = Math.PI * 2;
/**
 * Body tilt visitors can drag to (radians, positive = lens up). The body
 * pivots on the bracket bolts: lens-down stops ~8 units above the base plate,
 * lens-up before the back of the body drops below the mounting face.
 */
const TILT_RANGE: [number, number] = [-0.3, 0.6];
/** Seconds after letting go before the model eases back to the front. */
const SETTLE_AFTER = 1.6;

type Orbit = {
  down: boolean;
  /** Last pointer position, in px. */
  px: number;
  py: number;
  /** Visitor's turn of the whole model, and tilt of the body on its bracket,
   * as offsets from the resting pose (radians). */
  yaw: number;
  tilt: number;
  /** Release momentum (radians per frame at 60fps). */
  vYaw: number;
  vTilt: number;
  /** Seconds since the last interaction. */
  idle: number;
  /** 0–1 blend of the ambient sway that hints the model is 3D. */
  sway: number;
};

/** Runs the orbit step inside the R3F render loop. */
function OrbitRig({ step }: { step: (time: number, delta: number) => void }) {
  useFrame(({ clock }, delta) => step(clock.elapsedTime, delta));
  return null;
}

export default function HeroCamera({
  tilt,
  onInteract,
}: {
  /** Body pitch on the bracket (radians); the hero intro tweens `.value`. */
  tilt: React.RefObject<{ value: number }>;
  /** Fired on the visitor's drags and key presses. */
  onInteract: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const state = useRef<ShowcaseState>({
    x: 0,
    y: 0,
    scale: MODEL_SCALE,
    ...HERO_POSE,
    rotZ: 0,
    spinX: 0,
    tilt: 0,
    explode: 0,
    anchors: new Map(),
  });
  const orbit = useRef<Orbit>({ down: false, px: 0, py: 0, yaw: 0, tilt: 0, vYaw: 0, vTilt: 0, idle: 99, sway: 1 });
  const [active, setActive] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    io.observe(node);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(reduce.matches);
    sync();
    reduce.addEventListener("change", sync);
    return () => {
      io.disconnect();
      reduce.removeEventListener("change", sync);
    };
  }, []);

  // Turns drag input into the model pose: momentum, settle back, idle sway.
  const step = (time: number, delta: number) => {
    const o = orbit.current;
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    const base = tilt.current.value;
    const clampTilt = (v: number) => THREE.MathUtils.clamp(v, TILT_RANGE[0] - base, TILT_RANGE[1] - base);

    if (!o.down) {
      o.idle += dt;
      const friction = Math.pow(0.9, dt * 60);
      o.yaw += o.vYaw * dt * 60;
      o.tilt = clampTilt(o.tilt + o.vTilt * dt * 60);
      o.vYaw *= friction;
      o.vTilt *= friction;

      if (o.idle > SETTLE_AFTER) {
        // Return to the nearest front-facing turn so it never unwinds.
        o.yaw = THREE.MathUtils.damp(o.yaw, Math.round(o.yaw / TURN) * TURN, 2.2, dt);
        o.tilt = THREE.MathUtils.damp(o.tilt, 0, 2.2, dt);
      }
    }

    const swayTarget = !still && !o.down && o.idle > SETTLE_AFTER + 0.8 ? 1 : 0;
    o.sway = THREE.MathUtils.damp(o.sway, swayTarget, 1.5, dt);

    s.rotY = HERO_POSE.rotY + o.yaw + Math.sin(time * 0.55) * 0.32 * o.sway;
    s.tilt = base + clampTilt(o.tilt);
  };

  const touch = () => {
    orbit.current.idle = 0;
    onInteract();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const o = orbit.current;
    Object.assign(o, { down: true, px: e.clientX, py: e.clientY, vYaw: 0, vTilt: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
    touch();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const o = orbit.current;
    if (!o.down) return;
    const { width, height } = e.currentTarget.getBoundingClientRect();
    const dYaw = ((e.clientX - o.px) / width) * Math.PI * 1.6;
    // Up/down only tilts the body; the bracket stays put. On touch, a swipe
    // that starts vertical scrolls the page instead (pan-y), so tilting there
    // happens within a sideways drag.
    const dTilt = -((e.clientY - o.py) / height) * Math.PI * 0.9;
    o.yaw += dYaw;
    const tilted = THREE.MathUtils.clamp(
      o.tilt + dTilt,
      TILT_RANGE[0] - tilt.current.value,
      TILT_RANGE[1] - tilt.current.value,
    );
    o.vTilt = tilted - o.tilt;
    o.tilt = tilted;
    o.vYaw = dYaw;
    o.px = e.clientX;
    o.py = e.clientY;
    o.idle = 0;
  };

  const onPointerUp = () => {
    orbit.current.down = false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const o = orbit.current;
    const step = { ArrowLeft: [-0.35, 0], ArrowRight: [0.35, 0], ArrowUp: [0, 0.2], ArrowDown: [0, -0.2] }[e.key];
    if (!step) return;
    e.preventDefault();
    o.vYaw = step[0] * 0.1;
    o.vTilt = step[1] * 0.1;
    touch();
  };

  return (
    <div
      ref={el}
      role="img"
      tabIndex={0}
      aria-label="Interactive 3D model of the BoatEye360 C-1080 camera. Drag sideways or use the left and right arrow keys to turn it; drag up and down or use the up and down arrow keys to tilt the camera body on its mount."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      onKeyDown={onKeyDown}
      // pan-y: a vertical swipe still scrolls the page; horizontal turns the model.
      className="pointer-events-auto size-full cursor-grab touch-pan-y select-none rounded-3xl outline-none focus-visible:ring-1 focus-visible:ring-white/40 active:cursor-grabbing"
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        // Measure layout size, not the on-screen box: the hero intro and
        // scroll exit scale this canvas's parents.
        resize={{ offsetSize: true }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6], fov: 30, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <StudioLights />
        <OrbitRig step={step} />
        <Suspense fallback={null}>
          <CameraModel state={state} />
        </Suspense>
      </Canvas>
    </div>
  );
}
