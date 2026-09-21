import { HeartPulse, Leaf, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";

const BADGES = [
  { icon: Leaf, label: "100% Natural" },
  { icon: ShieldCheck, label: "Premium Quality" },
  { icon: Truck, label: "Doorstep Delivery" },
  { icon: HeartPulse, label: "Healthy Lifestyle" },
];

/** Compact trust strip, mobile only — desktop already covers this in the richer TrustSection lower down. */
export function TrustBadges() {
  return (
    <section className="py-3 md:hidden">
      <Container>
        <div className="grid grid-cols-4 gap-2">
          {BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-sand-dark text-brand-forest">
                <Icon size={17} />
              </span>
              <span className="text-[10px] font-medium leading-tight text-brand-ink/80">{label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
