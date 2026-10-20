"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Scrub defaults shared by every scroll-driven timeline on the page. */
export const SCRUB = 1;

/**
 * Function-based `x` that pulls split chars/words toward their centre, so a
 * `from()` reads as the text "expanding" into place. Unlike tweening
 * letter-spacing it only uses transforms, so lines never re-wrap mid-scroll.
 */
export const gatherX =
  (spread: number) =>
  (i: number, _target: unknown, targets: unknown[]) =>
    (targets.length / 2 - i - 0.5) * spread;

export { gsap, ScrollTrigger, SplitText, useGSAP };
