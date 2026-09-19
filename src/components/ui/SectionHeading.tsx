import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  viewAllHref,
  viewAllLabel = "View All",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Renders a small "View All" link on its own row below the subtitle — never squeezed inline with it. */
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-light bg-brand-forest inline-block rounded-full px-3 py-1 mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-forest">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-brand-ink/70">{subtitle}</p>}
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-forest active:opacity-70",
            align === "center" && "justify-center",
          )}
        >
          {viewAllLabel} <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}
