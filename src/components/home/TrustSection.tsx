import { BadgeCheck, Leaf, PackageCheck, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TRUST_POINTS = [
  {
    icon: Leaf,
    title: "Direct Farmer Sourcing",
    description: "We buy directly from orchard families in Kashmir, Afghanistan, Iran and California — no middlemen.",
  },
  {
    icon: BadgeCheck,
    title: "Lab-Tested Quality",
    description: "Every batch is graded for oil content, moisture and purity before it reaches your pouch.",
  },
  {
    icon: PackageCheck,
    title: "Nitrogen-Sealed Freshness",
    description: "Nitrogen-flushed packaging locks in freshness for up to 6 months after opening.",
  },
  {
    icon: Users,
    title: "40,000+ Happy Households",
    description: "Verified reviews from customers across 200+ Indian cities keep us accountable.",
  },
];

export function TrustSection() {
  return (
    <section className="py-12">
      <Container>
        <SectionHeading eyebrow="Why Suvarna7" title="Farm-to-Pouch Trust Audit" align="center" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-brand-sand-dark bg-white p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-sand-dark text-brand-forest">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 font-semibold text-brand-forest">{title}</h3>
              <p className="mt-2 text-sm text-brand-ink/70">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
