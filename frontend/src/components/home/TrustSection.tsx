import type { HomeHighlight } from "@/types/home";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function TrustSection({ points }: { points: HomeHighlight[] }) {
  if (points.length === 0) return null;
  return (
    <section id="quality" className="scroll-mt-52 py-12 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Why Suvarna7" title="Goodness begins at the source." />
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(({ title, description }, index) => (
            <div key={title} className="border-t border-brand-walnut/40 pt-5">
              <span className="text-xs text-brand-walnut-dark">0{index + 1}</span>
              <h3 className="mt-5 font-serif text-xl text-brand-forest">{title}</h3>
              {description && <p className="mt-3 text-sm leading-relaxed text-brand-ink/60">{description}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
