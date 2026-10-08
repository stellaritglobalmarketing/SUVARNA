import type { ProductOrigin, ProductProcessing } from "@/types/product";

type Point = { title: string; text: string };
type Kind = "saffron" | "honey" | "ghee" | "gift" | "nuts";

// Saffron, honey, ghee and nuts are checked and made very differently, so each gets its own copy.
// Process steps follow the product descriptions in the catalogue.
function kindOf(name: string): Kind {
  const n = name.toLowerCase();
  if (/saffron|kesar/.test(n)) return "saffron";
  if (/honey/.test(n)) return "honey";
  if (/ghee/.test(n)) return "ghee";
  if (/box|hamper|gift/.test(n)) return "gift";
  return "nuts";
}

const NUT_PROCESSING_STEP: Record<ProductProcessing, string> = {
  Raw: "Kept raw — no roasting, no added salt, no preservatives. Packed the way it was harvested.",
  "Roasted & Salted": "Slow-roasted in small batches and lightly salted, then cooled fully before packing so it stays crisp.",
  Smoked: "Smoked in small batches for an even flavour, then cooled fully before packing.",
  Traditional: "Prepared the traditional way, in small batches, without shortcuts or artificial additives.",
};

function content(kind: Kind, origin: ProductOrigin, processing: ProductProcessing): { checks: Point[]; steps: Point[] } {
  switch (kind) {
    case "saffron":
      return {
        checks: [
          { title: "Stigmas only", text: "Only the crimson stigmas go into the pack — no yellow style, no fillers." },
          { title: "Colour & aroma", text: "Each batch is checked for deep crimson threads and a strong, honeyed aroma before packing." },
          { title: "Kept from light & moisture", text: "Stored and packed away from light and damp, which dull saffron's colour and fragrance." },
          { title: "Lab tested", text: "Tested for quality before it is sold." },
        ],
        steps: [
          { title: "Hand-picked at dawn", text: "Each autumn the violet crocus flowers of the Karewa highlands are picked by hand at dawn." },
          { title: "Stigmas drawn by hand", text: "Only the three crimson stigmas of each flower are separated by hand." },
          { title: "Gently dried", text: "The threads are dried gently to seal in their colour, aroma and flavour." },
          { title: "Packed airtight", text: "Sealed in an airtight pack that keeps out light and moisture." },
        ],
      };
    case "honey":
      return {
        checks: [
          { title: "From the Kashmir hills", text: "Every jar comes from honey gathered in the hills of Kashmir." },
          { title: "Minimal handling", text: "Collected with care and packed with as little handling as possible." },
          { title: "Clean, dry jars", text: "Filled into clean, dry jars and sealed tight, since moisture spoils honey." },
          { title: "Lab tested", text: "Tested for quality before it is sold." },
        ],
        steps: [
          { title: "Nectar gathered by bees", text: "Honeybees forage on the flowering trees and wild blossoms of the Kashmir hills." },
          { title: "Collected with care", text: "The honey is collected from the hives by hand." },
          { title: "Packed with minimal handling", text: "Jarred with as little processing as possible to keep its natural character." },
          { title: "Sealed & dispatched", text: "Sealed tight and sent out in small batches." },
        ],
      };
    case "ghee":
      return {
        checks: [
          { title: "Dahi, never cream", text: "Only ghee churned from curd goes into our jars — never ghee made from cream." },
          { title: "Small batches", text: "Cooked a little at a time over a gentle flame, so every batch gets attention." },
          { title: "Grain & aroma", text: "Each batch is checked for its danedar (granular) texture and rich, nutty aroma." },
          { title: "Clean, dry jars", text: "Filled into clean, dry jars and sealed, so it keeps without refrigeration." },
        ],
        steps: [
          { title: "Milk set into dahi", text: "Fresh milk is set into dahi overnight." },
          { title: "Churned in a wooden bilona", text: "The dahi is hand-churned until golden makkhan rises to the surface." },
          { title: "Slow-cooked", text: "The makkhan is slow-cooked over a gentle flame, in small batches, into liquid gold." },
          { title: "Danedar grain forms", text: "As it cools, the ghee forms its signature granular texture." },
          { title: "Jarred & sealed", text: "Filled into jars and sealed for dispatch." },
        ],
      };
    case "gift":
      return {
        checks: [
          { title: "Every item checked", text: "Each product in the box passes its own quality checks before it is packed." },
          { title: "Dry or sealed items", text: "Everything inside is dry or sealed, so it travels well." },
          { title: "Ready to gift", text: "Presented in a keepsake box — no extra wrapping needed." },
        ],
        steps: [
          { title: "Chosen from our range", text: "Saffron, wild honey, almonds and walnuts from our own Kashmir range." },
          { title: "Packed in matching sizes", text: "Each item is packed in its gift size, with the saffron at the centre." },
          { title: "Boxed by hand", text: "Arranged by hand in the keepsake box." },
          { title: "Dispatched", text: "Sealed and sent out, ready to give." },
        ],
      };
    default:
      return {
        checks: [
          { title: "Hand-sorted", text: "Every lot is sorted by hand — broken, shrivelled and discoloured pieces are picked out." },
          { title: "Size & grade", text: "Pieces are graded by size so each pack is uniform, not topped up with smaller or lower-grade pieces." },
          { title: "Freshness test", text: "We smell and taste a sample from every batch; anything stale or rancid is rejected, not blended in." },
          { title: "Moisture check", text: "Lots that feel damp or overly dry are set aside, since moisture is what leads to fungus and a soft bite." },
          { title: "Foreign matter removed", text: "Stones, shell fragments, stems and dust are cleaned out before anything goes near a pouch." },
          { title: "Final look before sealing", text: "Each pack gets one last visual check at the packing table before it is sealed." },
        ],
        steps: [
          { title: "Sourced from farmers", text: `Harvested by local farming families in ${origin} and bought directly from them.` },
          { title: "Dried, shelled & sorted", text: "Carefully dried, then shelled and sorted to remove damaged pieces." },
          { title: "Graded", text: "Sorted by size and quality so only the grade we sell makes it to the next step." },
          { title: processing, text: NUT_PROCESSING_STEP[processing] },
          { title: "Packed airtight", text: "Weighed and sealed in airtight packs to keep out moisture and air." },
        ],
      };
  }
}

/** Quality checks and process steps for a product, chosen by what kind of product it is. */
export function qualityProcessContent(name: string, origin: ProductOrigin, processing: ProductProcessing) {
  return content(kindOf(name), origin, processing);
}

export type { Point as QualityPoint };
