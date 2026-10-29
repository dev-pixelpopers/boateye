/**
 * BoatEye360 lockup. The updated Figma file ships the mark as a full-colour
 * image and keeps the wordmark as an alpha mask, now filled with charcoal.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="/" aria-label="BoatEye360 home" className={`flex items-center gap-[0.55em] text-[clamp(0.85rem,1.04vw,1.25rem)] ${className}`}>
      <span
        aria-hidden
        className="block aspect-[66/69] w-[3.3em] rounded-full bg-[url(/assets/images/logo-mark.webp)] bg-contain bg-no-repeat"
      />
      <span
        aria-hidden
        className="block aspect-[154/19] w-[7.7em] bg-charcoal [mask-image:url(/assets/images/logo-wordmark-mask.png)] [mask-size:contain] [mask-repeat:no-repeat]"
      />
    </a>
  );
}
