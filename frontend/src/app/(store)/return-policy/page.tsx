import type { Metadata } from "next";
import { Ban, Camera, CheckCircle2, Clock, MessageCircle, PackageCheck, XCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getStoreSettings } from "@/lib/api/settings";

export const metadata: Metadata = {
  title: "Suvarna7 — Exchange & Return Policy",
  description:
    "Suvarna7 does not accept returns or offer refunds. Damaged, wrong or defective items can be exchanged if reported within 36 hours of delivery.",
};

const HIGHLIGHTS = [
  {
    icon: Ban,
    title: "No Returns",
    description: "Because our products are food items, we can't take back an order once it's delivered.",
  },
  {
    icon: PackageCheck,
    title: "Exchange Only",
    description: "If something is wrong with your order, we'll send you a replacement at no extra cost.",
  },
  {
    icon: Clock,
    title: "Within 36 Hours",
    description: "Exchange requests must reach us within 36 hours of delivery. After that, we can't accept them.",
  },
];

const ELIGIBLE = [
  "The product arrived damaged, broken, leaking or with a torn pouch",
  "You received a different product or weight than the one you ordered",
  "An item from your order is missing",
  "The seal was broken or the pack looked tampered with on arrival",
  "The product is spoiled or has a clear quality defect",
];

const NOT_ELIGIBLE = [
  "Requests made more than 36 hours after delivery",
  "Change of mind, or no longer wanting the product",
  "Products that have been opened, used or partly consumed (unless the defect was found on opening)",
  "Products not kept in their original packaging, or stored improperly after delivery",
  "Natural variations in colour, texture, crystallisation (honey) or grain (ghee), which are signs of a pure product",
  "Requests without photos or an unboxing video",
];

const steps = (whatsappDisplay: string) => [
  {
    title: "Message us on WhatsApp",
    description: `Within 36 hours of delivery, send a message to ${whatsappDisplay} with your order number and what went wrong.`,
  },
  {
    title: "Share photos and video",
    description:
      "Attach clear photos of the product, the outer box and the shipping label, along with an unboxing video if you have one.",
  },
  {
    title: "We review your request",
    description: "Our team checks the details and replies within 24–48 hours to confirm whether the exchange is approved.",
  },
  {
    title: "Replacement is shipped",
    description:
      "Once approved, we ship the same product to you free of charge. If it's out of stock, we'll offer another product of equal value.",
  },
];

export default async function ReturnPolicyPage() {
  // The number is set in Admin → Settings.
  const { whatsapp_number, whatsapp_display } = await getStoreSettings();
  const STEPS = steps(whatsapp_display);

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-forest text-brand-sand">
        <Container className="py-16 sm:py-20">
          <span className="inline-block rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink">
            Support
          </span>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Exchange &amp; Return Policy
          </h1>
          <p className="mt-5 max-w-xl text-brand-sand/80">
            We don&rsquo;t accept returns or offer refunds. If your order arrives damaged, incorrect or defective,
            we&rsquo;ll exchange it, as long as you tell us within 36 hours of delivery.
          </p>
        </Container>
      </section>

      {/* Highlights */}
      <section className="py-12 sm:py-16">
        <Container className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-brand-sand-dark bg-white p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-forest text-brand-sand">
                <Icon size={22} />
              </div>
              <h2 className="mt-4 font-semibold text-brand-forest">{title}</h2>
              <p className="mt-2 text-sm text-brand-ink/70">{description}</p>
            </div>
          ))}
        </Container>
      </section>

      <Container className="max-w-4xl space-y-12 pb-16 sm:pb-20">
        {/* Why no returns */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-forest sm:text-3xl">Why We Don&rsquo;t Accept Returns</h2>
          <p className="mt-4 leading-relaxed text-brand-ink/75">
            Saffron, honey, ghee and dry fruits are food products. Once a pack leaves our facility, we can&rsquo;t
            verify how it was stored or handled, so we can&rsquo;t resell it safely. To keep every order fresh and
            hygienic for all our customers, we don&rsquo;t accept returns and don&rsquo;t issue refunds for delivered
            orders.
          </p>
        </section>

        {/* 36-hour window */}
        <section className="rounded-2xl border border-brand-gold/40 bg-brand-gold/10 p-6">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 shrink-0 text-brand-forest" size={22} />
            <div>
              <h2 className="font-semibold text-brand-forest">The 36-hour exchange window</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink/75">
                Exchange requests are accepted only within <strong>36 hours of delivery</strong>, counted from the
                delivery time recorded by our courier partner. Requests received after 36 hours will not be
                accepted, whatever the reason. Please check your order as soon as it arrives.
              </p>
            </div>
          </div>
        </section>

        {/* Eligible / not eligible */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-sand-dark bg-white p-6">
            <h2 className="font-semibold text-brand-forest">You can request an exchange if</h2>
            <ul className="mt-4 space-y-3">
              {ELIGIBLE.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-brand-ink/75">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-brand-forest" size={16} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-brand-sand-dark bg-white p-6">
            <h2 className="font-semibold text-brand-forest">An exchange is not possible for</h2>
            <ul className="mt-4 space-y-3">
              {NOT_ELIGIBLE.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-brand-ink/75">
                  <XCircle className="mt-0.5 shrink-0 text-red-600" size={16} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How to request */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-forest sm:text-3xl">How to Request an Exchange</h2>
          <ol className="mt-6 space-y-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-forest text-sm font-semibold text-brand-sand">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-brand-forest">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-brand-ink/75">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 flex items-start gap-2 text-sm text-brand-ink/65">
            <Camera className="mt-0.5 shrink-0" size={16} />
            Tip: record a short video while opening your parcel. It makes damage claims much faster to approve.
          </p>
        </section>

        {/* Other terms */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-brand-forest sm:text-3xl">Other Terms</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-brand-ink/75">
            <li>Each order can be exchanged only once.</li>
            <li>The exchange is for the same product and weight. We don&rsquo;t offer cash, refunds or store credit in place of an exchange.</li>
            <li>We may ask you to keep the original product and packaging until the exchange is complete.</li>
            <li>If the outer box looks damaged at delivery, please note it with the courier or refuse the parcel, and let us know right away.</li>
            <li>Suvarna7 has the final say on whether a request qualifies for an exchange.</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-brand-sand-dark/40 p-8 text-center">
          <MessageCircle className="text-brand-forest" size={28} />
          <h2 className="font-serif text-2xl font-bold text-brand-forest">Something wrong with your order?</h2>
          <p className="max-w-md text-sm text-brand-ink/70">
            Message us on WhatsApp at {whatsapp_display} within 36 hours of delivery with your order
            number and photos.
          </p>
          <Button href={`https://wa.me/${whatsapp_number}`} size="lg" external>
            Chat on WhatsApp
          </Button>
        </section>
      </Container>
    </div>
  );
}
