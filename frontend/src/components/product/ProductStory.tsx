import type { ProductInfoSection } from "@/types/product";
import { isFaqSection } from "@/lib/seo";
import { cn } from "@/lib/utils/cn";

const headingClass = "font-serif text-xl font-semibold text-brand-forest";

function InfoBlock({ section }: { section: ProductInfoSection }) {
  return (
    <div>
      <h2 className={headingClass}>{section.title}</h2>
      {section.body && <p className="mt-2 text-[15px] leading-7 text-brand-ink/75">{section.body}</p>}
      {section.items.length > 0 && (
        <ul className={cn("list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-brand-ink/75 marker:text-brand-gold", section.body ? "mt-3" : "mt-2")}>
          {section.items.map((item, index) => (
            <li key={`${item.label ?? ""}-${index}`}>
              {item.label && <span className="font-semibold text-brand-forest">{item.label}: </span>}
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FaqList({ section }: { section: ProductInfoSection }) {
  return (
    <div>
      <h2 className={headingClass}>{section.title}</h2>
      {/* <details> keeps every answer in the page (search engines and FAQ schema need them), just folded. */}
      <div className="mt-3 divide-y divide-brand-sand-dark border-y border-brand-sand-dark">
        {section.items.map((item, index) => (
          <details key={`${item.label ?? ""}-${index}`} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-brand-ink marker:content-none">
              {item.label}
              <span className="shrink-0 text-lg text-brand-ink/40 transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-brand-ink/70">{item.text}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/**
 * Everything below Add to Cart, in catalogue order: "The Story" (the description), then the information
 * blocks — the first (Highlights, What's Inside) on the left, the rest stacked on the right — then the FAQs.
 */
export function ProductStory({ story, sections }: { story: string; sections: ProductInfoSection[] }) {
  const paragraphs = story
    .split(/\n\s*\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const faqs = sections.find(isFaqSection);
  const [lead, ...rest] = sections.filter((section) => section !== faqs);

  if (paragraphs.length === 0 && !lead && !faqs) return null;

  return (
    <section className="space-y-10 rounded-2xl border border-brand-sand-dark bg-white p-5 sm:p-8">
      {paragraphs.length > 0 && (
        <div className="max-w-3xl">
          <h2 className={headingClass}>The Story</h2>
          <div className="mt-2 space-y-3 text-[15px] leading-7 text-brand-ink/75">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {lead && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          <InfoBlock section={lead} />
          {rest.length > 0 && (
            <div className="space-y-8">
              {rest.map((section, index) => (
                <InfoBlock key={`${section.title}-${index}`} section={section} />
              ))}
            </div>
          )}
        </div>
      )}

      {faqs && faqs.items.length > 0 && <FaqList section={faqs} />}
    </section>
  );
}
