import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const FAQS = [
  {
    question: "Is Cash on Delivery (COD) available?",
    answer: "Yes, COD is available on most pincodes across India. You'll see the option at checkout once your pincode is verified.",
  },
  {
    question: "What is your return & refund policy?",
    answer: "If a pouch arrives damaged or doesn't match the listing, we offer a free replacement or full refund within 7 days of delivery.",
  },
  {
    question: "How do you ensure freshness?",
    answer: "Every pouch is nitrogen-flushed at the time of packing and shipped within 48 hours of your order to lock in freshness.",
  },
  {
    question: "Do you deliver across India?",
    answer: "Yes, we ship pan-India via Ekart, Delhivery, BlueDart, DTDC and Shiprocket, with delivery in 2–5 days depending on your pincode.",
  },
  {
    question: "Are your products lab tested?",
    answer: "Every batch is graded and lab-tested for oil content, moisture and purity before it's approved for packing.",
  },
];

export function FAQSection() {
  return (
    <section className="py-8 sm:py-12">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="Good to Know" title="Frequently Asked Questions" align="center" />
        <div className="mt-8 divide-y divide-brand-sand-dark rounded-2xl border border-brand-sand-dark bg-white">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-brand-ink marker:content-none">
                {faq.question}
                <span className="shrink-0 text-lg text-brand-ink/40 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
