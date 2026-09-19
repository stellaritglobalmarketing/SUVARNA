import type { LipidBreakdownItem } from "@/types/product";

export function NutrientDonut({ items }: { items: LipidBreakdownItem[] }) {
  const { stops } = items.reduce<{ stops: string[]; cumulative: number }>(
    (acc, item) => {
      const start = acc.cumulative;
      const end = start + item.percent;
      return { stops: [...acc.stops, `${item.color} ${start}% ${end}%`], cumulative: end };
    },
    { stops: [], cumulative: 0 },
  );
  const gradient = stops.join(", ");

  return (
    <div className="flex items-center gap-6">
      <div
        role="img"
        aria-label={`Lipid breakdown: ${items.map((item) => `${item.label} ${item.percent}%`).join(", ")}`}
        className="relative h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white text-center">
          <span className="text-xs font-semibold text-brand-forest">Lipid
            <br />
            Profile
          </span>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden="true" />
            <span className="text-brand-ink/80">{item.label}</span>
            <span className="font-semibold text-brand-ink">{item.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
