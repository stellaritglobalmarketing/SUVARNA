"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * List filters kept in the URL (?search=…&page=2), so they survive refresh/back and the dashboard
 * can link straight to a filtered list. Changing any filter other than `page` resets to page 1.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = Object.fromEntries(keys.map((key) => [key, searchParams.get(key) ?? ""])) as Record<K, string>;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const setFilter = useCallback(
    (key: K | "page", value: string | number) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "" || value === undefined) next.delete(key);
      else next.set(key, String(value));
      if (key !== "page") next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { filters, page, setFilter };
}
