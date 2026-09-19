import Image from "next/image";
import { ShieldCheck, Sprout, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const VALUE_PROPS = [
  { icon: Sprout, label: "100% Grade-A", sublabel: "Kashmiri & Californian Harvest" },
  { icon: ShieldCheck, label: "Chemical-Free", sublabel: "Farm-to-Pouch Sourcing" },
  { icon: Truck, label: "Nitrogen-Sealed Freshness", sublabel: "Pan-India Delivery" },
];

export function Hero() {
  return (
    <section className="relative hidden overflow-hidden bg-brand-forest text-brand-sand lg:block">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(circle at 80% 20%, #c9a227 0%, transparent 55%)" }}
      />
      <Container className="relative grid grid-cols-1 items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
            Premium By Nature
          </span>
          <h1 className="max-w-xl font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-[3.25rem]">
            Artisanal Dry Fruits, Sourced Straight From The Orchard
          </h1>
          <p className="max-w-lg text-brand-sand/80">
            Harvesta brings you Mamra almonds, King cashews, Medjool dates and more — graded, tested and
            nitrogen-sealed for freshness, delivered across India.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href="/products" variant="secondary" size="lg" className="w-full sm:w-auto">
              Shop Best Sellers
            </Button>
            <Button
              href="/products?category=Almonds"
              variant="outline"
              size="lg"
              className="w-full border-brand-sand text-brand-sand hover:bg-brand-sand hover:text-brand-forest sm:w-auto"
            >
              Explore Almonds
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
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

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-square">
          <Image
            src="https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1400&q=80"
            alt="Bowls of almonds, cashews, walnuts and dates on a wooden table"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 90vw"
            className="object-cover"
          />
          <span className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1.5 font-serif text-xs italic text-white backdrop-blur">
            Goodness from Nature to You
          </span>
        </div>
      </Container>
    </section>
  );
}
