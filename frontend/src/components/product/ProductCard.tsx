"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Clock, Heart, Star } from "lucide-react";
import { MdAddShoppingCart } from "react-icons/md";
import type { Product, WeightVariant } from "@/types/product";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { selectWishlistIds, toggleWishlist } from "@/lib/redux/slices/wishlistSlice";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { WeightVariantSelector } from "@/components/ui/WeightVariantSelector";
import { RatingStars } from "@/components/ui/RatingStars";
import { PriceTag } from "@/components/ui/PriceTag";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const wishlistIds = useAppSelector(selectWishlistIds);
  const isWishlisted = wishlistIds.includes(product.slug);
  const inStockVariants = product.variants;
  const [selectedVariant, setSelectedVariant] = useState(
    inStockVariants.find((variant) => variant.stock > 0) ?? inStockVariants[0],
  );

  const addVariantToCart = (variant: WeightVariant) => {
    dispatch(
      addToCart({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        image: product.images[0] ?? "",
        variantLabel: variant.label,
        unitPrice: variant.price,
        unitMrp: variant.mrp,

        variantId: variant.id,
      }),
    );
    dispatch(pushToast(`${product.name} (${variant.label}) added to cart`, "success"));
  };

  const toggleHeart = () => dispatch(toggleWishlist(product.slug));

  const purityLabel = product.certifications.find((cert) => cert.label.startsWith("100%"))?.label;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-sand-dark bg-white transition-shadow sm:hover:shadow-lg">
      {/* Compact app-style card — quick-commerce density for mobile browsing */}
      <div className="sm:hidden">
        <div className="relative aspect-square overflow-hidden">
          <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
            <ProductImagePlaceholder src={product.images[0]} alt={product.name} gradient={product.gradient} className="h-full w-full" />
          </Link>
          {(product.isBestSeller || product.discountPercent > 0) && (
            <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-brand-forest px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-sand">
              {product.discountPercent > 0 ? `${product.discountPercent}% OFF` : "Best Seller"}
            </span>
          )}
          {inStockVariants.length > 1 ? (
            <select
              value={selectedVariant.label}
              onChange={(event) => {
                const next = inStockVariants.find((variant) => variant.label === event.target.value);
                if (next) setSelectedVariant(next);
              }}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Select pack size for ${product.name}`}
              className="absolute bottom-2 left-2 z-10 rounded-md border-0 bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink shadow-sm cursor-pointer"
            >
              {inStockVariants.map((variant) => (
                <option key={variant.label} value={variant.label} disabled={variant.stock === 0}>
                  {variant.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink shadow-sm">
              {selectedVariant.label}
            </span>
          )}

          <button
            type="button"
            onClick={toggleHeart}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-sm cursor-pointer"
          >
            <Heart size={13} className={cn(isWishlisted && "fill-red-500 text-red-500")} />
          </button>

          <button
            type="button"
            onClick={() => addVariantToCart(selectedVariant)}
            disabled={selectedVariant.stock === 0}
            aria-label={
              selectedVariant.stock === 0
                ? `${product.name} ${selectedVariant.label} is sold out`
                : `Add ${product.name} ${selectedVariant.label} to cart`
            }
            className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-forest bg-white text-brand-forest shadow-sm disabled:opacity-40 cursor-pointer"
          >
            <MdAddShoppingCart size={15} />
          </button>
        </div>

        <div className="px-2.5 pb-2 pt-2">
          <p className="text-sm font-bold text-brand-ink">
            {formatInr(selectedVariant.price)}
            {selectedVariant.mrp > selectedVariant.price && (
              <span className="ml-1 text-[11px] font-normal text-brand-ink/40 line-through">
                {formatInr(selectedVariant.mrp)}
              </span>
            )}
          </p>
          <Link href={`/products/${product.slug}`}>
            <p className="mt-0.5 truncate text-xs leading-snug text-brand-ink/80">{product.name}</p>
          </Link>
          {purityLabel && (
            <p className="mt-0.5 flex items-center gap-1 text-[9px] font-medium text-brand-forest">
              <BadgeCheck size={11} className="shrink-0 text-brand-gold" />
              <span className="truncate">{purityLabel}</span>
            </p>
          )}
          <div className="mt-1 flex items-center gap-2 text-[10px] text-brand-ink/50">
            {product.reviewCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Star size={10} className="fill-brand-gold text-brand-gold" />
                {product.rating} ({product.reviewCount})
              </span>
            )}
            <span className="flex items-center gap-0.5 text-brand-walnut-dark">
              <Clock size={10} />
              {product.deliveryEstimateDays[0]}–{product.deliveryEstimateDays[1]}d
            </span>
          </div>
        </div>
      </div>

      {/* Full storefront card — desktop / tablet */}
      <div className="relative hidden sm:flex sm:flex-1 sm:flex-col">
        <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden">
          <ProductImagePlaceholder src={product.images[0]} alt={product.name} gradient={product.gradient} className="h-full w-full" />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isBestSeller && <Badge tone="gold">Best Seller</Badge>}
            {product.discountPercent > 0 && <Badge tone="forest">{product.discountPercent}% OFF</Badge>}
          </div>
        </Link>

        <button
          type="button"
          onClick={toggleHeart}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow-sm cursor-pointer"
        >
          <Heart size={16} className={cn(isWishlisted && "fill-red-500 text-red-500")} />
        </button>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-walnut-dark">{product.origin} Origin</p>
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-serif text-lg font-semibold text-brand-forest leading-tight">{product.name}</h3>
          </Link>
          <RatingStars rating={product.rating} reviewCount={product.reviewCount} />

          {purityLabel && (
            <p className="flex items-center gap-1 text-xs font-medium text-brand-forest">
              <BadgeCheck size={14} className="shrink-0 text-brand-gold" />
              <span className="truncate">{purityLabel}</span>
            </p>
          )}

          <div className="mt-1">
            <WeightVariantSelector variants={inStockVariants} selected={selectedVariant} onSelect={setSelectedVariant} size="sm" />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            <PriceTag price={selectedVariant.price} mrp={selectedVariant.mrp} size="sm" />
            <button
              type="button"
              onClick={() => addVariantToCart(selectedVariant)}
              disabled={selectedVariant.stock === 0}
              aria-label={`Add ${product.name} ${selectedVariant.label} to cart`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-forest text-brand-sand transition-colors hover:bg-brand-forest-light disabled:opacity-40 cursor-pointer"
            >
              <MdAddShoppingCart size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
