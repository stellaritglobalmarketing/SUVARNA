import Link from "next/link";
import { Gift, Heart, PackagePlus, PackageSearch } from "lucide-react";
import { Container } from "@/components/ui/Container";

const ACTIONS = [
  { href: "/track-order", label: "Track Order", icon: PackageSearch },
  { href: "/products", label: "Gift Boxes", icon: Gift },
  { href: "/products", label: "Bulk Orders", icon: PackagePlus },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

/** App-style shortcut strip — mobile only; desktop already surfaces these via the header. */
export function QuickActions() {
  return (
    <section className="py-5 md:hidden">
      <Container>
        <div className="grid grid-cols-4 gap-2">
          {ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white py-3 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-sand-dark text-brand-forest">
                <Icon size={18} />
              </span>
              <span className="text-center text-[10.5px] font-medium leading-tight text-brand-ink">{label}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
