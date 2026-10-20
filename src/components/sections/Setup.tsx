"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, gatherX, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";
import { PillButton } from "@/components/ui/PillButton";

const STEPS = [
  "Position the camera where it has a suitable view of the water ahead.",
  "Run the cable to your helm and connect it to your display.",
  "Power up and see what the night hides.",
];

export function Setup() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".setup-heading"), { type: "lines,chars", mask: "lines" });
      const steps = q(".setup-step").map((el) => SplitText.create(el, { type: "lines", mask: "lines" }));

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: SCRUB },
      });

      tl.from(q(".setup-glow"), { scale: 0.5, autoAlpha: 0, duration: 1 }, 0)
        .from(
          heading.chars,
          { yPercent: 100, x: gatherX(14), stagger: { each: 0.03, from: "center" }, duration: 0.8, ease: "power3.out" },
          0,
        )
        .fromTo(
          q(".setup-heading"),
          { filter: "blur(10px)" },
          { filter: "blur(0px)", duration: 1.1, ease: "power3.out" },
          0,
        )
        .fromTo(
          q(".setup-icon"),
          { clipPath: "circle(0% at 50% 50%)", rotateY: -180 },
          { clipPath: "circle(75% at 50% 50%)", rotateY: 0, duration: 1 },
          0.5,
        )
        .fromTo(q(".setup-rule"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1 }, 0.6);

      steps.forEach((split, i) => {
        const at = 1.2 + i * 1.4;
        if (i > 0) {
          tl.to(steps[i - 1].lines, { yPercent: -110, stagger: 0.05, duration: 0.5 }, at - 0.4)
            .to(q(".setup-icon"), { rotateY: `+=180`, duration: 0.9 }, at - 0.4)
            .to(q(".setup-num-track"), { yPercent: -100 * (i / STEPS.length), duration: 0.6 }, at - 0.3);
        }
        tl.from(split.lines, { yPercent: 110, stagger: 0.06, duration: 0.6, ease: "power3.out" }, at);
      });

      tl.fromTo(
        q(".setup-cta .pill-stroke"),
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.8 },
        1.4,
      ).to({}, { duration: 0.6 });
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} className="relative h-[320vh]" aria-labelledby="setup-heading">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-[clamp(2rem,5vh,5rem)] overflow-hidden px-4">
        <div
          aria-hidden
          className="setup-glow glow-signal pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[min(150vw,2140px)] -translate-x-1/2 -translate-y-1/2"
        />
        <h2
          id="setup-heading"
          aria-label="Straightforward setup"
          className="setup-heading text-giant text-center font-audiowide uppercase text-white"
        >
          {/* Figma breaks the word deliberately to keep a two-line lockup */}
          Straightfor
          <br />
          ward Setup
        </h2>

        <div className="grid w-full max-w-[1100px] grid-cols-[auto_auto_1fr] items-center gap-[clamp(1rem,3vw,4rem)]">
          <div className="h-[clamp(1.5rem,2.1vw,2.5rem)] overflow-hidden font-audiowide text-[clamp(1.4rem,2.08vw,2.5rem)] leading-[1] tracking-[-0.04em] text-white">
            <div className="setup-num-track flex flex-col">
              {STEPS.map((_, i) => (
                <span key={i}>{`0${i + 1}`}</span>
              ))}
            </div>
          </div>

          <div className="[perspective:900px]">
            <div className="setup-icon relative aspect-[250/304] w-[clamp(6rem,13vw,15.6rem)]">
              <Image src="/assets/images/setup-camera-outline.svg" alt="" fill className="object-contain" />
            </div>
          </div>

          <div className="grid">
            {STEPS.map((step) => (
              <p
                key={step}
                className="setup-step col-start-1 row-start-1 max-w-[507px] font-archivo text-[clamp(1.25rem,3.13vw,3.75rem)] leading-[1.17] text-white"
              >
                {step}
              </p>
            ))}
          </div>
        </div>

        <svg aria-hidden className="h-px w-full max-w-[1100px] overflow-visible" viewBox="0 0 100 1" preserveAspectRatio="none">
          <line className="setup-rule" x1="0" y1="0.5" x2="100" y2="0.5" stroke="rgb(255 255 255 / .25)" pathLength={1} strokeDasharray="1" />
        </svg>

        <PillButton uppercase className="setup-cta">
          View Installation Guide
        </PillButton>
      </div>
    </section>
  );
}
