// POST /api/watchlist/snapshot?id=...
// Re-runs the flexible-date grid search for a saved search and
// records the current cheapest price as a snapshot. This is what
// powers the "is this cheap vs last week?" trend. Call it on
// demand (a "Refresh" button) or from a cron/scheduled task.

import { NextResponse } from "next/server";
import { searchOffers } from "@/lib/duffel";
import { buildDateWindow } from "@/lib/dates";
import { addSnapshot, getWatchlist, getSnapshotsForSearch } from "@/lib/store";
import { computeStats } from "@/lib/stats";

export async function POST(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required." }, { status: 400 });
  }

  const list = await getWatchlist();
  const w = list.find((x) => x.id === id);
  if (!w) {
    return NextResponse.json({ error: "Saved search not found." }, { status: 404 });
  }

  const dates = buildDateWindow(w.targetDate, w.flexDays);

  // Find the single cheapest offer across the whole window.
  let best: {
    date: string;
    amount: number;
    currency: string;
    owner: string;
    stops: number;
  } | null = null;

  for (const date of dates) {
    try {
      // Consistent with the grid (option A): track the cheapest
      // ONE-WAY outbound price as the indicator, capped connections
      // for speed.
      const offers = await searchOffers(
        {
          origin: w.origin,
          destination: w.destination,
          date,
          tripType: "one_way",
          adults: 1,
          cabinClass: w.cabinClass,
          maxConnections: w.maxConnections !== undefined ? w.maxConnections : 1,
        },
        { supplierTimeoutMs: 4000 }
      );
      for (const o of offers) {
        if (!best || o.totalAmount < best.amount) {
          best = {
            date,
            amount: o.totalAmount,
            currency: o.currency,
            owner: o.owner,
            stops: o.maxStops,
          };
        }
      }
    } catch {
      // Skip a failing date; keep scanning the rest of the window.
    }
  }

  if (!best) {
    return NextResponse.json(
      { error: "No offers found for this watch right now." },
      { status: 502 }
    );
  }

  await addSnapshot({
    searchId: w.id,
    date: best.date,
    cheapestAmount: best.amount,
    currency: best.currency,
    owner: best.owner,
    stops: best.stops,
  });

  const snaps = await getSnapshotsForSearch(w.id);
  return NextResponse.json({ stats: computeStats(snaps), snapshotCount: snaps.length });
}
