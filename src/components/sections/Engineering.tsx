"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, gatherX, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";

export function Engineering() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".eng-heading"), { type: "lines,words", mask: "lines" });
      const eyebrow = SplitText.create(q(".eng-eyebrow"), { type: "chars" });
      const copy = SplitText.create(q(".eng-copy"), { type: "lines", mask: "lines" });

      gsap
        .timeline({
          scrollTrigger: { trigger: q(".eng-text"), start: "top 85%", end: "bottom 45%", scrub: SCRUB },
        })
        .from(heading.words, { yPercent: 100, x: gatherX(60), stagger: 0.05, ease: "power3.out" })
        .from(
          eyebrow.chars,
          { autoAlpha: 0, filter: "blur(6px)", scale: 1.6, stagger: { each: 0.02, from: "random" } },
          0.3,
        )
        .from(copy.lines, { yPercent: 110, stagger: 0.08 }, 0.5);

      // Image opens from a pill-shaped aperture, like a lens iris.
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".eng-frame"), start: "top 95%", end: "center 55%", scrub: SCRUB },
        })
        .fromTo(
          q(".eng-frame"),
          { clipPath: "inset(32% 36% 32% 36% round 999px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut" },
        )
        .fromTo(
          q(".eng-img"),
          { scale: 1.5, filter: "brightness(0.35) saturate(0.4)" },
          { scale: 1.05, filter: "brightness(1) saturate(1)", ease: "none" },
          0,
        );
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section
      ref={root}
      className="relative bg-[linear-gradient(to_bottom,#fff_0,#fff_calc(100%-clamp(4rem,11.5vw,14rem)),transparent_calc(100%-clamp(4rem,11.5vw,14rem)))] px-4 text-charcoal md:px-[5.73vw]"
      aria-labelledby="eng-heading"
    >
      <div className="eng-text mx-auto flex max-w-[1230px] flex-col items-center gap-[clamp(1.5rem,2.6vw,3rem)] text-center">
        <h2 id="eng-heading" className="eng-heading font-audiowide text-title uppercase leading-[0.91]">
          Better Visibility.
          <br />
          Practical Engineering.
        </h2>
        <div className="flex max-w-[758px] flex-col gap-[clamp(0.75rem,1.1vw,1.25rem)]">
          <h3 className="eng-eyebrow font-audiowide text-eyebrow uppercase text-charcoal">Built Around Boaters</h3>
          <p className="eng-copy font-archivo text-[clamp(1rem,1.3vw,1.5625rem)] leading-[1.42] text-slate">
            Purpose-built marine technology designed around real boating conditions, helping you
            navigate, explore, and enjoy the water with greater visibility and confidence after
            dark.
          </p>
        </div>
      </div>

      <div className="eng-frame relative mx-auto mt-[clamp(2.5rem,4.2vw,5rem)] aspect-[1702/786] max-w-[1702px] overflow-hidden">
        <Image
          src="/assets/images/boat-console-night.webp"
          alt="Crew at a center console at dusk, lit by blue helm lighting"
          fill
          sizes="(min-width: 1800px) 1702px, 90vw"
          className="eng-img object-cover object-[50%_75%]"
        />
      </div>
    </section>
  );
}
