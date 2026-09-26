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
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-walnut-dark">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-brand-forest">{title}</h2>
      {subtitle && <p className={cn("mt-3 max-w-2xl text-sm leading-relaxed text-brand-ink/60", align === "center" && "mx-auto")}>{subtitle}</p>}
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
