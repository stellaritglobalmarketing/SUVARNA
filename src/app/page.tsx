import { Hero } from "@/components/home/Hero";
import { PromoBanner } from "@/components/home/PromoBanner";
import { TrustBadges } from "@/components/home/TrustBadges";
import { QuickActions } from "@/components/home/QuickActions";
import { AllProducts } from "@/components/home/AllProducts";
import { CustomHampers } from "@/components/home/CustomHampers";
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
      <AllProducts />
      <CustomHampers />
      <TrustSection />
      <Testimonials />
      <FAQSection />
    </>
  );
}
