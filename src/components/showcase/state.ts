/**
 * Mutable bridge between the GSAP scroll timeline (DOM side) and the R3F
 * render loop. GSAP tweens these numbers; `CameraModel` reads them every frame.
 */
export type ShowcaseState = {
  /** 0 → 1 while the section scrolls into view (before the sticky stage locks). */
  enter: number;
  /** Horizontal / vertical offset as a fraction of half the viewport. */
  x: number;
  y: number;
  scale: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  /** Extra flip around X (radians) — a full turn reads as the same pose. */
  spinX: number;
  /** 0 = assembled, 1 = fully exploded. */
  explode: number;
  /** DOM nodes that should track 3D anchors (exploded-view callouts). */
  anchors: Map<string, HTMLElement>;
};

export function createShowcaseState(): ShowcaseState {
  return {
    enter: 0,
    x: 0,
    y: 0,
    scale: 0.8,
    rotX: 0.12,
    rotY: -1.6,
    rotZ: 0,
    spinX: 0,
    explode: 0,
    anchors: new Map(),
  };
}

/** Key poses used by the scroll choreography (radians). */
export const POSES = {
  // Lens turned toward the heading and tilted up, as in the Figma render.
  intro: { rotY: -0.5, rotX: -0.34 },
  front: { rotY: 0, rotX: 0.04 },
  back: { rotY: Math.PI + 0.35, rotX: 0.1 },
  body: { rotY: Math.PI * 2 - 1.05, rotX: 0.32 },
  exploded: { rotY: Math.PI * 2 - 0.85, rotX: 0.14 },
} as const;
