"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import { gsap, gatherX, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";
import { PillButton } from "@/components/ui/PillButton";
import { createShowcaseState, INTRO, POSES, TILT_UP, type ShowcaseState } from "./state";

const CameraCanvas = dynamic(() => import("./CameraCanvas"), { ssr: false });

// One at a time while the model turns past front, side, back, side, front;
// the matching poses live in the timeline below.
const FEATURES = [
  {
    title: "World's Smallest",
    copy: "The world's smallest marine night vision camera. Compact enough to mount on a hardtop, T-top, arch or rail without crowding your view.",
  },
  {
    title: "Built Tougher",
    copy: "The world's toughest marine night vision camera. A sealed, marine-grade stainless housing made to shrug off salt, spray, sun and constant pounding.",
  },
  {
    title: "Analog + HDMI",
    copy: "The only marine night vision camera with both analog and digital HDMI outputs, so it works with the screens you have today and the ones you add later.",
  },
  {
    title: "Fits Your Display",
    copy: "Broad compatibility with marine displays and monitors means it plugs into the helm you already have, with no new electronics required.",
  },
  {
    title: "Priced for Boaters",
    copy: "Full-color night vision at a price that makes sense for everyday boat owners, not just commercial fleets.",
  },
  {
    title: "Built in the USA",
    copy: "Proudly built in the USA for boaters who want gear they can count on, season after season.",
  },
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
  { key: "glass", title: "Scratch-proof glass", sub: "Keeps the view clear", dx: -20, dy: -120, hx: -40 },
  { key: "seal", title: "IP69 waterproof", sub: "Sealed against spray & washdown", dx: -40, dy: 130, hx: -60 },
  { key: "screws", title: "Titanium screws", sub: "Won't rust or seize", dx: 10, dy: -190, hx: 50 },
  { key: "housing", title: "316L stainless housing", sub: "Marine-grade steel", dx: 20, dy: -190, hx: -60 },
  // Overall size as measured from the 3D model (incl. bracket and bolts).
  { key: "size", title: "Compact size", sub: "136 × 110 × 99 mm", dx: -10, dy: 200, hx: -60 },
  { key: "bracket", title: "Flip-mount bracket", sub: "Upright or upside down", dx: 20, dy: 130, hx: 30 },
  { key: "analog", title: "Analog video output", sub: "For classic displays", dx: 100, dy: -40, hx: 40 },
  { key: "hdmi", title: "Digital HDMI output", sub: "For modern MFDs", dx: 90, dy: 40, hx: 40 },
];

/** Full-stage layer: occupies the stage grid's single cell. */
const LAYER = "col-start-1 row-start-1";

/**
 * Side-on pictogram of the camera on its bracket and mounting surface. The
 * `flip` copy turns over on scroll to show the same unit hung upside down.
 */
