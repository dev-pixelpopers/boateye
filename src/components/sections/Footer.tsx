"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, gatherX, SplitText, useGSAP, SCRUB } from "@/lib/gsap";
import { useFontsReady } from "@/hooks/useFontsReady";

const NAV = ["Home", "Services", "Service Areas", "Process", "About", "Contact"];
const LEGAL = [
  "Dealer Login",
  "Privacy Policy",
  "Refund Policy",
  "Shipping Policy",
  "Dealer Locations",
  "Contact Information",
];
const SOCIAL = ["Facebook", "Instagram", "YouTube", "Pinterest"];

function LinkList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item} className="ft-item overflow-hidden">
          <a href="#" className="inline-block transition-colors hover:text-signal">
            {item}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady) return;
      const q = gsap.utils.selector(root);
      const mark = SplitText.create(q(".ft-mark"), { type: "chars", mask: "chars" });

      gsap.fromTo(
        q(".ft-bg"),
        { yPercent: -18, scale: 1.2 },
        {
          yPercent: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: SCRUB },
        },
      );

      gsap
        .timeline({
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "bottom bottom", scrub: SCRUB },
        })
        .from(q(".ft-col"), { clipPath: "inset(0% 0% 100% 0%)", y: 30, stagger: 0.08, ease: "power2.out" })
        .fromTo(q(".ft-rule"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none" }, 0.2)
        .from(q(".ft-copy"), { y: 20, filter: "blur(6px)", autoAlpha: 0 }, 0.35)
        .from(
          mark.chars,
          { yPercent: 105, x: gatherX(18), stagger: { each: 0.05, from: "center" }, ease: "power3.out" },
          0.3,
        );
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <footer ref={root} className="relative isolate overflow-hidden pt-[clamp(3rem,3.8vw,4.5rem)]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="ft-bg absolute inset-0">
          <Image
            src="/assets/images/footer-night-sea.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_35%]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />
      </div>

      <div className="mx-auto grid max-w-[1130px] grid-cols-2 gap-x-6 gap-y-10 px-4 font-archivo text-[clamp(0.95rem,0.94vw,1.125rem)] font-normal leading-[1.4] text-white md:grid-cols-[1.4fr_1fr_1.3fr_auto] md:px-[5.73vw] xl:px-0">
        <div className="ft-col flex flex-col gap-10">
          <a href="tel:8134192120" className="hover:text-signal">
            Call Us Now →<br />
            813-419-2120
          </a>
          <a href="mailto:info@boateye360.com" className="hover:text-signal">
            Send Email →<br />
            info@boateye360.com
          </a>
        </div>
        <nav className="ft-col" aria-label="Site">
          <LinkList items={NAV} />
        </nav>
        <nav className="ft-col md:pt-[0.7rem]" aria-label="Legal">
          <LinkList items={LEGAL} />
        </nav>
        <nav className="ft-col md:pt-[0.7rem]" aria-label="Social">
          <LinkList items={SOCIAL} />
        </nav>
      </div>

      <svg aria-hidden className="mx-auto mt-[clamp(2.5rem,4vw,5rem)] block h-px w-[88.5vw] overflow-visible" viewBox="0 0 100 1" preserveAspectRatio="none">
        <line className="ft-rule" x1="0" y1="0.5" x2="100" y2="0.5" stroke="rgb(255 255 255 / .3)" pathLength={1} strokeDasharray="1" />
      </svg>

      <p className="ft-copy mt-6 text-center font-archivo text-[clamp(0.85rem,0.94vw,1.125rem)] font-normal text-white">
        © boateye360 — All Rights Reserved
      </p>

      <p
        aria-hidden
        className="ft-mark mt-[clamp(4rem,12vw,14rem)] text-center font-audiowide text-[clamp(3rem,10.42vw,12.5rem)] uppercase leading-[1.1] tracking-[-0.02em] text-white"
      >
        Boateye360
      </p>
    </footer>
  );
}
