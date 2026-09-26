"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RatingStars } from "@/components/ui/RatingStars";
import type { HomeTestimonial } from "@/types/home";

const arrowClass = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-walnut/40 bg-white text-brand-forest transition hover:border-brand-walnut hover:bg-brand-sand disabled:pointer-events-none disabled:opacity-35";

/** Curated homepage testimonials — distinct from PDP reviews, not tied to one product. */
export function Testimonials({ testimonials }: { testimonials: HomeTestimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateArrows, testimonials.length]);

  const scroll = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = card ? card.offsetWidth + gap : track.clientWidth;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * step, behavior: reducedMotion ? "instant" : "smooth" });
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="border-y border-brand-sand-dark bg-[#f7f4ed] py-12 sm:py-16">
      <Container>
        <SectionHeading eyebrow="At Your Table" title="What Our Customers Say" align="center" />
        <div className="mt-10 flex items-center gap-2 sm:gap-4">
          <button type="button" className={arrowClass} aria-label="Previous reviews" onClick={() => scroll(-1)} disabled={!canPrev}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div ref={trackRef} onScroll={updateArrows}
            className="relative flex min-w-0 flex-1 snap-x snap-mandatory gap-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.name} className="flex shrink-0 basis-full snap-start flex-col border-t border-brand-walnut/40 py-6 sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-4.5rem)/4)]">
                <blockquote className="flex-1 font-serif text-lg leading-relaxed text-brand-ink/80">&ldquo;{testimonial.quote}&rdquo;</blockquote>
                <RatingStars rating={testimonial.rating} size={12} className="mt-4" />
                <figcaption className="mt-2 text-sm">
                  <span className="font-semibold text-brand-forest">{testimonial.name}</span>
                  {testimonial.location && <span className="block text-xs text-brand-ink/50">{testimonial.location}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
          <button type="button" className={arrowClass} aria-label="Next reviews" onClick={() => scroll(1)} disabled={!canNext}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </Container>
    </section>
  );
}