function MountFigure({ label, flip = false }: { label: string; flip?: boolean }) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 96" className="h-[clamp(3.5rem,5vw,5rem)] overflow-visible" fill="none" aria-hidden>
        <g className={flip ? "sc-mount-flip" : undefined}>
          {/* Mounting surface: deck, or the underside of a hardtop */}
          <path d="M8 88h104" className="stroke-white/50" strokeWidth="1.5" />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${14 + i * 11} 88l-5 6`} className="stroke-white/25" />
          ))}
          {/* Bracket base, arm and hinge bolt */}
          <path d="M38 88v-7h44v7M45 81l11-31h10l11 31" className="stroke-white" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Housing with the lens face and its view */}
          <rect x="20" y="34" width="72" height="30" rx="6" className="fill-white/10 stroke-white" strokeWidth="1.5" />
          <rect x="92" y="36" width="7" height="26" rx="2" className="fill-signal" />
          <circle cx="61" cy="50" r="3" className="fill-charcoal stroke-white" />
          <path d="M101 49l15-8M101 49l15 8" className="stroke-white/40" strokeDasharray="2 3" />
        </g>
      </svg>
      <figcaption className="font-archivo text-[clamp(0.65rem,0.7vw,0.8rem)] uppercase tracking-[0.18em] text-white/80">
        {label}
      </figcaption>
    </figure>
  );
}

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
      const featureTitles = q(".sc-feature-title").map((el) =>
        SplitText.create(el, { type: "lines,words", mask: "lines" }),
      );
      const featureCopies = q(".sc-feature-copy").map((el) => SplitText.create(el, { type: "lines", mask: "lines" }));

      const introTitle = SplitText.create(q(".sc-intro-title"), { type: "lines,chars", mask: "lines" });
      const introCopy = SplitText.create(q(".sc-intro-copy"), { type: "lines", mask: "lines" });

      gsap.set(q(".sc-line"), { strokeDasharray: 1, strokeDashoffset: 1 });

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

          // ── Phase 1 · intro: the camera arrives alone, its body looks up
          // on the bracket, then the heading, copy and CTA come in around it
          const intro = desktop ? INTRO.desktop : INTRO.mobile;
          // Mirror of the intro angle: facing right, toward the feature text.
          const lookRight = { rotY: -intro.rotY, rotX: intro.rotX };
          gsap.set(state, intro);
          // The tilt holds until the explode; the bracket never moves.
          tl.fromTo(state, { tilt: 0 }, { tilt: TILT_UP, duration: 0.5, immediateRender: false }, 0.1);

          const reveal = { ease: "power3.out" };
          tl.addLabel("reveal", 0.7)
            .from(introTitle.chars, { ...reveal, yPercent: 110, x: gatherX(14), stagger: 0.02, duration: 0.6 }, "reveal")
            .from(introCopy.lines, { ...reveal, yPercent: 110, stagger: 0.08, duration: 0.5 }, "reveal+=0.45")
            .fromTo(
              q(".sc-intro-cta .pill-stroke"),
              { strokeDasharray: 1, strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" },
              "reveal+=0.6",
            )
            .from(q(".sc-intro-cta .pill-label"), { ...reveal, yPercent: 80, autoAlpha: 0, duration: 0.4 }, "reveal+=0.8");

          // ── Phase 2 · heading goes, the camera flips across to the left ─
          // Heading lines peel away upward, last line first, each a beat
          // apart; copy and CTA drop out beneath them. Later phases are timed
          // from here.
          const SPLIT = 2.4;
          const out = { immediateRender: false, ease: "power2.in" };
          tl.addLabel("split", SPLIT)
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
          // time, heading over description; the model keeps turning one way
          // and shows the part each feature is about ─────────────────────────
          const poses = [
            // Smallest: front three-quarter, held small.
            { ...lookRight, scale: sideScale * 0.95 },
            // Toughest: side profile along the stainless housing.
            { rotY: 1.45, rotX: 0.26, scale: sideScale * 0.95, x: desktop ? -0.36 : 0 },
            // Dual outputs: straight at the rear HDMI port and cable glands.
            { ...POSES.back, scale: sideScale * 1.3, x: side.x },
            // Compatibility: rear three-quarter, ports and cable run.
            { rotY: Math.PI + 0.95, rotX: 0.22, scale: sideScale, x: desktop ? -0.38 : 0 },
            // Affordable: the full product from above.
            { ...POSES.body, scale: sideScale * 0.95, x: desktop ? -0.36 : 0 },
            // Built in the USA: nearly head-on and level.
            { rotY: Math.PI * 2 - 0.5, rotX: 0.08, scale: sideScale, x: desktop ? -0.36 : 0 },
          ];
          const features = q(".sc-feature");
          const FEATURE_START = SPLIT + 1;
          const FEATURE_STEP = 1.2;
          const leave = { yPercent: -115, stagger: 0.03, duration: 0.35, ease: "power2.in" };

          features.forEach((feature, i) => {
            const at = FEATURE_START + i * FEATURE_STEP;
            tl.fromTo(feature, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at)
              .from(
                featureTitles[i].words,
                { yPercent: 115, rotateX: -70, transformOrigin: "100% 100%", stagger: 0.05, duration: 0.5, ease: "power3.out" },
                at + 0.05,
              )
              .from(featureCopies[i].lines, { yPercent: 110, stagger: 0.06, duration: 0.45, ease: "power3.out" }, at + 0.3)
              .to(state, { ...poses[i], duration: 0.9 }, at - 0.15);

            if (i > 0) {
              tl.to(featureTitles[i - 1].words, leave, at - 0.35)
                .to(featureCopies[i - 1].lines, { ...leave, stagger: 0.02 }, at - 0.35)
                .to(features[i - 1], { autoAlpha: 0, duration: 0.01 }, at);
            }
          });

          // ── Section 4 · recentre and explode ──────────────────────────────
          const last = features.length - 1;
          const TECH = FEATURE_START + last * FEATURE_STEP + 1.3;
          tl.addLabel("tech", TECH)
            .to(featureTitles[last].words, { ...leave, duration: 0.4 }, "tech")
            .to(featureCopies[last].lines, { ...leave, stagger: 0.02 }, "tech")
            .to(q(".sc-glow"), { x: () => -window.innerWidth * 0.1, duration: 1 }, "tech")
            .to(state, { x: 0, y: desktop ? -0.2 : -0.1, scale: desktop ? 0.8 : 0.85, ...POSES.exploded, duration: 1.1 }, "tech")
            // Level the body back out before the parts separate.
            .to(state, { tilt: 0, duration: 0.8 }, "tech")
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
            const at = TECH + 1.3 + i * 0.16;
            tl.to(el.querySelector(".sc-line"), { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, at)
              .fromTo(el.querySelector(".sc-callout-dot"), { scale: 0 }, { scale: 1, duration: 0.2 }, at)
              .fromTo(
                el.querySelector(".sc-callout-label"),
                { clipPath: "inset(0% 100% 0% 0%)", autoAlpha: 0 },
                { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, duration: 0.4 },
                at + 0.3,
              );
          });

          // Mounting card: the second pictogram turns over to show the same
          // bracket hung upside down.
          const MOUNT = TECH + 2.6;
          tl.fromTo(q(".sc-mount"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, MOUNT)
            .fromTo(
              q(".sc-mount-flip"),
              { scaleY: 1, transformOrigin: "50% 50%" },
              { scaleY: -1, duration: 0.6, ease: "power2.inOut" },
              MOUNT + 0.35,
            );

          tl.to({}, { duration: 0.8 }); // hold the exploded frame before release
        },
      );

      return () => mm.revert();
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} id="clearer-view" className="relative h-[1250vh]" aria-label="The C-1080 camera">
      {/* One-cell grid: every full-stage layer shares the cell and stacks in
          DOM order, so only the offset/anchored pieces need `absolute`. */}
      <div className="sticky top-0 grid h-svh grid-cols-[100%] grid-rows-[100%] overflow-hidden">
        {/* Figma ellipse 109:82 — charcoal shade rising from the lower right */}
        <div
          aria-hidden
          className="sc-glow glow-ellipse pointer-events-none absolute -z-10 aspect-[1/2] w-[55.73vw] rounded-l-full"
          style={{ left: "calc(87.3% - 55.73vw)", top: "calc(135% - 55.73vw)" }}
        />

        {/* Phase 1 heading, copy and CTA — behind the model */}
        <div className={`${LAYER} pointer-events-none flex flex-col items-start px-4 pt-[14vh] md:px-[10vw] md:pt-[10vh]`}>
          <h2 className="sc-intro-title text-giant text-left font-audiowide uppercase text-charcoal">
            <span className="block whitespace-nowrap">A Clearer</span>
            <span className="block whitespace-nowrap">View After</span>
            <span className="block whitespace-nowrap">Dark.</span>
          </h2>
          <p className="sc-intro-copy mt-[clamp(1.5rem,4vh,3.5rem)] max-w-[22rem] font-archivo text-[clamp(0.9rem,0.94vw,1.125rem)] leading-[1.42] text-charcoal">
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
          <h2 className="sc-tech sc-tech-title text-giant origin-top text-center font-audiowide uppercase text-charcoal">
            Technology
            <br />
            Behind the C-1080
          </h2>
        </div>

        {/* Phase 3 features — one at a time where the heading was, right-aligned,
            heading with its description underneath */}
        <div className={`${LAYER} pointer-events-none grid content-start justify-items-end px-4 pt-[14vh] md:px-[10vw] md:pt-[10vh]`}>
          {FEATURES.map(({ title, copy }) => (
            <div key={title} className="sc-feature invisible col-start-1 row-start-1 flex max-w-full flex-col items-end text-right">
              <h3 className="sc-feature-title text-[clamp(2rem,5.6vw,6.75rem)] leading-[0.95] tracking-[-0.03em] font-audiowide uppercase text-charcoal [perspective:900px]">
                {title}
              </h3>
              <p className="sc-feature-copy mt-[clamp(1rem,3vh,2.5rem)] max-w-[24rem] font-archivo text-[clamp(0.9rem,0.94vw,1.125rem)] leading-[1.42] text-charcoal">
                {copy}
              </p>
            </div>
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
            <span className="sc-callout-dot absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_var(--crimson)]" />
            <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1">
              <path
                className="sc-line"
                d={`M0 0 L${c.dx} ${c.dy} L${c.dx + c.hx} ${c.dy}`}
                fill="none"
                stroke="rgb(54 69 79 / .8)"
                strokeWidth="1"
                pathLength={1}
              />
            </svg>
            <div
              className={`sc-callout-label absolute w-max rounded-md bg-charcoal/85 px-3 py-2 backdrop-blur-sm ${c.hx < 0 ? "-translate-x-full text-right" : ""} -translate-y-1/2`}
              style={{ left: c.dx + c.hx, top: c.dy }}
            >
              <p className="font-audiowide text-[clamp(0.8rem,0.95vw,1.1rem)] uppercase text-white">{c.title}</p>
              <p className="font-archivo text-[clamp(0.7rem,0.75vw,0.875rem)] uppercase tracking-[0.18em] text-white/60">
                {c.sub}
              </p>
            </div>
          </div>
        ))}

        {/* Section 4 · mounting flexibility: the same bracket, either way up */}
        <div className={`sc-mount ${LAYER} invisible pointer-events-none z-20 mb-[9vh] mr-4 self-end justify-self-end md:mr-[5.73vw]`}>
          <div className="rounded-xl border border-white/10 bg-charcoal/85 px-4 py-3 backdrop-blur-sm">
            <p className="font-audiowide text-[clamp(0.8rem,0.95vw,1.1rem)] uppercase text-white">Mount it either way</p>
            <div className="mt-2 flex gap-5">
              <MountFigure label="Upright" />
              <MountFigure label="Upside down" flip />
            </div>
            <p className="mt-2 font-archivo text-[clamp(0.7rem,0.75vw,0.875rem)] uppercase tracking-[0.18em] text-white/60">
              No software changes
            </p>
          </div>
        </div>

        {/* Scroll-progress HUD line for the exploded sequence */}
        <svg className={`sc-progress ${LAYER} pointer-events-none z-20 mb-[4vh] ml-[5.73vw] h-px w-[88.5vw] self-end justify-self-start overflow-visible`} preserveAspectRatio="none" viewBox="0 0 100 1">
          <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="rgb(54 69 79 / .15)" vectorEffect="non-scaling-stroke" />
          <line className="sc-line" x1="0" y1="0.5" x2="100" y2="0.5" stroke="var(--crimson)" pathLength={1} />
        </svg>
      </div>
    </section>
  );
}
