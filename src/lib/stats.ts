// ─────────────────────────────────────────────────────────────
// Turn a saved search's snapshot history into a "is this cheap?"
// verdict — our personalized version of Google Flights' low/
// normal/high, built from YOUR own search history.
// Pure functions; safe on client or server.
// ─────────────────────────────────────────────────────────────

import type { PriceSnapshot, PriceStats } from "./types";

/**
 * A reading is "low" if it's within 5% of the cheapest ever seen,
 * "high" if within 5% of the most expensive, else "normal".
 * Needs at least 2 readings to say anything.
 */
export function computeStats(snapshots: PriceSnapshot[]): PriceStats {
  const sorted = [...snapshots].sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt)
  );
  const points = sorted.map((s) => s.cheapestAmount);

  if (points.length === 0) {
    return {
      current: null,
      min: null,
      max: null,
      avg: null,
      verdict: "unknown",
      changeFromPrevious: null,
      points: [],
    };
  }

  const current = points[points.length - 1];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const avg = points.reduce((a, b) => a + b, 0) / points.length;
  const changeFromPrevious =
    points.length >= 2 ? current - points[points.length - 2] : null;

  let verdict: PriceStats["verdict"] = "unknown";
  if (points.length >= 2) {
    const range = max - min;
    if (range === 0) {
      verdict = "normal";
    } else {
      const lowBand = min + range * 0.05;
      const highBand = max - range * 0.05;
      if (current <= lowBand) verdict = "low";
      else if (current >= highBand) verdict = "high";
      else verdict = "normal";
    }
  }

  return { current, min, max, avg, verdict, changeFromPrevious, points };
}
