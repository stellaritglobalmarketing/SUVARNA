"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import type { ProductInfoSection, ProductOrigin, ProductProcessing } from "@/types/product";
import { cn } from "@/lib/utils/cn";
import { qualityProcessContent, type QualityPoint } from "./QualityProcess";

type Tab = { id: string; title: string; render: () => ReactNode };

const STAGGER_MS = 60;
const stagger = (index: number): CSSProperties => ({ animationDelay: `${80 + index * STAGGER_MS}ms` });

function InfoPanel({ section }: { section: ProductInfoSection }) {
  return (
    <div className="max-w-3xl">
      {section.body && (
        <p className="animate-tab-item text-[15px] leading-7 text-brand-ink/75" style={stagger(0)}>
          {section.body}
        </p>
      )}
      {section.items.length > 0 && (
        <ul className={cn("grid grid-cols-1 gap-x-10 sm:grid-cols-2", section.body && "mt-6")}>
          {section.items.map((item, index) => (
            <li
              key={`${item.label ?? ""}-${index}`}
              className="animate-tab-item border-t border-brand-sand-dark py-4 text-sm leading-6 text-brand-ink/75 first:border-t-0 first:pt-0 sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(2)]:pt-0"
              style={stagger(index + 1)}
            >
              {item.label && <span className="block font-semibold text-brand-forest">{item.label}</span>}
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChecksPanel({ checks }: { checks: QualityPoint[] }) {
  return (
    <div>
      <p className="animate-tab-item text-sm text-brand-ink/60" style={stagger(0)}>
        What every batch has to pass before it is packed.
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        {checks.map(({ title, text }, index) => (
          <li key={title} className="animate-tab-item flex gap-3" style={stagger(index + 1)}>
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-forest">{title}</p>
              <p className="mt-1 text-sm leading-6 text-brand-ink/70">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepsPanel({ steps }: { steps: QualityPoint[] }) {
  return (
    <div>
      <p className="animate-tab-item text-sm text-brand-ink/60" style={stagger(0)}>
        From the source to your doorstep, step by step.
      </p>
      <ol className="mt-6 max-w-2xl">
        {steps.map(({ title, text }, index) => (
          <li key={title} className="animate-tab-item relative flex gap-4 pb-6 last:pb-0" style={stagger(index + 1)}>
            {index < steps.length - 1 && (
              <span className="absolute left-[15px] top-9 h-[calc(100%-2.5rem)] w-px bg-brand-sand-dark" aria-hidden="true" />
            )}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-forest font-serif text-sm font-semibold text-brand-forest tabular-nums">
              {index + 1}
            </span>
            <div className="pt-1">
              <p className="text-sm font-semibold text-brand-ink">{title}</p>
              <p className="mt-0.5 text-sm leading-6 text-brand-ink/70">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Product information, quality checks and process in one card, switched by tabs. */
export function ProductDetailsTabs({
  sections,
  name,
  origin,
  processing,
}: {
  sections: ProductInfoSection[];
  name: string;
  origin: ProductOrigin;
  processing: ProductProcessing;
}) {
  const { checks, steps } = qualityProcessContent(name, origin, processing);
  const tabs: Tab[] = [
    ...sections.map((section, index) => ({ id: `info-${index}`, title: section.title, render: () => <InfoPanel section={section} /> })),
    { id: "quality", title: "Quality Check", render: () => <ChecksPanel checks={checks} /> },
    { id: "process", title: "How We Process", render: () => <StepsPanel steps={steps} /> },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const active = tabs[Math.min(activeIndex, tabs.length - 1)];

  // Slide the underline under the active tab, and keep that tab in view on narrow screens.
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeIndex];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    // Scrolls only the tab strip sideways (scrollIntoView would also scroll the page to it).
    const list = listRef.current;
    const el = tabRefs.current[activeIndex];
    if (list && el && (el.offsetLeft < list.scrollLeft || el.offsetLeft + el.offsetWidth > list.scrollLeft + list.clientWidth)) {
      list.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, tabs.length]);

  const select = (index: number) => {
    setActiveIndex(index);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = tabs.length - 1;
    const focused = tabRefs.current.findIndex((el) => el === document.activeElement);
    const from = focused === -1 ? activeIndex : focused;
    const next = { ArrowRight: from === last ? 0 : from + 1, ArrowLeft: from === 0 ? last : from - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-sand-dark bg-white">
      <div className="border-b border-brand-sand-dark">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Product details"
          onKeyDown={onKeyDown}
          className="relative flex overflow-x-auto px-3 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "shrink-0 whitespace-nowrap px-3 py-4 font-serif text-[15px] transition-colors sm:px-4 sm:text-base cursor-pointer",
                  selected ? "font-semibold text-brand-forest" : "text-brand-ink/55 hover:text-brand-ink",
                )}
              >
                {tab.title}
              </button>
            );
          })}
          {indicator && (
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-0.5 rounded-full bg-brand-gold motion-safe:transition-[transform,width] motion-safe:duration-300 motion-safe:ease-out"
              style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
            />
          )}
        </div>
      </div>

      {/* key remounts the panel so its entrance animation plays on every switch */}
      <div
        key={active.id}
        id={`panel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${active.id}`}
        className="animate-tab-in p-5 sm:p-8"
      >
        <h2 className="sr-only">{active.title}</h2>
        {active.render()}
      </div>
    </section>
  );
}
