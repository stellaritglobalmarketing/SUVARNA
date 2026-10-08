"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { cn } from "@/lib/utils/cn";

/** One row of the "At a glance" table, e.g. { label: "Refunds", text: "Not offered" }. */
export interface PolicyFact {
  label: string;
  text: string;
}

export interface PolicySection {
  id: string;
  title: string;
  /** One plain-language sentence: what this section means for the customer. */
  inShort: string;
  body: ReactNode;
}

/**
 * Shared reader for the legal pages (Terms, Privacy, Refund & Cancellation). Built for focus rather
 * than decoration: a narrow column of readable type, an "At a glance" fact table up top, every section
 * opening with a one-line plain-words version, a numbered index that follows the reader, and a thin
 * progress line so the length of the page is never a surprise.
 */
export function PolicyPage({
  eyebrow,
  title,
  updated,
  intro,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: ReactNode;
  summary: PolicyFact[];
  sections: PolicySection[];
}) {
  const store = useStoreSettings();
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [progress, setProgress] = useState(0);

  // Reading progress and the section currently on screen.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [sections]);

  return (
    <div className="bg-[#fffdf8]">
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent" aria-hidden="true">
        <div className="h-full origin-left bg-brand-gold" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* Centred two-column page: everything shares one left edge; the index sits beside it from the top. */}
      <Container className="py-12 sm:py-16">
        <div className="mx-auto grid w-full max-w-[80rem] grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
          <div className="min-w-0">
            {/* Title block */}
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">{eyebrow}</p>
              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-brand-forest sm:text-4xl">{title}</h1>
              <p className="mt-2 text-xs text-brand-ink/55">Last updated {updated}</p>
              <div className="mt-5 text-[15px] leading-7 text-brand-ink/75">{intro}</div>
            </header>

            {/* At a glance */}
            <section aria-labelledby="at-a-glance" className="mt-10">
              <h2 id="at-a-glance" className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/50">
                At a glance
              </h2>
              <dl className="mt-3 border-t border-brand-ink/80">
                {summary.map((fact) => (
                  <div key={fact.label} className="grid grid-cols-1 gap-1 border-b border-brand-sand-dark py-3.5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
                    <dt className="text-[13px] font-semibold uppercase tracking-wider text-brand-forest">{fact.label}</dt>
                    <dd className="text-[15px] leading-6 text-brand-ink">{fact.text}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Sections */}
            <div className="mt-12 space-y-9">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-40">
                  <h2 className="flex items-baseline gap-3 font-serif text-xl font-bold text-brand-forest sm:text-2xl">
                    <span className="text-base font-bold text-brand-gold lining-nums tabular-nums sm:text-lg" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </h2>
                  <p className="mt-2 text-[15px] font-medium leading-7 text-brand-ink">{section.inShort}</p>
                  <div className="policy-body mt-3 space-y-3 text-[15px] leading-7 text-brand-ink/70 [&_a]:font-semibold [&_a]:text-brand-forest [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_strong]:text-brand-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                    {section.body}
                  </div>
                </section>
              ))}

              {/* Questions */}
              <section className="rounded-2xl bg-brand-forest p-6 text-brand-sand sm:p-7">
                <h2 className="font-serif text-xl font-bold">Questions about this page?</h2>
                <p className="mt-2 text-brand-sand/80">Message us and a real person from our team will answer.</p>
                <a
                  href={`https://wa.me/${store.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-sand px-5 py-3 font-semibold text-brand-forest hover:bg-white"
                >
                  <MessageCircle size={18} /> WhatsApp {store.whatsapp_display}
                </a>
              </section>
            </div>
          </div>

          {/* On this page — starts level with the title and follows the reader */}
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-40 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/50">On this page</p>
              <ol className="mt-4 space-y-1 border-l border-brand-sand-dark">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={cn(
                        "-ml-px flex gap-2 border-l-2 py-1.5 pl-4 text-sm transition-colors",
                        activeId === section.id
                          ? "border-brand-forest font-semibold text-brand-forest"
                          : "border-transparent text-brand-ink/60 hover:text-brand-ink",
                      )}
                    >
                      <span className="tabular-nums text-brand-ink/35">{String(index + 1).padStart(2, "0")}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        </div>
      </Container>
    </div>
  );
}
