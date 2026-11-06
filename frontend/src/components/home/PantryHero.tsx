"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Alex_Brush, Anton } from "next/font/google";
import type { HomeBanner } from "@/types/home";
import type { Product, WeightVariant } from "@/types/product";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { formatInr } from "@/lib/utils/format";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { WeightVariantSelector } from "@/components/ui/WeightVariantSelector";

const scriptFont = Alex_Brush({ weight: "400", subsets: ["latin"], display: "swap" });
const blockFont = Anton({ weight: "400", subsets: ["latin"], display: "swap" });

interface Cutout {
  src: string;
  width: number;
  height: number;
  /** Size next to the other jars: the small saffron jar stands shorter than the big jars and pouches. */
  scale: number;
  /** Degrees a pouch leans while it's away from the middle. */
  lean: number;
  /** Short line under the name. */
  line: string;
}

/**
 * Background-free photos of the products that stand on the shelf, by product slug. A product shows on the shelf
 * only when it has one here; the shelf follows the product order set in Admin → Products.
 */
const CUTOUTS: Record<string, Cutout> = {
  "kashmiri-kesar-saffron": { src: "/images/hero/pantry/saffron.webp", width: 924, height: 829, scale: 0.68, lean: 0, line: "Hand-picked at dawn from our own fields" },
  "kashmir-acacia-honey": { src: "/images/hero/pantry/acacia.webp", width: 703, height: 900, scale: 1, lean: 0, line: "Light, clear honey from spring acacia blossoms" },
  "kashmir-wild-forest-honey": { src: "/images/hero/pantry/honey.webp", width: 724, height: 900, scale: 1, lean: 0, line: "From the wild forests of the Kashmir hills" },
  "buffalo-bilona-ghee": { src: "/images/hero/pantry/buffalo.webp", width: 681, height: 900, scale: 1, lean: 0, line: "Slow-cooked for a danedar grain" },
  "gir-cow-bilona-ghee": { src: "/images/hero/pantry/ghee.webp", width: 751, height: 900, scale: 1, lean: 0, line: "Churned from dahi, never cream" },
  "kashmiri-almonds-badam": { src: "/images/hero/pantry/almonds.webp", width: 608, height: 900, scale: 1, lean: -2.5, line: "From the pink-blossom orchards of Kashmir" },
  "kashmiri-walnut-kernels-akhrot": { src: "/images/hero/pantry/walnuts.webp", width: 596, height: 900, scale: 1, lean: 2.5, line: "Light, buttery kernels from old walnut trees" },
};

/** Share of each product's stretch of scrolling during which the shelf stands still on it. */
const DWELL = 0.3;
/** How quickly the shelf catches up with the scroll position, in ms; smooths out mouse-wheel jumps. */
const GLIDE_MS = 90;

/** Where the shelf should be for scroll progress `progress` (0 to 1): a product index, pausing on each one. */
function shelfPosition(progress: number, count: number) {
  const raw = progress * (count - 1);
  const index = Math.floor(raw);
  const within = (raw - index - DWELL / 2) / (1 - DWELL);
  const t = Math.min(1, Math.max(0, within));
  return index + t * t * (3 - 2 * t);
}

const firstInStock = (product: Product) => product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];

/**
 * The home page banner: the Kashmiri Pantry shelf. Background-free product photos stand on a wooden shelf. While
 * the page scrolls past, the shelf holds still on screen and the products walk along it from left to right: each
 * one pauses in the middle, largest, with its name and price underneath. Selecting a product opens its details
 * (pack sizes, price, Add to Cart) without leaving the page. A mouse over a product turns it; on a phone a
 * sideways swipe moves to the next product.
 */
