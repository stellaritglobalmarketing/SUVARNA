import Image from "next/image";
import type { HomeBanner, HomeHighlight } from "@/types/home";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getHomeIcon } from "@/lib/utils/homeIcons";

export function Hero({ banner, highlights }: { banner: HomeBanner; highlights: HomeHighlight[] }) {
  return (
    <section className="relative hidden overflow-hidden bg-brand-forest text-brand-sand lg:block">
      {/* Full-bleed product photo shown in its own colors. The only shading is a fade behind
          the text column on the left, so the product line-up on the right stays clear. */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-hero-zoom absolute inset-0">
          <Image src={banner.imageUrl} alt={banner.imageAlt} fill priority sizes="100vw" className="object-cover object-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-forest/85 from-20% via-brand-forest/45 via-45% to-transparent to-65%" />
      </div>
      {/* Seam into the cream section below instead of a hard color cut */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
      <Container className="relative flex min-h-[560px] flex-col justify-center py-14 sm:py-20 lg:min-h-[640px]">
        <div className="flex max-w-2xl flex-col items-start gap-5">
          {banner.eyebrow && (
            <span className="animate-fade-up rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
              {banner.eyebrow}
            </span>
          )}
          <div className="animate-fade-up h-1 w-14 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-light [animation-delay:60ms]" />
          <h1 className="animate-fade-up max-w-xl font-serif text-4xl font-bold leading-tight [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-[3.25rem] [animation-delay:120ms]">
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p className="animate-fade-up max-w-lg text-brand-sand/80 [animation-delay:240ms]">{banner.subtitle}</p>
          )}
          <div className="animate-fade-up flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap [animation-delay:360ms]">
            {banner.cta && (
              <Button href={banner.cta.href} variant="secondary" size="lg" className="w-full sm:w-auto">
                {banner.cta.label}
              </Button>
            )}
            {banner.secondaryCta && (
              <Button
                href={banner.secondaryCta.href}
                variant="outline"
                size="lg"
                className="w-full border-brand-sand text-brand-sand hover:bg-brand-sand hover:text-brand-forest sm:w-auto"
              >
                {banner.secondaryCta.label}
              </Button>
            )}
          </div>

          <div className="animate-fade-up mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6 [animation-delay:480ms]">
            {highlights.map(({ icon, title, description }) => {
              const Icon = getHomeIcon(icon);
              return (
                <div key={title} className="flex items-start gap-2.5 text-sm text-brand-sand/90">
                  <Icon size={18} className="mt-0.5 shrink-0 text-brand-gold-light" />
                  <span>
                    <span className="block font-medium">{title}</span>
                    {description && <span className="block text-xs text-brand-sand/60">{description}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
