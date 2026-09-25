import Image from "next/image";
import Link from "next/link";
import type { HomeBanner } from "@/types/home";
import heroImage from "../../../public/images/hero/suvarna7-hero.jpg";

/**
 * Full-width brand poster. The artwork already carries the logo, tagline and product line-up,
 * so it is shown whole (no overlay text or tint) and the banner's title stays only as the
 * page heading for screen readers and search engines.
 */
export function Hero({ banner }: { banner: HomeBanner }) {
  return (
    <section className="bg-brand-sand">
      <h1 className="sr-only">{banner.title}</h1>
      <Link href={banner.cta?.href ?? "/products"} aria-label={banner.cta?.label ?? "Shop all products"} className="block">
        <Image
          src={heroImage}
          alt="Suvarna7 Mongra saffron, honey, Afghani and Mamra almonds, cow and buffalo ghee and walnuts"
          priority
          placeholder="blur"
          sizes="100vw"
          className="h-auto w-full"
        />
      </Link>
    </section>
  );
}
