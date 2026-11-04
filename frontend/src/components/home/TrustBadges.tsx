import { ShieldCheck, Sprout, FlaskConical } from "lucide-react";
import { Container } from "@/components/ui/Container";

// Each badge breaks into two lines on phones, where three have to share one row.
const BADGES = [
  { icon: Sprout, lines: ["Own farm", "in Pampore"] },
  { icon: FlaskConical, lines: ["Tested by", "IIKSTC"] },
  { icon: ShieldCheck, lines: ["FSSAI Lic.", "10726994001139"] },
];

/** The three proofs of origin and quality, kept just under the hero so they're seen before the products. */
export function TrustBadges() {
  return (
    <section className="pt-3 sm:pt-5" aria-label="Our quality promise">
      <Container>
        <ul className="grid grid-cols-3 divide-x divide-brand-sand-dark">
          {BADGES.map(({ icon: Icon, lines }) => (
            <li key={lines[0]} className="flex flex-col items-center gap-1 px-1 text-center sm:flex-row sm:justify-center sm:gap-2">
              <Icon size={16} className="shrink-0 text-brand-walnut-dark" aria-hidden="true" />
              <span className="text-[10.5px] font-medium leading-tight text-brand-ink/75 sm:text-sm">
                {lines[0]} <span className="block sm:inline">{lines[1]}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
