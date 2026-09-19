import type { ManifestItem } from "@/types/order";
import { formatInr } from "@/lib/utils/format";

export function ManifestList({ manifest }: { manifest: ManifestItem[] }) {
  const total = manifest.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="rounded-2xl border border-brand-sand-dark bg-white p-5">
      <h3 className="font-serif text-lg font-semibold text-brand-forest">Manifest Itemization</h3>
      <ul className="mt-3 divide-y divide-brand-sand-dark">
        {manifest.map((item) => (
          <li key={`${item.productName}-${item.variant}`} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <p className="font-medium text-brand-ink">{item.productName}</p>
              <p className="text-xs text-brand-ink/60">
                {item.variant} × {item.quantity}
              </p>
            </div>
            <span className="font-semibold text-brand-ink">{formatInr(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between border-t border-brand-sand-dark pt-3 text-sm font-semibold">
        <span>Total</span>
        <span className="text-brand-forest">{formatInr(total)}</span>
      </div>
    </div>
  );
}
