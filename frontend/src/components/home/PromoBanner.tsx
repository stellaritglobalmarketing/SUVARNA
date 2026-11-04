import Image from "next/image";
import type { HomeBanner } from "@/types/home";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function PromoBanner({ banner }: { banner: HomeBanner }) {
  return (
    <section className="pb-12 sm:pb-16">
      <Container>
        <div className="grid overflow-hidden rounded-md bg-[#eee8da] sm:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
          {/* A 4:5 poster with its own headline, so the slot keeps its shape and nothing is cropped. */}
          <div className="relative aspect-[4/5]">
            <Image src={banner.imageUrl} alt={banner.imageAlt} fill sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col items-start justify-center p-7 sm:p-10">
            {banner.eyebrow && <p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-brand-walnut-dark">{banner.eyebrow}</p>}
            <h2 className="font-serif text-3xl leading-tight text-brand-forest">{banner.title}</h2>
            {banner.subtitle && <p className="mt-4 text-sm leading-relaxed text-brand-ink/65">{banner.subtitle}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              {banner.cta && <Button href={banner.cta.href}>{banner.cta.label}</Button>}
              {banner.secondaryCta && <Button href={banner.secondaryCta.href} variant="outline">{banner.secondaryCta.label}</Button>}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
