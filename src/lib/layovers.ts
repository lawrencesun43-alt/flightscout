// ─────────────────────────────────────────────────────────────
// Layover engine — the core differentiator.
// Pure functions, run CLIENT-SIDE so toggling a filter re-renders
// instantly with zero extra API calls.
// ─────────────────────────────────────────────────────────────

import type { FlightOffer, LayoverFilters } from "./types";

export const DEFAULT_FILTERS: LayoverFilters = {
  maxStops: 2,
  minLayoverMinutes: 0,
  maxLayoverMinutes: 24 * 60, // 24h
  avoidAirports: [],
  preferAirports: [],
};

/** Does this offer pass every active layover constraint? */
export function offerPasses(
  offer: FlightOffer,
  f: LayoverFilters
): boolean {
  if (offer.stops > f.maxStops) return false;

  for (const lay of offer.layovers) {
    if (lay.durationMinutes < f.minLayoverMinutes) return false;
    if (lay.durationMinutes > f.maxLayoverMinutes) return false;
    if (f.avoidAirports.includes(lay.airport)) return false;
  }
  return true;
}

/** True if any layover is at a "preferred" airport (for UI badging). */
export function hasPreferredLayover(
  offer: FlightOffer,
  f: LayoverFilters
): boolean {
  if (f.preferAirports.length === 0) return false;
  return offer.layovers.some((l) => f.preferAirports.includes(l.airport));
}

/**
 * Filter + sort. Offers with a preferred layover float to the top
 * (but still ordered by price within each group).
 */
export function applyFilters(
  offers: FlightOffer[],
  f: LayoverFilters
): FlightOffer[] {
  return offers
    .filter((o) => offerPasses(o, f))
    .sort((a, b) => {
      const ap = hasPreferredLayover(a, f) ? 0 : 1;
      const bp = hasPreferredLayover(b, f) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.totalAmount - b.totalAmount;
    });
}

/** "7h 25m" from minutes. */
export function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
