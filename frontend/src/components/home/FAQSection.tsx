import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { HomeFaq } from "@/types/home";

export function FAQSection({ faqs }: { faqs: HomeFaq[] }) {
  if (faqs.length === 0) return null;

  return (
    <section className="py-12 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Good to Know" title="Frequently Asked Questions" align="center" />
        <div className="mt-8 divide-y divide-brand-sand-dark border-y border-brand-sand-dark">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
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
