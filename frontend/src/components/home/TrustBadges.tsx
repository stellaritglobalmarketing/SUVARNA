import type { HomeHighlight } from "@/types/home";
import { Container } from "@/components/ui/Container";
import { getHomeIcon } from "@/lib/utils/homeIcons";

/** Compact trust strip, mobile only — desktop already covers this in the richer TrustSection lower down. */
export function TrustBadges({ badges }: { badges: HomeHighlight[] }) {
  if (badges.length === 0) return null;

  return (
    <section className="py-3 md:hidden">
      <Container>
        <div className="grid grid-cols-4 gap-2">
          {badges.map(({ icon, title }) => {
            const Icon = getHomeIcon(icon);
            return (
              <div key={title} className="flex flex-col items-center gap-1.5 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-sand-dark text-brand-forest">
                  <Icon size={17} />
                </span>
                <span className="text-[10px] font-medium leading-tight text-brand-ink/80">{title}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
