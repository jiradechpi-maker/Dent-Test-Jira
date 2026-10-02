"use client";

import { useEffect, useState } from "react";

export interface ClockSync {
  /** Milliseconds to add to Date.now() to get server time. */
  offset: number;
  status: "syncing" | "synced" | "local";
}

/**
 * Measures the difference between this device's clock and the (NTP-synced) server clock,
 * using the midpoint of the request round-trip. Falls back to the local clock on failure.
 */
export function useServerClock(): ClockSync {
  const [sync, setSync] = useState<ClockSync>({ offset: 0, status: "syncing" });

  useEffect(() => {
    let cancelled = false;

    async function measure(): Promise<number | null> {
      const t0 = Date.now();
      const response = await fetch("/api/time", { cache: "no-store" });
      const t1 = Date.now();
      if (!response.ok) return null;
      const body = (await response.json()) as { now?: unknown };
      if (typeof body.now !== "number") return null;
      const roundTrip = t1 - t0;
      if (roundTrip > 3000) return null; // too slow to be trustworthy
      return body.now - (t0 + roundTrip / 2);
    }

    (async () => {
      try {
        const samples: number[] = [];
        for (let i = 0; i < 3; i += 1) {
          const sample = await measure();
          if (sample !== null) samples.push(sample);
        }
        if (cancelled) return;
        if (samples.length === 0) {
          setSync({ offset: 0, status: "local" });
          return;
        }
        samples.sort((a, b) => a - b);
        const median = samples[Math.floor(samples.length / 2)] ?? 0;
        // Ignore sub-second differences — they are network noise, not a wrong clock.
        setSync({ offset: Math.abs(median) < 1000 ? 0 : Math.round(median), status: "synced" });
      } catch {
        if (!cancelled) setSync({ offset: 0, status: "local" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return sync;
}
