import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ToastViewport } from "@/components/layout/ToastViewport";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { DeliverySheet } from "@/components/layout/DeliverySheet";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suvarna7 — Pure Indian Goodness",
  description:
    "Pure Indian honey, ghee, saffron and dry fruits — sourced responsibly, delivered fresh across India.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Suvarna7",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3d2b1c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col bg-brand-sand text-brand-ink overscroll-y-contain pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] lg:pb-0"
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <ToastViewport />
          <MobileBottomNav />
          <DeliverySheet />
        </Providers>
      </body>
    </html>
  );
}
