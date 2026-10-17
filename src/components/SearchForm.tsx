"use client";

import { useState } from "react";
import type { SearchParams, TripType } from "@/lib/types";
import { shiftDate } from "@/lib/dates";

interface Props {
  onSearch: (params: SearchParams, flexDays: number) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [origin, setOrigin] = useState("LHR");
  const [destination, setDestination] = useState("JFK");
  const [tripType, setTripType] = useState<TripType>("one_way");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [flexDays, setFlexDays] = useState(3);
  const [cabinClass, setCabinClass] =
    useState<SearchParams["cabinClass"]>("economy");

  const roundTrip = tripType === "round_trip";

  // When the user picks an outbound date and we don't yet have a
  // return date, default it to outbound + 7 days.
  function handleDateChange(value: string) {
    setDate(value);
    if (roundTrip && value && !returnDate) {
      setReturnDate(shiftDate(value, 7));
    }
  }

  function handleTripTypeChange(next: TripType) {
    setTripType(next);
    if (next === "round_trip" && date && !returnDate) {
      setReturnDate(shiftDate(date, 7));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(
      {
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        date,
        returnDate: roundTrip ? returnDate : undefined,
        tripType,
        adults: 1,
        cabinClass,
      },
      flexDays
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl bg-white p-4 shadow-sm">
      {/* Trip-type toggle */}
      <div className="mb-3 inline-flex rounded-lg border border-slate-200 p-0.5 text-xs">
        <button
          type="button"
          onClick={() => handleTripTypeChange("one_way")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            !roundTrip
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          One-way
        </button>
        <button
          type="button"
          onClick={() => handleTripTypeChange("round_trip")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            roundTrip
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Round-trip
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-7">
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
          <label className="block text-xs font-medium text-slate-500">
            {roundTrip ? "Depart" : "Date"}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-xs font-medium text-slate-500">
            Return
          </label>
          <input
            type="date"
            value={returnDate}
            min={date || undefined}
            onChange={(e) => setReturnDate(e.target.value)}
            required={roundTrip}
            disabled={!roundTrip}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 disabled:bg-slate-100 disabled:text-slate-400"
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
          <label className="block text-xs font-medium text-slate-500">
            Cabin
          </label>
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
      </div>

      {roundTrip && (
        <p className="mt-2 text-[11px] text-slate-400">
          The date grid varies your <strong>outbound</strong> day (±flex) as a
          price indicator; results below are full round-trip offers for the
          selected dates.
        </p>
      )}
    </form>
  );
}
