import { useEffect, useState } from "react";

/** The current time in ms, refreshed every `intervalMs`. For client-rendered parts only (e.g. the home page). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
