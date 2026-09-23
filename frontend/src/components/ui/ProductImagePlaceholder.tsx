import Image from "next/image";
import { Nut } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Renders a real product photo when `src` is given, falling back to a
 * brand-gradient tile otherwise. Keeps a single call site across the app so
 * swapping in the final photography pipeline only means passing `src`.
 */
export function ProductImagePlaceholder({
  src,
  alt = "",
  gradient,
  iconSize = 32,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  className,
}: {
  src?: string;
  alt?: string;
  gradient: [string, string];
  iconSize?: number;
  sizes?: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
    >
      <Nut size={iconSize} className="text-white/90" strokeWidth={1.5} />
    </div>
  );
}
