import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

/** Mobile-only banner shown right below the header's search bar — fills the role the desktop Hero plays. */
export function PromoBanner() {
  return (
    <section className="pt-4 md:hidden">
      <Container>
        <Link
          href="/#products"
          className="relative flex h-36 items-center overflow-hidden rounded-2xl active:opacity-90"
        >
          <Image
            src="https://images.unsplash.com/photo-1769255484646-16988ad5552d?auto=format&fit=crop&w=1000&q=80"
            alt="Royal festive gift collection of dry fruits"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-forest/90 via-brand-forest/55 to-transparent" />
          <div className="relative z-10 max-w-[70%] px-5">
            <span className="inline-block rounded-full bg-brand-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ink">
              Festive Collection
            </span>
            <p className="mt-2 font-serif text-xl font-bold leading-tight text-brand-sand">
              Royal Gift Boxes, Ready to Ship
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-light">
              Shop Now <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      </Container>
    </section>
  );
}
