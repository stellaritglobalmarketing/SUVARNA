"use client";

import Link from "next/link";
import { useId, type CSSProperties } from "react";
import { ArrowRight, Gift, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ProductImagePlaceholder } from "@/components/ui/ProductImagePlaceholder";
import { BULK_GIFTING_WHATSAPP_DISPLAY, BULK_GIFTING_WHATSAPP_HREF } from "@/lib/contact";
import { formatInr } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { HomeHamper } from "@/types/home";
import type { Product } from "@/types/product";
import { Diya, Rangoli, Sparkles } from "./DiwaliDecor";

/**
 * The home page hamper section during Diwali (see CustomHampers): a warm festive backdrop with brass lanterns,
 * a "Happy Diwali" medallion, diyas and marigolds in the corners and falling petals, then the three gift boxes,
 * the bulk-order note and the "Customize Your Own Hamper" button. Decorations are hidden from screen readers
 * and stand still for reduced-motion users (globals.css, `diwali-*`).
 */
export function DiwaliHampers({
  gifts,
  productNames,
  onCustomize,
}: {
  gifts: { hamper: HomeHamper; product: Product }[];
  productNames: Map<string, string>;
  onCustomize?: () => void;
}) {
  return (
    // Not positioned: the decor spreads over the whole section, padding included.
    <div className="diwali-anim">
      <SectionDecor />
      <Container className="relative">
        <Sparkles className="bottom-auto h-48" />
        <FestiveHeading />

        <div className="mx-auto mt-8 grid max-w-md gap-6 sm:mt-10 md:max-w-6xl md:grid-cols-3">
          {gifts.map(({ hamper, product }) => {
            const variant = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
            const contents = hamper.productSlugs.map((slug) => productNames.get(slug)).filter(Boolean);
            return (
              <Link
                key={hamper.slug}
                href={`/products/${product.slug}`}
                className="group flex flex-col rounded-2xl border border-[#e7c98d] bg-[#fffaf2] p-2.5 shadow-[0_14px_40px_-18px_rgba(150,80,20,.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-18px_rgba(150,80,20,.7)]"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <ProductImagePlaceholder
                    src={hamper.imageUrl ?? product.images[0]}
                    alt={hamper.name}
                    gradient={product.gradient}
                    iconSize={40}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="aspect-[3/2] w-full transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-0 top-3 flex items-center gap-1.5 bg-gradient-to-r from-[#7a1d1d] to-[#5a1414] py-1 pl-2.5 pr-5 text-[11px] font-semibold uppercase tracking-wide text-[#fbe2a8] shadow-md [clip-path:polygon(0_0,100%_0,90%_50%,100%_100%,0_100%)]">
                    <Diya className="w-4" /> Diwali Special ✦
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-2.5 pt-4">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-[#3b1d10]">{hamper.name}</h3>
                    {hamper.subtitle && <p className="mt-0.5 text-sm font-medium text-[#3b1d10]/85">{hamper.subtitle}</p>}
                    {product.tagline && <p className="mt-1 text-xs leading-relaxed text-brand-ink/60">{product.tagline}</p>}
                  </div>
                  {contents.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5">
                      {contents.map((name) => (
                        <li key={name} className="rounded-full bg-[#f5e8d3] px-2.5 py-1 text-[11px] text-brand-ink/75">
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    {variant && (
                      <span>
                        <span className="block text-2xl font-bold text-[#3b1d10] tabular-nums">{formatInr(variant.price)}</span>
                        <span className="text-xs text-brand-ink/60">Free delivery</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 rounded-lg bg-[#5a1414] px-4 py-2.5 text-sm font-semibold text-[#fbe7c0] transition-colors group-hover:bg-[#7a1d1d]">
                      View Gift Box <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mx-auto mt-10 flex max-w-2xl items-center gap-4 rounded-2xl border border-[#e2bf7e] bg-gradient-to-r from-[#fbecd2] via-[#fffaf0] to-[#fbecd2] px-5 py-3.5 shadow-sm sm:rounded-full sm:px-7">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5dfb3] text-[#8a5c2e]">
            <Gift size={20} aria-hidden="true" />
          </span>
          <div className="flex-1 text-center text-sm text-brand-ink/75">
            <p>Gifting for your team or clients? Bulk orders from 10 boxes with a free name card.</p>
            <a
              href={BULK_GIFTING_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-[#1f8a4c] underline-offset-2 hover:underline"
            >
              <MessageCircle size={15} aria-hidden="true" /> WhatsApp: {BULK_GIFTING_WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>

        {onCustomize && (
          <div className="mt-7 flex items-center justify-center gap-3">
            <Lotus className="hidden w-8 text-[#c9963f] sm:block" />
            <button
              type="button"
              onClick={onCustomize}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7a1d1d] to-[#5a1414] px-7 py-3 text-sm font-semibold text-[#fbe7c0] shadow-[0_10px_24px_-10px_rgba(90,20,20,.8)] transition hover:brightness-110 cursor-pointer"
            >
              Customize Your Own Hamper <ArrowRight size={15} aria-hidden="true" />
            </button>
            <Lotus className="hidden w-8 text-[#c9963f] sm:block" />
          </div>
        )}
      </Container>
    </div>
  );
}

function FestiveHeading() {
  return (
    <div className="relative mx-auto max-w-3xl text-center">
      <MountainLines className="absolute left-1/2 top-2 w-[110%] -translate-x-1/2 text-[#c9963f] opacity-25" />
      <p className="relative flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a8742f]">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#c9963f] sm:w-16" />
        Thoughtfully Given
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#c9963f] sm:w-16" />
      </p>
      <h2 className="relative mt-3 font-serif text-[34px] font-semibold leading-[1.1] tracking-tight text-[#3b1d10] sm:text-5xl lg:text-6xl">
        Diwali Gift Hampers
        <span className="mt-1 flex items-center justify-center gap-3 sm:gap-5">
          <Lotus className="w-7 text-[#c9963f] sm:w-10" />
          <span>
            <em className="font-normal">from</em> Kashmir
          </span>
          <Lotus className="w-7 text-[#c9963f] sm:w-10" />
        </span>
      </h2>
      <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-ink/70 sm:text-base">
        Kesar from our own farm, with the finest dry fruits, honey and ghee. Ready to gift.
      </p>
      <Lotus className="relative mx-auto mt-3 w-6 text-[#c9963f]" />
    </div>
  );
}

/** Lanterns, the medallion, corner diyas and marigolds, a faint rangoli and falling petals. */
function SectionDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Petals />
      <BrassLantern drop={20} wait={0} className="absolute left-[2%] top-0 w-8 sm:w-12" />
      <BrassLantern drop={70} wait={1.1} className="absolute left-[9%] top-0 hidden w-10 lg:block" />
      <BrassLantern drop={70} wait={0.5} className="absolute right-[9%] top-0 hidden w-10 lg:block" />
      <BrassLantern drop={20} wait={1.7} className="absolute right-[2%] top-0 w-8 sm:w-12" />
      <HappyDiwaliMedallion className="absolute right-[13%] top-24 hidden w-36 xl:block" />
      <Rangoli className="absolute -bottom-24 -right-24 hidden w-96 text-[#c9963f] opacity-20 lg:block" />
      <div className="absolute bottom-3 left-2 hidden items-end gap-1 lg:flex">
        <Marigolds className="w-28" />
        <Diya wait={0.3} className="-ml-8 w-16" />
      </div>
      <div className="absolute bottom-3 right-2 hidden items-end gap-1 lg:flex">
        <Diya wait={0.8} className="w-16" />
        <Marigolds className="-ml-6 w-28 -scale-x-100" />
      </div>
    </div>
  );
}

const delay = (seconds: number): CSSProperties => ({ animationDelay: `-${seconds.toFixed(2)}s` });

/** A small lotus outline in the current text colour. */
function Lotus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 22" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M20 2 C25 8 25 14 20 20 C15 14 15 8 20 2 Z" />
        <path d="M20 20 C14 18 10 13 9 7 C14 9 18 13 20 20" />
        <path d="M20 20 C26 18 30 13 31 7 C26 9 22 13 20 20" />
        <path d="M20 20 C12 21 5 18 1 13 C8 13 15 15 20 20" />
        <path d="M20 20 C28 21 35 18 39 13 C32 13 25 15 20 20" />
      </g>
    </svg>
  );
}

/** Faint line drawing of Kashmir's mountains behind the heading. */
function MountainLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 120" className={className} aria-hidden="true">
      <path
        d="M0 110 L70 70 L110 88 L180 30 L230 66 L270 48 L330 96 M300 110 L380 40 L420 64 L470 22 L530 80 L600 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M180 30 L196 46 L186 44 L174 52 M470 22 L486 40 L476 38 L462 46" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** A pierced brass lantern on a chain, glowing and swinging. */
function BrassLantern({ drop, wait, className }: { drop: number; wait: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox={`0 0 60 ${drop + 112}`} className={className}>
      <defs>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#ffd98a" stopOpacity=".85" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}brass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a5c2e" />
          <stop offset=".5" stopColor="#e2b25a" />
          <stop offset="1" stopColor="#8a5c2e" />
        </linearGradient>
      </defs>
      <g className="diwali-lantern" style={{ transformOrigin: "30px 0px", ...delay(wait) }}>
        <line x1="30" y1="0" x2="30" y2={drop} stroke="#8a5c2e" strokeWidth="1.4" strokeDasharray="3 2" />
        <g transform={`translate(0 ${drop})`}>
          <circle className="diwali-lantern-light" cx="30" cy="56" r="30" fill={`url(#${id}glow)`} style={delay(wait)} />
          <circle cx="30" cy="4" r="3.5" fill="none" stroke={`url(#${id}brass)`} strokeWidth="2" />
          <path d="M18 24 Q30 4 42 24 Z" fill={`url(#${id}brass)`} />
          <rect x="15" y="24" width="30" height="4" rx="1.5" fill={`url(#${id}brass)`} />
          <path d="M17 28 H43 L40 74 H20 Z" fill="#ffe3a3" opacity=".9" />
          <path d="M17 28 H43 L40 74 H20 Z M24 32 V70 M30 32 V70 M36 32 V70" fill="none" stroke={`url(#${id}brass)`} strokeWidth="2" />
          <path d="M22 40 Q24 34 26 40 M28 40 Q30 34 32 40 M34 40 Q36 34 38 40" fill="none" stroke="#8a5c2e" strokeWidth="1" />
          <rect x="17" y="74" width="26" height="4" rx="1.5" fill={`url(#${id}brass)`} />
          <path d="M22 78 Q30 92 38 78 Z" fill={`url(#${id}brass)`} />
          <line x1="30" y1="86" x2="30" y2="100" stroke="#8a5c2e" strokeWidth="1.4" />
          <circle cx="30" cy="102" r="2.4" fill="#e2b25a" />
        </g>
      </g>
    </svg>
  );
}

/** Scalloped maroon medallion reading "Happy Diwali". */
function HappyDiwaliMedallion({ className }: { className?: string }) {
  const scallops = 18;
  const point = (i: number, r: number) => {
    const angle = (i / scallops) * Math.PI * 2 - Math.PI / 2;
    return `${(Math.cos(angle) * r).toFixed(2)} ${(Math.sin(angle) * r).toFixed(2)}`;
  };
  const edge = `M${point(0, 44)} ${Array.from({ length: scallops }, (_, i) => `A8.5 8.5 0 0 1 ${point(i + 1, 44)}`).join(" ")} Z`;
  return (
    <svg viewBox="-56 -56 112 112" className={cn("diwali-float drop-shadow-[0_8px_16px_rgba(90,20,20,.35)]", className)} aria-hidden="true">
      <path d={edge} fill="#6e1919" stroke="#e2b25a" strokeWidth="2" />
      <circle r="36" fill="none" stroke="#e2b25a" strokeWidth=".8" strokeDasharray="2 2.5" />
      <text y="-6" textAnchor="middle" className="font-serif" fontSize="15" fill="#fbe2a8">
        Happy
      </text>
      <text y="14" textAnchor="middle" className="font-serif" fontSize="19" fontWeight="600" fill="#f6c86a">
        Diwali
      </text>
      <path d="M-9 22 H9 C8 28 4 31 0 31 C-4 31 -8 28 -9 22 Z" fill="#e2b25a" />
      <path className="diwali-flame" d="M0 13 C3 17 3 20 0 22 C-3 20 -3 17 0 13 Z" fill="#ffd25e" />
    </svg>
  );
}

const MARIGOLDS: [number, number, number, string][] = [
  [22, 46, 14, "#f97316"], [46, 38, 16, "#f59e0b"], [70, 48, 13, "#ea580c"], [36, 64, 12, "#fbbf24"], [60, 66, 11, "#f97316"],
];

/** A small heap of marigolds with a couple of leaves. */
function Marigolds({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 80" className={className} aria-hidden="true">
      <path d="M8 74 C20 56 34 54 44 60 C32 62 20 68 8 74 Z" fill="#4d7c0f" />
      <path d="M88 72 C78 58 66 56 58 62 C68 64 78 68 88 72 Z" fill="#65a30d" />
      {MARIGOLDS.map(([cx, cy, r, colour]) => (
        <g key={`${cx}-${cy}`} transform={`translate(${cx} ${cy})`}>
          <circle r={r} fill={colour} />
          <circle r={r * 0.68} fill="none" stroke="#fff1c4" strokeWidth="1.2" strokeDasharray="2 2.2" opacity=".55" />
          <circle r={r * 0.36} fill="none" stroke="#9a3412" strokeWidth="1" strokeDasharray="1.5 1.5" opacity=".6" />
        </g>
      ))}
    </svg>
  );
}

// [left %, size px, seconds to fall, head start s, colour]
const PETALS: [number, number, number, number, string][] = [
  [8, 9, 14, 0, "#f97316"], [21, 7, 17, 6, "#fbbf24"], [34, 8, 15, 11, "#ea580c"], [52, 6, 18, 3, "#f59e0b"],
  [67, 9, 16, 9, "#f97316"], [79, 7, 14, 13, "#fbbf24"], [91, 8, 17, 5, "#ea580c"], [44, 7, 19, 15, "#f97316"],
];

/** Marigold petals drifting down the section. */
function Petals() {
  return (
    <div className="diwali-petals absolute inset-0">
      {PETALS.map(([left, size, seconds, wait, colour]) => (
        <span
          key={left}
          style={{ left: `${left}%`, width: size, height: size * 0.6, background: colour, animationDuration: `${seconds}s`, ...delay(wait) }}
        />
      ))}
    </div>
  );
}
