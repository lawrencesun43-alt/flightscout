"use client";

import { useState } from "react";
import type { SearchParams } from "@/lib/types";

interface Props {
  onSearch: (params: SearchParams, flexDays: number) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [origin, setOrigin] = useState("LHR");
  const [destination, setDestination] = useState("JFK");
  const [date, setDate] = useState("");
  const [flexDays, setFlexDays] = useState(3);
  const [cabinClass, setCabinClass] =
    useState<SearchParams["cabinClass"]>("economy");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(
      {
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        date,
        adults: 1,
        cabinClass,
      },
      flexDays
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-6"
    >
      <div className="col-span-1">
        <label className="block text-xs font-medium text-slate-500">From</label>
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="LHR"
          maxLength={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 uppercase"
        />
      </div>
      <div className="col-span-1">
        <label className="block text-xs font-medium text-slate-500">To</label>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="JFK"
          maxLength={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 uppercase"
        />
      </div>
      <div className="col-span-1">
        <label className="block text-xs font-medium text-slate-500">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
        />
      </div>
      <div className="col-span-1">
        <label className="block text-xs font-medium text-slate-500">
          Flex ±days
        </label>
        <select
          value={flexDays}
          onChange={(e) => setFlexDays(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
        >
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              ±{n}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-1">
        <label className="block text-xs font-medium text-slate-500">Cabin</label>
        <select
          value={cabinClass}
          onChange={(e) =>
            setCabinClass(e.target.value as SearchParams["cabinClass"])
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
        >
          <option value="economy">Economy</option>
          <option value="premium_economy">Premium</option>
          <option value="business">Business</option>
          <option value="first">First</option>
        </select>
      </div>
      <div className="col-span-1 flex items-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
    </form>
  );
}
