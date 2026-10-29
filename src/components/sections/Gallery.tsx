"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, gatherX, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";

type Tab = "photos" | "videos";

type Slide = {
  /** Distance from the centre card; drives size and the fan-out direction. */
  offset: number;
  photo: { src: string; alt: string };
  video: { src: string; alt: string; position?: string };
};

const SLIDES: Slide[] = [
  {
    offset: -2,
    photo: { src: "/assets/images/gallery-1.webp", alt: "BoatEye360 camera on a T-top over a boat lift" },
    video: { src: "/assets/images/testimonial-1.webp", alt: "Boat owner sharing his experience on deck", position: "67% 50%" },
  },
  {
    offset: -1,
    photo: { src: "/assets/images/gallery-2.webp", alt: "Blue-hulled center console tied up at a private dock" },
    video: { src: "/assets/images/testimonial-2.webp", alt: "Boater talking about night navigation" },
  },
  {
    offset: 0,
    photo: { src: "/assets/images/gallery-3.webp", alt: "Installer wiring a camera inside a center-console" },
    video: { src: "/assets/images/boat-console-night.webp", alt: "Crew at a center console at dusk", position: "50% 75%" },
  },
  {
    offset: 1,
    photo: { src: "/assets/images/gallery-4.webp", alt: "Camera mounted under a light bar on a T-top" },
    video: { src: "/assets/images/testimonial-3.webp", alt: "Captain describing the camera at the helm" },
  },
  {
    offset: 2,
    photo: { src: "/assets/images/gallery-5.webp", alt: "Hardtop camera mount seen from the cockpit" },
    video: { src: "/assets/images/testimonial-4.webp", alt: "Angler standing on the dock", position: "58% 50%" },
  },
];

/** Card widths from the 1920 frame (299 / 357 / 448), doubled up on phones. */
const SIZE: Record<number, string> = {
  0: "w-[46vw] md:w-[23.33vw] aspect-[448/594]",
  1: "w-[36vw] md:w-[18.6vw] aspect-[357/474]",
  2: "w-[30vw] md:w-[15.6vw] aspect-[299/396]",
};

export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();
  const [tab, setTab] = useState<Tab>("photos");

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const heading = SplitText.create(q(".gal-heading"), { type: "chars", mask: "chars" });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: SCRUB },
      });

      tl.from(heading.chars, { yPercent: 110, x: gatherX(18), stagger: { each: 0.04, from: "center" }, duration: 0.8 }, 0)
        .fromTo(q(".gal-heading"), { filter: "blur(12px)" }, { filter: "blur(0px)", duration: 0.9 }, 0)
        .from(q(".gal-tab"), { yPercent: 120, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, 0.35)
        // Centre card irises open first…
        .fromTo(
          q(".gal-card[data-offset='0']"),
          { clipPath: "inset(50% 50% 50% 50% round 17px)" },
          { clipPath: "inset(0% 0% 0% 0% round 17px)", duration: 1, ease: "power2.inOut" },
          0.5,
        )
        .fromTo(q(".gal-card[data-offset='0'] .gal-img"), { scale: 1.45 }, { scale: 1, duration: 1.4, ease: "none" }, 0.5)
        // …then the rest deal out from behind it, fanning in 3D.
        .from(
          q(".gal-card:not([data-offset='0'])"),
          {
            xPercent: (_i: number, el: HTMLElement) => -Number(el.dataset.offset) * 85,
            rotateY: (_i: number, el: HTMLElement) => Number(el.dataset.offset) * -35,
            scale: 0.7,
            autoAlpha: 0,
            stagger: { each: 0.1, from: "center" },
            duration: 1,
            ease: "power3.inOut",
          },
          1,
        )
        // Settled row drifts in a gentle wave for the remaining scroll.
        .to(
          q(".gal-card"),
          { yPercent: (_i: number, el: HTMLElement) => -6 + Math.abs(Number(el.dataset.offset)) * 3, duration: 1, ease: "none" },
          2.1,
        );
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} id="gallery" className="relative h-[260vh]" aria-labelledby="gal-heading">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-[clamp(1.25rem,3vh,2.5rem)] overflow-hidden">
        <h2 id="gal-heading" className="gal-heading text-giant text-center font-audiowide uppercase text-charcoal">
          Gallery
        </h2>

        <div role="tablist" aria-label="Gallery media" className="flex gap-[clamp(1rem,1.4vw,1.75rem)] overflow-hidden">
          {(["photos", "videos"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className="gal-tab group font-archivo text-[clamp(0.9rem,0.94vw,1.125rem)] capitalize text-charcoal"
            >
              {/* Opacity transition lives on the label so it never fights the GSAP reveal */}
              <span
                className={`block underline-offset-4 transition-opacity group-hover:opacity-100 ${tab === t ? "underline" : "opacity-70"}`}
              >
                {t}
              </span>
            </button>
          ))}
        </div>

        <ul className="gal-row flex w-full items-end justify-center gap-[clamp(0.5rem,1.25vw,1.5rem)] [perspective:1600px]">
          {SLIDES.map((s) => {
            const d = Math.abs(s.offset);
            return (
              <li
                key={s.photo.src}
                data-offset={s.offset}
                className={`gal-card relative shrink-0 overflow-hidden rounded-[17px] ${SIZE[d]} ${d === 2 ? "max-md:hidden" : ""}`}
              >
                <div className="gal-img absolute inset-0">
                  <Image
                    src={s.photo.src}
                    alt={s.photo.alt}
                    fill
                    sizes="(min-width: 768px) 24vw, 46vw"
                    className={`object-cover transition-opacity duration-700 ${tab === "photos" ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: `${d * 80}ms` }}
                  />
                  <Image
                    src={s.video.src}
                    alt={s.video.alt}
                    fill
                    sizes="(min-width: 768px) 24vw, 46vw"
                    className={`object-cover transition-opacity duration-700 ${tab === "videos" ? "opacity-100" : "opacity-0"}`}
                    style={{ objectPosition: s.video.position ?? "50% 50%", transitionDelay: `${d * 80}ms` }}
                  />
                </div>
                {tab === "videos" && (
                  <button
                    type="button"
                    aria-label={`Play video: ${s.video.alt}`}
                    className="group absolute inset-0 grid place-items-center"
                  >
                    <span className="relative block aspect-[54/62] w-[clamp(1.5rem,2.6vw,3.2rem)] transition-transform duration-500 group-hover:scale-125">
                      <Image src="/assets/images/play-icon.svg" alt="" fill className="rotate-90 object-contain" />
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        {/* Figma ellipses 254:189 / 254:190 — canvas-coloured blurs that fade the outer cards */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[12vw] bg-gradient-to-r from-canvas via-canvas/70 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[12vw] bg-gradient-to-l from-canvas via-canvas/70 to-transparent" />
      </div>
    </section>
  );
}
