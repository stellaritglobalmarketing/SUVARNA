"use client";

import { useHome } from "@/hooks/useHome";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Hero } from "./Hero";
import { PromoBanner } from "./PromoBanner";
import { AllProducts } from "./AllProducts";
import { CraftStory } from "./CraftStory";
import { CustomHampers } from "./CustomHampers";
import { giftPhoto } from "./DiwaliHampers";
import { TrustSection } from "./TrustSection";
import { FAQSection } from "./FAQSection";

/** Loads GET /product/home once and hands each section its slice; sections with no data render nothing. */
export function HomeContent() {
  const { data, isLoading, isError, refetch } = useHome();

  if (isLoading) return <HomeSkeleton />;

  if (isError || !data) {
    return (
      <Container className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-lg font-medium text-brand-forest">We couldn&apos;t load the store right now.</p>
        <p className="text-sm text-brand-ink/60">Please check your connection and try again.</p>
        <Button onClick={() => refetch()} variant="primary" className="mt-2">
          Try Again
        </Button>
      </Container>
    );
  }

  // Gift boxes (hampers that are products) show in the hamper section, not in the main product grid.
  const giftSlugs = new Set(data.hampers.map((hamper) => hamper.slug));
  const gridProducts = data.products.filter((product) => !giftSlugs.has(product.slug));
  // Gift box photos for the hero's Diwali slide, in hamper order.
  const giftPhotos = data.hampers.flatMap((hamper) => {
    const product = data.products.find((p) => p.slug === hamper.slug);
    const photo = product && giftPhoto(hamper, product);
    return photo ? [photo] : [];
  });

  return (
    <>
      {data.hero && <Hero banner={data.hero} hasHampers={data.products.length > 0} giftPhotos={giftPhotos} />}
      <CraftStory />
      <AllProducts products={gridProducts} />
      {data.promo && <PromoBanner banner={data.promo} />}
      <CustomHampers hampers={data.hampers} products={data.products} />
      <TrustSection points={data.trustPoints} />
      <FAQSection faqs={data.faqs} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      {/* Same footprint as the Hero / PromoBanner so the page doesn't jump when data lands */}
      <div className="min-h-[480px] bg-brand-sand lg:min-h-[580px]" />
      <Container className="pt-4 md:hidden">
        <Skeleton className="h-36 w-full rounded-2xl" />
      </Container>
      <Container className="py-4 sm:py-12">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-3 h-9 w-56" />
        <div className="mt-6 sm:mt-8">
          <ProductGridSkeleton count={8} />
        </div>
      </Container>
    </>
  );
}
