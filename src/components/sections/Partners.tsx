"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";

const STATS = ["Sold cameras in 38 countries", "Cameras are installed on thousands of boats"];

/** One seamless tile of five logo cards (Garmin → Boston Whaler), 1602×170 at 1920. */
const TILE = { src: "/assets/images/partner-logos.webp", w: 3204, h: 340 };
const COPIES = 3;

function LogoRow({ className }: { className: string }) {
  return (
    <div className={`${className} flex w-max`}>
      {Array.from({ length: COPIES }, (_, i) => (
        <Image
          key={i}
          src={TILE.src}
          alt={i === 0 ? "Raymarine, Sea Ray, Boston Whaler, Garmin and Yamaha" : ""}
          aria-hidden={i > 0}
          width={TILE.w}
          height={TILE.h}
          sizes="84vw"
          className="h-auto w-[max(84vw,40rem)] max-w-none shrink-0"
        />
      ))}
    </div>
  );
}

export function Partners() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".prt-heading"), { type: "lines,words", mask: "lines" });

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: q(".prt-heading"), start: "top 90%", end: "bottom 45%", scrub: SCRUB },
        })
        .from(heading.words, { yPercent: 115, rotateX: -80, transformOrigin: "50% 100% -30px", stagger: 0.1 })
        // Stat pills unzip from their centre line, then the copy rises in.
        .fromTo(
          q(".prt-stat"),
          { clipPath: "inset(0% 50% 0% 50% round 999px)" },
          { clipPath: "inset(0% 0% 0% 0% round 999px)", stagger: 0.12, ease: "power2.inOut" },
          0.35,
        )
        .from(q(".prt-stat span"), { yPercent: 120, autoAlpha: 0, stagger: 0.12 }, 0.55);

      // The two logo belts run against each other for as long as they're on screen.
      const belts = gsap.timeline({
        scrollTrigger: { trigger: q(".prt-belts"), start: "top bottom", end: "bottom top", scrub: SCRUB },
      });
      belts
        .fromTo(q(".prt-row-a"), { xPercent: 0 }, { xPercent: -100 / COPIES, ease: "none" }, 0)
        .fromTo(q(".prt-row-b"), { xPercent: -100 / COPIES }, { xPercent: 0, ease: "none" }, 0)
        .fromTo(
          q(".prt-belts"),
          { clipPath: "inset(0% 50% 0% 50%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.3, ease: "power2.out" },
          0,
        );

      // Caption underline hands over from "Partners" to "Customers".
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".prt-caption"), start: "top 95%", end: "top 55%", scrub: SCRUB },
        })
        .fromTo(q(".prt-rule-a"), { scaleX: 0 }, { scaleX: 1, ease: "power2.out" })
        .to(q(".prt-rule-a"), { scaleX: 0, transformOrigin: "100% 50%", ease: "power2.in" })
        .fromTo(q(".prt-rule-b"), { scaleX: 0 }, { scaleX: 1, ease: "power2.out" }, "<0.3");
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section
      ref={root}
      id="partners"
      className="relative overflow-hidden pb-[clamp(3rem,5.7vw,7rem)] pt-[clamp(3rem,4vw,5rem)]"
      aria-labelledby="prt-heading"
    >
      <div className="flex flex-col items-center gap-[clamp(1.5rem,3.4vw,4rem)] px-4">
        <h2
          id="prt-heading"
          className="prt-heading text-giant text-center font-audiowide uppercase text-charcoal [perspective:800px]"
        >
          Partners &amp;
          <br />
          Customers
        </h2>

        <ul className="flex flex-wrap justify-center gap-[clamp(0.75rem,2.45vw,3rem)]">
          {STATS.map((s) => (
            <li
              key={s}
              className="prt-stat overflow-hidden rounded-full border border-charcoal/20 px-[clamp(1rem,1.6vw,2rem)] py-[clamp(0.4rem,0.6vw,0.7rem)]"
            >
              <span className="block font-archivo text-[clamp(1rem,2.08vw,2.5rem)] leading-[1.42] text-charcoal">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="prt-belts relative mt-[clamp(1.5rem,2.2vw,2.75rem)] flex flex-col gap-[clamp(0.25rem,0.4vw,0.5rem)]">
        <LogoRow className="prt-row-a" />
        <LogoRow className="prt-row-b" />
        {/* Figma ellipses 264:221 / 264:222 — canvas blurs fading the belt ends */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[10vw] bg-gradient-to-r from-canvas to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[10vw] bg-gradient-to-l from-canvas to-transparent" />
      </div>

      <p className="prt-caption mt-[clamp(1.5rem,2.6vw,3rem)] flex items-start justify-center gap-[0.55em] font-archivo text-[clamp(0.8rem,1.04vw,1.25rem)] tracking-[0.55em] text-charcoal">
        <span className="flex flex-col items-center gap-2">
          Partners
          <span aria-hidden className="prt-rule-a block h-px w-full origin-left bg-charcoal" />
        </span>
        <span aria-hidden>|</span>
        <span className="flex flex-col items-center gap-2">
          Customers
          <span aria-hidden className="prt-rule-b block h-px w-full origin-left bg-charcoal" />
        </span>
      </p>
    </section>
  );
}
