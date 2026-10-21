"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import { gsap, gatherX, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";
import { PillButton } from "@/components/ui/PillButton";
import { createShowcaseState, INTRO, POSES, type ShowcaseState } from "./state";

const CameraCanvas = dynamic(() => import("./CameraCanvas"), { ssr: false });

// Each feature turns the model to the part it describes: front, back, body.
const FEATURES = [
  "Full-color low-light imaging",
  "HDMI and analog video outputs",
  "316L marine-grade stainless steel housing",
] as const;

type Callout = {
  key: string;
  title: string;
  sub: string;
  /** Leader line: diagonal to (dx, dy), then a horizontal run of hx. */
  dx: number;
  dy: number;
  hx: number;
};

const CALLOUTS: Callout[] = [
  { key: "glass", title: "Front window", sub: "Optical glass", dx: -40, dy: -110, hx: -70 },
  { key: "lens", title: "Lens assembly", sub: "Low-light optics", dx: -50, dy: 120, hx: -70 },
  { key: "aperture", title: "Iris badge", sub: "Anodized finish", dx: 20, dy: -170, hx: 60 },
  { key: "bezel", title: "Front bezel", sub: "Sealed ring", dx: 30, dy: 150, hx: 60 },
  { key: "housing", title: "316L housing", sub: "Marine-grade stainless", dx: 60, dy: -140, hx: 80 },
  { key: "bracket", title: "Mount bracket", sub: "Adjustable tilt", dx: 60, dy: 110, hx: 80 },
];

/** Full-stage layer: occupies the stage grid's single cell. */
const LAYER = "col-start-1 row-start-1";

