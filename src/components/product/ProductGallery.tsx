"use client";

import { useRef, useState } from "react";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { cn } from "@/lib/utils/cn";

export function ProductGallery({
  images,
  gradient,
  name,
}: {
  images: string[];
  gradient: [string, string];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  return (
    <div>
      {/* Mobile: full-bleed swipe carousel with dot indicators */}
      <div className="lg:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div key={image} className="aspect-square w-full shrink-0 snap-start">
              <ProductImagePlaceholder
                src={image}
                alt={`${name} view ${index + 1}`}
                gradient={gradient}
                iconSize={56}
                sizes="100vw"
                className="h-full w-full"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to view ${index + 1}`}
                aria-current={index === activeIndex}
                className={cn(
                  "h-1.5 rounded-full transition-all cursor-pointer",
                  index === activeIndex ? "w-6 bg-brand-forest" : "w-1.5 bg-brand-sand-dark",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: main image + thumbnail strip */}
      <div className="hidden flex-col gap-3 lg:flex">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-brand-sand-dark">
          <ProductImagePlaceholder
            src={images[activeIndex] ?? images[0]}
            alt={name}
            gradient={gradient}
            iconSize={56}
            className="h-full w-full"
          />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${name} view ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  "aspect-square overflow-hidden rounded-xl border-2 transition-colors cursor-pointer",
                  index === activeIndex ? "border-brand-forest" : "border-transparent",
                )}
              >
                <ProductImagePlaceholder
                  src={image}
                  alt=""
                  gradient={gradient}
                  iconSize={20}
                  sizes="150px"
                  className="h-full w-full opacity-90"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
