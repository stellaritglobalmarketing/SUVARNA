import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeBanner } from "@/types/home";
import { Container } from "@/components/ui/Container";

/** Mobile-only banner shown right below the header's search bar — fills the role the desktop Hero plays. */
export function PromoBanner({ banner }: { banner: HomeBanner }) {
  return (
    <section className="pt-4 md:hidden">
      <Container>
        <Link
          href={banner.cta?.href ?? "/#products"}
          className="relative flex h-36 items-center overflow-hidden rounded-2xl active:opacity-90"
        >
          <Image
            src={banner.imageUrl}
            alt={banner.imageAlt}
            fill
            sizes="100vw"
            className="object-cover"
          />
          {/* Shade only behind the text so the products on the right stay clear */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-forest/85 from-25% via-brand-forest/45 via-50% to-transparent to-80%" />
          <div className="relative z-10 max-w-[70%] px-5">
            {banner.eyebrow && (
              <span className="inline-block rounded-full bg-brand-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ink">
                {banner.eyebrow}
              </span>
            )}
            <p className="mt-2 font-serif text-xl font-bold leading-tight text-brand-sand">{banner.title}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-light">
              {banner.cta?.label ?? "Shop Now"} <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      </Container>
    </section>
  );
}
