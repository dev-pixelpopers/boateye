"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";
import { PillButton } from "@/components/ui/PillButton";

export function FinalCta() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".cta-heading"), { type: "words" });
      const copy = SplitText.create(q(".cta-copy"), { type: "lines", mask: "lines" });

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: root.current, start: "top 75%", end: "center 45%", scrub: SCRUB },
        })
        .from(q(".cta-glow"), { scale: 0.3, autoAlpha: 0, ease: "power1.out" }, 0)
        // Words punch in from the camera: oversized, defocused, then snap sharp.
        .from(heading.words, {
          scale: 2.6,
          z: 200,
          filter: "blur(24px)",
          autoAlpha: 0,
          stagger: 0.12,
        }, 0)
        .from(copy.lines, { yPercent: 110, stagger: 0.1 }, 0.45)
        .fromTo(
          q(".cta-btn .pill-stroke"),
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, ease: "power2.inOut" },
          0.55,
        )
        .from(q(".cta-btn .pill-label"), { autoAlpha: 0, yPercent: 60 }, 0.75);
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section
      ref={root}
      className="relative isolate flex flex-col items-center gap-[clamp(1.5rem,2.3vw,2.75rem)] overflow-hidden px-4 pb-[clamp(4rem,8.6vw,10rem)] pt-[clamp(5rem,6vw,7rem)] text-center"
      aria-labelledby="cta-heading"
    >
      <div
        aria-hidden
        className="cta-glow glow-signal pointer-events-none absolute left-1/2 top-[85%] -z-10 aspect-square w-[min(150vw,2140px)] -translate-x-1/2"
      />
      <h2
        id="cta-heading"
        className="cta-heading text-giant max-w-[1519px] font-audiowide uppercase text-white [perspective:600px]"
      >
        Make Every View Count.
      </h2>
      <p className="cta-copy max-w-[902px] font-archivo text-[clamp(1.1rem,2.08vw,2.5rem)] leading-[1.42] text-white">
        Give your next trip a clearer perspective. Discover full-color night vision built for
        life on the water.
      </p>
      <PillButton uppercase className="cta-btn mt-[clamp(0.5rem,1vw,1.25rem)]">
        Shop Night Vision Cameras
      </PillButton>
    </section>
  );
}
