import { cn } from "@/lib/utils/cn";

type Tone = "gold" | "forest" | "walnut" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  gold: "bg-brand-gold text-brand-ink",
  forest: "bg-brand-forest text-brand-sand",
  walnut: "bg-brand-walnut text-brand-ink",
  danger: "bg-red-600 text-white",
  neutral: "bg-brand-sand-dark text-brand-ink",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
