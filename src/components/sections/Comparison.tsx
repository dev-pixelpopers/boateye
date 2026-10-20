"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";

export function Comparison() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

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

      // Night → BoatEye360 sequence across the comparison frame.
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".cmp-frame"), start: "top 90%", end: "bottom 70%", scrub: SCRUB },
        })
        .fromTo(
          q(".cmp-left"),
          { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" },
          { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", ease: "power2.inOut" },
          0,
        )
        .fromTo(
          q(".cmp-right"),
          { clipPath: "polygon(100% 0%, 100% 0%, 120% 100%, 100% 100%)" },
          { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, -20% 100%)", ease: "power2.inOut" },
          0.15,
        )
        .fromTo(q(".cmp-img"), { scale: 1.3, yPercent: -8 }, { scale: 1, yPercent: 0, ease: "none" }, 0)
        .fromTo(
          q(".cmp-right .cmp-img"),
          { filter: "brightness(0.25) saturate(0) contrast(1.2)" },
          { filter: "brightness(1) saturate(1) contrast(1)", ease: "power1.in" },
          0.35,
        )
        .fromTo(q(".cmp-scan"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none" }, 0.2)
        .to(q(".cmp-scan-wrap"), { autoAlpha: 0, ease: "none", duration: 0.2 }, 0.9)
        .from(q(".cmp-label"), { y: 24, filter: "blur(6px)", autoAlpha: 0, stagger: 0.1, ease: "power2.out" }, 0.55);
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} className="relative px-4 md:px-[5.73vw]" aria-labelledby="cmp-heading">
      {/* Figma ellipse 95:37 — glows up behind the hero's lower edge */}
      <div
        aria-hidden
        className="glow-ellipse pointer-events-none absolute left-1/2 top-[-8.33vw] aspect-[2/1] w-[111.46vw] -translate-x-1/2 rounded-t-full"
      />
      <div className="cmp-card relative mx-auto flex w-full max-w-[1700px] flex-col items-center bg-white px-3 pt-[clamp(3rem,5.6vw,6.7rem)] text-black md:px-[min(13vw,252px)]">
        <div className="flex w-full max-w-[1196px] flex-col px-2 md:px-0">
          <h2
            id="cmp-heading"
            className="cmp-heading max-w-[1089px] font-audiowide text-title uppercase leading-[1.11] [perspective:900px]"
          >
            Darkness Changes. Your View Doesn&apos;t Have To.
          </h2>
          <p className="cmp-copy mt-[clamp(1.5rem,2.6vw,3rem)] max-w-[22.8rem] font-archivo text-[clamp(0.95rem,0.94vw,1.125rem)] leading-[1.42]">
            From floating markers to nearby vessels, see how full-color imaging can help reveal
            details that are difficult to spot in low light.
          </p>
        </div>

        <div className="cmp-frame relative mt-[clamp(2.5rem,4vw,5rem)] grid w-full max-w-[1196px] grid-cols-2 gap-[3px]">
          <figure className="cmp-left relative aspect-[587/646] overflow-hidden">
            <Image
              src="/assets/images/comparison-other-brands.webp"
              alt="Boat at night seen through a conventional camera — barely visible"
              fill
              sizes="(min-width: 1280px) 600px, 50vw"
              className="cmp-img object-cover"
            />
            <figcaption className="cmp-label absolute bottom-[1.4rem] left-[clamp(0.75rem,1.7vw,2rem)] font-archivo text-[clamp(0.7rem,0.94vw,1.125rem)] uppercase text-white">
              Other Brands
            </figcaption>
          </figure>
          <figure className="cmp-right relative aspect-[598/646] overflow-hidden">
            <Image
              src="/assets/images/comparison-boateye.webp"
              alt="The same boat in full color through BoatEye360"
              fill
              sizes="(min-width: 1280px) 600px, 50vw"
              className="cmp-img object-cover"
            />
            <figcaption className="cmp-label absolute bottom-[1.4rem] right-[clamp(0.75rem,1.7vw,2rem)] font-archivo text-[clamp(0.7rem,0.94vw,1.125rem)] uppercase text-white">
              BoatEye 360
            </figcaption>
          </figure>

          {/* HUD scan line that draws down the seam between the two views */}
          <svg
            aria-hidden
            className="cmp-scan-wrap pointer-events-none absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 overflow-visible"
            viewBox="0 0 16 100"
            preserveAspectRatio="none"
          >
            <line
              className="cmp-scan"
              x1="8"
              y1="0"
              x2="8"
              y2="100"
              stroke="#ed1b26"
              strokeWidth="2"
              pathLength={1}
              strokeDasharray="1"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
