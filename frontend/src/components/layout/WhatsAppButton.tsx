"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { cn } from "@/lib/utils/cn";

/** Floating "Chat on WhatsApp" button on every store page, to the number in Admin → Settings. */
export function WhatsAppButton() {
  const pathname = usePathname();
  const store = useStoreSettings();
  // Product pages have a sticky Add to Cart bar above the mobile tab bar; sit above both.
  const onProductPage = pathname.startsWith("/products/");

  return (
    <a
      href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent("Hi Suvarna7, ")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat on WhatsApp (${store.whatsapp_display})`}
      title="Chat on WhatsApp"
      className={cn(
        "fixed right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_4px_16px_rgba(0,0,0,0.22)] transition-transform hover:scale-105 lg:bottom-6 lg:right-6 lg:h-14 lg:w-14",
        onProductPage
          ? "bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+6.5rem)]"
          : "bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+1rem)]",
      )}
    >
      <MessageCircle size={26} strokeWidth={2.2} aria-hidden="true" />
    </a>
  );
}
