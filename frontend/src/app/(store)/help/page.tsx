import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock, MessageCircle, PackageSearch, Phone, RefreshCcw, ShoppingBag, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getStoreSettings } from "@/lib/api/settings";

export const metadata: Metadata = {
  title: "Suvarna7 — Help & Support",
  description: "Questions about an order, delivery or an exchange? Chat with Suvarna7 on WhatsApp or give us a call.",
};


const TOPICS = [
  {
    icon: PackageSearch,
    title: "Where is my order?",
    text: "Track your parcel live with your order number. You'll also find it under My Orders.",
    href: "/track-order",
    cta: "Track order",
  },
  {
    icon: RefreshCcw,
    title: "Damaged or wrong item",
    text: "Message us within 36 hours of delivery with photos and your order number, and we'll send a replacement.",
    href: "/return-policy",
    cta: "Exchange policy",
  },
  {
    icon: ShoppingBag,
    title: "My orders",
    text: "See everything you've ordered, check its status and download the invoice for a paid order.",
    href: "/orders",
    cta: "View orders",
  },
  {
    icon: Truck,
    title: "Delivery",
    text: "We deliver across India, usually in 2–4 days. Check your pincode on any product page for an estimate.",
    href: "/#products",
    cta: "Shop products",
  },
];

const FAQS = [
  {
    q: "What should I keep ready when I contact you?",
    a: "Your order number (it starts with ORD-), the phone number you ordered with, and photos if something arrived damaged.",
  },
  {
    q: "Can I return a product?",
    a: "Our products are food items, so we don't accept returns or give refunds. Damaged, wrong or defective items are exchanged if you tell us within 36 hours of delivery.",
  },
  {
    q: "Can I change my delivery address after ordering?",
    a: "Yes, if the order hasn't shipped yet. Message us on WhatsApp with your order number and the new address as soon as possible.",
  },
  {
    q: "Do you take bulk or corporate gifting orders?",
    a: "Yes. Tell us on WhatsApp what you need, how many boxes and by when, and we'll share options and pricing.",
  },
];

export default async function HelpPage() {
  // The number is set in Admin → Settings.
  const { whatsapp_number, whatsapp_display } = await getStoreSettings();
  const WHATSAPP_URL = `https://wa.me/${whatsapp_number}?text=${encodeURIComponent("Hi Suvarna7, I need help with ")}`;
  const CALL_URL = `tel:+${whatsapp_number}`;

  return (
    <div>
      {/* Hero with the two ways to reach us */}
      <section className="bg-brand-forest text-brand-sand">
        <Container className="py-14 sm:py-20">
          <span className="inline-block rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
            Help &amp; Support
          </span>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">How can we help?</h1>
          <p className="mt-4 max-w-xl text-brand-sand/80">
            Our team answers on WhatsApp and phone. Message us with your order number and we&rsquo;ll sort it out quickly.
          </p>

          <div className="mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-brand-sand p-5 text-brand-ink transition-colors hover:bg-white"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white">
                <MessageCircle size={22} />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-brand-ink/55">Chat on WhatsApp</span>
                <span className="block text-lg font-semibold">{whatsapp_display}</span>
                <span className="block text-xs text-brand-ink/60">Fastest — send photos and your order number</span>
              </span>
              <ChevronRight size={18} className="text-brand-ink/40 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href={CALL_URL} className="group flex items-center gap-4 rounded-2xl bg-brand-sand p-5 text-brand-ink transition-colors hover:bg-white">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-forest text-brand-sand">
                <Phone size={20} />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-brand-ink/55">Call us</span>
                <span className="block text-lg font-semibold">{whatsapp_display}</span>
                <span className="block text-xs text-brand-ink/60">Talk to our team directly</span>
              </span>
              <ChevronRight size={18} className="text-brand-ink/40 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm text-brand-sand/75">
            <Clock size={15} /> Monday to Saturday, 10:00 AM – 7:00 PM. WhatsApp messages sent later are answered the next working day.
          </p>
        </Container>
      </section>

      <Container className="max-w-5xl space-y-14 py-14 sm:py-16">
        {/* Common topics */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-forest sm:text-3xl">Common questions, quick answers</h2>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TOPICS.map(({ icon: Icon, title, text, href, cta }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="group flex h-full gap-4 rounded-2xl border border-brand-sand-dark bg-white p-5 transition-colors hover:border-brand-forest"
                >
                  <Icon size={22} className="mt-0.5 shrink-0 text-brand-gold" />
                  <span>
                    <span className="block font-semibold text-brand-forest">{title}</span>
                    <span className="mt-1 block text-sm leading-6 text-brand-ink/70">{text}</span>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-forest">
                      {cta} <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-forest sm:text-3xl">Before you message us</h2>
          <div className="mt-6 divide-y divide-brand-sand-dark rounded-2xl border border-brand-sand-dark bg-white">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-brand-ink">
                  {q}
                  <ChevronRight size={18} className="shrink-0 text-brand-ink/40 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2 text-sm leading-6 text-brand-ink/70">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-brand-sand-dark/40 p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-forest">Still need help?</h2>
          <p className="max-w-md text-sm text-brand-ink/70">Send us a message on WhatsApp. A real person from our team will reply.</p>
          <Button href={WHATSAPP_URL} external size="lg">
            <MessageCircle size={18} /> Chat on WhatsApp
          </Button>
        </section>
      </Container>
    </div>
  );
}
