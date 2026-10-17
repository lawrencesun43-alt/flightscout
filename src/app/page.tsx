"use client";

import { useMemo, useState } from "react";
import SearchForm from "@/components/SearchForm";
import DateGrid from "@/components/DateGrid";
import LayoverControls from "@/components/LayoverControls";
import OfferCard from "@/components/OfferCard";
import Lenses from "@/components/Lenses";
import Watchlist from "@/components/Watchlist";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/layovers";
import type {
  FlightOffer,
  GridCell,
  LayoverFilters,
  SearchParams,
} from "@/lib/types";

export default function Home() {
  const [params, setParams] = useState<SearchParams | null>(null);
  const [flexDays, setFlexDays] = useState(3);
  const [cells, setCells] = useState<GridCell[]>([]);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [filters, setFilters] = useState<LayoverFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchRefresh, setWatchRefresh] = useState(0);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function saveToWatchlist() {
    if (!params) return;
    setSaveMsg(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: params.origin,
          destination: params.destination,
          targetDate: params.date,
          returnDate: params.returnDate,
          tripType: params.tripType,
          flexDays,
          cabinClass: params.cabinClass,
          maxConnections: params.maxConnections,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Could not save");
      }
      setSaveMsg("Saved to watchlist — hit Refresh there to capture a price.");
      setWatchRefresh((n) => n + 1);
    } catch (e: any) {
      setSaveMsg(e.message);
    }
  }

  const visibleOffers = useMemo(
    () => applyFilters(offers, filters),
    [offers, filters]
  );

  async function fetchOffers(p: SearchParams) {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Search failed");
    setOffers(json.offers as FlightOffer[]);
  }

  async function fetchGrid(p: SearchParams, flex: number) {
    const res = await fetch("/api/grid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, flexDays: flex }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Grid failed");
    setCells(json.cells as GridCell[]);
  }

  async function handleSearch(p: SearchParams, flex: number) {
    setLoading(true);
    setError(null);
    setParams(p);
    setFlexDays(flex);
    try {
      await Promise.all([fetchOffers(p), fetchGrid(p, flex)]);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickDate(date: string) {
    if (!params) return;
    const next = { ...params, date };
    setParams(next);
    setLoading(true);
    setError(null);
    try {
      await fetchOffers(next);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          ✈️ FlightScout
        </h1>
        <p className="text-sm text-slate-500">
          One search — cash offers, layover control, flexible dates, plus
          student &amp; points shortcuts.
        </p>
      </header>

      <div className="mb-6">
        <Watchlist refreshKey={watchRefresh} />
      </div>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {error && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {params && (
        <div className="mt-6 space-y-6">
          {cells.length > 0 && (
            <DateGrid
              cells={cells}
              selectedDate={params.date}
              onPick={handlePickDate}
            />
          )}

          <Lenses params={params} />

          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="md:sticky md:top-6 md:self-start">
              <LayoverControls filters={filters} onChange={setFilters} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                  {visibleOffers.length} offer
                  {visibleOffers.length !== 1 ? "s" : ""}
                  {offers.length !== visibleOffers.length &&
                    ` (of ${offers.length}, filtered)`}
                </h2>
                <button
                  onClick={saveToWatchlist}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  📌 Save to watchlist
                </button>
              </div>

              {saveMsg && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
                  {saveMsg}
                </div>
              )}

              {!loading && offers.length === 0 && (
                <p className="text-sm text-slate-500">
                  No offers for this date. In the Duffel sandbox, try LHR→JFK or
                  LGW→JFK with a near-future date.
                </p>
              )}

              {visibleOffers.map((o) => (
                <OfferCard key={o.id} offer={o} filters={filters} />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
