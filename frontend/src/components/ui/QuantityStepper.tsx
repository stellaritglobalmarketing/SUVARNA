import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = 20,
}: {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-brand-sand-dark bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full text-brand-forest disabled:opacity-30 cursor-pointer"
      >
        <Minus size={14} />
      </button>
      <span className="w-6 text-center text-sm font-medium tabular-nums">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        aria-label="Increase quantity"
        className="flex h-8 w-8 items-center justify-center rounded-full text-brand-forest disabled:opacity-30 cursor-pointer"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
