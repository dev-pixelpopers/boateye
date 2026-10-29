"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";
import { PillButton } from "@/components/ui/PillButton";

const MONITOR = "/assets/images/external-monitor.webp";

export function ExternalMonitor() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".mon-heading"), { type: "lines,chars", mask: "lines" });
      const copy = SplitText.create(q(".mon-copy"), { type: "lines", mask: "lines" });

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: SCRUB },
        })
        .from(heading.chars, { yPercent: 110, rotateX: -70, transformOrigin: "50% 100%", stagger: 0.03, duration: 0.8 }, 0)
        // Monitor swings up out of a closing letterbox, like it's being unboxed.
        .fromTo(
          q(".mon-device"),
          { clipPath: "inset(100% 0% 0% 0%)", yPercent: 35, rotateX: 28, scale: 0.82 },
          { clipPath: "inset(-10% -10% -10% -10%)", yPercent: 0, rotateX: 0, scale: 1, duration: 1.2, ease: "power2.inOut" },
          0.45,
        )
        // Screen "powers on": a glare band sweeps across the glass only.
        .fromTo(q(".mon-glare"), { xPercent: -120 }, { xPercent: 120, duration: 0.9, ease: "power1.inOut" }, 1.45)
        .from(copy.lines, { yPercent: 110, stagger: 0.08, duration: 0.6 }, 1.5)
        .fromTo(
          q(".mon-cta .pill-stroke"),
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" },
          1.8,
        )
        .from(q(".mon-cta .pill-label"), { yPercent: 80, autoAlpha: 0, duration: 0.4 }, 1.95)
        .to(q(".mon-device"), { yPercent: -4, duration: 0.6, ease: "none" }, 2.4);
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} id="monitor" className="relative h-[240vh] bg-white" aria-labelledby="mon-heading">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-4 text-center">
        <h2
          id="mon-heading"
          className="mon-heading text-giant max-w-[1519px] font-audiowide uppercase text-charcoal [perspective:700px]"
        >
          External
          <br />
          Monitor
        </h2>

        {/* The device overlaps the bottom of "Monitor" as in Figma 246:153 */}
        <div className="relative z-10 -mt-[2vw] md:-mt-[clamp(2.5rem,5.5vw,6.5rem)] w-[min(68vw,618px,42svh)] [perspective:1200px]">
          <div className="mon-device relative aspect-[1271/1176] overflow-hidden">
            <Image src={MONITOR} alt="BoatEye360 V2 marine monitor with sun visor" fill sizes="(min-width: 768px) 618px, 68vw" className="object-contain" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 [mask-image:url(/assets/images/external-monitor.webp)] [mask-size:contain] [mask-repeat:no-repeat]"
            >
              <div className="mon-glare absolute inset-y-0 -left-1/4 w-[60%] -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </div>
          </div>
        </div>

        <p className="mon-copy mt-[clamp(1rem,2vh,2rem)] max-w-[1106px] font-archivo text-[clamp(1.05rem,2.08vw,2.5rem)] leading-[1.42] text-charcoal">
          Introducing the new V2 Marine Monitor — the same reliable screen, now upgraded with better
          materials, improved mounting, and a cleaner install.
        </p>

        <PillButton uppercase className="mon-cta mt-[clamp(1rem,2.2vh,2.5rem)]">
          Explore Now
        </PillButton>
      </div>
    </section>
  );
}
