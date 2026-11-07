"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";
import type { HomeBanner } from "@/types/home";
import type { Product, WeightVariant } from "@/types/product";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { formatInr } from "@/lib/utils/format";
import { PriceTag } from "@/components/ui/PriceTag";
import { RatingStars } from "@/components/ui/RatingStars";
import { WeightVariantSelector } from "@/components/ui/WeightVariantSelector";

const wordmarkFont = Cormorant_Garamond({ weight: ["500", "600"], style: ["normal", "italic"], subsets: ["latin"], display: "swap" });

interface Cutout {
  src: string;
  width: number;
  height: number;
  /** Size next to the other jars: the small saffron jar stands shorter than the big jars and pouches. */
  scale: number;
  /** Short line under the name. */
  line: string;
}

/**
 * Background-free photos of the products that stand on the shelf, by product slug. A product shows on the shelf
 * only when it has one here; the shelf follows the product order set in Admin → Products.
 */
const CUTOUTS: Record<string, Cutout> = {
  "kashmiri-kesar-saffron": { src: "/images/hero/pantry/saffron.webp", width: 924, height: 829, scale: 0.68, line: "Hand-picked at dawn from our own fields" },
  "kashmir-acacia-honey": { src: "/images/hero/pantry/acacia.webp", width: 703, height: 900, scale: 1, line: "Light, clear honey from spring acacia blossoms" },
  "kashmir-wild-forest-honey": { src: "/images/hero/pantry/honey.webp", width: 724, height: 900, scale: 1, line: "From the wild forests of the Kashmir hills" },
  "buffalo-bilona-ghee": { src: "/images/hero/pantry/buffalo.webp", width: 681, height: 900, scale: 1, line: "Slow-cooked for a danedar grain" },
  "gir-cow-bilona-ghee": { src: "/images/hero/pantry/ghee.webp", width: 751, height: 900, scale: 1, line: "Churned from dahi, never cream" },
  "kashmiri-almonds-badam": { src: "/images/hero/pantry/almonds.webp", width: 608, height: 900, scale: 1, line: "From the pink-blossom orchards of Kashmir" },
  "kashmiri-walnut-kernels-akhrot": { src: "/images/hero/pantry/walnuts.webp", width: 596, height: 900, scale: 1, line: "Light, buttery kernels from old walnut trees" },
};

const firstInStock = (product: Product) => product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];

/**
 * The home page banner: the Suvarna 7 shelf. Every product with a background-free photo stands on one wooden shelf,
 * all in view at once, and the page scrolls past it normally. A mouse over a jar lifts it a little and shows its
 * name and price under the shelf; selecting a jar opens its details (pack sizes, price, Add to Cart) without leaving
 * the page. On a narrow screen the shelf scrolls sideways.
 */
export function PantryHero({ banner, products }: { banner: HomeBanner; products: Product[] }) {
  const items = products.flatMap((product) => {
    const cutout = CUTOUTS[product.slug];
    return cutout && product.variants.length ? [{ product, cutout }] : [];
  });
  const count = items.length;

  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  if (!count) return <h1 className="sr-only">{banner.title}</h1>;

  // How wide the whole row is, in jar heights, so the jars can be sized to fit the shelf in one row.
  const rowRatio = items.reduce((sum, { cutout }) => sum + (cutout.scale * cutout.width) / cutout.height, 0);
  const shown = hovered === null ? null : items[hovered];
  const variant = shown && firstInStock(shown.product);

  return (
    <section className="pantry" aria-label="Suvarna 7 products"
      style={{ "--pantry-count": count, "--pantry-ratio": rowRatio.toFixed(3) } as CSSProperties}>
      <h1 className="sr-only">{banner.title}</h1>
      <div className="pantry-head" aria-hidden="true">
        <p className={`pantry-title ${wordmarkFont.className}`}>Suvarna<span className="pantry-title-seven">7</span></p>
        <p className="pantry-tagline">From Kashmir &amp; Gujarat</p>
      </div>

      <div className="pantry-rail">
        <div className="pantry-row">
          {items.map(({ product, cutout }, index) => (
            <button key={product.slug} type="button" className="pantry-jar"
              aria-label={`${product.name}, from ${formatInr(firstInStock(product).price)}. Show details`}
              aria-haspopup="dialog"
              style={{ height: `calc(var(--jar-height) * ${cutout.scale})`, aspectRatio: `${cutout.width} / ${cutout.height}` }}
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(index); }}
              onPointerLeave={(event) => { if (event.pointerType === "mouse") setHovered(null); }}
              onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) setHovered(index); }}
              onBlur={() => setHovered(null)}
              onClick={() => setSelected(index)}>
              <span className="pantry-jar-body">
                <Image src={cutout.src} alt="" fill sizes="(max-width: 640px) 40vw, 16vw" loading="eager" draggable={false} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="pantry-caption" aria-live="polite">
        {shown && variant ? (
          <p key={shown.product.slug} className="pantry-caption-text">
            <span className="pantry-caption-name">{shown.product.name}</span>
            <span className="pantry-caption-meta">
              {variant.label} · <span className="pantry-caption-price">{formatInr(variant.price)}</span> · {shown.cutout.line}
            </span>
          </p>
        ) : (
          <p className="pantry-caption-text pantry-caption-hint">
            <span className="pantry-caption-name">
              <span className="pantry-hint-mouse">Hover over a jar to see what&apos;s inside</span>
              <span className="pantry-hint-touch">Tap a jar to see what&apos;s inside</span>
            </span>
            <span className="pantry-caption-meta">Saffron, honey, almonds and walnuts from Kashmir, and bilona ghee from Gujarat</span>
          </p>
        )}
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
    // The page behind stays put while the details are open, so it doesn't scroll underneath.
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
