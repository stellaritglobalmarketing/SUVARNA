"use client";

import { getImageProps } from "next/image";import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import type { HomeBanner } from "@/types/home";

const BANNERS = [
  { src: "/images/hero/products-banner-v2.webp", href: "#products", label: "Shop the collection", alt: "Suvarna7. Goodness in every bite. Saffron, dry fruits, honey & ghee. Shop the collection." },
  { src: "/images/hero/hampers-banner-v2.webp", href: "#hampers", label: "Explore hampers", alt: "Suvarna7. A gift of pure goodness. Thoughtfully curated. Beautifully gifted. Explore hampers." },
];

export function Hero({ banner, hasHampers }: { banner: HomeBanner; hasHampers: boolean }) {
  const slides = hasHampers ? BANNERS : BANNERS.slice(0, 1);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const fadeRef = useRef<HTMLDivElement>(null);
  const transitioning = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const touchStart = useRef<number | null>(null);
  const swiped = useRef(false);
  const current = active % slides.length;

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".store-header");
    if (!header) return;
    const updateHeight = () => sectionRef.current?.style.setProperty("--store-header-height", `${header.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const changeBanner = useCallback(async (index: number) => {
    if (index === active || transitioning.current) return;
    const overlay = fadeRef.current;
    if (reducedMotion || !overlay) { setActive(index); return; }
    transitioning.current = true;
    try {
      const fadeIn = overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 850, easing: "ease-in-out", fill: "forwards" });
      await fadeIn.finished;
      setActive(index);
      const fadeOut = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1150, easing: "ease-in-out", fill: "forwards" });
      await fadeOut.finished;
      fadeIn.cancel();
      fadeOut.cancel();
    } catch {
      // Animation cancellation is expected when navigating away.
    } finally {
      transitioning.current = false;
    }
  }, [active, reducedMotion]);

  useEffect(() => {
    const overlay = fadeRef.current;
    return () => overlay?.getAnimations().forEach((animation) => animation.cancel());
  }, []);

  useEffect(() => {
    if (hovered || focused || reducedMotion || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void changeBanner((active + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [active, hovered, focused, reducedMotion, slides.length, changeBanner]);

  const move = (direction: number) => {
    void changeBanner((active + direction + slides.length) % slides.length);
  };

  const scrollToSection = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (swiped.current) { event.preventDefault(); swiped.current = false; return; }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    event.preventDefault();
    window.history.replaceState(null, "", href);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  };

  return (
    <section ref={sectionRef} className="store-hero" aria-label="Suvarna collections">
      <h1 className="sr-only">{banner.title}</h1>
      <div className="hero-gallery" role="region" aria-roledescription="carousel" aria-label="Shop products and gift hampers"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; swiped.current = false; }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(event) => {
          if (touchStart.current !== null) {
            const distance = touchStart.current - event.changedTouches[0].clientX;
            if (Math.abs(distance) > 40) { swiped.current = true; move(distance > 0 ? 1 : -1); }
          }
          touchStart.current = null;
        }}>
        <div className="hero-photographs">
          {slides.map((slide, index) => (
            <a key={slide.src} href={slide.href} className={`hero-slide ${index === current ? "is-active" : ""}`}
              aria-label={slide.label} aria-hidden={index !== current} tabIndex={index === current ? 0 : -1}
              onClick={(event) => scrollToSection(event, slide.href)} draggable={false}>
              <BannerArtwork slide={slide} first={index === 0} />
            </a>
          ))}
        </div>
        <div ref={fadeRef} className="hero-white-fade" aria-hidden="true" />
        {slides.length > 1 && <div className="hero-controls">
          <div className="hero-pagination">
            {slides.map((slide, index) => <button key={slide.src} type="button" className={`hero-dot ${index === current ? "is-active" : ""}`} aria-label={`Show ${index === 0 ? "products" : "hampers"} banner`} aria-pressed={index === current} onClick={() => { void changeBanner(index); }} />)}
          </div>
        </div>}
      </div>
    </section>
  );
}

function BannerArtwork({ slide, first }: { slide: typeof BANNERS[number]; first: boolean }) {
  const common = { alt: slide.alt, sizes: "100vw", loading: "eager" as const, fetchPriority: first ? "high" as const : "auto" as const };
  const { props: desktop } = getImageProps({ ...common, src: slide.src, width: 2172, height: 724 });
  return (
    <picture>
      {/* getImageProps supplies Next's optimized responsive image URLs. */}
      <img {...desktop} alt={slide.alt} className="hero-artwork" draggable={false} />
    </picture>
  );
}
