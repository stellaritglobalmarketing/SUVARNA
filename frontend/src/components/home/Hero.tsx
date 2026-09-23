import Image from "next/image";
import { ShieldCheck, Sprout, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const VALUE_PROPS = [
  { icon: Sprout, label: "100% Grade-A", sublabel: "Kashmiri & Afghani Harvest" },
  { icon: ShieldCheck, label: "Chemical-Free", sublabel: "Farm-to-Pouch Sourcing" },
  { icon: Truck, label: "Nitrogen-Sealed Freshness", sublabel: "Pan-India Delivery" },
];

export function Hero() {
  return (
    <section className="relative hidden overflow-hidden bg-brand-forest text-brand-sand lg:block">
      {/* Full-bleed backdrop photo, blended into the forest green as a duotone so it reads
          as one designed image rather than a washed-out photo fighting the brand color. */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="animate-hero-zoom absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1800&q=80"
            alt="Bowls of almonds, walnuts, saffron and ghee on a wooden table"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80 mix-blend-luminosity"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-forest via-brand-forest/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-forest via-transparent to-brand-forest/20" />
      </div>
      <div
        className="animate-glow-pulse pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 85% 15%, #eab54a 0%, transparent 45%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 130%, rgba(0,0,0,0.45) 0%, transparent 60%)" }}
      />
      {/* Seam into the cream section below instead of a hard color cut */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-background" />
      <Container className="relative flex min-h-[560px] flex-col justify-center py-14 sm:py-20 lg:min-h-[640px]">
        <div className="flex max-w-2xl flex-col items-start gap-5">
          <span className="animate-fade-up rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
            Premium By Nature
          </span>
          <div className="animate-fade-up h-1 w-14 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-light [animation-delay:60ms]" />
          <h1 className="animate-fade-up max-w-xl font-serif text-4xl font-bold leading-tight [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-[3.25rem] [animation-delay:120ms]">
            Artisanal Dry Fruits, Sourced Straight From The Orchard
          </h1>
          <p className="animate-fade-up max-w-lg text-brand-sand/80 [animation-delay:240ms]">
            Suvarna7 brings you Mamra almonds, Mongra saffron, pure ghee and more — graded, tested and
            nitrogen-sealed for freshness, delivered across India.
          </p>
          <div className="animate-fade-up flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap [animation-delay:360ms]">
            <Button href="/#products" variant="secondary" size="lg" className="w-full sm:w-auto">
              Shop Now
            </Button>
            <Button
              href="/our-story"
              variant="outline"
              size="lg"
              className="w-full border-brand-sand text-brand-sand hover:bg-brand-sand hover:text-brand-forest sm:w-auto"
            >
              Our Story
            </Button>
          </div>

          <div className="animate-fade-up mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6 [animation-delay:480ms]">
            {VALUE_PROPS.map(({ icon: Icon, label, sublabel }) => (
              <div key={label} className="flex items-start gap-2.5 text-sm text-brand-sand/90">
                <Icon size={18} className="mt-0.5 shrink-0 text-brand-gold-light" />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="block text-xs text-brand-sand/60">{sublabel}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
