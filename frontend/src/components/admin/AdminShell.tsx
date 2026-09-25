"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquareText,
  Package,
  ShoppingCart,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getToken } from "@/lib/auth/token";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/admin/shipments", label: "Shipments", icon: Truck },
  { href: "/admin/content", label: "Home Content", icon: LayoutTemplate },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin chrome: sidebar navigation + top bar, and the admin-only guard for every /admin page. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isNavOpen, setNavOpen] = useState(false);

  // The session is restored from storage right after the first render — check storage itself
  // before deciding the visitor isn't logged in.
  useEffect(() => {
    if (!isAuthenticated && !getToken()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-brand-ink/60">Loading admin…</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-serif text-2xl font-bold text-brand-forest">Admins only</p>
        <p className="text-sm text-brand-ink/70">You&apos;re signed in as a customer. Sign in with an admin account to use the admin panel.</p>
        <div className="flex gap-2">
          <Link href="/" className="rounded-lg border border-brand-sand-dark bg-white px-4 py-2 text-sm font-medium text-brand-forest">
            Back to store
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            }}
            className="rounded-lg bg-brand-forest px-4 py-2 text-sm font-medium text-brand-sand cursor-pointer"
          >
            Switch account
          </button>
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setNavOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(pathname, href) ? "bg-brand-gold text-brand-ink" : "text-brand-sand/80 hover:bg-white/10 hover:text-brand-sand",
          )}
        >
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-brand-sand">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-brand-forest px-3 py-5 lg:flex">
        <Link href="/admin" className="mb-6 px-3 font-serif text-xl font-bold text-brand-sand">
          Suvarna7 <span className="text-xs font-sans font-semibold uppercase tracking-widest text-brand-gold-light">Admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <Link href="/" target="_blank" className="mt-4 flex items-center gap-2 px-3 text-xs text-brand-sand/60 hover:text-brand-sand">
          <ExternalLink size={13} /> View store
        </Link>
      </aside>

      {/* Mobile drawer */}
      {isNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setNavOpen(false)} className="absolute inset-0 bg-black/40 cursor-pointer" />
          <aside className="relative flex h-full w-64 flex-col bg-brand-forest px-3 py-5">
            <div className="mb-6 flex items-center justify-between px-3">
              <span className="font-serif text-xl font-bold text-brand-sand">Suvarna7 Admin</span>
              <button type="button" onClick={() => setNavOpen(false)} aria-label="Close menu" className="text-brand-sand cursor-pointer">
                <X size={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-brand-sand-dark bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setNavOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 hover:bg-brand-sand-dark lg:hidden cursor-pointer">
            <Menu size={20} />
          </button>
          <span className="hidden text-sm text-brand-ink/60 lg:block">
            {NAV.find((item) => isActive(pathname, item.href))?.label ?? "Admin"}
          </span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-ink/70">{user.name}</span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login?next=/admin");
              }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-brand-forest hover:bg-brand-sand-dark cursor-pointer"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