export function PantryHero({ banner, products }: { banner: HomeBanner; products: Product[] }) {
  const items = products.flatMap((product) => {
    const cutout = CUTOUTS[product.slug];
    return cutout && product.variants.length ? [{ product, cutout }] : [];
  });
  const count = items.length;

  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // The shelf pins under the store header, so it needs the header's height (it changes between phone and desktop).
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".store-header");
    const section = sectionRef.current;
    if (!header || !section) return;
    const update = () => section.style.setProperty("--store-header-height", `${header.getBoundingClientRect().height}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const rail = railRef.current;
    if (!track || !rail || !count) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let spacing = 0;
    const measure = () => { spacing = rail.clientHeight * 0.74; };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(rail);

    const target = () => {
      const rect = track.getBoundingClientRect();
      const stage = track.firstElementChild as HTMLElement;
      const travel = rect.height - stage.offsetHeight;
      // The stage pins at its sticky offset (under the header), so progress counts from there.
      const pinnedAt = parseFloat(getComputedStyle(stage).top) || 0;
      const progress = travel > 0 ? Math.min(1, Math.max(0, (pinnedAt - rect.top) / travel)) : 0;
      return count > 1 ? shelfPosition(progress, count) : 0;
    };

    let position = target();
    let shown = -1;
    let previous = 0;
    let frame = 0;

    const place = () => {
      slotRefs.current.forEach((slot, index) => {
        if (!slot) return;
        const offset = index - position;
        const nearness = Math.max(0, 1 - Math.abs(offset));
        const scale = 0.92 * (1 + 0.16 * nearness);
        const lean = Number(slot.dataset.lean) * (1 - nearness);
        slot.style.transform = `translateX(calc(-50% + ${(offset * spacing).toFixed(1)}px)) rotate(${lean.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        slot.style.zIndex = String(20 - Math.round(Math.abs(offset)));
      });
      const nearest = Math.min(count - 1, Math.max(0, Math.round(position)));
      if (nearest !== shown) {
        shown = nearest;
        setActive(nearest);
      }
    };

    const tick = (now: number) => {
      const elapsed = previous ? now - previous : 16;
      previous = now;
      const goal = target();
      position = reducedMotion ? goal : position + (goal - position) * (1 - Math.exp(-elapsed / GLIDE_MS));
      if (Math.abs(goal - position) < 0.0005) position = goal;
      place();
      frame = requestAnimationFrame(tick);
    };

    place();
    // Only runs while the shelf is on screen.
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        previous = 0;
        frame = requestAnimationFrame(tick);
      }
    });
    visibility.observe(track);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
    };
  }, [count]);

  if (!count) return <h1 className="sr-only">{banner.title}</h1>;

  /** Scrolls the page to where product `index` stands in the middle of the shelf. */
  const scrollToProduct = (index: number, smooth = true) => {
    const track = trackRef.current;
    if (!track || count < 2) return;
    const stage = track.firstElementChild as HTMLElement;
    const travel = track.offsetHeight - stage.offsetHeight;
    const pinnedAt = parseFloat(getComputedStyle(stage).top) || 0;
    const top = track.getBoundingClientRect().top + window.scrollY - pinnedAt + (index / (count - 1)) * travel;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: smooth && !reducedMotion ? "smooth" : "instant" });
  };

  const shown = items[hovered ?? active];
  const variant = firstInStock(shown.product);

  return (
    <section ref={sectionRef} className="pantry" aria-label="Kashmiri Pantry" style={{ "--pantry-count": count } as CSSProperties}>
      <h1 className="sr-only">{banner.title}</h1>
      <div className="pantry-head" aria-hidden="true">
        <p className={`pantry-script ${scriptFont.className}`}>Kashmiri</p>
        <p className={`pantry-title ${blockFont.className}`}>Pantry</p>
      </div>
      <p className="pantry-intro">
        Saffron, honey, almonds and walnuts from the valley, and bilona ghee from Gujarat. Scroll to walk along the shelf,
        and pick a jar to see what&apos;s inside.
      </p>

      <div ref={trackRef} className="pantry-track">
        <div className="pantry-stage">
          <div ref={railRef} className="pantry-rail"
            onTouchStart={(event) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
            onTouchCancel={() => { touchStart.current = null; }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              touchStart.current = null;
              if (!start) return;
              const dx = start.x - event.changedTouches[0].clientX;
              const dy = start.y - event.changedTouches[0].clientY;
              // A sideways swipe moves one product along; up and down is ordinary page scrolling.
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                scrollToProduct(Math.min(count - 1, Math.max(0, active + (dx > 0 ? 1 : -1))));
              }
            }}>
            <div className="pantry-shelf" aria-hidden="true" />
            {items.map(({ product, cutout }, index) => (
              <button key={product.slug} type="button" className="pantry-jar"
                ref={(element) => { slotRefs.current[index] = element; }}
                data-lean={cutout.lean}
                aria-label={`${product.name}, from ${formatInr(firstInStock(product).price)}. Show details`}
                aria-haspopup="dialog"
                style={{ height: `calc(var(--jar-height) * ${cutout.scale})`, aspectRatio: `${cutout.width} / ${cutout.height}` }}
                onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(index); }}
                onPointerLeave={(event) => { if (event.pointerType === "mouse") setHovered(null); }}
                onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) scrollToProduct(index, false); }}
                onClick={() => setSelected(index)}>
                <span className="pantry-jar-body">
                  <Image src={cutout.src} alt="" fill sizes="(max-width: 640px) 50vw, 26vw" loading="eager" draggable={false} />
                </span>
              </button>
            ))}
          </div>

          <div className="pantry-caption">
            <p key={shown.product.slug} className="pantry-caption-text">
              <span className="pantry-caption-name">{shown.product.name}</span>
              <span className="pantry-caption-meta">
                {variant.label} · <span className="pantry-caption-price">{formatInr(variant.price)}</span> · {shown.cutout.line}
              </span>
            </p>
            <button type="button" className="pantry-caption-button" onClick={() => setSelected(hovered ?? active)}>
              View details
            </button>
            <div className="pantry-dots">
              {items.map(({ product }, index) => (
                <button key={product.slug} type="button" className={`pantry-dot ${index === active ? "is-active" : ""}`}
                  aria-label={`Go to ${product.name}`} aria-current={index === active || undefined}
                  onClick={() => scrollToProduct(index)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {selected !== null && (
        <PantryDetails key={items[selected].product.slug} product={items[selected].product} cutout={items[selected].cutout}
          onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

/** A product's details over the page: photo, rating, description, pack sizes, price and Add to Cart. */
function PantryDetails({ product, cutout, onClose }: { product: Product; cutout: Cutout; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [variant, setVariant] = useState<WeightVariant>(() => firstInStock(product));
  const soldOut = variant.stock === 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // The page behind stays put while the details are open, so the shelf doesn't move underneath.
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      if (dialog.open) dialog.close();
      opener?.focus({ preventScroll: true });
    };
  }, []);

  const add = () => {
    dispatch(addToCart({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      image: product.images[0] ?? "",
      variantLabel: variant.label,
      unitPrice: variant.price,
      unitMrp: variant.mrp,
      variantId: variant.id,
    }));
    dispatch(pushToast(`${product.name} (${variant.label}) added to cart`, "success"));
  };

  return (
    <dialog ref={dialogRef} className="pantry-dialog" aria-labelledby="pantry-dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="pantry-dialog-body">
        <button type="button" onClick={onClose} aria-label="Close" className="pantry-dialog-close">
          <X size={18} />
        </button>
        <div className="pantry-dialog-photo">
          <div className="pantry-dialog-jar" style={{ height: `${Math.round(100 * cutout.scale)}%`, aspectRatio: `${cutout.width} / ${cutout.height}` }}>
            <Image src={cutout.src} alt={product.imageAlt ?? product.name} fill sizes="(max-width: 640px) 60vw, 320px" />
          </div>
        </div>
        <div className="pantry-dialog-info">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-walnut-dark">{product.origin}</p>
          <h2 id="pantry-dialog-title" className="mt-1 font-serif text-2xl leading-tight text-brand-forest sm:text-3xl">{product.name}</h2>
          {product.reviewCount > 0 && <RatingStars rating={product.rating} reviewCount={product.reviewCount} className="mt-2" />}
          <p className="mt-3 text-sm leading-relaxed text-brand-ink/75">{product.shortDescription || product.tagline}</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-ink/60">Pack size</p>
          <div className="mt-2">
            <WeightVariantSelector variants={product.variants} selected={variant} onSelect={setVariant} size="sm" />
          </div>
          <PriceTag price={variant.price} mrp={variant.mrp} size="lg" className="mt-4" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={add} disabled={soldOut}
              className="rounded-lg bg-brand-forest px-5 py-3 text-sm font-semibold text-brand-sand transition-colors hover:bg-brand-forest-light disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
              {soldOut ? "Sold out" : "Add to Cart"}
            </button>
            <Link href={`/products/${product.slug}`} className="text-sm font-semibold text-brand-walnut-dark underline underline-offset-4 hover:text-brand-forest">
              View full details
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
