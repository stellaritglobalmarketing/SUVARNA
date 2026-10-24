import { Mail } from "lucide-react";
import { STORE_EMAIL, STORE_EMAIL_HREF } from "@/lib/contact";
import { cn } from "@/lib/utils/cn";

/** "About the Founder" card, shared by the Contact and Our Story pages. */
export function FounderBio({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="founder-heading"
      className={cn(
        "grid grid-cols-1 items-start gap-6 rounded-2xl border border-brand-sand-dark bg-white p-6 sm:grid-cols-[96px_minmax(0,1fr)] sm:p-8",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-forest font-serif text-2xl font-bold text-brand-sand sm:h-24 sm:w-24 sm:text-3xl"
      >
        JP
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">About the Founder</p>
        <h2 id="founder-heading" className="mt-2 font-serif text-2xl font-bold text-brand-forest sm:text-3xl">
          Jignesh Panchal
        </h2>
        <p className="mt-1 text-sm font-medium text-brand-ink/60">Founder &amp; Owner of Suvarna7</p>
        <p className="mt-4 max-w-3xl text-[15px] leading-7 text-brand-ink/75">
          At Suvarna7, our focus is on offering quality food products, including premium ghee, Kashmiri saffron, and dry
          fruits. We aim to provide customers with reliable service, quality products, and a smooth online shopping
          experience.
        </p>
        <a
          href={STORE_EMAIL_HREF}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-forest underline-offset-4 hover:underline"
        >
          <Mail size={16} /> {STORE_EMAIL}
        </a>
      </div>
    </section>
  );
}
