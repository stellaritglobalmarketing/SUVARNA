import type { HomeHighlight } from "@/types/home";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getHomeIcon } from "@/lib/utils/homeIcons";

export function TrustSection({ points }: { points: HomeHighlight[] }) {
  if (points.length === 0) return null;

  return (
    <section className="py-12">
      <Container>
        <SectionHeading eyebrow="Why Suvarna7" title="Farm-to-Pouch Trust Audit" align="center" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(({ icon, title, description }) => {
            const Icon = getHomeIcon(icon);
            return (
              <div key={title} className="rounded-2xl border border-brand-sand-dark bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-sand-dark text-brand-forest">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-brand-forest">{title}</h3>
                {description && <p className="mt-2 text-sm text-brand-ink/70">{description}</p>}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
