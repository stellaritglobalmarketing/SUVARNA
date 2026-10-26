import type { ProductDetail, ProductInfoSection } from "@/types/product";

/** The public storefront address, for canonical links, the sitemap and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://suvarna7.com").trim().replace(/\/$/, "");

/** Site-relative paths ("/images/…") become full URLs; full URLs pass through. */
export function absoluteUrl(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** The product-information block titled "FAQs" (or "FAQ", "Frequently asked questions") holds questions and answers. */
export function isFaqSection(section: ProductInfoSection): boolean {
  return /^(faqs?\b|frequently asked)/i.test(section.title.trim());
}

/** Google Product schema (price, availability, free delivery) plus FAQ schema when the page has FAQs. */
export function productJsonLd(product: ProductDetail): object[] {
  const url = `${SITE_URL}/products/${product.slug}`;
  const [minDays, maxDays] = product.deliveryEstimateDays;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.metaDescription || product.shortDescription || product.tagline,
    image: product.images.map(absoluteUrl),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "Suvarna7" },
    url,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      name: `${product.name} ${variant.label}`,
      sku: variant.sku,
      price: variant.price,
      priceCurrency: "INR",
      availability: variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: minDays, maxValue: maxDays, unitCode: "DAY" },
        },
      },
    })),
  };

  const faqItems = product.infoSections.find(isFaqSection)?.items.filter((item) => item.label) ?? [];
  if (faqItems.length === 0) return [productSchema];

  return [
    productSchema,
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.label,
        acceptedAnswer: { "@type": "Answer", text: item.text },
      })),
    },
  ];
}
