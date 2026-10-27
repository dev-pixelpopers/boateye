"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { CameraModel } from "./CameraModel";
import type { ShowcaseState } from "./state";

/**
 * Studio set matching the Figma renders: a big soft overhead box, two tall
 * white strips for the long specular streaks on the housing, and a red rim
 * picking up the page's #ED1B26 glow from behind.
 */
export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-4, 1.5, -3]} intensity={0.9} color="#ff2a33" />
      <spotLight position={[0, -3, 3]} angle={0.6} penumbra={1} intensity={2} color="#ff3b44" />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.6} position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={1.8} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[1.2, 8, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[1.2, 8, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ed1b26" position={[0, 0, -6]} scale={[10, 3, 1]} />
        <Lightformer form="ring" intensity={1.2} position={[2, 2, 6]} scale={2.5} />
      </Environment>
    </>
  );
}

export default function CameraCanvas({
  state,
  track,
}: {
  state: React.RefObject<ShowcaseState>;
  /** Element whose visibility decides whether the render loop runs. */
  track: React.RefObject<HTMLElement | null>;
}) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "20% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [track]);

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 30, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      <StudioLights />
      <Suspense fallback={null}>
        <CameraModel state={state} />
      </Suspense>
    </Canvas>
  );
}
