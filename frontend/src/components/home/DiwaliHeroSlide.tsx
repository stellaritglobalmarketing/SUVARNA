import Image from "next/image";
import { diwaliOrderCountdown } from "@/lib/diwali";
import { Burst, Diya, Embers, Rangoli } from "./DiwaliDecor";

const BOX = { width: 1536, height: 1024 };

/**
 * The hero's Diwali slide (it sits inside the slide's link to the hamper section): "Happy Diwali", the three
 * gift boxes fanned out, a countdown to the order-by date, diyas, rising sparks and fireworks. Drawn in HTML,
 * not artwork, so the countdown stays live.
 */
export function DiwaliHeroSlide({ now }: { now: number }) {
  const countdown = diwaliOrderCountdown(now);
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
        {/* Phones: one box. Larger screens: all three, fanned out. */}
        <div className="absolute right-3 top-1/2 w-[94%] -translate-y-1/2 sm:hidden">
          <Image src="/images/hampers/heritage-diwali-gift-hamper.webp" {...BOX} alt="" sizes="40vw" className="diwali-float rounded-lg border border-[#f3c969]/60 shadow-xl" />
        </div>
        <div className="absolute left-[4%] top-[14%] hidden w-[48%] -rotate-[8deg] sm:block">
          <Image src="/images/hampers/deepam-diwali-gift-box.webp" {...BOX} alt="" sizes="25vw" className="diwali-float rounded-xl border-2 border-[#f3c969]/60 shadow-2xl" style={{ animationDelay: "-1.2s" }} />
        </div>
        <div className="absolute right-[4%] top-[14%] hidden w-[48%] rotate-[8deg] sm:block">
          <Image src="/images/hampers/utsav-diwali-dry-fruit-hamper.webp" {...BOX} alt="" sizes="25vw" className="diwali-float rounded-xl border-2 border-[#f3c969]/60 shadow-2xl" style={{ animationDelay: "-2.4s" }} />
        </div>
        <div className="absolute left-1/2 top-[34%] z-10 hidden w-[56%] -translate-x-1/2 sm:block">
          <Image src="/images/hampers/heritage-diwali-gift-hamper.webp" {...BOX} alt="" sizes="30vw" className="diwali-float rounded-xl border-2 border-[#f3c969]/80 shadow-2xl" />
        </div>
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
