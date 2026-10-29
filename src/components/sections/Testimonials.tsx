"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";

const VIDEOS = [
  { src: "/assets/images/testimonial-1.webp", alt: "Boat owner sharing his experience on deck", position: "67% 50%" },
  { src: "/assets/images/testimonial-2.webp", alt: "Boater talking about night navigation", position: "50% 50%" },
  { src: "/assets/images/testimonial-3.webp", alt: "Captain describing the camera at the helm", position: "50% 50%" },
  { src: "/assets/images/testimonial-4.webp", alt: "Angler standing on the dock", position: "58% 50%" },
];

export function Testimonials() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".tst-heading"), { type: "lines,chars", mask: "lines" });

      gsap.from(heading.chars, {
        yPercent: (i) => (i % 2 ? -110 : 110),
        stagger: 0.025,
        ease: "power3.out",
        scrollTrigger: { trigger: q(".tst-heading"), start: "top 90%", end: "bottom 45%", scrub: SCRUB },
      });

      // Cards deal out of a fanned 3D stack into the row.
      const cards = q(".tst-card");
      gsap
        .timeline({
          scrollTrigger: { trigger: q(".tst-row"), start: "top 95%", end: "center 50%", scrub: SCRUB },
        })
        .fromTo(
          cards,
          {
            rotateY: (i) => (i - 1.5) * -28,
            rotateX: 18,
            z: -300,
            yPercent: 25,
            clipPath: "inset(100% 0% 0% 0%)",
          },
          {
            rotateY: 0,
            rotateX: 0,
            z: 0,
            yPercent: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            stagger: 0.12,
            ease: "power2.out",
          },
        )
        .fromTo(q(".tst-img"), { scale: 1.45 }, { scale: 1.05, stagger: 0.12, ease: "none" }, 0)
        .from(q(".tst-play"), { scale: 0, rotate: -90, autoAlpha: 0, stagger: 0.12, ease: "back.out(2)" }, 0.35);

      // White horizon swells up to hand off to the light section.
      gsap.fromTo(
        q(".tst-curve"),
        { scaleY: 0.25, yPercent: 40 },
        {
          scaleY: 1,
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: q(".tst-curve-wrap"), start: "top bottom", end: "top 40%", scrub: SCRUB },
        },
      );
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} className="relative overflow-hidden pt-[clamp(4rem,6vw,8rem)]" aria-labelledby="tst-heading">
      <h2
        id="tst-heading"
        className="tst-heading text-giant text-center font-audiowide uppercase text-charcoal"
      >
        Shared
        <br />
        Confidence.
      </h2>

      <ul className="tst-row relative z-10 mx-auto mt-[clamp(2rem,3.3vw,4rem)] grid max-w-[1700px] grid-cols-2 gap-[clamp(0.5rem,1.25vw,1.5rem)] px-4 [perspective:1600px] md:grid-cols-4 md:px-[5.73vw]">
        {VIDEOS.map((v) => (
          <li key={v.src} className="tst-card relative aspect-[407/735] overflow-hidden [transform-style:preserve-3d]">
            <button type="button" className="group absolute inset-0" aria-label={`Play video: ${v.alt}`}>
              <Image
                src={v.src}
                alt={v.alt}
                fill
                sizes="(min-width: 768px) 22vw, 50vw"
                className="tst-img object-cover transition-transform duration-700 group-hover:scale-110"
                style={{ objectPosition: v.position }}
              />
              <span className="tst-play absolute left-1/2 top-[45%] block aspect-[54/62] w-[clamp(1.75rem,3.2vw,3.9rem)] -translate-x-1/2 -translate-y-1/2">
                <Image src="/assets/images/play-icon.svg" alt="" fill className="rotate-90 object-contain" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div aria-hidden className="tst-curve-wrap relative -mt-[clamp(3rem,13vw,16rem)] h-[clamp(6rem,24vw,29rem)]">
        <div className="tst-curve absolute left-1/2 top-0 h-[200%] w-[164vw] -translate-x-1/2 origin-bottom rounded-[50%] bg-white" />
      </div>
    </section>
  );
}
