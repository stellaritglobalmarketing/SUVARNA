import type { Metadata } from "next";
import Image from "next/image";
import { Award, Gem, Leaf, Sparkles, Wheat } from "lucide-react";
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
    description: "No additives, no adulteration, no shortcuts — every jar and pouch is exactly what nature made.",
  },
  {
    icon: Gem,
    title: "Direct Farmer Trade",
    description: "We buy straight from orchard families and gaushalas, so quality — and fairness — never gets diluted.",
  },
  {
    icon: Wheat,
    title: "Traditional Methods",
    description: "Bilona-churned ghee, hand-picked Mongra saffron, cold-extracted honey — made the way it always should be.",
  },
  {
    icon: Award,
    title: "No Preservatives",
    description: "Nothing to mask a shortcut, because there aren't any. Just pure, honest food.",
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
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 85% 10%, #eab54a 0%, transparent 45%)" }}
        />
        <Container className="relative py-20 sm:py-28">
          <span className="inline-block rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
            Our Story
          </span>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Pure Indian Goodness, From Source to Home
          </h1>
          <p className="mt-5 max-w-xl text-brand-sand/80">
            Suvarna7 began with a simple frustration — that &ldquo;premium&rdquo; dry fruits on shelves rarely
            matched what families actually grow in Kashmir, Afghanistan and across India. So we cut out the
            middlemen and went straight to the source.
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
            <h2 className="mt-3 font-serif text-3xl font-bold text-brand-forest sm:text-4xl">
              A Family Habit, Turned Into a Promise
            </h2>
            <p className="mt-5 text-brand-ink/75 leading-relaxed">
              Long before Suvarna7 was a brand, it was a habit — soaking Mamra almonds overnight, finishing a
              meal with a spoon of A2 ghee, watching a few threads of real Mongra saffron bloom in warm milk.
              We noticed how hard it had become to find any of that without wading through vague labels and
              inflated &ldquo;premium&rdquo; pricing.
            </p>
            <p className="mt-4 text-brand-ink/75 leading-relaxed">
              So we built direct relationships with orchard families in Kashmir, saffron growers in Pampore,
              almond farmers across the Gurbandi valley, and small gaushalas still churning ghee the bilona
              way. What started as sourcing for our own kitchen is now Suvarna7 — the same standard, just at a
              scale we can share.
            </p>
            <p className="mt-6 font-serif text-xl italic text-brand-forest">&ldquo;Good Food. Brighter Tomorrows.&rdquo;</p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-brand-sand-dark/40 py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="What We Stand For" title="No Shortcuts, No Middlemen" align="center" />
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
          <SectionHeading eyebrow="Sourced, Not Assembled" title="Where It Comes From" align="center" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {ORIGINS.map((origin) => (
              <div key={origin.place} className="group overflow-hidden rounded-2xl border border-brand-sand-dark bg-white">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={origin.image}
                    alt={origin.place}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
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

      {/* Mission statement */}
      <section className="bg-brand-forest py-16 text-brand-sand sm:py-24">
        <Container className="text-center">
          <Sparkles className="mx-auto text-brand-gold-light" size={28} />
          <p className="mx-auto mt-6 max-w-3xl font-serif text-2xl italic leading-relaxed sm:text-3xl">
            &ldquo;We don&apos;t sell dry fruits, honey and ghee. We deliver exactly what a farmer, a beekeeper
            or a gaushala family would put on their own table — nothing added, nothing hidden.&rdquo;
          </p>
          <p className="mt-6 text-sm uppercase tracking-[0.2em] text-brand-gold-light">Team Suvarna7</p>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-forest sm:text-4xl">Taste the Difference, Yourself</h2>
          <p className="max-w-lg text-brand-ink/70">
            Every product on Suvarna7 is graded, tested and sealed the same way we&apos;d want for our own family.
          </p>
          <Button href="/#products" size="lg">
            Shop Our Products
          </Button>
        </Container>
      </section>
    </div>
  );
}
