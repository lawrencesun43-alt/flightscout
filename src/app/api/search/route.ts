// POST /api/search  → full offer list for one date.
// Keeps the Duffel token server-side.

import { NextResponse } from "next/server";
import { searchOffers } from "@/lib/duffel";
import type { SearchParams } from "@/lib/types";

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
    const offers = await searchOffers({
      ...params,
      adults: params.adults || 1,
    });
    return NextResponse.json({ offers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Search failed." },
      { status: 502 }
    );
  }
}
