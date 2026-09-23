import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandLogo } from "@/components/ui/BrandLogo";

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products/kashmiri-mongra-saffron", label: "Mongra Saffron" },
      { href: "/products/raw-forest-honey", label: "Raw Forest Honey" },
      { href: "/products/kashmir-mamra-almonds", label: "Mamra Almonds" },
      { href: "/products/afghani-gurbandi-almonds", label: "Afghani Almonds" },
      { href: "/products/pure-cow-ghee", label: "Cow Ghee" },
      { href: "/products/pure-buffalo-ghee", label: "Buffalo Ghee" },
      { href: "/products/kashmiri-walnut-kernels", label: "Walnuts" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/track-order", label: "Track Order" },
      { href: "/", label: "Shipping Policy" },
      { href: "/", label: "Returns & Refunds" },
      { href: "/", label: "Contact Us" },
    ],
  },
  {
    title: "Suvarna7",
    links: [
      { href: "/our-story", label: "Our Story" },
      { href: "/", label: "Farm Partners" },
      { href: "/", label: "Quality Promise" },
      { href: "/", label: "Bulk & Corporate Gifting" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-sand-dark bg-brand-forest text-brand-sand">
      <Container className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <BrandLogo className="h-24 w-48" sizes="192px" />
          <p className="mt-3 text-sm text-brand-sand/70">
            Pure Indian honey, ghee, saffron and dry fruits — sourced responsibly, delivered fresh across India.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-gold-light">{column.title}</h3>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-brand-sand/80 hover:text-brand-sand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-brand-sand/10 py-4 text-center text-xs text-brand-sand/60">
        © {new Date().getFullYear()} Suvarna7 — Pure Indian Goodness. All rights reserved.
      </div>
    </footer>
  );
}
