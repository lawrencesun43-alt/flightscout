// GET /api/places?q=sing  → airport/city suggestions for autocomplete.
// Keeps the Duffel token server-side. Results are cached since the
// same prefixes get typed repeatedly.

import { NextResponse } from "next/server";
import { suggestPlaces } from "@/lib/duffel";
import { TtlCache } from "@/lib/cache";
import type { Place } from "@/lib/types";

const PLACES_TTL_MS = 60 * 60 * 1000; // 1h — airport data barely changes
const placesCache = new TtlCache<Place[]>(PLACES_TTL_MS);

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ places: [] });
  }

  try {
    const places = await placesCache.getOrCompute(q.toLowerCase(), () =>
      suggestPlaces(q)
    );
    return NextResponse.json({ places });
  } catch (err: any) {
    // Autocomplete failing shouldn't block the user — return empty.
    return NextResponse.json({ places: [], error: err.message ?? "lookup failed" });
  }
}