export function Showcase() {
  const root = useRef<HTMLElement>(null);
  // Mutable bag shared with the render loop; only touched in effects,
  // ref callbacks and frame callbacks, so it never triggers re-renders.
  const stateRef = useRef<ShowcaseState>(createShowcaseState());
  const fontsReady = useFontsReady();

  const anchor = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) stateRef.current.anchors.set(key, el);
      else stateRef.current.anchors.delete(key);
    },
    [],
  );

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const state = stateRef.current;

      const tech = SplitText.create(q(".sc-tech-title"), { type: "lines,chars", mask: "lines" });
      const featureTitles = q(".sc-feature").map((el) =>
        SplitText.create(el, { type: "lines,words", mask: "lines" }),
      );

      const introTitle = SplitText.create(q(".sc-intro-title"), { type: "lines,chars", mask: "lines" });
      const introCopy = SplitText.create(q(".sc-intro-copy"), { type: "lines", mask: "lines" });

      gsap.set(q(".sc-line"), { strokeDasharray: 1, strokeDashoffset: 1 });

      // Entrance, scrubbed while the stage slides up into place, so the
      // heading, copy and CTA have fully landed by the time it sticks.
      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "top top", scrub: SCRUB },
        })
        .from(introTitle.chars, { yPercent: 110, x: gatherX(14), stagger: 0.02, duration: 0.6 }, 0)
        .from(introCopy.lines, { yPercent: 110, stagger: 0.08, duration: 0.5 }, 0.45)
        .fromTo(
          q(".sc-intro-cta .pill-stroke"),
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" },
          0.6,
        )
        .from(q(".sc-intro-cta .pill-label"), { yPercent: 80, autoAlpha: 0, duration: 0.4 }, 0.8);

      const mm = gsap.matchMedia();

      mm.add(
        { desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" },
        (ctx) => {
          const { desktop } = ctx.conditions as { desktop: boolean };
          const side = desktop ? { x: -0.48, y: -0.12 } : { x: 0, y: -0.32 };
          const sideScale = desktop ? 0.74 : 0.8;

          const tl = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: SCRUB },
          });

          // ── Phase 1 · intro: heading, copy and model already in place;
          // hold briefly before the split ────────────────────────────────
          const intro = desktop ? INTRO.desktop : INTRO.mobile;
          // Mirror of the intro angle: facing right, toward the feature text.
          const lookRight = { rotY: -intro.rotY, rotX: intro.rotX };
          gsap.set(state, intro);

          // ── Phase 2 · heading goes, the camera flips across to the left ─
          // Heading lines peel away upward, last line first, each a beat
          // apart; copy and CTA drop out beneath them.
          const out = { immediateRender: false, ease: "power2.in" };
          tl.addLabel("split", 0.4)
            .fromTo(
              introTitle.lines,
              { yPercent: 0, filter: "blur(0px)" },
              { ...out, yPercent: -110, filter: "blur(6px)", stagger: { each: 0.08, from: "end" }, duration: 0.45 },
              "split+=0.05",
            )
            .fromTo(introCopy.lines, { yPercent: 0 }, { ...out, yPercent: 110, stagger: 0.04, duration: 0.35 }, "split")
            .to(q(".sc-intro-cta"), { y: 30, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, "split")
            // The model slides left, turning on the spot from facing left to
            // facing right, ready for feature 1.
            .to(state, { ...side, ...lookRight, scale: sideScale, duration: 0.85 }, "split");

          // ── Phase 3 · features take over the heading's place, one at a
          // time; the model scales up and turns to the matching part ───────
          const poses = [
            { ...lookRight, scale: sideScale * 1.3 },
            { ...POSES.back, scale: sideScale * 1.25 },
            { ...POSES.body, scale: sideScale * 1.1, x: desktop ? -0.42 : 0 },
          ];
          const features = q(".sc-feature");
          const FEATURE_START = 1.4;
          const FEATURE_STEP = 1.2;

          features.forEach((feature, i) => {
            const at = FEATURE_START + i * FEATURE_STEP;
            tl.fromTo(feature, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at)
              .from(
                featureTitles[i].words,
                { yPercent: 115, rotateX: -70, transformOrigin: "100% 100%", stagger: 0.05, duration: 0.5, ease: "power3.out" },
                at + 0.05,
              )
              .to(state, { ...poses[i], duration: 0.9 }, at - 0.15);

            if (i > 0) {
              tl.to(featureTitles[i - 1].words, { yPercent: -115, stagger: 0.03, duration: 0.35, ease: "power2.in" }, at - 0.35)
                .to(features[i - 1], { autoAlpha: 0, duration: 0.01 }, at);
            }
          });

          // ── Section 4 · recentre and explode ──────────────────────────────
          tl.addLabel("tech", 5.1)
            .to(featureTitles[2].words, { yPercent: -115, stagger: 0.03, duration: 0.4, ease: "power2.in" }, "tech")
            .to(q(".sc-glow"), { x: () => -window.innerWidth * 0.1, duration: 1 }, "tech")
            .to(state, { x: 0, y: desktop ? -0.2 : -0.1, scale: desktop ? 0.8 : 0.85, ...POSES.exploded, duration: 1.1 }, "tech")
            .fromTo(q(".sc-tech"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, "tech+=0.2")
            .fromTo(
              tech.chars,
              { yPercent: 175, scaleY: 1.6, transformOrigin: "50% 100%" },
              { yPercent: 0, scaleY: 1, stagger: 0.012, duration: 0.7, ease: "power3.out" },
              "tech+=0.2",
            )
            .fromTo(
              q(".sc-tech"),
              { y: () => window.innerHeight * 0.22, scale: 1 },
              { y: 0, scale: desktop ? 0.46 : 0.6, duration: 1.1 },
              "tech+=0.9",
            )
            .to(state, { explode: 1, duration: 1.8, ease: "power1.inOut" }, "tech+=1")
            // Parts spread ~2.5× along the optical axis, so pull back as they separate.
            .to(state, { scale: desktop ? 0.5 : 0.6, x: desktop ? 0.1 : 0, duration: 1.8, ease: "power1.inOut" }, "tech+=1")
            .to(q(".sc-progress .sc-line"), { strokeDashoffset: 0, duration: 1.8, ease: "none" }, "tech+=1");

          q(".sc-callout").forEach((el, i) => {
            const at = 6.4 + i * 0.16;
            tl.to(el.querySelector(".sc-line"), { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, at)
              .fromTo(el.querySelector(".sc-callout-dot"), { scale: 0 }, { scale: 1, duration: 0.2 }, at)
              .fromTo(
                el.querySelector(".sc-callout-label"),
                { clipPath: "inset(0% 100% 0% 0%)", autoAlpha: 0 },
                { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, duration: 0.4 },
                at + 0.3,
              );
          });

          tl.to({}, { duration: 0.8 }); // hold the exploded frame before release
        },
      );

      return () => mm.revert();
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} id="clearer-view" className="relative h-[780vh]" aria-label="The C-1080 camera">
      {/* One-cell grid: every full-stage layer shares the cell and stacks in
          DOM order, so only the offset/anchored pieces need `absolute`. */}
      <div className="sticky top-0 grid h-svh grid-cols-[100%] grid-rows-[100%] overflow-hidden">
        {/* Figma ellipse 109:82 — red glow rising from the lower right */}
        <div
          aria-hidden
          className="sc-glow glow-ellipse pointer-events-none absolute -z-10 aspect-[1/2] w-[55.73vw] rounded-l-full"
          style={{ left: "calc(87.3% - 55.73vw)", top: "calc(135% - 55.73vw)" }}
        />

        {/* Phase 1 heading, copy and CTA — behind the model */}
        <div className={`${LAYER} pointer-events-none flex flex-col items-start px-4 pt-[14vh] md:px-[10vw] md:pt-[10vh]`}>
          <h2 className="sc-intro-title text-giant text-left font-audiowide uppercase text-mist">
            <span className="block whitespace-nowrap">A Clearer</span>
            <span className="block whitespace-nowrap">View After</span>
            <span className="block whitespace-nowrap">Dark.</span>
          </h2>
          <p className="sc-intro-copy mt-[clamp(1.5rem,4vh,3.5rem)] max-w-[22rem] font-archivo text-[clamp(0.9rem,0.94vw,1.125rem)] leading-[1.42] text-white">
            Full-color marine night vision, engineered for real-world boating. See more detail in
            low light with a camera built for demanding marine environments.
          </p>
          <div className="pointer-events-auto mt-[clamp(1.5rem,4.5vh,3.5rem)]">
            <PillButton className="sc-intro-cta" href="#helm">
              Explore the C-1080
            </PillButton>
          </div>
        </div>

        {/* Section 4 heading */}
        <div className={`${LAYER} pointer-events-none flex items-start justify-center px-4 pt-[6vh]`}>
          <h2 className="sc-tech sc-tech-title text-giant origin-top text-center font-audiowide uppercase text-white">
            Technology
            <br />
            Behind the C-1080
          </h2>
        </div>

        {/* Phase 3 features — one at a time where the heading was, right-aligned */}
        <div className={`${LAYER} pointer-events-none grid content-start justify-items-end px-4 pt-[14vh] md:px-[10vw] md:pt-[10vh]`}>
          {FEATURES.map((title) => (
            <h3
              key={title}
              className="sc-feature text-[clamp(2rem,6.2vw,7.5rem)] leading-[0.95] tracking-[-0.03em] invisible col-start-1 row-start-1 max-w-full text-right font-audiowide uppercase text-mist [perspective:900px]"
            >
              {title}
            </h3>
          ))}
        </div>

        <div className={`${LAYER} pointer-events-none z-10`}>
          <CameraCanvas state={stateRef} track={root} />
        </div>

        {/* Section 4 callouts pinned to exploded parts */}
        {CALLOUTS.map((c) => (
          <div
            key={c.key}
            ref={anchor(c.key)}
            className="sc-callout pointer-events-none absolute left-0 top-0 z-20 hidden will-change-transform md:block"
          >
            <span className="sc-callout-dot absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_#ed1b26]" />
            <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1">
              <path
                className="sc-line"
                d={`M0 0 L${c.dx} ${c.dy} L${c.dx + c.hx} ${c.dy}`}
                fill="none"
                stroke="rgb(255 255 255 / .8)"
                strokeWidth="1"
                pathLength={1}
              />
            </svg>
            <div
              className={`sc-callout-label absolute w-max rounded-md bg-ink/70 px-3 py-2 backdrop-blur-sm ${c.hx < 0 ? "-translate-x-full text-right" : ""} -translate-y-1/2`}
              style={{ left: c.dx + c.hx, top: c.dy }}
            >
              <p className="font-audiowide text-[clamp(0.8rem,0.95vw,1.1rem)] uppercase text-white">{c.title}</p>
              <p className="font-archivo text-[clamp(0.7rem,0.75vw,0.875rem)] uppercase tracking-[0.18em] text-white/60">
                {c.sub}
              </p>
            </div>
          </div>
        ))}

        {/* Scroll-progress HUD line for the exploded sequence */}
        <svg className={`sc-progress ${LAYER} pointer-events-none z-20 mb-[4vh] ml-[5.73vw] h-px w-[88.5vw] self-end justify-self-start overflow-visible`} preserveAspectRatio="none" viewBox="0 0 100 1">
          <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="rgb(255 255 255 / .12)" vectorEffect="non-scaling-stroke" />
          <line className="sc-line" x1="0" y1="0.5" x2="100" y2="0.5" stroke="#ed1b26" pathLength={1} />
        </svg>
      </div>
    </section>
  );
}
