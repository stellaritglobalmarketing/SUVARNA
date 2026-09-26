"use client";

import { useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import type { HomeHamper } from "@/types/home";
import type { Product } from "@/types/product";
import { HamperBuilderModal } from "./HamperBuilderModal";

const NO_PRESET: string[] = [];

/** Simple themed hamper tiles + a "build your own" button, both opening the same quantity-picker modal. */
export function CustomHampers({ hampers, products }: { hampers: HomeHamper[]; products: Product[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [presetSlugs, setPresetSlugs] = useState<string[]>(NO_PRESET);

  const openWithPreset = (slugs: string[]) => {
    setPresetSlugs(slugs);
    setIsOpen(true);
  };

  // Nothing to put in a hamper yet.
  if (products.length === 0) return null;

  return (
    <section id="hampers" tabIndex={-1} className="scroll-mt-52 border-y border-brand-sand-dark bg-[#f7f4ed] py-12 sm:py-16">
      <Container>
        <SectionHeading eyebrow="Thoughtfully Given" title="A little goodness, beautifully gifted." subtitle="Pick a starting theme, or build your own from scratch." />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-4">
          {hampers.map((theme) => (
            <button
              key={theme.slug}
              type="button"
              onClick={() => openWithPreset(theme.productSlugs)}
              className="overflow-hidden rounded-md border border-brand-sand-dark bg-white text-left cursor-pointer"
            >
              <div className="relative aspect-square w-full">
                {theme.imageUrl && (
                  <Image src={theme.imageUrl} alt={theme.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-brand-forest">{theme.name}</p>
                {theme.subtitle && <p className="mt-0.5 text-xs text-brand-ink/60">{theme.subtitle}</p>}
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
        <HamperBuilderModal
          key={presetSlugs.join("|")}
          onClose={() => setIsOpen(false)}
          products={products}
          presetSlugs={presetSlugs}
        />
      )}
    </section>
  );
}
