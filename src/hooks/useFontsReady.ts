"use client";

import { useEffect, useState } from "react";

/**
 * Returns 0 until the web fonts have loaded, then a key that bumps whenever the
 * viewport width settles on a new value. Use it as a `useGSAP` dependency so
 * SplitText re-measures lines with the real Audiowide/Archivo glyphs and
 * re-splits after a resize, instead of animating stale line breaks.
 */
export function useFontsReady() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let width = window.innerWidth;

    document.fonts.ready.then(() => {
      if (alive) setKey(1);
    });

    // Height-only changes (mobile URL bar) never alter line breaks.
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (window.innerWidth === width) return;
        width = window.innerWidth;
        setKey((k) => (k ? k + 1 : k));
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return key;
}
