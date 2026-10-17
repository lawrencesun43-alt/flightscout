// ─────────────────────────────────────────────────────────────
// Thin Duffel API client.
// Runs SERVER-SIDE only (inside API routes) so the token never
// reaches the browser. We hit the raw REST endpoint with fetch
// to avoid an extra SDK dependency for the MVP.
// Docs: https://duffel.com/docs/api/offer-requests
// ─────────────────────────────────────────────────────────────

import type { FlightOffer, Segment, Layover, SearchParams } from "./types";

const DUFFEL_BASE = "https://api.duffel.com";

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
 * Duffel returns offers inline when we POST with a single call
 * (synchronous search via `?return_offers=true`-style default).
 */
export async function searchOffers(
  params: SearchParams
): Promise<FlightOffer[]> {
  const { token, version } = getConfig();

  const body = {
    data: {
      // One slice = one-way. (Round-trip would add a second slice.)
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.date,
        },
      ],
      passengers: Array.from({ length: params.adults }, () => ({
        type: "adult",
      })),
      cabin_class: params.cabinClass ?? "economy",
      ...(params.maxConnections !== undefined
        ? { max_connections: params.maxConnections }
        : {}),
    },
  };

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests`, {
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

/** Map Duffel's raw offer → our lean FlightOffer. */
function normalizeOffer(raw: any): FlightOffer {
  // MVP searches are one-way → a single slice. Take the first slice.
  const slice = raw.slices?.[0] ?? { segments: [] };

  const segments: Segment[] = (slice.segments ?? []).map((s: any) => ({
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

  const totalDurationMinutes =
    segments.length > 0
      ? minutesBetween(
          segments[0].departingAt,
          segments[segments.length - 1].arrivingAt
        )
      : 0;

  return {
    id: raw.id,
    totalAmount: parseFloat(raw.total_amount),
    currency: raw.total_currency,
    owner: raw.owner?.name ?? "Unknown",
    segments,
    layovers,
    stops: layovers.length,
    totalDurationMinutes,
  };
}
