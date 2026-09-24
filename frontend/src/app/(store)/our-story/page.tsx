import type { Metadata } from "next";
import Image from "next/image";
import { Award, Gem, Leaf, Wheat } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Suvarna7 — Our Story",
  description:
    "How Suvarna7 sources Mongra saffron, Mamra almonds, raw honey and A2 ghee directly from farmers across Kashmir, Afghanistan and India.",
};

const VALUES = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Every jar and pouch is exactly what nature made. No additives, no adulteration.",
  },
  {
    icon: Gem,
    title: "Direct Farmer Trade",
    description: "We buy straight from orchard families and gaushalas instead of going through traders.",
  },
  {
    icon: Wheat,
    title: "Traditional Methods",
    description: "Ghee is bilona-churned, saffron is hand-picked, honey is cold-extracted. We haven't shortcut the process.",
  },
  {
    icon: Award,
    title: "No Preservatives",
    description: "Products stay fresh because of how they're sealed and stored, not because of what's added to them.",
  },
];

const ORIGINS = [
  {
    place: "Kashmir",
    products: "Mongra Saffron, Mamra Almonds, Walnuts",
    image: "/images/products/kashmiri-mongra-saffron.webp",
  },
  {
    place: "Afghanistan",
    products: "Gurbandi Almonds",
    image: "/images/products/afghani-gurbandi-almonds.webp",
  },
  {
    place: "Across India",
    products: "Raw Forest Honey, Cow & Buffalo Ghee",
    image: "/images/products/pure-cow-ghee.webp",
  },
];

export default function OurStoryPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-forest text-brand-sand">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1800&q=80"
            alt="Bowls of almonds, walnuts, saffron and ghee on a wooden table"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-forest via-brand-forest/70 to-brand-forest/30" />
        </div>
        <Container className="relative py-20 sm:py-28">
          <span className="inline-block rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
            Our Story
          </span>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">About Suvarna7</h1>
          <p className="mt-5 max-w-xl text-brand-sand/80">
            Suvarna7 sources saffron, almonds, honey, ghee and walnuts directly from farmers in Kashmir,
            Afghanistan and across India, rather than buying through traders and distributors.
          </p>
        </Container>
      </section>

      {/* Narrative */}
      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-2 grid grid-cols-2 gap-4 lg:order-1">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/images/products/kashmir-mamra-almonds.webp"
                alt="Kashmir Mamra almonds"
                fill
                sizes="(min-width: 1024px) 20vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/images/products/kashmiri-walnut-kernels.webp"
                alt="Kashmiri walnut kernels"
                fill
                sizes="(min-width: 1024px) 20vw, 45vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">How It Started</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-brand-forest sm:text-4xl">Why We Buy Direct</h2>
            <p className="mt-5 text-brand-ink/75 leading-relaxed">
              Most dry fruits sold as &ldquo;premium&rdquo; in shops pass through several traders before they
              reach a shelf. Each step adds margin and makes it harder to know where the product actually came
              from, or how it was graded.
            </p>
            <p className="mt-4 text-brand-ink/75 leading-relaxed">
              We work directly with orchard families in Kashmir, saffron growers in Pampore, almond farmers in
              the Gurbandi valley, and small gaushalas that still churn ghee using the bilona method. That
              means fewer people between the farm and your home, and a clearer answer to where each product
              comes from.
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.15em] text-brand-forest">
              Good Food. Brighter Tomorrows.
            </p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-brand-sand-dark/40 py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Standards" title="What We Stand For" align="center" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-brand-sand-dark bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-forest text-brand-sand">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-brand-forest">{title}</h3>
                <p className="mt-2 text-sm text-brand-ink/70">{description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Origins */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Origins" title="Where It Comes From" align="center" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {ORIGINS.map((origin) => (
              <div key={origin.place} className="overflow-hidden rounded-2xl border border-brand-sand-dark bg-white">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={origin.image}
                    alt={origin.place}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <p className="absolute bottom-3 left-4 font-serif text-xl font-bold text-white">{origin.place}</p>
                </div>
                <p className="p-4 text-sm text-brand-ink/70">{origin.products}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-forest sm:text-4xl">See the Full Range</h2>
          <p className="max-w-lg text-brand-ink/70">
            Every product is graded and sealed before it ships, with the source behind it.
          </p>
          <Button href="/#products" size="lg">
            Shop Our Products
          </Button>
        </Container>
      </section>
    </div>
  );
}
