"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { formatInr } from "@/lib/utils/format";
import { BULK_GIFTING_WHATSAPP_DISPLAY, BULK_GIFTING_WHATSAPP_HREF } from "@/lib/contact";
import { isDiwaliSeason } from "@/lib/diwali";
import { useNow } from "@/hooks/useNow";
import type { HomeHamper } from "@/types/home";
import type { Product } from "@/types/product";
import { HamperBuilderModal } from "./HamperBuilderModal";
import { DiwaliHampers, giftPhoto } from "./DiwaliHampers";

const NO_PRESET: string[] = [];

/**
 * Ready-made gift boxes (a hamper whose slug is a product: the Diwali Deepam, Utsav and Heritage boxes) link to that product;
 * themed hamper tiles and "build your own" open the same quantity-picker modal.
 */
export function CustomHampers({ hampers, products }: { hampers: HomeHamper[]; products: Product[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [presetSlugs, setPresetSlugs] = useState<string[]>(NO_PRESET);
  const isDiwali = isDiwaliSeason(useNow());

  const openWithPreset = (slugs: string[]) => {
    setPresetSlugs(slugs);
    setIsOpen(true);
  };

  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const gifts = hampers.flatMap((hamper) => {
    const product = productBySlug.get(hamper.slug);
    return product ? [{ hamper, product }] : [];
  });
  const themes = hampers.filter((hamper) => !productBySlug.has(hamper.slug));
  // A gift box isn't something to put inside a custom hamper.
  const builderProducts = products.filter((product) => !hampers.some((hamper) => hamper.slug === product.slug));

  // Nothing to put in a hamper yet.
  if (products.length === 0) return null;

  const builder = isOpen && (
    <HamperBuilderModal
      key={presetSlugs.join("|")}
      onClose={() => setIsOpen(false)}
      products={builderProducts}
      presetSlugs={presetSlugs}
    />
  );

  // During Diwali the gift boxes get the festive section.
  if (isDiwali && gifts.length > 0) {
    return (
      <section id="hampers" tabIndex={-1} className="diwali-hampers relative scroll-mt-52 overflow-hidden border-y border-[#ecd3a6] py-14 sm:py-20">
        <DiwaliHampers
          gifts={gifts}
          productNames={new Map(products.map((product) => [product.slug, product.name]))}
          onCustomize={builderProducts.length > 0 ? () => openWithPreset(NO_PRESET) : undefined}
        />
        {builder}
      </section>
    );
  }

  return (
    <section id="hampers" tabIndex={-1} className="scroll-mt-52 border-y border-brand-sand-dark bg-[#f7f4ed] py-12 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Thoughtfully Given"
          title={gifts.length > 0 ? "Diwali Gift Hampers from Kashmir" : "A little goodness, beautifully gifted."}
          subtitle={
            gifts.length > 0
              ? "Kesar from our own farm, with the finest dry fruits, honey and ghee. Ready to gift."
              : themes.length > 0
                ? "Pick a starting theme, or build your own from scratch."
                : "Pick your favourites and build a hamper of your own."
          }
        />

        {gifts.length > 0 && (
          <div className="mx-auto mt-6 grid max-w-md gap-4 sm:mt-8 md:max-w-none md:grid-cols-3 md:gap-5">
            {gifts.map(({ hamper, product }) => {
              const variant = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
              const contents = hamper.productSlugs.map((slug) => productBySlug.get(slug)?.name).filter(Boolean);
              return (
                <Link
                  key={hamper.slug}
                  href={`/products/${product.slug}`}
                  className="group flex overflow-hidden rounded-2xl border border-brand-sand-dark bg-white md:flex-col"
                >
                  {/* On phones a short row with the whole photo: its name and price are printed on it, so it can't be cropped. */}
                  <div className="relative w-[38%] shrink-0 self-start md:w-full">
                    <ProductImagePlaceholder
                      src={giftPhoto(hamper, product)}
                      alt={hamper.name}
                      gradient={product.gradient}
                      iconSize={40}
                      sizes="(min-width: 768px) 33vw, 40vw"
                      className="aspect-[2/3] w-full"
                    />
                    {/* Hidden on phones, where it would cover the name printed across the top of the smaller photo. */}
                    <span className="absolute left-3 top-3 hidden items-center gap-1.5 rounded-full bg-brand-forest px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-sand md:flex">
                      <Gift size={12} aria-hidden="true" /> Diwali Special
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 md:gap-3 md:p-5">
                    <div>
                      <h3 className="font-serif text-lg font-semibold leading-tight text-brand-forest md:text-2xl">{hamper.name}</h3>
                      {hamper.subtitle && <p className="mt-0.5 text-xs font-medium text-brand-walnut-dark md:text-sm">{hamper.subtitle}</p>}
                      {product.tagline && <p className="mt-1.5 hidden text-sm text-brand-ink/60 md:block">{product.tagline}</p>}
                    </div>
                    {contents.length > 0 && <p className="text-[11px] leading-snug text-brand-ink/70 md:hidden">{contents.join(" · ")}</p>}
                    {contents.length > 0 && (
                      <ul className="hidden flex-wrap gap-1.5 md:flex">
                        {contents.map((name) => (
                          <li key={name} className="rounded-full bg-brand-sand px-2.5 py-1 text-xs text-brand-ink/75">
                            {name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-2 md:flex-wrap md:items-center md:gap-3 md:pt-2">
                      {variant && (
                        <span>
                          <span className="block text-lg font-bold leading-tight text-brand-forest tabular-nums md:text-xl">{formatInr(variant.price)}</span>
                          <span className="text-[10px] text-brand-ink/60 md:text-xs">Free delivery</span>
                        </span>
                      )}
                      <span className="shrink-0 rounded-lg bg-brand-forest px-2.5 py-1.5 text-xs font-semibold text-brand-sand transition-colors group-hover:bg-brand-forest-light md:px-4 md:py-2 md:text-sm">
                        View<span className="hidden md:inline"> Gift Box</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {gifts.length > 0 && (
          <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-brand-sand-dark bg-white px-5 py-4 text-center text-sm text-brand-ink/75">
            Gifting for your team or clients? Bulk orders from 10 boxes with a free name card. WhatsApp:{" "}
            <a
              href={BULK_GIFTING_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold whitespace-nowrap text-brand-forest underline underline-offset-2"
            >
              {BULK_GIFTING_WHATSAPP_DISPLAY}
            </a>
          </p>
        )}

        {themes.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-4">
            {themes.map((theme) => (
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
        )}

        {builderProducts.length > 0 && (
          <div className="mt-6 flex justify-center sm:mt-8">
            <Button onClick={() => openWithPreset(NO_PRESET)} variant={gifts.length > 0 ? "outline" : "primary"}>
              Customize Your Own Hamper
            </Button>
          </div>
        )}
      </Container>

      {builder}
    </section>
  );
}
