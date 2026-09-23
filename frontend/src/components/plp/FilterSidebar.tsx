import { FilterControls } from "./FilterControls";

/** Static sidebar shown from `lg` up — below that, `MobileFilterSheet` takes over. */
export function FilterSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <FilterControls />
    </aside>
  );
}
