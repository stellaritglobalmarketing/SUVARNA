import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function BrandLogo({ className, sizes = "160px", priority = false }: {
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Link href="/" aria-label="Suvarna7 home" className={cn("relative block h-16 w-40 shrink-0 overflow-hidden rounded-lg bg-brand-sand", className)}>
      <Image src="/logo-background.png" alt="Suvarna7" fill sizes={sizes} className="object-contain" priority={priority} />
    </Link>
  );
}
