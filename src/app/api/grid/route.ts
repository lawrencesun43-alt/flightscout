// POST /api/grid  → cheapest price per date across a ± window.
//
// Each day's cheapest price is fetched as a lightweight one-way
// "indicator" (option A). All days run in PARALLEL (lightly
// staggered to respect Duffel's rate limit) and each day is CACHED,
// so repeat searches and date-grid clicks are instant.

import { NextResponse } from "next/server";
import { searchOffers } from "@/lib/duffel";
import { buildDateWindow } from "@/lib/dates";
import { TtlCache } from "@/lib/cache";
import type { GridCell, SearchParams } from "@/lib/types";

interface GridBody extends SearchParams {
  flexDays: number;
}

// Cache each day's cheapest-price cell for 10 minutes. Module-level
// so it persists across requests within the running server.
const GRID_CELL_TTL_MS = 10 * 60 * 1000;
const gridCache = new TtlCache<GridCell>(GRID_CELL_TTL_MS);

/** Duffel's documented rate limit is ~1 request / 100ms. */
const STAGGER_MS = 110;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  // SPEED/accuracy notes:
  //  - Always search ONE-WAY outbound (option A): the grid varies the
  //    outbound date as a price indicator; full round-trip pricing is
  //    in the detailed results.
  //  - Cap connections (default 1) → far fewer itineraries.
  const gridMaxConnections =
    body.maxConnections !== undefined ? body.maxConnections : 1;
  const cabin = body.cabinClass ?? "economy";

  const cacheKey = (date: string) =>
    `${body.origin}|${body.destination}|${date}|${cabin}|${gridMaxConnections}`;

  const empty = (date: string): GridCell => ({
    date,
    cheapestAmount: null,
    currency: null,
    owner: null,
    stops: null,
  });

  async function fetchCell(date: string): Promise<GridCell> {
    return gridCache.getOrCompute(cacheKey(date), async () => {
      try {
        const offers = await searchOffers(
          {
            origin: body.origin,
            destination: body.destination,
            date,
            tripType: "one_way",
            adults: body.adults || 1,
            cabinClass: body.cabinClass,
            maxConnections: gridMaxConnections,
          },
          // Short per-airline timeout — grid is just an indicator.
          { supplierTimeoutMs: 4000 }
        );
        if (offers.length === 0) return empty(date);
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
        return empty(date);
      }
    });
  }

  // Fire all days in PARALLEL, but stagger the *start* of each by
  // ~110ms so we stay under Duffel's rate limit. Cached days resolve
  // instantly and still get a (harmless) tiny stagger delay.
  const cells: GridCell[] = await Promise.all(
    dates.map(async (date, i) => {
      await sleep(i * STAGGER_MS);
      return fetchCell(date);
    })
  );

  return NextResponse.json({ cells });
}
