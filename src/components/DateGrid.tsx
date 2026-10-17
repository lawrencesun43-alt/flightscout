"use client";

import type { GridCell } from "@/lib/types";
import { fmtDateLabel } from "@/lib/dates";

interface Props {
  cells: GridCell[];
  selectedDate: string;
  onPick: (date: string) => void;
}

/** Flexible-date heatmap. Cheapest day is highlighted green. */
export default function DateGrid({ cells, selectedDate, onPick }: Props) {
  const prices = cells
    .map((c) => c.cheapestAmount)
    .filter((p): p is number => p !== null);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  function cellTone(c: GridCell): string {
    if (c.cheapestAmount === null) return "bg-slate-100 text-slate-400";
    if (c.cheapestAmount === min) return "bg-emerald-100 text-emerald-800";
    if (max !== min && c.cheapestAmount === max)
      return "bg-rose-50 text-rose-700";
    return "bg-white text-slate-700";
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        Cheapest by date
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cells.map((c) => (
          <button
            key={c.date}
            onClick={() => c.cheapestAmount !== null && onPick(c.date)}
            disabled={c.cheapestAmount === null}
            className={`min-w-[88px] flex-shrink-0 rounded-lg border px-2 py-2 text-center transition ${cellTone(
              c
            )} ${
              c.date === selectedDate
                ? "border-indigo-500 ring-2 ring-indigo-200"
                : "border-slate-200"
            }`}
          >
            <div className="text-[11px] font-medium">
              {fmtDateLabel(c.date)}
            </div>
            <div className="text-sm font-bold">
              {c.cheapestAmount !== null
                ? `${c.currency === "GBP" ? "£" : c.currency === "USD" ? "$" : ""}${Math.round(
                    c.cheapestAmount
                  )}`
                : "—"}
            </div>
            <div className="text-[10px] text-slate-400">
              {c.stops === null
                ? "no offers"
                : c.stops === 0
                ? "nonstop"
                : `${c.stops} stop${c.stops > 1 ? "s" : ""}`}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
