import type { NutrientInfo } from "@/types/product";

export function NutrientTable({ nutrients }: { nutrients: NutrientInfo[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-sand-dark">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-sand-dark/60 text-brand-forest">
          <tr>
            <th className="px-4 py-3 font-semibold">Nutrient</th>
            <th className="px-4 py-3 font-semibold">Per 100g</th>
            <th className="px-4 py-3 font-semibold">% Daily Value</th>
          </tr>
        </thead>
        <tbody>
          {nutrients.map((nutrient, index) => (
            <tr key={nutrient.label} className={index % 2 === 0 ? "bg-white" : "bg-brand-sand"}>
              <td className="px-4 py-3 font-medium text-brand-ink">{nutrient.label}</td>
              <td className="px-4 py-3 text-brand-ink/70">{nutrient.valuePer100g}</td>
              <td className="px-4 py-3 text-brand-ink/70">
                {nutrient.dailyValuePercent != null ? (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-brand-sand-dark">
                      <div
                        className="h-full rounded-full bg-brand-gold"
                        style={{ width: `${Math.min(100, nutrient.dailyValuePercent)}%` }}
                      />
                    </div>
                    <span>{nutrient.dailyValuePercent}%</span>
                  </div>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
