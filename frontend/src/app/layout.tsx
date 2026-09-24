import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastViewport } from "@/components/layout/ToastViewport";

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

/**
 * Shared by the storefront — app/(store)/layout.tsx adds its header, footer and cart — and the
 * admin panel — app/admin/layout.tsx adds its sidebar.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-brand-sand text-brand-ink overscroll-y-contain">
        <Providers>
          {children}
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
