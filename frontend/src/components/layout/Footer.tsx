import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BrandLogo } from "@/components/ui/BrandLogo";

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products/kashmir-saffron", label: "Kashmir Saffron" },
      { href: "/products/kashmir-acacia-honey", label: "Acacia Honey" },
      { href: "/products/kashmir-wild-dark-honey", label: "Wild Dark Honey" },
      { href: "/products/gir-cow-bilona-ghee", label: "Gir Cow Bilona Ghee" },
      { href: "/products/buffalo-bilona-ghee", label: "Buffalo Bilona Ghee" },
      { href: "/products/kashmiri-almonds", label: "Kashmiri Almonds" },
      { href: "/products/kashmiri-walnut-kernels", label: "Walnut Kernels" },
      { href: "/products/heritage-box", label: "Heritage Box" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/track-order", label: "Track Order" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund & Cancellation" },
      { href: "/help", label: "Help & Support" },
      { href: "/contact", label: "Contact Us" },
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

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund & Cancellation Policy" },
];

export function Footer() {
  return (
    <footer className="mt-8 border-t border-brand-sand-dark bg-[#f3eee4] text-brand-ink">
      <Container className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <BrandLogo className="h-24 w-48" sizes="192px" />
          <p className="mt-3 text-sm text-brand-ink/60">
            Pure Indian honey, ghee, saffron and dry fruits — sourced responsibly, delivered fresh across India.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">{column.title}</h3>
            <ul className="mt-4 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-brand-ink/65 hover:text-brand-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="flex flex-col items-center gap-2 border-t border-brand-ink/10 px-4 py-4 text-center text-xs text-brand-ink/55 sm:flex-row sm:justify-center sm:gap-4">
        <span>© {new Date().getFullYear()} Suvarna7 — Pure Indian Goodness. All rights reserved.</span>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-brand-forest underline-offset-2 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
