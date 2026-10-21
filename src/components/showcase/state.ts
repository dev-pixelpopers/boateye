/**
 * Mutable bridge between the GSAP scroll timeline (DOM side) and the R3F
 * render loop. GSAP tweens these numbers; `CameraModel` reads them every frame.
 */
export type ShowcaseState = {
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
    ...INTRO.desktop,
    rotZ: 0,
    spinX: 0,
    explode: 0,
    anchors: new Map(),
  };
}

/** Opening pose: right of centre, overlapping the heading, lens level. */
export const INTRO = {
  desktop: { x: 0.6, y: -0.25, scale: 1, rotY: -0.7, rotX: 0 },
  mobile: { x: 0.12, y: -0.46, scale: 0.9, rotY: -0.5, rotX: 0 },
} as const;

/** Key poses used by the scroll choreography (radians). */
export const POSES = {
  back: { rotY: Math.PI + 0.35, rotX: 0.1 },
  body: { rotY: Math.PI * 2 - 1.05, rotX: 0.32 },
  exploded: { rotY: Math.PI * 2 - 0.85, rotX: 0.14 },
} as const;
