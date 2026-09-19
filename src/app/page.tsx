import { Hero } from "@/components/home/Hero";
import { PromoBanner } from "@/components/home/PromoBanner";
import { QuickActions } from "@/components/home/QuickActions";
import { CategoryChips } from "@/components/home/CategoryChips";
import { BestSellers } from "@/components/home/BestSellers";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { ShopByHealthGoal } from "@/components/home/ShopByHealthGoal";
import { GiftCollectionBanner } from "@/components/home/GiftCollectionBanner";
import { TrustSection } from "@/components/home/TrustSection";
import { Testimonials } from "@/components/home/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <PromoBanner />
      <QuickActions />
      <CategoryChips />
      <BestSellers />
      <FeaturedProducts />
      <ShopByHealthGoal />
      <GiftCollectionBanner />
      <TrustSection />
      <Testimonials />
    </>
  );
}
