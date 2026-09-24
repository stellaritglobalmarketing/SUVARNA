import { Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RatingStars } from "@/components/ui/RatingStars";
import type { HomeTestimonial } from "@/types/home";

/** Curated homepage testimonials — distinct from PDP reviews, not tied to one product. */
export function Testimonials({ testimonials }: { testimonials: HomeTestimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-12">
      <Container>
        <SectionHeading eyebrow="40,000+ Happy Households" title="What Our Customers Say" align="center" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.name} className="flex flex-col rounded-2xl border border-brand-sand-dark bg-white p-6">
              <Quote size={22} className="text-brand-gold" />
              <blockquote className="mt-3 flex-1 text-sm text-brand-ink/80">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <RatingStars rating={testimonial.rating} size={12} className="mt-4" />
              <figcaption className="mt-2 text-sm">
                <span className="font-semibold text-brand-forest">{testimonial.name}</span>
                {testimonial.location && <span className="block text-xs text-brand-ink/50">{testimonial.location}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
