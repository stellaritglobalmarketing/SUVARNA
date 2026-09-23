"use client";

import { useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { HamperBuilderModal } from "./HamperBuilderModal";

interface HamperTheme {
  label: string;
  subtitle: string;
  image: string;
  presetSlugs: string[];
}

const HAMPER_THEMES: HamperTheme[] = [
  {
    label: "Festive Nut Box",
    subtitle: "Almonds & walnuts",
    image: "/images/hampers/festive-nut-box.webp",
    presetSlugs: ["afghani-gurbandi-almonds", "kashmir-mamra-almonds", "kashmiri-walnut-kernels"],
  },
  {
    label: "Kesar & Ghee Gift Set",
    subtitle: "Saffron & pure ghee",
    image: "/images/hampers/kesar-ghee-gift-set.webp",
    presetSlugs: ["kashmiri-mongra-saffron", "pure-cow-ghee", "pure-buffalo-ghee"],
  },
  {
    label: "Wellness Basket",
    subtitle: "Honey, nuts & more",
    image: "/images/hampers/wellness-basket.webp",
    presetSlugs: ["raw-forest-honey", "kashmiri-walnut-kernels", "kashmir-mamra-almonds"],
  },
  {
    label: "The Everything Hamper",
    subtitle: "One of each product",
    image: "/images/hampers/everything-hamper.webp",
    presetSlugs: [
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

const NO_PRESET: string[] = [];

/** Simple themed hamper tiles + a "build your own" button, both opening the same quantity-picker modal. */
export function CustomHampers() {
  const [isOpen, setIsOpen] = useState(false);
  const [presetSlugs, setPresetSlugs] = useState<string[]>(NO_PRESET);

  const openWithPreset = (slugs: string[]) => {
    setPresetSlugs(slugs);
    setIsOpen(true);
  };

  return (
    <section className="py-4 sm:py-12">
      <Container>
        <SectionHeading eyebrow="Gift It" title="Customized Hampers" subtitle="Pick a starting theme, or build your own from scratch." />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-4">
          {HAMPER_THEMES.map((theme) => (
            <button
              key={theme.label}
              type="button"
              onClick={() => openWithPreset(theme.presetSlugs)}
              className="overflow-hidden rounded-xl border border-brand-sand-dark bg-white text-left cursor-pointer"
            >
              <div className="relative aspect-square w-full">
                <Image src={theme.image} alt={theme.label} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-brand-forest">{theme.label}</p>
                <p className="mt-0.5 text-xs text-brand-ink/60">{theme.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-center sm:mt-8">
          <Button onClick={() => openWithPreset(NO_PRESET)} variant="primary">
            Customize Your Own Hamper
          </Button>
        </div>
      </Container>

      {isOpen && (
        <HamperBuilderModal key={presetSlugs.join("|")} onClose={() => setIsOpen(false)} presetSlugs={presetSlugs} />
      )}
    </section>
  );
}
