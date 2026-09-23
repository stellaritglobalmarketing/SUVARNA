import { Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RatingStars } from "@/components/ui/RatingStars";

/** Dummy testimonials — 4 entries, distinct from PDP reviews (curated for the homepage, not tied to one product). */
const TESTIMONIALS = [
  {
    name: "Ritika Sharma",
    location: "Pune, Maharashtra",
    rating: 5,
    quote:
      "The Mamra almonds taste nothing like what I used to buy from the supermarket — soft, sweet, and clearly fresh. Suvarna7 is now my only source for dry fruits.",
  },
  {
    name: "Arjun Mehta",
    location: "Bengaluru, Karnataka",
    rating: 5,
    quote:
      "Ordered the festive gift box for Diwali and everyone asked where it was from. Packaging felt premium and the cashews were genuinely the best I've had.",
  },
  {
    name: "Fatima Khan",
    location: "Ghaziabad, Uttar Pradesh",
    rating: 4,
    quote:
      "Love that I can see the origin and processing details before buying. The pincode delivery estimate was spot on too.",
  },
  {
    name: "Suresh Nair",
    location: "Kochi, Kerala",
    rating: 5,
    quote:
      "Been buying dates and walnuts monthly for my parents. Consistent quality every single time, and the nitrogen-sealed pouches actually keep things fresh.",
  },
];

export function Testimonials() {
  return (
    <section className="py-12">
      <Container>
        <SectionHeading eyebrow="40,000+ Happy Households" title="What Our Customers Say" align="center" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.name} className="flex flex-col rounded-2xl border border-brand-sand-dark bg-white p-6">
              <Quote size={22} className="text-brand-gold" />
              <blockquote className="mt-3 flex-1 text-sm text-brand-ink/80">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <RatingStars rating={testimonial.rating} size={12} className="mt-4" />
              <figcaption className="mt-2 text-sm">
                <span className="font-semibold text-brand-forest">{testimonial.name}</span>
                <span className="block text-xs text-brand-ink/50">{testimonial.location}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
