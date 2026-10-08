"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/** Longer than this and the text starts clamped with a "Read more" toggle. */
const COLLAPSE_AFTER_CHARS = 320;

/** Tagline under the product name. */
export function ProductTagline({ text }: { text: string }) {
  if (!text) return null;
  return <p className="font-serif text-lg italic leading-snug text-brand-walnut-dark sm:text-xl">{text}</p>;
}

/** The long product description as plain body copy, clamped when long. */
export function ProductDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = text
    .split(/\n\s*\n|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  const collapsible = text.length > COLLAPSE_AFTER_CHARS;
  const collapsed = collapsible && !expanded;

  return (
    <div>
      <div className={cn("space-y-3 text-[15px] leading-7 text-brand-ink/75", collapsed && "line-clamp-4")}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 text-sm font-semibold text-brand-forest underline decoration-brand-gold/60 underline-offset-4 hover:decoration-brand-forest cursor-pointer"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
