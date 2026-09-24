import {
  BadgeCheck,
  HeartPulse,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Icon keys stored in the backend's `home_highlights.icon` column → lucide components. */
const HOME_ICONS: Record<string, LucideIcon> = {
  "badge-check": BadgeCheck,
  "heart-pulse": HeartPulse,
  leaf: Leaf,
  "package-check": PackageCheck,
  "shield-check": ShieldCheck,
  sprout: Sprout,
  truck: Truck,
  users: Users,
};

/** Unknown keys (e.g. a typo entered in the admin) fall back to a neutral leaf instead of breaking the section. */
export function getHomeIcon(key: string): LucideIcon {
  return HOME_ICONS[key] ?? Leaf;
}
