// ─────────────────────────────────────────────────────────────
// Shared types for FlightScout.
// These are a SIMPLIFIED view of Duffel's response — we map
// Duffel's verbose offer shape down to just what the UI needs.
// ─────────────────────────────────────────────────────────────

/** A single flight leg (one takeoff → one landing). */
export interface Segment {
  origin: string; // IATA code, e.g. "LHR"
  destination: string; // IATA code, e.g. "JFK"
  departingAt: string; // ISO datetime
  arrivingAt: string; // ISO datetime
  marketingCarrier: string; // e.g. "British Airways"
  marketingCarrierCode: string; // e.g. "BA"
  flightNumber: string;
  durationMinutes: number;
}

/** A computed gap between two consecutive segments. */
export interface Layover {
  airport: string; // IATA code where you wait
  durationMinutes: number;
}

/**
 * One direction of a journey (e.g. the outbound, or the return).
 * A one-way offer has one slice; a round-trip has two.
 */
export interface Slice {
  origin: string;
  destination: string;
  segments: Segment[];
  layovers: Layover[];
  stops: number; // == layovers.length
  durationMinutes: number; // first departure → last arrival for this slice
}

/** One bookable offer, normalized for the UI. */
export interface FlightOffer {
  id: string;
  totalAmount: number;
  currency: string;
  owner: string; // airline that owns the offer
  slices: Slice[]; // 1 = one-way, 2 = round-trip
  /** Worst (highest) stop count across all slices — used for filtering. */
  maxStops: number;
  totalDurationMinutes: number; // sum of all slices' flying time
}

export type TripType = "one_way" | "round_trip";

/** An airport or city suggestion for autocomplete. */
export interface Place {
  iataCode: string; // "SIN"
  name: string; // "Singapore Changi Airport"
  cityName: string; // "Singapore"
  type: "airport" | "city";
}

/** The search the user asked for. */
export interface SearchParams {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD (outbound)
  returnDate?: string; // YYYY-MM-DD — present only for round-trip
  tripType?: TripType; // defaults to one_way
  adults: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  maxConnections?: number; // sent to Duffel to cap stops server-side
}

/** Client-side layover filters (applied without new API calls). */
export interface LayoverFilters {
  maxStops: number; // 0 = nonstop only
  minLayoverMinutes: number;
  maxLayoverMinutes: number;
  avoidAirports: string[]; // IATA codes to exclude as connections
  preferAirports: string[]; // IATA codes to boost/mark (does not exclude)
}

/** One cell in the flexible-date grid. */
export interface GridCell {
  date: string; // YYYY-MM-DD
  cheapestAmount: number | null; // null = no offers / error
  currency: string | null;
  owner: string | null;
  stops: number | null;
}

// ── Phase 5: watchlist + price snapshots ─────────────────────

/** A route the user saved to track over time. */
export interface SavedSearch {
  id: string;
  origin: string;
  destination: string;
  targetDate: string; // YYYY-MM-DD (outbound)
  returnDate?: string; // YYYY-MM-DD — present only for round-trip
  tripType?: TripType; // defaults to one_way
  flexDays: number;
  cabinClass: SearchParams["cabinClass"];
  maxConnections?: number;
  createdAt: string; // ISO
}

/** One recorded "cheapest price" reading for a saved search. */
export interface PriceSnapshot {
  id: string;
  searchId: string; // → SavedSearch.id
  date: string; // the cheapest date in the window (YYYY-MM-DD)
  cheapestAmount: number;
  currency: string;
  owner: string; // airline
  stops: number;
  capturedAt: string; // ISO
}

/** Derived trend info for showing "is this cheap?". */
export interface PriceStats {
  current: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  verdict: "low" | "normal" | "high" | "unknown";
  changeFromPrevious: number | null; // + = went up since last reading
  points: number[]; // chronological amounts, for a sparkline
}
