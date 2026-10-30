import Image from "next/image";
import { diwaliOrderCountdown } from "@/lib/diwali";
import { Burst, Diya, Embers, Rangoli } from "./DiwaliDecor";

/** One gift box photo in a tall gold-edged frame, gently floating. Positioned by `className`. */
function GiftPhoto({ src, sizes, wait = 0, className }: { src: string; sizes: string; wait?: number; className: string }) {
  return (
    <div className={`absolute aspect-[2/3] ${className}`}>
      <div className="diwali-float relative h-full w-full overflow-hidden rounded-xl border-2 border-[#f3c969]/70 shadow-2xl" style={{ animationDelay: `-${wait}s` }}>
        <Image src={src} alt="" fill sizes={sizes} className="object-cover" />
      </div>
    </div>
  );
}

/**
 * The hero's Diwali slide (it sits inside the slide's link to the hamper section): "Happy Diwali", the gift
 * boxes' photos (`photos`, from Admin → Products, in hamper order) fanned out, a countdown to the order-by date, diyas, rising sparks and fireworks. Drawn in HTML,
 * not artwork, so the countdown stays live.
 */
export function DiwaliHeroSlide({ now, photos }: { now: number; photos: string[] }) {
  const countdown = diwaliOrderCountdown(now);
  // The last box (the premium one) sits in front; the others fan out behind it.
  const front = photos[photos.length - 1];
  const left = photos[0];
  const right = photos[1] ?? photos[0];
  return (
    <div className="diwali-anim diwali-slide relative h-full w-full overflow-hidden">
      <Rangoli className="absolute -right-[12%] top-1/2 aspect-square h-[150%] -translate-y-1/2 text-[#f3c969] opacity-[0.13]" />
      <Embers className="[--rise:180px] sm:[--rise:320px] lg:[--rise:560px]" />
      <Burst colour="#ffd25e" wait={0} className="left-[44%] top-[16%] hidden [--burst:42px] sm:block lg:[--burst:70px]" />
      <Burst colour="#ff8a65" wait={1.8} className="left-[92%] top-[12%] hidden [--burst:36px] sm:block lg:[--burst:58px]" />
      <Burst colour="#ffe9a8" wait={3} className="left-[30%] top-[78%] hidden [--burst:30px] lg:block lg:[--burst:50px]" />

      <div className="relative z-10 flex h-full w-[58%] flex-col items-start justify-center gap-1.5 pl-4 sm:w-1/2 sm:gap-3 sm:pl-10 lg:gap-4 lg:pl-20">
        <p className="hidden text-xs font-semibold uppercase tracking-[0.32em] text-[#f3c969] sm:block lg:text-sm">✦ Shubh Deepavali ✦</p>
        <p className="diwali-title font-serif text-[28px] font-semibold leading-none sm:text-5xl lg:text-7xl">Happy Diwali</p>
        <p className="text-[11px] font-medium text-[#f7e7c6] sm:hidden">Diwali Hampers from ₹999</p>
        <p className="hidden max-w-md text-sm leading-relaxed text-[#f7e7c6]/85 sm:block lg:text-lg">
          Gift a little light of Kashmir: kesar from our own farm, with the finest dry fruits, honey and ghee. Hampers from ₹999.
        </p>
        {countdown && (
          <p className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f3c969]/40 bg-black/20 px-2 py-0.5 text-[9px] text-[#f7e7c6] sm:px-3 sm:py-1 sm:text-xs lg:text-sm">
            <span className="diwali-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffb347]" />
            <span>
              Order in <strong className="font-semibold tabular-nums text-[#ffd25e]">{countdown}</strong>
              <span className="hidden sm:inline"> for Diwali delivery</span>
            </span>
          </p>
        )}
        <span className="mt-0.5 rounded-full bg-gradient-to-r from-[#f6d27a] via-[#ffe7a3] to-[#e9a93a] px-3 py-1 text-[10px] font-semibold text-[#3a0d0f] shadow-[0_0_24px_rgba(255,200,90,.35)] sm:mt-1 sm:px-5 sm:py-2.5 sm:text-sm lg:text-base">
          Shop Diwali Hampers →
        </span>
      </div>

      <div className="absolute inset-y-0 right-0 w-[42%] sm:w-1/2">
        {/* Phones: the front box. Larger screens: all three, fanned out, in tall frames like the gift bag photos. */}
        <GiftPhoto src={front} sizes="30vw" className="right-4 top-1/2 h-[84%] -translate-y-1/2 sm:hidden" />
        <GiftPhoto src={left} sizes="20vw" wait={1.2} className="left-[6%] top-[16%] hidden w-[34%] -rotate-[7deg] sm:block" />
        <GiftPhoto src={right} sizes="20vw" wait={2.4} className="right-[6%] top-[16%] hidden w-[34%] rotate-[7deg] sm:block" />
        <GiftPhoto src={front} sizes="25vw" className="left-1/2 top-[8%] z-10 hidden w-[40%] -translate-x-1/2 sm:block" />
      </div>

      <div className="absolute bottom-2 left-10 hidden gap-2 sm:flex lg:bottom-6 lg:left-20 lg:gap-4">
        {[0, 0.4, 0.9].map((wait) => (
          <Diya key={wait} wait={wait} className="w-8 lg:w-14" />
        ))}
      </div>
      <div className="absolute bottom-2 right-8 hidden gap-2 sm:flex lg:bottom-6 lg:right-16 lg:gap-4">
        {[0.2, 0.7, 1.1].map((wait) => (
          <Diya key={wait} wait={wait} className="w-8 lg:w-14" />
        ))}
      </div>
    </div>
  );
}
