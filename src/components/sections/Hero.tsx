"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";
import { PillButton } from "@/components/ui/PillButton";
import { Logo } from "@/components/ui/Logo";
import { TILT_UP } from "@/components/showcase/state";

const HeroCamera = dynamic(() => import("./HeroCamera"), { ssr: false });

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();
  // Body tilt for the hero model, tweened by the intro below.
  const cameraTilt = useRef({ value: 0 });
  const [interacted, setInteracted] = useState(false);
  const onInteract = useCallback(() => setInteracted(true), []);

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);

      const lineA = SplitText.create(q(".hero-line-a"), { type: "chars", mask: "chars" });
      const lineB = SplitText.create(q(".hero-word"), { type: "chars", mask: "chars" });
      const copy = SplitText.create(q(".hero-copy"), { type: "lines", mask: "lines" });

      gsap.set(root.current, { autoAlpha: 1 });

      // ── On-load intro: camera → (1s) heading → (1s) copy + CTA ───────────
      const CAMERA_AT = 0;
      const HEADING_AT = 1;
      const COPY_AT = 2;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.from(q(".hero-header > *"), { yPercent: -140, autoAlpha: 0, duration: 1.2, stagger: 0.1 }, CAMERA_AT)
        .fromTo(
          q(".hero-camera"),
          { clipPath: "inset(48% 48% 48% 48% round 50%)", scale: 1.35, filter: "blur(18px) brightness(2)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0%)",
            scale: 1,
            filter: "blur(0px) brightness(1)",
            duration: 1,
            ease: "expo.inOut",
            // The canvas overhangs this box so the model can turn freely.
            clearProps: "clipPath,filter",
          },
          CAMERA_AT,
        )
        .from(q(".hero-camera-shadow"), { scaleX: 0, autoAlpha: 0, duration: 1 }, CAMERA_AT + 0.5)
        // Once revealed, the body looks up on its bracket.
        .fromTo(cameraTilt.current, { value: 0 }, { value: TILT_UP, duration: 1.4, ease: "power3.inOut" }, CAMERA_AT + 0.8)
        .from(
          lineA.chars,
          { yPercent: 115, rotateX: -80, transformOrigin: "50% 100%", duration: 1.2, stagger: 0.035 },
          HEADING_AT,
        )
        .from(
          lineB.chars,
          { yPercent: -115, rotateX: 80, transformOrigin: "50% 0%", duration: 1.2, stagger: { each: 0.035, from: "edges" } },
          HEADING_AT + 0.1,
        )
        .from(copy.lines, { yPercent: 105, duration: 1.1, stagger: 0.08 }, COPY_AT)
        .fromTo(
          q(".hero-cta .pill-stroke"),
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.4, ease: "power3.inOut" },
          COPY_AT,
        )
        .from(q(".hero-cta .pill-label"), { autoAlpha: 0, yPercent: 80, filter: "blur(4px)", duration: 1.1 }, COPY_AT + 0.2)
        .from(q(".hero-hint"), { autoAlpha: 0, y: 12, duration: 1 }, COPY_AT + 0.4);

      // ── Exit as the page moves on (scroll-scrubbed) ──────────────────────
      gsap
        .timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: SCRUB },
        })
        .to(q(".hero-camera-wrap"), { yPercent: 28, scale: 0.86, ease: "none" }, 0)
        .to(q(".hero-title"), { yPercent: -18, scale: 0.96, autoAlpha: 0.25, ease: "none" }, 0)
        .to(q(".hero-bottom"), { yPercent: -60, autoAlpha: 0, ease: "none" }, 0);

      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section
      ref={root}
      className="hero-hidden relative isolate z-10 flex min-h-svh flex-col overflow-hidden px-4 pb-[clamp(3rem,6vw,8rem)] pt-[clamp(1.5rem,2.7vw,3.2rem)] md:px-[5.73vw]"
    >
      <header className="hero-header flex items-center justify-between">
        <Logo />
        <button
          type="button"
          className="font-michroma text-[clamp(0.95rem,1.04vw,1.25rem)] leading-[0.94] text-white"
        >
          Menu
        </button>
      </header>

      <h1
        className="hero-title relative mt-[clamp(3rem,5.6vw,6.7rem)] flex flex-col items-center font-audiowide uppercase text-mist [perspective:800px]"
        aria-label="See what the night hides"
      >
        <span className="hero-line-a text-mega block whitespace-nowrap">See What the</span>
        <span className="flex w-full max-w-[95.2vw] items-center justify-between text-[clamp(2.9rem,10.26vw,12.3rem)] leading-[0.91] tracking-[-0.07em]">
          <span className="hero-word">Night</span>
          <span className="hero-word">Hides</span>
        </span>
      </h1>

      {/* Interactive 3D model between "Night" and "Hides". Only the model's
          canvas takes pointer input, so the rest of the hero scrolls as usual. */}
      <div className="hero-camera-wrap pointer-events-none absolute left-1/2 top-[clamp(9rem,14.9vw,18rem)] w-[clamp(11rem,25.9vw,31rem)] -translate-x-1/2">
        <div className="hero-camera relative aspect-[1400/1647] will-change-transform">
          <div className="absolute -inset-x-[45%] -inset-y-[20%]">
            <HeroCamera tilt={cameraTilt} onInteract={onInteract} />
          </div>
        </div>
        <div
          aria-hidden
          className="hero-camera-shadow mx-auto -mt-[4%] h-[6%] w-[70%] rounded-[50%] bg-black/70 blur-xl"
        />
        <div aria-hidden className="hero-hint mt-[clamp(0.75rem,1.4vw,1.5rem)] flex justify-center">
          <span
            className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-ink/50 px-3.5 py-1.5 font-archivo text-[clamp(0.65rem,0.7vw,0.8rem)] uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm transition-opacity duration-700 ${interacted ? "opacity-0" : ""}`}
          >
            <svg viewBox="0 0 24 24" className="size-[1.4em]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="12" rx="10" ry="4" />
              <path d="M17.5 5.2 20 8.3l-3.6.9" />
            </svg>
            <span className="pointer-coarse:hidden">Drag to rotate</span>
            <span className="hidden pointer-coarse:inline">Swipe to rotate</span>
          </span>
        </div>
      </div>

      <div className="hero-bottom mt-auto flex flex-col items-start gap-8 pt-[clamp(10rem,30vw,4rem)] md:flex-row md:items-end md:justify-between">
        <p className="hero-copy max-w-[22.8rem] font-archivo text-[clamp(0.95rem,0.94vw,1.125rem)] leading-[1.42] text-white">
          Navigate with greater awareness after dark. BoatEye360 brings full-color night vision
          to your helm, helping you see what lies ahead when visibility fades.
        </p>
        <PillButton className="hero-cta" href="#clearer-view">
          Explore Night Vision
        </PillButton>
      </div>
    </section>
  );
}
