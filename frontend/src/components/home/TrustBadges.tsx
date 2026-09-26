import type { HomeHighlight } from "@/types/home";
import { Container } from "@/components/ui/Container";

export function TrustBadges({ badges }: { badges: HomeHighlight[] }) {
  if (badges.length === 0) return null;
  return (
    <section className="border-y border-brand-sand-dark bg-white py-4">
      <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {badges.map(({ title }) => <span key={title} className="text-center text-[10px] font-medium uppercase tracking-[0.12em] text-brand-ink/65 sm:text-xs">{title}</span>)}
      </Container>
    </section>
  );
}
