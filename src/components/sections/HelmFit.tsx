"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";
import { PillButton } from "@/components/ui/PillButton";

export function HelmFit() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".helm-heading"), { type: "lines,words", mask: "lines" });
      const copy = SplitText.create(q(".helm-copy"), { type: "lines", mask: "lines" });

      // Photo: diagonal polygon wipe in from the right edge with a 3D swing.
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".helm-frame"), start: "top 95%", end: "center 45%", scrub: SCRUB },
        })
        .fromTo(
          q(".helm-frame"),
          { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 115% 100%)", rotateY: -22, transformOrigin: "100% 50%" },
          { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, -15% 100%)", rotateY: 0, ease: "power2.out" },
        )
        .fromTo(q(".helm-img"), { scale: 1.35, xPercent: 8 }, { scale: 1.05, xPercent: 0, ease: "none" }, 0);

      // Continuous parallax inside the frame for the rest of the section.
      gsap.fromTo(
        q(".helm-img-wrap"),
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: SCRUB },
        },
      );

      gsap
        .timeline({
          scrollTrigger: { trigger: q(".helm-text"), start: "top 80%", end: "bottom 50%", scrub: SCRUB },
        })
        .from(heading.words, {
          rotateY: -95,
          xPercent: 40,
          autoAlpha: 0,
          transformOrigin: "100% 50%",
          stagger: 0.07,
          ease: "power3.out",
        })
        .from(copy.lines, { yPercent: 110, stagger: 0.1 }, "-=0.25");

      gsap
        .timeline({
          scrollTrigger: { trigger: q(".helm-cta"), start: "top 95%", end: "top 65%", scrub: SCRUB },
        })
        .fromTo(q(".helm-cta .pill-stroke"), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none" })
        .from(q(".helm-cta .pill-label"), { yPercent: 80, autoAlpha: 0 }, 0.3);
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section
      ref={root}
      id="helm"
      className="relative z-10 bg-white py-[clamp(4rem,8.4vw,10rem)] text-black"
      aria-labelledby="helm-heading"
    >
      <div className="grid gap-12 md:grid-cols-[minmax(0,709fr)_minmax(0,1123fr)] md:gap-[4.6vw]">
        <div className="helm-text flex flex-col items-end justify-between gap-10 px-4 text-right md:pl-[5.73vw] md:pr-0">
          <div className="flex flex-col items-end gap-[clamp(1.5rem,2.4vw,3rem)]">
            <h2
              id="helm-heading"
              className="helm-heading max-w-[663px] font-audiowide text-title uppercase leading-[0.94] [perspective:700px]"
            >
              Fits Your Helm. Works With Your Setup
            </h2>
            <p className="helm-copy max-w-[300px] font-archivo text-[clamp(0.9rem,0.94vw,1.125rem)] leading-[1.42]">
              Your electronics matter. Find the right connection for your existing marine display
              or explore a dedicated monitor.
            </p>
          </div>
          <PillButton tone="dark" uppercase className="helm-cta self-end md:self-start">
            Check Device Compatibility
          </PillButton>
        </div>

        <div className="[perspective:1400px]">
          <div className="helm-frame relative aspect-[1123/898] overflow-hidden">
            <div className="helm-img-wrap absolute -inset-y-[8%] inset-x-0">
              <Image
                src="/assets/images/helm-installation.webp"
                alt="BoatEye360 camera mounted under a center-console hardtop"
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="helm-img object-cover object-[70%_50%]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
