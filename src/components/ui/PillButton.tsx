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
 * Outline pill CTA from the Figma file. The border is an SVG rect normalised
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

  const stroke = tone === "light" ? "#ffffff" : "#000000";
  const text =
    tone === "light"
      ? "text-white hover:text-ink"
      : "text-black hover:text-white";
  const fill = tone === "light" ? "bg-white" : "bg-black";

  return (
    <a
      ref={ref}
      href={href}
      className={`pill group relative inline-flex items-center justify-center overflow-hidden rounded-full px-[clamp(1.25rem,1.93vw,2.3rem)] py-[clamp(0.8rem,1vw,1.2rem)] font-audiowide text-[clamp(0.9rem,1.25vw,1.5rem)] leading-[0.94] whitespace-nowrap transition-colors duration-500 ${text} ${uppercase ? "uppercase" : ""} ${className}`}
    >
      <span
        aria-hidden
        className={`absolute inset-0 origin-bottom scale-y-0 rounded-full transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:scale-y-100 ${fill}`}
      />
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
      <span className="pill-label relative">{children}</span>
    </a>
  );
}
