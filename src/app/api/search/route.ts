// POST /api/search  → full offer list for one date.
// Keeps the Duffel token server-side. Results are cached briefly so
// clicking around the date grid (which re-searches per date) and
// repeat searches feel instant.

import { NextResponse } from "next/server";
import { searchOffers } from "@/lib/duffel";
import { TtlCache } from "@/lib/cache";
import type { FlightOffer, SearchParams } from "@/lib/types";

// 5 min TTL — shorter than the grid since these are the full,
// bookable results the user actually looks at.
const SEARCH_TTL_MS = 5 * 60 * 1000;
const searchCache = new TtlCache<FlightOffer[]>(SEARCH_TTL_MS);

function keyFor(p: SearchParams): string {
  return [
    p.origin,
    p.destination,
    p.date,
    p.returnDate ?? "",
    p.tripType ?? "one_way",
    p.cabinClass ?? "economy",
    p.adults || 1,
    p.maxConnections ?? "",
  ].join("|");
}

export async function POST(req: Request) {
  let params: SearchParams;
  try {
    params = (await req.json()) as SearchParams;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!params.origin || !params.destination || !params.date) {
    return NextResponse.json(
      { error: "origin, destination and date are required." },
      { status: 400 }
    );
  }

  try {
    const normalized: SearchParams = { ...params, adults: params.adults || 1 };
    const offers = await searchCache.getOrCompute(keyFor(normalized), () =>
      searchOffers(normalized)
    );
    return NextResponse.json({ offers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Search failed." },
      { status: 502 }
    );
  }
}
