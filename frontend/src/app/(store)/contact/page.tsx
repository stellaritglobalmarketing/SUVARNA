import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact/ContactForm";
import { getStoreSettings } from "@/lib/api/settings";

export const metadata: Metadata = {
  title: "Suvarna7 — Contact Us",
  description: "Talk to the Suvarna7 team on WhatsApp or by phone about an order, a product, returns or gifting.",
};

export default async function ContactPage() {
  const { whatsapp_number, whatsapp_display } = await getStoreSettings();

  const channels = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: whatsapp_display,
      note: "Fastest. Send photos and your order number.",
      href: `https://wa.me/${whatsapp_number}`,
      external: true,
    },
    {
      icon: Phone,
      label: "Call",
      value: whatsapp_display,
      note: "Talk to our team directly.",
      href: `tel:+${whatsapp_number}`,
      external: false,
    },
  ];

  return (
    <div className="bg-[#fffdf8]">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[80rem]">
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">Contact Us</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-brand-forest sm:text-4xl">Talk to a real person.</h1>
          <p className="mt-4 text-[15px] leading-7 text-brand-ink/75">
            Questions about an order, a product, a return or a gift box — our team answers on WhatsApp and phone.
          </p>
        </header>

        {/* Channels as large, tappable rows */}
        <ul className="mt-10 divide-y divide-brand-sand-dark border-y border-brand-sand-dark">
          {channels.map(({ icon: Icon, label, value, note, href, external }) => (
            <li key={label}>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 py-6 sm:grid-cols-[48px_140px_minmax(0,1fr)_auto] sm:gap-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-forest text-brand-forest transition-colors group-hover:bg-brand-forest group-hover:text-brand-sand sm:h-12 sm:w-12">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-semibold uppercase tracking-wider text-brand-ink/55 sm:text-base">
                  {label}
                  <span className="mt-1 block font-serif text-xl font-bold normal-case tracking-normal text-brand-forest sm:hidden">{value}</span>
                </span>
                <span className="hidden sm:block">
                  <span className="block font-serif text-2xl font-bold text-brand-forest">{value}</span>
                  <span className="text-sm text-brand-ink/60">{note}</span>
                </span>
                <ArrowUpRight size={22} className="text-brand-ink/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-forest" />
              </a>
            </li>
          ))}
          <li className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-4 py-6 sm:grid-cols-[48px_140px_minmax(0,1fr)] sm:gap-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-sand-dark text-brand-ink/60 sm:h-12 sm:w-12">
              <Clock size={20} />
            </span>
            <span className="text-sm font-semibold uppercase tracking-wider text-brand-ink/55 sm:text-base">Hours</span>
            <span className="col-span-2 text-[15px] leading-7 text-brand-ink/75 sm:col-span-1">
              Monday to Saturday, 10:00 AM – 7:00 PM. Messages sent later are answered the next working day.
            </span>
          </li>
        </ul>

        {/* Form */}
        <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border-2 border-brand-forest/80 bg-white p-6 sm:p-8">
            <h2 className="font-serif text-2xl font-bold text-brand-forest">Write to us</h2>
            <p className="mb-6 mt-1 text-sm text-brand-ink/60">Fill this in and we&rsquo;ll get it on WhatsApp.</p>
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/50">Quick answers</h2>
              <ul className="mt-3 space-y-1">
                {[
                  { href: "/track-order", label: "Track your order" },
                  { href: "/orders", label: "My orders & invoices" },
                  { href: "/refund-policy", label: "Returns & cancellations" },
                  { href: "/help", label: "Help & FAQs" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between border-b border-brand-sand-dark py-3 text-[15px] font-medium text-brand-ink hover:text-brand-forest"
                    >
                      {link.label} <ArrowUpRight size={16} className="text-brand-ink/35" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm leading-6 text-brand-ink/60">
              Writing about an order? Keep your order number handy — it starts with <strong className="text-brand-ink">ORD-</strong> and is
              on your invoice and in My Orders.
            </p>
          </aside>
        </section>
        </div>
      </Container>
    </div>
  );
}
