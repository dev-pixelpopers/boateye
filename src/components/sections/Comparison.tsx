"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";

type Target = {
  key: string;
  label: string;
  note: string;
  /** Position in the frame, in percent. Both photos share the same framing. */
  x: number;
  y: number;
  zoom: number;
};

const TARGETS: Target[] = [
  { key: "marker", label: "Floating markers", note: "Channel marker on the horizon", x: 90.8, y: 46.9, zoom: 2.6 },
  { key: "vessel", label: "Nearby vessels", note: "Center console underway", x: 52, y: 53.5, zoom: 1.7 },
  { key: "crew", label: "Crew on deck", note: "People at the T-top helm", x: 55, y: 48, zoom: 2.6 },
];

/** Divider position when nothing is being inspected: half night, half BoatEye360. */
const REST = 50;
/** How far left of an inspected detail the divider parks, so it shows in color. */
const LEAD = 30;

const BRACKETS = [
  "left-3 top-3 border-l border-t",
  "right-3 top-3 border-r border-t",
  "bottom-3 left-3 border-b border-l",
  "bottom-3 right-3 border-b border-r",
];

export function Comparison() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const fontsReady = useFontsReady();
  const [active, setActive] = useState<Target | null>(null);
  const [touched, setTouched] = useState(false);

  // Divider position (% from the left). Mutated by GSAP and written straight
  // to CSS variables, so dragging never re-renders React.
  const split = useRef({ v: 100 });
  const took = useRef(false);
  const dragging = useRef(false);

  const apply = () => {
    const v = split.current.v;
    frame.current?.style.setProperty("--split", `${v}%`);
    frame.current?.style.setProperty("--s", String(v / 100));
    knob.current?.setAttribute("aria-valuenow", String(Math.round(v)));
    knob.current?.setAttribute("aria-valuetext", `${Math.round(100 - v)}% BoatEye360 view`);
    if (readout.current) readout.current.textContent = String(Math.round(100 - v)).padStart(2, "0");
  };

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);

      const heading = SplitText.create(q(".cmp-heading"), { type: "lines,words", mask: "lines" });
      const copy = SplitText.create(q(".cmp-copy"), { type: "lines", mask: "lines" });

      // Card unfolds from a rounded inset window as it rises into view.
      gsap.fromTo(
        q(".cmp-card"),
        { clipPath: "inset(14% 9% 0% 9% round 64px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: "none",
          scrollTrigger: { trigger: q(".cmp-card"), start: "top bottom", end: "top 25%", scrub: SCRUB },
        },
      );

      gsap
        .timeline({
          scrollTrigger: { trigger: q(".cmp-heading"), start: "top 85%", end: "bottom 35%", scrub: SCRUB },
        })
        .from(heading.words, {
          yPercent: 120,
          rotateX: -75,
          transformOrigin: "50% 100% -40px",
          stagger: 0.06,
          ease: "power3.out",
        })
        .from(copy.lines, { yPercent: 110, filter: "blur(6px)", stagger: 0.1, ease: "power2.out" }, "-=0.3");

      // Panel: target rows rise in as their rules draw across.
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".cmp-panel"), start: "top 85%", end: "bottom 60%", scrub: SCRUB },
        })
        .from(q(".cmp-readout > *"), { yPercent: 110, stagger: 0.08, ease: "power3.out" })
        .fromTo(q(".cmp-rule"), { scaleX: 0 }, { scaleX: 1, stagger: 0.1, ease: "power2.inOut" }, 0.1)
        .from(q(".cmp-target-inner"), { yPercent: 110, stagger: 0.1, ease: "power3.out" }, 0.2);

      // Viewer: the frame opens from a slit, then the divider sweeps from full
      // night across to the halfway mark — until the user grabs it.
      const intro = { v: 100 };
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".cmp-frame"), start: "top 90%", end: "center 45%", scrub: SCRUB },
        })
        .fromTo(
          q(".cmp-frame"),
          { clipPath: "inset(46% 0% 46% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 0.5 },
          0,
        )
        .fromTo(q(".cmp-zoom"), { scale: 1.35 }, { scale: 1, ease: "none", duration: 0.8 }, 0)
        .from(q(".cmp-bracket"), { scale: 2.2, autoAlpha: 0, stagger: 0.05, ease: "power3.out", duration: 0.3 }, 0.35)
        .fromTo(
          intro,
          { v: 100 },
          {
            v: REST,
            ease: "power2.inOut",
            duration: 0.6,
            onUpdate: () => {
              if (took.current) return;
              split.current.v = intro.v;
              apply();
            },
          },
          0.4,
        )
        .from(q(".cmp-chip"), { y: -16, filter: "blur(6px)", stagger: 0.1, ease: "power2.out", duration: 0.3 }, 0.7);

      apply();
    },
    { scope: root, dependencies: [fontsReady] },
  );

  // Event-time tweens on a plain object and the zoom layers; nothing to revert.
  const moveTo = (v: number, duration = 0.35) => {
    took.current = true;
    gsap.to(split.current, {
      v: gsap.utils.clamp(0, 100, v),
      duration,
      ease: "power3.out",
      overwrite: true,
      onUpdate: apply,
    });
  };

  const focus = (t: Target | null) => {
    setTouched(true);
    setActive(t);
    moveTo(t ? Math.max(8, t.x - LEAD) : REST, 1);
    gsap.to(root.current!.querySelectorAll(".cmp-zoom"), {
      scale: t ? t.zoom : 1,
      ...(t && { transformOrigin: `${t.x}% ${t.y}%` }),
      duration: 1.1,
      ease: "power3.inOut",
      overwrite: true,
    });
  };

  const fromPointer = (e: React.PointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    moveTo(((e.clientX - r.left) / r.width) * 100);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 5;
    const keys: Record<string, number> = {
      ArrowLeft: split.current.v - step,
      ArrowDown: split.current.v - step,
      ArrowRight: split.current.v + step,
      ArrowUp: split.current.v + step,
      Home: 0,
      End: 100,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    setTouched(true);
    moveTo(keys[e.key]);
  };

  return (
    <section ref={root} className="relative px-4 md:px-[5.73vw]" aria-labelledby="cmp-heading">
      {/* Figma ellipse 95:37 — shades up behind the hero's lower edge */}
      <div
        aria-hidden
        className="glow-ellipse pointer-events-none absolute left-1/2 top-[-8.33vw] aspect-[2/1] w-[111.46vw] -translate-x-1/2 rounded-t-full"
      />
      <div className="cmp-card relative mx-auto flex w-full max-w-[1700px] flex-col items-center bg-charcoal px-3 pb-[clamp(3rem,6vw,7rem)] pt-[clamp(3rem,5.6vw,6.7rem)] text-canvas md:px-[min(13vw,252px)]">
        <div className="flex w-full max-w-[1196px] flex-col px-2 md:px-0">
          <h2
            id="cmp-heading"
            className="cmp-heading max-w-[1089px] font-audiowide text-title uppercase leading-[1.11] [perspective:900px]"
          >
            Darkness Changes. Your View Doesn&apos;t Have To.
          </h2>
        </div>

        <div className="mt-[clamp(2rem,3.4vw,4rem)] grid w-full max-w-[1196px] gap-10 px-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-[clamp(2rem,4.5vw,6rem)] md:px-0">
          {/* ── Control panel ─────────────────────────────────────────── */}
          <div className="cmp-panel flex flex-col gap-[clamp(2rem,3vw,3.5rem)] max-md:order-2 md:justify-between">
            <p className="cmp-copy max-w-[22.8rem] font-archivo text-[clamp(0.95rem,0.94vw,1.125rem)] leading-[1.42]">
              From floating markers to nearby vessels, see how full-color imaging can help reveal
              details that are difficult to spot in low light.
            </p>

            <div className="flex flex-col gap-[clamp(1.25rem,2vw,2rem)]">
              <div className="cmp-readout flex items-end gap-4 overflow-hidden" aria-hidden>
                <span className="font-audiowide text-[clamp(3rem,6.25vw,7.5rem)] leading-[0.85] tracking-[-0.04em] tabular-nums">
                  <span ref={readout}>00</span>
                  <span className="text-[0.45em] text-canvas/60">%</span>
                </span>
                <span className="mb-[0.4em] max-w-[9rem] font-archivo text-[clamp(0.7rem,0.75vw,0.875rem)] uppercase leading-[1.3] tracking-[0.18em] text-canvas/60">
                  of the frame in full color
                </span>
              </div>

              <div>
                <p className="mb-3 font-archivo text-[clamp(0.7rem,0.75vw,0.875rem)] uppercase tracking-[0.18em] text-canvas/60">
                  Spot it in the dark
                </p>
                <ul className="flex flex-col">
                  {TARGETS.map((t, i) => {
                    const on = active?.key === t.key;
                    return (
                      <li key={t.key} className="relative">
                        <span aria-hidden className="cmp-rule absolute inset-x-0 top-0 block h-px origin-left bg-canvas/20" />
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => focus(on ? null : t)}
                          className="group w-full overflow-hidden py-[clamp(0.8rem,1.1vw,1.25rem)] text-left"
                        >
                          <span className="cmp-target-inner flex items-center gap-4">
                            <span className={`font-audiowide text-[clamp(0.8rem,0.95vw,1.1rem)] transition-colors ${on ? "text-white" : "text-canvas/50"}`}>
                              {`0${i + 1}`}
                            </span>
                            <span className="flex-1 whitespace-nowrap font-audiowide text-[clamp(0.95rem,1.15vw,1.4rem)] uppercase leading-none transition-transform duration-500 group-hover:translate-x-2">
                              {t.label}
                            </span>
                            {/* Plus turns into a cross while the target is inspected */}
                            <span
                              aria-hidden
                              className={`relative grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-500 ${on ? "rotate-45 border-crimson bg-crimson" : "border-canvas/30 group-hover:border-canvas"}`}
                            >
                              <span className="absolute h-px w-3 bg-current" />
                              <span className="absolute h-3 w-px bg-current" />
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  <li aria-hidden className="relative h-px">
                    <span className="cmp-rule absolute inset-0 block origin-left bg-canvas/20" />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Before / after viewer ────────────────────────────────── */}
          <div
            ref={frame}
            className="cmp-frame group/frame relative mx-auto aspect-[598/794] w-full max-w-[min(640px,72svh*598/794)] cursor-ew-resize touch-pan-y select-none overflow-hidden bg-ink [--s:1] [--split:100%] max-md:order-1"
            onPointerDown={(e) => {
              dragging.current = true;
              setTouched(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              fromPointer(e);
            }}
            onPointerMove={(e) => dragging.current && fromPointer(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <div className="absolute inset-0">
              <div className="cmp-zoom absolute inset-0 will-change-transform">
                <Image
                  src="/assets/images/comparison-other-brands.webp"
                  alt="Boat at night seen through a conventional camera — barely visible"
                  fill
                  draggable={false}
                  sizes="(min-width: 768px) 560px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="absolute inset-0 [clip-path:inset(0_0_0_var(--split))]">
              <div className="cmp-zoom absolute inset-0 will-change-transform">
                <Image
                  src="/assets/images/comparison-boateye.jpg"
                  alt="The same boat in full color through BoatEye360"
                  fill
                  draggable={false}
                  sizes="(min-width: 768px) 560px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Viewfinder corners */}
            {BRACKETS.map((b) => (
              <span key={b} aria-hidden className={`cmp-bracket pointer-events-none absolute size-5 border-white/60 ${b}`} />
            ))}

            {/* Side labels fade as their half of the frame closes */}
            <span className="cmp-chip pointer-events-none absolute left-[clamp(0.75rem,1.4vw,1.5rem)] top-[clamp(2.25rem,3vw,3rem)] rounded-full border border-white/20 bg-ink/40 px-3 py-1.5 font-archivo text-[clamp(0.65rem,0.75vw,0.875rem)] uppercase tracking-[0.18em] text-white backdrop-blur-sm [opacity:calc((var(--s)_-_0.12)*5)]">
              Other brands
            </span>
            <span className="cmp-chip pointer-events-none absolute right-[clamp(0.75rem,1.4vw,1.5rem)] top-[clamp(2.25rem,3vw,3rem)] flex items-center gap-2 rounded-full bg-crimson px-3 py-1.5 font-archivo text-[clamp(0.65rem,0.75vw,0.875rem)] uppercase tracking-[0.18em] text-white [opacity:calc((0.88_-_var(--s))*5)]">
              <span className="size-1.5 rounded-full bg-white" />
              BoatEye360
            </span>

            {/* Reticle on the inspected detail. Zoom pivots on this point, so it stays put. */}
            {active && (
              <div
                key={active.key}
                aria-live="polite"
                className="pointer-events-none absolute"
                style={{ left: `${active.x}%`, top: `${active.y}%` }}
              >
                <span className="absolute size-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-crimson" />
                <span className="absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90" />
                <span
                  className={`absolute top-8 w-max rounded-md bg-ink/70 px-3 py-2 font-archivo text-[clamp(0.65rem,0.75vw,0.875rem)] uppercase tracking-[0.14em] text-white backdrop-blur-sm ${active.x > 60 ? "right-0" : "-translate-x-1/2"}`}
                >
                  {active.note}
                </span>
              </div>
            )}

            {/* Divider + handle */}
            <div className="pointer-events-none absolute inset-y-0 left-[var(--split)] w-0.5 -translate-x-1/2 bg-crimson shadow-[0_0_18px_var(--crimson)]">
              <div
                ref={knob}
                role="slider"
                tabIndex={0}
                aria-label="Compare other brands with BoatEye360"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={100}
                onKeyDown={onKeyDown}
                className="pointer-events-auto absolute left-1/2 top-1/2 grid size-[clamp(2.75rem,3.4vw,3.5rem)] -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full bg-crimson text-white shadow-[0_6px_24px_rgb(0_0_0/0.35)] outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-white active:cursor-grabbing group-hover/frame:scale-110"
              >
                {!touched && (
                  <span aria-hidden className="absolute inset-0 animate-ping rounded-full border border-crimson" />
                )}
                <svg viewBox="0 0 24 24" className="size-1/2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
                </svg>
              </div>
            </div>

            <span
              aria-hidden
              className={`pointer-events-none absolute bottom-[clamp(1rem,1.6vw,1.75rem)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/50 px-3.5 py-1.5 font-archivo text-[clamp(0.65rem,0.7vw,0.8rem)] uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm transition-opacity duration-700 ${touched ? "opacity-0" : ""}`}
            >
              Drag to compare
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
