// POST /api/grid  → cheapest price per date across a ± window.
// Fires one Duffel search per date, in parallel (bounded), and
// returns just the cheapest cell for each day.

import { NextResponse } from "next/server";
import { searchOffers } from "@/lib/duffel";
import { buildDateWindow } from "@/lib/dates";
import type { GridCell, SearchParams } from "@/lib/types";

interface GridBody extends SearchParams {
  flexDays: number;
}

/** Resolve promises in small batches to respect Duffel rate limits. */
async function inBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

export async function POST(req: Request) {
  let body: GridBody;
  try {
    body = (await req.json()) as GridBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.origin || !body.destination || !body.date) {
    return NextResponse.json(
      { error: "origin, destination and date are required." },
      { status: 400 }
    );
  }

  const flexDays = Math.min(Math.max(body.flexDays ?? 3, 0), 5);
  const dates = buildDateWindow(body.date, flexDays);

  // SPEED: the grid only needs the cheapest price per day, as a
  // price *indicator*. So we:
  //   1. Always search ONE-WAY (outbound only), even on round-trip
  //      — option A: the grid varies the outbound date. Full
  //      round-trip pricing happens in the detailed results below.
  //   2. Cap connections (default 1) so Duffel returns far fewer
  //      itineraries → each call is much faster on long-haul routes.
  const gridMaxConnections =
    body.maxConnections !== undefined ? body.maxConnections : 1;

  // Batches of 3 keep us comfortably under Duffel's rate limit
  // (1 request / 100ms).
  const cells: GridCell[] = await inBatches(dates, 3, async (date) => {
    try {
      const offers = await searchOffers(
        {
          origin: body.origin,
          destination: body.destination,
          date,
          // grid is always a one-way outbound indicator (option A)
          tripType: "one_way",
          adults: body.adults || 1,
          cabinClass: body.cabinClass,
          maxConnections: gridMaxConnections,
        },
        { cheapestOnly: true }
      );
      if (offers.length === 0) {
        return { date, cheapestAmount: null, currency: null, owner: null, stops: null };
      }
      const cheapest = offers.reduce((a, b) =>
        a.totalAmount <= b.totalAmount ? a : b
      );
      return {
        date,
        cheapestAmount: cheapest.totalAmount,
        currency: cheapest.currency,
        owner: cheapest.owner,
        stops: cheapest.maxStops,
      };
    } catch {
      return { date, cheapestAmount: null, currency: null, owner: null, stops: null };
    }
  });

  return NextResponse.json({ cells });
}
