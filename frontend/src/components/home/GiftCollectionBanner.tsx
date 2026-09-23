import { Gift } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function GiftCollectionBanner() {
  return (
    <section className="py-12">
      <Container>
        <div className="flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-walnut-dark via-brand-walnut to-brand-gold px-8 py-12 text-center text-brand-ink sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/40">
            <Gift size={30} />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-2xl font-bold sm:text-3xl">Royal Festive Gift Collection</h3>
            <p className="mt-2 max-w-xl text-brand-ink/80">
              Handcrafted gift boxes featuring Mamra almonds, jumbo dates and Kashmiri walnuts — presented in
              premium sand-and-gold packaging, ready to ship anywhere in India.
            </p>
          </div>
          <Button href="/products" variant="primary" size="lg" className="shrink-0">
            Shop Gift Boxes
          </Button>
        </div>
      </Container>
    </section>
  );
}
