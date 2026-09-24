"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, PackageSearch, User } from "lucide-react";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectWishlistCount } from "@/lib/redux/slices/wishlistSlice";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/orders", label: "Orders", icon: PackageSearch },
  { href: "/profile", label: "Profile", icon: User },
];

/** App-style bottom tab bar for small screens — hidden at `lg` where the header nav takes over. Cart lives in the header. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const wishlistCount = useAppSelector(selectWishlistCount);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-white shadow-[0_-6px_24px_rgba(35,65,46,0.14)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-[var(--mobile-nav-height)] grid-cols-4 px-1 pt-2">
        {NAV_LINKS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const count = item.href === "/wishlist" ? wishlistCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium"
            >
              <span
                className={cn(
                  "flex h-8 w-11 items-center justify-center rounded-full transition-colors",
                  isActive ? "bg-brand-forest text-brand-sand" : "text-brand-ink/45",
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.25 : 2} />
              </span>
              <span className={isActive ? "text-brand-forest" : "text-brand-ink/45"}>{item.label}</span>
              {count > 0 && (
                <span className="absolute right-[18%] top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-gold px-1 text-[8px] font-bold text-brand-ink">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
