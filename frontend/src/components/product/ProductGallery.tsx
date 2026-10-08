"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { cn } from "@/lib/utils/cn";

type Media = { type: "image" | "video"; src: string };

function GalleryVideo({ src, name, className }: { src: string; name: string; className?: string }) {
  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label={`${name} video`}
      className={cn("h-full w-full bg-black object-contain", className)}
    />
  );
}

/** Still frame for a video thumbnail, with a play badge. */
function VideoThumb({ src }: { src: string }) {
  return (
    <div className="relative h-full w-full bg-black">
      <video src={`${src}#t=0.5`} muted playsInline preload="metadata" tabIndex={-1} className="pointer-events-none h-full w-full object-cover opacity-90" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-forest shadow">
          <Play size={14} className="ml-0.5" fill="currentColor" />
        </span>
      </span>
    </div>
  );
}

export function ProductGallery({
  images,
  videos = [],
  gradient,
  name,
}: {
  images: string[];
  videos?: string[];
  gradient: [string, string];
  name: string;
}) {
  // Photos first (the primary photo leads), then videos. With nothing at all, one placeholder slide.
  const media: Media[] = [
    ...images.map((src) => ({ type: "image" as const, src })),
    ...videos.map((src) => ({ type: "video" as const, src })),
  ];
  if (media.length === 0) media.push({ type: "image", src: "" });

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Stop a playing video once the shopper moves to another slide.
  useEffect(() => {
    rootRef.current?.querySelectorAll<HTMLVideoElement>("video[data-slide]").forEach((video) => {
      if (Number(video.dataset.slide) !== activeIndex) video.pause();
    });
  }, [activeIndex]);

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

  const active = media[activeIndex] ?? media[0];

  return (
    <div ref={rootRef}>
      {/* Mobile: full-bleed swipe carousel with dot indicators */}
      <div className="lg:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {media.map((item, index) => (
            <div key={`${index}-${item.src}`} className="aspect-square w-full shrink-0 snap-start">
              {item.type === "video" ? (
                <video
                  data-slide={index}
                  src={item.src}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={`${name} video`}
                  className="h-full w-full bg-black object-contain"
                />
              ) : (
                <ProductImagePlaceholder
                  src={item.src || undefined}
                  alt={`${name} view ${index + 1}`}
                  gradient={gradient}
                  iconSize={56}
                  sizes="100vw"
                  className="h-full w-full"
                />
              )}
            </div>
          ))}
        </div>
        {media.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {media.map((item, index) => (
              <button
                key={`${index}-${item.src}`}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to ${item.type === "video" ? "video" : "view"} ${index + 1}`}
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

      {/* Desktop: main image or video + thumbnail strip */}
      <div className="hidden flex-col gap-3 lg:flex">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-brand-sand-dark">
          {active.type === "video" ? (
            // key remounts the player so switching videos starts the new one from the beginning.
            <GalleryVideo key={active.src} src={active.src} name={name} />
          ) : (
            <ProductImagePlaceholder src={active.src || undefined} alt={name} gradient={gradient} iconSize={56} className="h-full w-full" />
          )}
        </div>
        {media.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {media.map((item, index) => (
              <button
                key={`${index}-${item.src}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`${name} ${item.type === "video" ? "video" : "view"} ${index + 1}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  "aspect-square overflow-hidden rounded-xl border-2 transition-colors cursor-pointer",
                  index === activeIndex ? "border-brand-forest" : "border-transparent",
                )}
              >
                {item.type === "video" ? (
                  <VideoThumb src={item.src} />
                ) : (
                  <ProductImagePlaceholder src={item.src} alt="" gradient={gradient} iconSize={20} sizes="150px" className="h-full w-full opacity-90" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
