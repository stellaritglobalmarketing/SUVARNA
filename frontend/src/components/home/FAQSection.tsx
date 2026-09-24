import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { HomeFaq } from "@/types/home";

export function FAQSection({ faqs }: { faqs: HomeFaq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section className="py-8 sm:py-12">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="Good to Know" title="Frequently Asked Questions" align="center" />
        <div className="mt-8 divide-y divide-brand-sand-dark rounded-2xl border border-brand-sand-dark bg-white">
          {faqs.map((faq) => (
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
