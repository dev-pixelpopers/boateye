"use client";

import { useLayoutEffect, useRef, useState } from "react";

type PillButtonProps = {
  children: React.ReactNode;
  href?: string;
  tone?: "light" | "dark";
  uppercase?: boolean;
  className?: string;
};

/**
 * Filled crimson pill CTA from the Figma file. `tone` names the surface the
 * pill sits on: "light" pages get a crimson keyline, "dark" panels a white one.
 * The border is an SVG rect normalised
 * with pathLength=1 so any parent timeline can "draw" it by tweening
 * `.pill-stroke` strokeDashoffset from 1 → 0.
 */
export function PillButton({
  children,
  href = "#",
  tone = "light",
  uppercase = false,
  className = "",
}: PillButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [radius, setRadius] = useState(30);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setRadius(el.offsetHeight / 2));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stroke = tone === "light" ? "var(--crimson)" : "#ffffff";
  const text = tone === "light" ? "text-white" : "text-white hover:text-charcoal";
  const fill = tone === "light" ? "bg-charcoal" : "bg-white";

  return (
    <a
      ref={ref}
      href={href}
      className={`pill group relative inline-flex items-center justify-center overflow-hidden rounded-full px-[clamp(1.25rem,1.93vw,2.3rem)] py-[clamp(0.8rem,1vw,1.2rem)] font-audiowide text-[clamp(0.9rem,1.25vw,1.5rem)] leading-[0.94] whitespace-nowrap transition-colors duration-500 ${text} ${uppercase ? "uppercase" : ""} ${className}`}
    >
      {/* Invisible copy sizes the pill; the visible label layer is absolute. */}
      <span aria-hidden className="invisible">
        {children}
      </span>
      {/* The crimson fill lives on `.pill-label`, so timelines that reveal the
          label bring the fill in with the text instead of an empty pill. */}
      <span className="pill-label absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-crimson">
        <span
          aria-hidden
          className={`absolute inset-0 origin-bottom scale-y-0 rounded-full transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:scale-y-100 ${fill}`}
        />
        <span className="relative">{children}</span>
      </span>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <rect
          className="pill-stroke"
          x="0.5"
          y="0.5"
          width="100%"
          height="100%"
          rx={radius}
          ry={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="1"
          pathLength={1}
          style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }}
        />
      </svg>
    </a>
  );
}
