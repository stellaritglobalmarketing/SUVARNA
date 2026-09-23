import type { ProductCategory } from "@/types/product";

export interface CategoryDisplay {
  label: string;
  subtitle: string;
  category: ProductCategory;
  image: string;
  gradient: [string, string];
}

export const CATEGORIES: CategoryDisplay[] = [
  {
    label: "Mamra Almonds",
    subtitle: "Premium Kashmiri Selection",
    category: "Almonds",
    image: "https://images.unsplash.com/photo-1708453860229-cc8a7fa3c56f?auto=format&fit=crop&w=400&q=80",
    gradient: ["#8a6a4f", "#d4a373"],
  },
  {
    label: "Mongra Saffron",
    subtitle: "Kashmir's Golden Spice",
    category: "Saffron",
    image: "https://images.unsplash.com/photo-1564057779901-11451bfca03b?auto=format&fit=crop&w=400&q=80",
    gradient: ["#7a1f2b", "#c9a227"],
  },
  {
    label: "Desi Ghee",
    subtitle: "A2 Bilona Method",
    category: "Ghee",
    image: "https://images.unsplash.com/photo-1573812461383-e5f8b759d12e?auto=format&fit=crop&w=400&q=80",
    gradient: ["#c9a227", "#e4c563"],
  },
  {
    label: "King Cashews",
    subtitle: "Large, Creamy & Fresh",
    category: "Cashews",
    image: "https://images.unsplash.com/photo-1627820752174-acae1b399128?auto=format&fit=crop&w=400&q=80",
    gradient: ["#e7d3a1", "#fdf9f1"],
  },
  {
    label: "Medjool Dates",
    subtitle: "Naturally Sweet",
    category: "Dates",
    image: "https://images.unsplash.com/photo-1770617476915-7269d29d27dc?auto=format&fit=crop&w=400&q=80",
    gradient: ["#4a2c1d", "#8a6a4f"],
  },
  {
    label: "Kashmiri Figs",
    subtitle: "Soft & Naturally Rich",
    category: "Figs",
    image: "https://images.unsplash.com/photo-1524593313283-1e092f06b2f0?auto=format&fit=crop&w=400&q=80",
    gradient: ["#6b3f2a", "#c9a887"],
  },
  {
    label: "Walnuts",
    subtitle: "Brain Food, Naturally",
    category: "Walnuts",
    image: "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?auto=format&fit=crop&w=400&q=80",
    gradient: ["#c9a887", "#8a6a4f"],
  },
  {
    label: "Seeds Mix",
    subtitle: "Power-Packed Nutrition",
    category: "Seeds",
    image: "https://images.unsplash.com/photo-1740993384743-dc8f2879f398?auto=format&fit=crop&w=400&q=80",
    gradient: ["#3f4d2b", "#7a8f4a"],
  },
  {
    label: "Makhana",
    subtitle: "Light, Crunchy & Healthy",
    category: "Makhana",
    image: "https://images.unsplash.com/photo-1776765828683-eb5ec29711e2?auto=format&fit=crop&w=400&q=80",
    gradient: ["#e7d3a1", "#c9a887"],
  },
];
