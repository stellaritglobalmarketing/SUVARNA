import Link from "next/link";
import type { CategoryDisplay } from "@/lib/data/categories";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";

export function CategoryCircle({ item, size = "md" }: { item: CategoryDisplay; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "h-16 w-16 sm:h-20 sm:w-20" : "h-20 w-20 sm:h-24 sm:w-24";

  return (
    <Link href={`/products?category=${item.category}`} className="flex flex-col items-center gap-2 text-center active:opacity-80">
      <div className={`relative overflow-hidden rounded-full border border-brand-sand-dark shadow-sm ${dimension}`}>
        <ProductImagePlaceholder
          src={item.image}
          alt={item.label}
          gradient={item.gradient}
          iconSize={20}
          sizes="96px"
          className="h-full w-full"
        />
      </div>
      <span className="line-clamp-2 w-16 text-xs font-medium leading-tight text-brand-ink sm:w-20 sm:text-sm">
        {item.label}
      </span>
    </Link>
  );
}
