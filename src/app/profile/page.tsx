import Link from "next/link";
import type { Metadata } from "next";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Heart,
  HelpCircle,
  Info,
  MapPin,
  PackageSearch,
  User,
} from "lucide-react";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Harvesta — My Profile",
};

const MENU_ITEMS = [
  { icon: PackageSearch, label: "My Orders", href: "/track-order" },
  { icon: Heart, label: "My Wishlist", href: "/wishlist" },
  { icon: MapPin, label: "My Addresses", href: "/" },
  { icon: CreditCard, label: "Payment Methods", href: "/" },
  { icon: Bell, label: "Notifications", href: "/" },
  { icon: HelpCircle, label: "Help & Support", href: "/" },
  { icon: Info, label: "About Harvesta", href: "/" },
];

export default function ProfilePage() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="flex items-center gap-4 rounded-2xl border border-brand-sand-dark bg-white p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-sand-dark text-brand-forest">
          <User size={28} />
        </div>
        <div>
          <p className="font-serif text-lg font-semibold text-brand-forest">Guest</p>
          <p className="text-sm text-brand-ink/60">Sign in to sync orders &amp; wishlist across devices</p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-brand-sand-dark overflow-hidden rounded-2xl border border-brand-sand-dark bg-white">
        {MENU_ITEMS.map(({ icon: Icon, label, href }) => (
          <Link key={label} href={href} className="flex items-center gap-3 px-5 py-4 text-sm active:bg-brand-sand">
            <Icon size={18} className="text-brand-forest" />
            <span className="flex-1 font-medium text-brand-ink">{label}</span>
            <ChevronRight size={16} className="text-brand-ink/30" />
          </Link>
        ))}
      </div>
    </Container>
  );
}
