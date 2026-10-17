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

  type Candidate = {
    date: string;
    amount: number;
    currency: string;
    owner: string;
    stops: number;
  };

  const STAGGER_MS = 110; // stay under Duffel's ~1 req/100ms limit
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Fire one search per day in PARALLEL (staggered), each returning
  // that day's cheapest candidate. Same fast one-way indicator the
  // grid uses (option A). Was a sequential loop (~14s) → now ~5s.
  const perDay = await Promise.all(
    dates.map(async (date, i): Promise<Candidate | null> => {
      await sleep(i * STAGGER_MS);
      try {
        const offers = await searchOffers(
          {
            origin: w.origin,
            destination: w.destination,
            date,
            tripType: "one_way",
            adults: 1,
            cabinClass: w.cabinClass,
            maxConnections:
              w.maxConnections !== undefined ? w.maxConnections : 1,
          },
          { supplierTimeoutMs: 4000 }
        );
        if (offers.length === 0) return null;
        const cheapest = offers.reduce((a, b) =>
          a.totalAmount <= b.totalAmount ? a : b
        );
        return {
          date,
          amount: cheapest.totalAmount,
          currency: cheapest.currency,
          owner: cheapest.owner,
          stops: cheapest.maxStops,
        };
      } catch {
        return null; // skip a failing date, keep the rest
      }
    })
  );

  // Pick the single cheapest across the whole window.
  const best = perDay.reduce<Candidate | null>((acc, c) => {
    if (!c) return acc;
    return !acc || c.amount < acc.amount ? c : acc;
  }, null);

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
