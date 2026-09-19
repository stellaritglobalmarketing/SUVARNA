"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ChevronDown,
  Heart,
  Leaf,
  MapPin,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { openCartDrawer, selectCartCount } from "@/lib/redux/slices/cartSlice";
import { selectWishlistCount } from "@/lib/redux/slices/wishlistSlice";
import { setSearch } from "@/lib/redux/slices/filtersSlice";
import { openDeliverySheet, selectDeliveryPincode } from "@/lib/redux/slices/uiSlice";
import { Container } from "@/components/ui/Container";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/", label: "Our Story" },
  { href: "/", label: "Quality" },
  { href: "/track-order", label: "Track Order" },
];

export function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const cartCount = useAppSelector(selectCartCount);
  const wishlistCount = useAppSelector(selectWishlistCount);
  const deliveryPincode = useAppSelector(selectDeliveryPincode);
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    dispatch(setSearch(searchValue));
    router.push("/products");
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-forest" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Mobile app-shell header: delivery headline + location + always-visible search */}
      <div className="lg:hidden">
        <Container className="flex items-start justify-between gap-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() => dispatch(openDeliverySheet())}
            className="flex flex-col items-start text-left cursor-pointer"
          >
            <span className="flex items-center gap-1 text-[11px] font-medium text-brand-gold-light">
              <Truck size={11} /> Harvesta delivers in
            </span>
            <span className="font-serif text-2xl font-bold leading-tight text-brand-sand">2–4 Days</span>
            <span className="mt-1 flex items-center gap-1 text-xs text-brand-sand/70">
              <MapPin size={12} />
              {deliveryPincode ? `Deliver to ${deliveryPincode}` : "Select delivery location"}
              <ChevronDown size={12} />
            </span>
          </button>
          <div className="flex items-center gap-1 pt-0.5">
            <Link
              href="/wishlist"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-brand-sand active:bg-white/10"
              aria-label={`Wishlist, ${wishlistCount} items`}
            >
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[9px] font-bold text-brand-ink">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => dispatch(openCartDrawer())}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-brand-sand active:bg-white/10 cursor-pointer"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[9px] font-bold text-brand-ink">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </Container>
        <Container className="pb-3">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
              <Search size={16} className="shrink-0 text-brand-ink/40" aria-hidden="true" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search for dry fruits..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-brand-ink/40"
              />
            </div>
          </form>
        </Container>
      </div>

      {/* Desktop header: utility strip + full nav + search */}
      <div className="hidden lg:block">
        <div className="bg-brand-forest text-brand-sand">
          <Container className="flex h-9 items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Leaf size={12} className="text-brand-gold-light" /> 100% Natural
              </span>
              <span className="text-brand-sand/30">|</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-brand-gold-light" /> No Preservatives
              </span>
              <span className="text-brand-sand/30">|</span>
              <span>Farm to Pouch</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Truck size={12} className="text-brand-gold-light" /> Pan-India Delivery
              </span>
              <span className="text-brand-sand/30">|</span>
              <Link href="/track-order" className="hover:text-brand-gold-light">
                Track Order
              </Link>
            </div>
          </Container>
        </div>

        <div className="border-b border-brand-sand-dark bg-brand-sand/95 backdrop-blur">
          <Container className="flex h-20 items-center justify-between gap-4">
            <Link href="/" className="flex shrink-0 flex-col leading-none">
              <span className="font-serif text-2xl font-bold text-brand-forest">Harvesta</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-brand-walnut-dark">
                Artisanal Dry Fruits
              </span>
            </Link>

            <nav className="flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-brand-ink hover:text-brand-forest transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <form onSubmit={handleSearch} className="max-w-sm flex-1">
              <div className="flex items-center gap-2 rounded-full border border-brand-sand-dark bg-brand-sand-dark/40 px-4 py-2">
                <Search size={16} className="shrink-0 text-brand-ink/50" aria-hidden="true" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search for dry fruits..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-brand-ink/40"
                />
              </div>
            </form>

            <div className="flex items-center gap-1.5">
              <Link
                href="/wishlist"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-forest hover:bg-brand-sand-dark"
                aria-label={`Wishlist, ${wishlistCount} items`}
              >
                <Heart size={19} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[11px] font-bold text-brand-ink">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/track-order"
                className="flex h-10 w-10 items-center justify-center rounded-full text-brand-forest hover:bg-brand-sand-dark"
                aria-label="Track order"
              >
                <PackageSearch size={19} />
              </Link>
              <button
                type="button"
                onClick={() => dispatch(openCartDrawer())}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-forest hover:bg-brand-sand-dark cursor-pointer"
                aria-label={`Cart, ${cartCount} items`}
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[11px] font-bold text-brand-ink">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </Container>
        </div>
      </div>
    </header>
  );
}
