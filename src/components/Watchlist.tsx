"use client";

import { useCallback, useEffect, useState } from "react";
import Sparkline from "./Sparkline";
import type { PriceStats, SavedSearch } from "@/lib/types";

interface WatchItem {
  search: SavedSearch;
  stats: PriceStats;
  snapshotCount: number;
}

const VERDICT_STYLE: Record<PriceStats["verdict"], string> = {
  low: "bg-emerald-100 text-emerald-700",
  normal: "bg-slate-100 text-slate-600",
  high: "bg-rose-100 text-rose-700",
  unknown: "bg-slate-100 text-slate-400",
};

function money(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  const sym = currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${sym}${Math.round(amount)}`;
}

/** The watchlist panel. `refreshKey` bumps to force a reload after a save. */
export default function Watchlist({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist");
      const json = await res.json();
      if (res.ok) setItems(json.items as WatchItem[]);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function refreshOne(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist/snapshot?id=${id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Refresh failed");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/watchlist?id=${id}`, { method: "DELETE" });
    await load();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-700">
          📌 Watchlist
        </h3>
        Save a search below to start tracking its price over time.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">📌 Watchlist</h3>
      {error && (
        <div className="mb-2 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {error}
        </div>
      )}
      <ul className="space-y-3">
        {items.map(({ search, stats, snapshotCount }) => {
          // Summary view is symbol-neutral; exact currency lives per-snapshot.
          const currency = "";
          return (
            <li
              key={search.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">
                    {search.origin} → {search.destination}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${VERDICT_STYLE[stats.verdict]}`}
                  >
                    {stats.verdict}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {search.targetDate} · ±{search.flexDays}d · {search.cabinClass}
                  {" · "}
                  {snapshotCount} reading{snapshotCount !== 1 ? "s" : ""}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm font-bold text-indigo-700">
                    {money(stats.current, currency)}
                  </span>
                  {stats.changeFromPrevious !== null &&
                    stats.changeFromPrevious !== 0 && (
                      <span
                        className={`text-xs ${
                          stats.changeFromPrevious > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {stats.changeFromPrevious > 0 ? "▲" : "▼"}{" "}
                        {money(Math.abs(stats.changeFromPrevious), currency)}
                      </span>
                    )}
                  {stats.min !== null && (
                    <span className="text-[11px] text-slate-400">
                      low {money(stats.min, currency)} · high{" "}
                      {money(stats.max, currency)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Sparkline points={stats.points} />
                <div className="flex gap-2">
                  <button
                    onClick={() => refreshOne(search.id)}
                    disabled={busyId === search.id}
                    className="rounded bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {busyId === search.id ? "…" : "Refresh"}
                  </button>
                  <button
                    onClick={() => remove(search.id)}
                    className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
