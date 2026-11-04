import Image from "next/image";
import Link from "next/link";
import type { HomeBanner } from "@/types/home";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const SEAL_TEXT = "PURE · TRADITIONAL · NATURAL · ";
const SEAL_RADIUS = 44;

/** Slowly turning gold seal with the poster's own three words. Decorative, and still for reduced-motion users (globals.css). */
function Seal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="#fffdf8" stroke="#d9a441" strokeWidth="1" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="#d9a441" strokeWidth=".75" />
      <text x="60" y="73" textAnchor="middle" className="font-serif" fontSize="38" fill="#a0641f">
        7
      </text>
      <g className="promo-seal-text">
        <path id="promo-seal-path" fill="none" d={`M60 ${60 - SEAL_RADIUS} a${SEAL_RADIUS} ${SEAL_RADIUS} 0 1 1 -.01 0`} />
        <text fontSize="10" fontWeight="600" fill="#a0641f" textLength={2 * Math.PI * SEAL_RADIUS - 2}>
          <textPath href="#promo-seal-path">{SEAL_TEXT}</textPath>
        </text>
      </g>
    </svg>
  );
}

/**
 * A plain tan band between the product grid and the gift section. The poster stands in the arch from the product
 * labels and breaks out of the band's top edge; the text is the banner's own, from Admin → Content.
 */
export function PromoBanner({ banner }: { banner: HomeBanner }) {
  const poster = (
    <span className="promo-arch relative block aspect-[4/5] overflow-hidden">
      <Image src={banner.imageUrl} alt={banner.imageAlt} fill sizes="(min-width: 1024px) 420px, (min-width: 768px) 300px, 300px" className="object-cover" />
    </span>
  );

  return (
    <section className="pt-14 md:pt-20">
      <div className="promo-band relative">
        <Container>
          <div className="grid items-center gap-8 pb-10 md:grid-cols-[minmax(0,1fr)_320px] md:gap-10 md:pb-14 lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-2">
            {/* Top padding matches the band's bottom padding, so the text sits at the band's true middle. */}
            <div className="relative order-2 flex flex-col items-center text-center md:order-1 md:items-start md:pt-14 md:text-left">
              {banner.eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-forest lg:text-xs">{banner.eyebrow}</p>
              )}
              <h2 className="mt-4 text-balance font-serif text-[32px] leading-[1.1] text-brand-forest md:text-5xl lg:mt-6 lg:text-[64px]">{banner.title}</h2>
              {banner.subtitle && <p className="mt-4 text-sm leading-relaxed text-brand-ink/65">{banner.subtitle}</p>}
              <div className="mt-6 flex flex-wrap justify-center gap-3 lg:mt-9">
                {banner.cta && (
                  <Button href={banner.cta.href} size="lg">
                    {banner.cta.label}
                  </Button>
                )}
                {banner.secondaryCta && (
                  <Button href={banner.secondaryCta.href} variant="outline" size="lg">
                    {banner.secondaryCta.label}
                  </Button>
                )}
              </div>
            </div>

            <div className="relative order-1 mx-auto -mt-14 w-[78%] max-w-[320px] md:order-2 md:-mt-20 md:w-full md:max-w-none xl:w-[440px]">
              <div className="promo-arch-frame">
                {banner.cta ? (
                  <Link href={banner.cta.href} className="block transition-transform duration-500 hover:-translate-y-1">
                    {poster}
                  </Link>
                ) : (
                  poster
                )}
              </div>
              <Seal className="pointer-events-none absolute -right-5 top-3 w-16 md:-right-6 md:top-5 md:w-20 lg:w-24" />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
