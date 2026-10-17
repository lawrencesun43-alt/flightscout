// ─────────────────────────────────────────────────────────────
// Thin Duffel API client.
// Runs SERVER-SIDE only (inside API routes) so the token never
// reaches the browser. We hit the raw REST endpoint with fetch
// to avoid an extra SDK dependency for the MVP.
// Docs: https://duffel.com/docs/api/offer-requests
// ─────────────────────────────────────────────────────────────

import type { FlightOffer, Segment, Layover, Slice, SearchParams } from "./types";

const DUFFEL_BASE = "https://api.duffel.com";

/** Extra knobs for tuning a search (used by the grid for speed). */
export interface SearchOptions {
  /**
   * How long (ms) Duffel waits for EACH airline to respond, before
   * returning whatever it has. This is the real speed lever: Duffel
   * otherwise waits up to 20s (default) for the slowest supplier.
   * Range 2000–60000. The flexible-date grid only needs a cheapest-
   * price indicator, so it sets this low (~4s) — fast suppliers still
   * answer; slow ones are simply skipped for the grid.
   * Docs: https://duffel.com/docs/api/overview/response-times
   */
  supplierTimeoutMs?: number;
}

function getConfig() {
  const token = process.env.DUFFEL_API_TOKEN;
  const version = process.env.DUFFEL_API_VERSION || "v2";
  if (!token || token.includes("paste_your_token")) {
    throw new Error(
      "DUFFEL_API_TOKEN is not set. Copy .env.local.example to .env.local and paste your sandbox token."
    );
  }
  return { token, version };
}

/** Minutes between two ISO datetimes. */
function minutesBetween(startIso: string, endIso: string): number {
  return Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  );
}

/**
 * Create an offer request and return normalized offers.
 *
 * - One-way  → 1 slice (origin → destination on `date`).
 * - Round-trip → 2 slices (outbound on `date`, return on `returnDate`).
 */
export async function searchOffers(
  params: SearchParams,
  options: SearchOptions = {}
): Promise<FlightOffer[]> {
  const { token, version } = getConfig();

  const isRoundTrip =
    params.tripType === "round_trip" && !!params.returnDate;

  const slices = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.date,
    },
  ];
  if (isRoundTrip) {
    // Return leg: reverse the route on the return date.
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate!,
    });
  }

  const body: any = {
    data: {
      slices,
      passengers: Array.from({ length: params.adults }, () => ({
        type: "adult",
      })),
      cabin_class: params.cabinClass ?? "economy",
      ...(params.maxConnections !== undefined
        ? { max_connections: params.maxConnections }
        : {}),
    },
  };

  // supplier_timeout (ms, 2000–60000) is the real speed lever: it
  // caps how long Duffel waits for each airline before returning.
  const qsParams = new URLSearchParams();
  if (options.supplierTimeoutMs !== undefined) {
    const clamped = Math.min(
      Math.max(Math.round(options.supplierTimeoutMs), 2000),
      60000
    );
    qsParams.set("supplier_timeout", String(clamped));
  }
  const qs = qsParams.toString() ? `?${qsParams.toString()}` : "";

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests${qs}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": version,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    // Flexible-date grids fire many of these; keep them snappy.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Duffel error ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = await res.json();
  const offers = json?.data?.offers ?? [];
  return offers.map(normalizeOffer);
}

/** Build a normalized Slice from one raw Duffel slice. */
function normalizeSlice(rawSlice: any): Slice {
  const segments: Segment[] = (rawSlice?.segments ?? []).map((s: any) => ({
    origin: s.origin?.iata_code ?? s.origin?.id ?? "???",
    destination: s.destination?.iata_code ?? s.destination?.id ?? "???",
    departingAt: s.departing_at,
    arrivingAt: s.arriving_at,
    marketingCarrier: s.marketing_carrier?.name ?? "Unknown",
    marketingCarrierCode: s.marketing_carrier?.iata_code ?? "??",
    flightNumber: s.marketing_carrier_flight_number ?? "",
    durationMinutes: minutesBetween(s.departing_at, s.arriving_at),
  }));

  const layovers: Layover[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    layovers.push({
      airport: segments[i].destination,
      durationMinutes: minutesBetween(
        segments[i].arrivingAt,
        segments[i + 1].departingAt
      ),
    });
  }

  const durationMinutes =
    segments.length > 0
      ? minutesBetween(
          segments[0].departingAt,
          segments[segments.length - 1].arrivingAt
        )
      : 0;

  return {
    origin: segments[0]?.origin ?? rawSlice?.origin?.iata_code ?? "???",
    destination:
      segments[segments.length - 1]?.destination ??
      rawSlice?.destination?.iata_code ??
      "???",
    segments,
    layovers,
    stops: layovers.length,
    durationMinutes,
  };
}

/** Map Duffel's raw offer → our lean FlightOffer (1+ slices). */
function normalizeOffer(raw: any): FlightOffer {
  const slices: Slice[] = (raw.slices ?? []).map(normalizeSlice);

  const maxStops = slices.reduce((m, s) => Math.max(m, s.stops), 0);
  const totalDurationMinutes = slices.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  );

  return {
    id: raw.id,
    totalAmount: parseFloat(raw.total_amount),
    currency: raw.total_currency,
    owner: raw.owner?.name ?? "Unknown",
    slices,
    maxStops,
    totalDurationMinutes,
  };
}
