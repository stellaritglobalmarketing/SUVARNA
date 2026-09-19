"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, PackageSearch, ShoppingBag, ShoppingCart } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { openCartDrawer, selectCartCount } from "@/lib/redux/slices/cartSlice";
import { selectWishlistCount } from "@/lib/redux/slices/wishlistSlice";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: ShoppingBag },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/track-order", label: "Track", icon: PackageSearch },
];

/** App-style bottom tab bar for small screens — hidden at `lg` where the header nav takes over. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);
  const wishlistCount = useAppSelector(selectWishlistCount);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-white shadow-[0_-6px_24px_rgba(35,65,46,0.14)] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 px-1 pt-2">
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
        <button
          type="button"
          onClick={() => dispatch(openCartDrawer())}
          className="relative flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-brand-ink/45 cursor-pointer"
        >
          <span className="flex h-8 w-11 items-center justify-center rounded-full">
            <ShoppingCart size={18} />
          </span>
          Cart
          {cartCount > 0 && (
            <span className="absolute right-[18%] top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-gold px-1 text-[8px] font-bold text-brand-ink">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
