/**
 * BoatEye360 lockup. Figma ships the mark and wordmark as alpha masks over a
 * white fill, so we reproduce that exactly with CSS masks.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#" aria-label="BoatEye360 home" className={`flex items-center gap-[0.55em] text-[clamp(0.85rem,1.04vw,1.25rem)] ${className}`}>
      <span
        aria-hidden
        className="block aspect-[71/69] w-[3.55em] bg-white [mask-image:url(/assets/images/logo-mark-mask.png)] [mask-size:contain] [mask-repeat:no-repeat]"
      />
      <span
        aria-hidden
        className="block aspect-[154/19] w-[7.7em] bg-white [mask-image:url(/assets/images/logo-wordmark-mask.png)] [mask-size:contain] [mask-repeat:no-repeat]"
      />
    </a>
  );
}
