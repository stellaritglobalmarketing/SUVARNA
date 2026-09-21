import { Hero } from "@/components/home/Hero";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrustBadges } from "@/components/home/TrustBadges";
import { QuickActions } from "@/components/home/QuickActions";
import { CategoryChips } from "@/components/home/CategoryChips";
import { BestSellers } from "@/components/home/BestSellers";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { ShopByHealthGoal } from "@/components/home/ShopByHealthGoal";
import { ComboDeals } from "@/components/home/ComboDeals";
import { GiftCollectionBanner } from "@/components/home/GiftCollectionBanner";
import { TrustSection } from "@/components/home/TrustSection";
import { Testimonials } from "@/components/home/Testimonials";
import { FAQSection } from "@/components/home/FAQSection";

export default function Home() {
  return (
    <>
      <Hero />
      <PromoBanner />
      <TrustBadges />
      <QuickActions />
      <CategoryChips />
      <BestSellers />
      <FeaturedProducts />
      <RecentlyViewed />
      <ShopByHealthGoal />
      <ComboDeals />
      <GiftCollectionBanner />
      <TrustSection />
      <Testimonials />
      <FAQSection />
    </>
  );
}
