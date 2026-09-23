"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ChevronDown,
  Heart,
  Leaf,
  LogOut,
  Menu,
  MapPin,
  PackageSearch,
  Pencil,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { openCartDrawer, selectCartCount } from "@/lib/redux/slices/cartSlice";
import { selectWishlistCount } from "@/lib/redux/slices/wishlistSlice";
import { setSearch } from "@/lib/redux/slices/filtersSlice";
import { openDeliverySheet, selectDeliveryPincode } from "@/lib/redux/slices/uiSlice";
import { selectAuthUser } from "@/lib/redux/slices/authSlice";
import { useAuth } from "@/hooks/useAuth";
import { Container } from "@/components/ui/Container";
import { BrandLogo } from "@/components/ui/BrandLogo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/our-story", label: "Our Story" },
  { href: "/", label: "Quality" },
  { href: "/track-order", label: "Track Order" },
];

export function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const cartCount = useAppSelector(selectCartCount);
  const wishlistCount = useAppSelector(selectWishlistCount);
  const deliveryPincode = useAppSelector(selectDeliveryPincode);
  const authUser = useAppSelector(selectAuthUser);
  const { logout } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    dispatch(setSearch(searchValue));
    router.push("/#products");
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-forest" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Mobile app-shell header: menu + logo + cart, location row, always-visible search */}
      <div className="lg:hidden">
        <Container className="flex h-20 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-brand-sand active:bg-white/10 cursor-pointer"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <BrandLogo className="w-36" sizes="144px" priority />
          </div>
          <button
            type="button"
            onClick={() => dispatch(openCartDrawer())}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-brand-sand active:bg-white/10 cursor-pointer"
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[9px] font-bold text-brand-ink">
                {cartCount}
              </span>
            )}
          </button>
        </Container>

        <Container className="pb-2.5">
          <button
            type="button"
            onClick={() => dispatch(openDeliverySheet())}
            className="flex w-full items-center justify-between gap-2 text-left cursor-pointer"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-brand-sand/85">
              <MapPin size={13} className="shrink-0 text-brand-gold-light" />
              <span className="truncate">
                Deliver to: <span className="font-semibold text-brand-sand">{deliveryPincode ?? "Select location"}</span>
              </span>
              <ChevronDown size={12} className="shrink-0" />
            </span>
            <Pencil size={12} className="shrink-0 text-brand-sand/60" />
          </button>
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

      {isMenuOpen && (
        <div className="border-t border-white/10 bg-brand-forest lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-sand active:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-brand-sand active:bg-white/10"
            >
              Wishlist
              {wishlistCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[11px] font-bold text-brand-ink">
                  {wishlistCount}
                </span>
              )}
            </Link>
            {authUser ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-sand active:bg-white/10 cursor-pointer"
              >
                <LogOut size={15} /> Sign Out ({authUser.name.split(" ")[0]})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-sand active:bg-white/10"
              >
                <User size={15} /> Login / Sign Up
              </Link>
            )}
          </Container>
        </div>
      )}

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
              <span className="text-brand-sand/30">|</span>
              {authUser ? (
                <button type="button" onClick={logout} className="flex items-center gap-1.5 hover:text-brand-gold-light cursor-pointer">
                  <LogOut size={12} /> Sign Out ({authUser.name.split(" ")[0]})
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-1.5 hover:text-brand-gold-light">
                  <User size={12} /> Login / Sign Up
                </Link>
              )}
            </div>
          </Container>
        </div>

        <div className="border-b border-brand-sand-dark bg-brand-sand/95 backdrop-blur">
          <Container className="flex h-20 items-center justify-between gap-4">
            <BrandLogo priority />

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
