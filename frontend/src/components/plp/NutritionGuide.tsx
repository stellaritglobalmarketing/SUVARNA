import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const GUIDE_ROWS = [
  { variety: "Mamra Almonds", origin: "Kashmir", oilContent: "40–42%", bestFor: "Soaking, daily wellness" },
  { variety: "Californian Nonpareil", origin: "California", oilContent: "50–55%", bestFor: "Baking, snacking" },
  { variety: "Gurbandi Almonds", origin: "Afghanistan", oilContent: "38–40%", bestFor: "Traditional recipes" },
  { variety: "Mamra Giri (peeled)", origin: "Kashmir", oilContent: "42–44%", bestFor: "Sweets, milk infusions" },
];

export function NutritionGuide() {
  return (
    <section className="py-16">
      <Container>
        <SectionHeading
          eyebrow="Buyer's Guide"
          title="Almond Connoisseur Compendium"
          subtitle="A quick reference for choosing the right almond variety by origin, oil content and best use — so you know exactly what you're paying for."
        />
        <div className="mt-8 overflow-x-auto rounded-2xl border border-brand-sand-dark">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-brand-sand-dark/60 text-brand-forest">
              <tr>
                <th className="px-4 py-3 font-semibold">Variety</th>
                <th className="px-4 py-3 font-semibold">Origin</th>
                <th className="px-4 py-3 font-semibold">Oil Content</th>
                <th className="px-4 py-3 font-semibold">Best For</th>
              </tr>
            </thead>
            <tbody>
              {GUIDE_ROWS.map((row, index) => (
                <tr key={row.variety} className={index % 2 === 0 ? "bg-white" : "bg-brand-sand"}>
                  <td className="px-4 py-3 font-medium text-brand-ink">{row.variety}</td>
                  <td className="px-4 py-3 text-brand-ink/70">{row.origin}</td>
                  <td className="px-4 py-3 text-brand-ink/70">{row.oilContent}</td>
                  <td className="px-4 py-3 text-brand-ink/70">{row.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
