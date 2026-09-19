import { cn } from "@/lib/utils/cn";

export function Chip({
  active = false,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
        active
          ? "border-brand-forest bg-brand-forest text-brand-sand"
          : "border-brand-sand-dark bg-white text-brand-ink hover:border-brand-forest",
        className,
      )}
    >
      {children}
    </button>
  );
}
