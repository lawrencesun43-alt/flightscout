// GET  /api/watchlist           → all saved searches + their stats
// POST /api/watchlist           → add a saved search
// DELETE /api/watchlist?id=...   → remove a saved search

import { NextResponse } from "next/server";
import {
  addToWatchlist,
  getWatchlist,
  getSnapshotsForSearch,
  removeFromWatchlist,
} from "@/lib/store";
import { computeStats } from "@/lib/stats";
import type { SavedSearch } from "@/lib/types";

export async function GET() {
  const list = await getWatchlist();
  const withStats = await Promise.all(
    list.map(async (w) => {
      const snaps = await getSnapshotsForSearch(w.id);
      return { search: w, stats: computeStats(snaps), snapshotCount: snaps.length };
    })
  );
  return NextResponse.json({ items: withStats });
}

export async function POST(req: Request) {
  let body: Omit<SavedSearch, "id" | "createdAt">;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.origin || !body.destination || !body.targetDate) {
    return NextResponse.json(
      { error: "origin, destination and targetDate are required." },
      { status: 400 }
    );
  }
  const saved = await addToWatchlist(body);
  return NextResponse.json({ saved });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required." }, { status: 400 });
  }
  await removeFromWatchlist(id);
  return NextResponse.json({ ok: true });
}
