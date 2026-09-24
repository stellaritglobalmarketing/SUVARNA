import type { HomeBanner, HomeFaq, HomeHamper, HomeHighlight, HomeTestimonial } from "@/types/home";

/**
 * Home page content for mock mode (no NEXT_PUBLIC_API_BASE_URL). The real copy lives in the
 * database — seeded from backend/seeds/data/home-data.js — and comes from GET /product/home.
 */

const HERO_IMAGE = "https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1800&q=80";

export const MOCK_HERO: HomeBanner = {
  eyebrow: "Premium By Nature",
  title: "Saffron, Almonds, Ghee and Honey, Sourced Directly From Farmers",
  subtitle:
    "Suvarna7 sources Mamra almonds, Mongra saffron, ghee, honey and walnuts directly from farmers, and delivers them nitrogen-sealed for freshness across India.",
  imageUrl: HERO_IMAGE,
  imageAlt: "Bowls of almonds, walnuts, saffron and ghee on a wooden table",
  cta: { label: "Shop Now", href: "/#products" },
  secondaryCta: { label: "Our Story", href: "/our-story" },
};

export const MOCK_PROMO: HomeBanner = {
  eyebrow: "Festive Collection",
  title: "Royal Gift Boxes, Ready to Ship",
  subtitle: null,
  imageUrl: "https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1000&q=80",
  imageAlt: "Royal festive gift collection of dry fruits",
  cta: { label: "Shop Now", href: "/#products" },
  secondaryCta: null,
};

export const MOCK_HERO_HIGHLIGHTS: HomeHighlight[] = [
  { icon: "sprout", title: "100% Grade-A", description: "Kashmiri & Afghani Harvest" },
  { icon: "shield-check", title: "Chemical-Free", description: "Farm-to-Pouch Sourcing" },
  { icon: "truck", title: "Nitrogen-Sealed Freshness", description: "Pan-India Delivery" },
];

export const MOCK_TRUST_BADGES: HomeHighlight[] = [
  { icon: "leaf", title: "100% Natural", description: null },
  { icon: "shield-check", title: "Premium Quality", description: null },
  { icon: "truck", title: "Doorstep Delivery", description: null },
  { icon: "heart-pulse", title: "Healthy Lifestyle", description: null },
];

export const MOCK_TRUST_POINTS: HomeHighlight[] = [
  {
    icon: "leaf",
    title: "Direct Farmer Sourcing",
    description: "We buy directly from orchard families in Kashmir, Afghanistan, Iran and California — no middlemen.",
  },
  {
    icon: "badge-check",
    title: "Lab-Tested Quality",
    description: "Every batch is graded for oil content, moisture and purity before it reaches your pouch.",
  },
  {
    icon: "package-check",
    title: "Nitrogen-Sealed Freshness",
    description: "Nitrogen-flushed packaging locks in freshness for up to 6 months after opening.",
  },
  {
    icon: "users",
    title: "40,000+ Happy Households",
    description: "Verified reviews from customers across 200+ Indian cities keep us accountable.",
  },
];

export const MOCK_HAMPERS: HomeHamper[] = [
  {
    slug: "festive-nut-box",
    name: "Festive Nut Box",
    subtitle: "Almonds & walnuts",
    imageUrl: "/images/hampers/festive-nut-box.webp",
    productSlugs: ["afghani-gurbandi-almonds", "kashmir-mamra-almonds", "kashmiri-walnut-kernels"],
  },
  {
    slug: "kesar-ghee-gift-set",
    name: "Kesar & Ghee Gift Set",
    subtitle: "Saffron & pure ghee",
    imageUrl: "/images/hampers/kesar-ghee-gift-set.webp",
    productSlugs: ["kashmiri-mongra-saffron", "pure-cow-ghee", "pure-buffalo-ghee"],
  },
  {
    slug: "wellness-basket",
    name: "Wellness Basket",
    subtitle: "Honey, nuts & more",
    imageUrl: "/images/hampers/wellness-basket.webp",
    productSlugs: ["raw-forest-honey", "kashmiri-walnut-kernels", "kashmir-mamra-almonds"],
  },
  {
    slug: "the-everything-hamper",
    name: "The Everything Hamper",
    subtitle: "One of each product",
    imageUrl: "/images/hampers/everything-hamper.webp",
    productSlugs: [
      "kashmiri-mongra-saffron",
      "raw-forest-honey",
      "afghani-gurbandi-almonds",
      "kashmir-mamra-almonds",
      "pure-cow-ghee",
      "pure-buffalo-ghee",
      "kashmiri-walnut-kernels",
    ],
  },
];

export const MOCK_TESTIMONIALS: HomeTestimonial[] = [
  {
    name: "Ritika Sharma",
    location: "Pune, Maharashtra",
    rating: 5,
    quote:
      "The Mamra almonds taste nothing like what I used to buy from the supermarket — soft, sweet, and clearly fresh. Suvarna7 is now my only source for dry fruits.",
  },
  {
    name: "Arjun Mehta",
    location: "Bengaluru, Karnataka",
    rating: 5,
    quote:
      "Ordered the festive gift box for Diwali and everyone asked where it was from. Packaging felt premium and the cashews were genuinely the best I've had.",
  },
  {
    name: "Fatima Khan",
    location: "Ghaziabad, Uttar Pradesh",
    rating: 4,
    quote:
      "Love that I can see the origin and processing details before buying. The pincode delivery estimate was spot on too.",
  },
  {
    name: "Suresh Nair",
    location: "Kochi, Kerala",
    rating: 5,
    quote:
      "Been buying dates and walnuts monthly for my parents. Consistent quality every single time, and the nitrogen-sealed pouches actually keep things fresh.",
  },
];

export const MOCK_FAQS: HomeFaq[] = [
  {
    question: "Is Cash on Delivery (COD) available?",
    answer: "Yes, COD is available on most pincodes across India. You'll see the option at checkout once your pincode is verified.",
  },
  {
    question: "What is your return & refund policy?",
    answer: "If a pouch arrives damaged or doesn't match the listing, we offer a free replacement or full refund within 7 days of delivery.",
  },
  {
    question: "How do you ensure freshness?",
    answer: "Every pouch is nitrogen-flushed at the time of packing and shipped within 48 hours of your order to lock in freshness.",
  },
  {
    question: "Do you deliver across India?",
    answer: "Yes, we ship pan-India via Ekart, Delhivery, BlueDart, DTDC and Shiprocket, with delivery in 2–5 days depending on your pincode.",
  },
  {
    question: "Are your products lab tested?",
    answer: "Every batch is graded and lab-tested for oil content, moisture and purity before it's approved for packing.",
  },
];
