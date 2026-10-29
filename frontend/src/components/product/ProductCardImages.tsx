"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { cn } from "@/lib/utils/cn";

/**
 * A product card's photo area: one photo, or a swipeable slide per photo when the product has several.
 * Every slide links to the product page. Arrows show on hover (desktop); touch screens swipe.
 */
export function ProductCardImages({
  images,
  href,
  name,
  imageAlt,
  gradient,
}: {
  images: string[];
  href: string;
  name: string;
  /** Alt text of the main (first) photo. */
  imageAlt?: string;
  gradient: [string, string];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = images.length ? images : [""];

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-ink opacity-0 shadow-sm transition-opacity group-hover/slides:opacity-100 focus-visible:opacity-100 sm:flex cursor-pointer";

  return (
    <div className="group/slides absolute inset-0">
      <Link href={href} className="block h-full w-full">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((src, index) => (
            <div key={`${index}-${src}`} className="h-full w-full shrink-0 snap-start">
              <ProductImagePlaceholder
                src={src || undefined}
                alt={index === 0 ? imageAlt || name : `${name} view ${index + 1}`}
                gradient={gradient}
                className="h-full w-full"
              />
            </div>
          ))}
        </div>
      </Link>

      {slides.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button type="button" onClick={() => scrollToIndex(activeIndex - 1)} aria-label={`Previous photo of ${name}`} className={cn(arrowClass, "left-2")}>
              <ChevronLeft size={16} />
            </button>
          )}
          {activeIndex < slides.length - 1 && (
            <button type="button" onClick={() => scrollToIndex(activeIndex + 1)} aria-label={`Next photo of ${name}`} className={cn(arrowClass, "right-2")}>
              <ChevronRight size={16} />
            </button>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-11 flex justify-center gap-1 sm:bottom-3">
            {slides.map((src, index) => (
              <span
                key={`${index}-${src}`}
                className={cn(
                  "h-1.5 rounded-full shadow-sm transition-all",
                  index === activeIndex ? "w-4 bg-brand-forest" : "w-1.5 bg-white/90",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
