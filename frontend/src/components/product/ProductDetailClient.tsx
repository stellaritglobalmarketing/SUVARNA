"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useProduct } from "@/hooks/useProduct";
import { useReviews } from "@/hooks/useReviews";
import { useAppDispatch } from "@/lib/redux/hooks";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { pushToast } from "@/lib/redux/slices/uiSlice";
import { addRecentlyViewed } from "@/lib/redux/slices/recentlyViewedSlice";
import { formatDiscount, formatInr } from "@/lib/utils/format";

import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { PriceTag } from "@/components/ui/PriceTag";
import { WeightVariantSelector } from "@/components/ui/WeightVariantSelector";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

import { ProductGallery } from "./ProductGallery";
import { CertificationBadges } from "./CertificationBadges";
import { NutrientTable } from "./NutrientTable";
import { NutrientDonut } from "./NutrientDonut";
import { PincodeChecker } from "./PincodeChecker";
import { FrequentlyBoughtTogether } from "./FrequentlyBoughtTogether";
import { StorageTips } from "./StorageTips";
import { SimilarProducts } from "./SimilarProducts";
import { ReviewSummary } from "./ReviewSummary";
import { ReviewList } from "./ReviewList";

export function ProductDetailClient({ slug }: { slug: string }) {
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: reviewsData } = useReviews(slug);
  const dispatch = useAppDispatch();

  const [selectedVariantLabel, setSelectedVariantLabel] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) dispatch(addRecentlyViewed(product.slug));
  }, [product, dispatch]);

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Container>
    );
  }

  if (isError || !product) {
    return (
      <Container className="py-20 text-center">
        <p className="text-lg font-medium text-brand-forest">Product not found.</p>
      </Container>
    );
  }

  const selectedVariant =
    product.variants.find((variant) => variant.label === selectedVariantLabel) ??
    product.variants.find((variant) => variant.stock > 0) ??
    product.variants[0];

  const lowStock = selectedVariant.stock > 0 && selectedVariant.stock <= 15;

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        image: product.images[0] ?? "",
        variantLabel: selectedVariant.label,
        unitPrice: selectedVariant.price,
        unitMrp: selectedVariant.mrp,

        variantId: selectedVariant.id,
        quantity,
      }),
    );
    dispatch(pushToast(`${product.name} (${selectedVariant.label}) added to cart`, "success"));
  };

  return (
    <div className="pb-32 lg:pb-0">
      <Container className="py-6 sm:py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images} gradient={product.gradient} name={product.name} />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {product.isBestSeller && <Badge tone="gold">Best Seller</Badge>}
              <Badge tone="forest">{product.origin} Origin</Badge>
              <Badge tone="neutral">{product.processing}</Badge>
            </div>

            <h1 className="font-serif text-3xl font-bold text-brand-forest sm:text-4xl">{product.name}</h1>
            <p className="text-brand-ink/70">{product.tagline}</p>
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} />

            <CertificationBadges certifications={product.certifications} />

            <div className="mt-2">
              <p className="mb-2 text-sm font-semibold text-brand-ink">Select Weight</p>
              <WeightVariantSelector
                variants={product.variants}
                selected={selectedVariant}
                onSelect={(variant) => setSelectedVariantLabel(variant.label)}
              />
            </div>

            <PriceTag price={selectedVariant.price} mrp={selectedVariant.mrp} size="lg" />

            {lowStock && (
              <p className="text-sm font-medium text-red-600">Only {selectedVariant.stock} packs left in fresh batch</p>
            )}
            <p className="text-xs text-brand-ink/50">
              Estimated delivery in {product.deliveryEstimateDays[0]}–{product.deliveryEstimateDays[1]} days
            </p>

            <div className="flex items-center gap-3 pt-2">
              <QuantityStepper quantity={quantity} onChange={setQuantity} max={selectedVariant.stock || 1} />
              <Button onClick={handleAddToCart} disabled={selectedVariant.stock === 0} size="lg" className="flex-1">
                <ShoppingBag size={18} /> {selectedVariant.stock === 0 ? "Sold Out" : "Add to Cart"}
              </Button>
            </div>

            <PincodeChecker />

            <p className="text-sm leading-relaxed text-brand-ink/70">{product.description}</p>
          </div>
        </div>
      </Container>

      <Container className="py-6">
        <FrequentlyBoughtTogether mainProduct={product} companions={product.frequentlyBoughtWithProducts} />
      </Container>

      <Container className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-xl font-semibold text-brand-forest">Nutrient Breakdown</h2>
          <p className="mt-1 text-sm text-brand-ink/60">Macro &amp; micro nutrients per 100g serving.</p>
          <div className="mt-4">
            <NutrientTable nutrients={product.nutrients} />
          </div>
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold text-brand-forest">Lipid Profile</h2>
          <p className="mt-1 text-sm text-brand-ink/60">Fat composition breakdown by weight.</p>
          <div className="mt-4">
            <NutrientDonut items={product.lipidBreakdown} />
          </div>
        </div>
      </Container>

      <Container className="pb-6">
        <StorageTips tips={product.storageTips} />
      </Container>

      <Container className="py-10">
        <h2 className="font-serif text-xl font-semibold text-brand-forest">Verified Buyer Reviews</h2>
        <div className="mt-4 space-y-6">
          {reviewsData && (
            <>
              {product.reviewCount > 0 && (
                <ReviewSummary rating={product.rating} reviewCount={product.reviewCount} breakdown={reviewsData.breakdown} />
              )}
              <ReviewList reviews={reviewsData.reviews} />
            </>
          )}
        </div>
      </Container>

      <Container className="py-10">
        <SimilarProducts products={product.similarProducts} />
      </Container>

      <div className="fixed inset-x-3 bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+0.5rem)] z-30 mx-auto grid max-w-xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-brand-sand-dark bg-white p-3 shadow-[0_4px_24px_rgba(61,43,28,0.14)] lg:hidden">
        <div className="min-w-0" aria-live="polite" aria-atomic="true">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
            <span className="text-xl font-bold leading-tight text-brand-forest">{formatInr(selectedVariant.price)}</span>
            {selectedVariant.mrp > selectedVariant.price && (
              <span className="text-xs text-brand-ink/45 line-through">{formatInr(selectedVariant.mrp)}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] text-brand-ink/60">{selectedVariant.label} pack</span>
            {selectedVariant.mrp > selectedVariant.price && (
              <span className="whitespace-nowrap rounded-md bg-brand-sand px-1.5 py-0.5 text-[10px] font-semibold text-brand-walnut-dark">
                {formatDiscount(selectedVariant.price, selectedVariant.mrp)}% off
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={selectedVariant.stock === 0}
          className="flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-forest px-4 py-3 text-sm font-semibold text-brand-sand shadow-sm transition-colors active:bg-brand-forest-light disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <ShoppingBag size={18} className="shrink-0" aria-hidden="true" />
          {selectedVariant.stock === 0 ? "Sold Out" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
