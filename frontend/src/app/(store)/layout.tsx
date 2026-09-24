import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DeliverySheet } from "@/components/layout/DeliverySheet";

/** Customer-facing pages. The (store) folder is a route group, so it doesn't appear in URLs. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    // Bottom padding keeps content clear of the fixed mobile tab bar.
    <div className="flex flex-1 flex-col pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <DeliverySheet />
    </div>
  );
}
