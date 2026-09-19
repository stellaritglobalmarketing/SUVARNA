import Link from "next/link";
import { Dumbbell, Droplet, HeartPulse, Scale, Zap } from "lucide-react";
import type { HealthBenefit } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const HEALTH_GOALS: { benefit: HealthBenefit; icon: typeof HeartPulse; description: string }[] = [
  { benefit: "Heart Health", icon: HeartPulse, description: "Omega-3 & MUFA-rich picks" },
  { benefit: "Keto Friendly", icon: Zap, description: "Low-carb, high-fat snacking" },
  { benefit: "Diabetic Friendly", icon: Droplet, description: "Low glycemic impact" },
  { benefit: "High Protein", icon: Dumbbell, description: "Fuel for active lifestyles" },
  { benefit: "Weight Management", icon: Scale, description: "Portion-friendly nutrition" },
];

export function ShopByHealthGoal() {
  return (
    <section className="py-12">
      <Container>
        <SectionHeading
          eyebrow="Nutrition First"
          title="Shop by Health Goal"
          subtitle="Jump straight to the range that fits how you eat."
        />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {HEALTH_GOALS.map(({ benefit, icon: Icon, description }) => (
            <Link
              key={benefit}
              href={`/products?health=${encodeURIComponent(benefit)}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-brand-sand-dark bg-white p-5 text-center transition-colors hover:border-brand-forest"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-sand-dark text-brand-forest transition-colors group-hover:bg-brand-forest group-hover:text-brand-sand">
                <Icon size={22} />
              </div>
              <span className="text-sm font-semibold text-brand-ink">{benefit}</span>
              <span className="text-xs text-brand-ink/60">{description}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
