import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DeliverySheet } from "@/components/layout/DeliverySheet";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { getStoreSettings } from "@/lib/api/settings";

/** Customer-facing pages. The (store) folder is a route group, so it doesn't appear in URLs. */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { announcement_text } = await getStoreSettings();
  return (
    // Bottom padding keeps content clear of the fixed mobile tab bar.
    <div className="flex flex-1 flex-col pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] lg:pb-0">
      <AnnouncementBar text={announcement_text} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <DeliverySheet />
      <WhatsAppButton />
    </div>
  );
}
