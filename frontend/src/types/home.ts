import type { Product } from "./product";

export interface HomeLink {
  label: string;
  href: string;
}

export interface HomeBanner {
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string;
  cta: HomeLink | null;
  secondaryCta: HomeLink | null;
}

/** Icon + text row (hero value props, trust badges, trust points). `icon` is a key from lib/utils/homeIcons. */
export interface HomeHighlight {
  icon: string;
  title: string;
  description: string | null;
}

export interface HomeHamper {
  slug: string;
  name: string;
  subtitle: string | null;
  imageUrl: string | null;
  /** Products pre-selected at qty 1 when this theme opens the hamper builder. */
  productSlugs: string[];
}

export interface HomeTestimonial {
  name: string;
  location: string | null;
  rating: number;
  quote: string;
}

export interface HomeFaq {
  question: string;
  answer: string;
}

export interface HomeData {
  hero: HomeBanner | null;
  promo: HomeBanner | null;
  heroHighlights: HomeHighlight[];
  trustBadges: HomeHighlight[];
  trustPoints: HomeHighlight[];
  products: Product[];
  featuredProducts: Product[];
  bestSellers: Product[];
  hampers: HomeHamper[];
  testimonials: HomeTestimonial[];
  faqs: HomeFaq[];
}
