"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { configurePixel, track } from "@/lib/tracking/track";

/** Turns on the Meta Pixel (when an ID is set in Admin → Settings) and reports every page the visitor opens. */
export function ActivityTracker({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    configurePixel(pixelId);
  }, [pixelId]);

  useEffect(() => {
    track("page_view");
  }, [pathname]);

  return null;
}
