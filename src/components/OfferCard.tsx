"use client";

import type { FlightOffer, LayoverFilters } from "@/lib/types";
import { fmtDuration, hasPreferredLayover } from "@/lib/layovers";

interface Props {
  offer: FlightOffer;
  filters: LayoverFilters;
}

function money(amount: number, currency: string): string {
  const sym = currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${sym}${amount.toFixed(2)} ${sym ? "" : currency}`.trim();
}

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OfferCard({ offer, filters }: Props) {
  const preferred = hasPreferredLayover(offer, filters);

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        preferred ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-slate-800">{offer.owner}</div>
          <div className="text-xs text-slate-500">
            {offer.stops === 0
              ? "Nonstop"
              : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}{" "}
            · {fmtDuration(offer.totalDurationMinutes)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-indigo-700">
            {money(offer.totalAmount, offer.currency)}
          </div>
          {preferred && (
            <span className="text-[10px] font-medium text-emerald-600">
              ★ preferred stop
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-600">
        {offer.segments.map((s, i) => (
          <div key={i}>
            <span className="font-medium">
              {s.origin} {timeOnly(s.departingAt)}
            </span>{" "}
            →{" "}
            <span className="font-medium">
              {s.destination} {timeOnly(s.arrivingAt)}
            </span>{" "}
            <span className="text-slate-400">
              · {s.marketingCarrierCode}
              {s.flightNumber} · {fmtDuration(s.durationMinutes)}
            </span>
            {offer.layovers[i] && (
              <div className="ml-2 text-[11px] text-amber-600">
                ↳ {fmtDuration(offer.layovers[i].durationMinutes)} layover in{" "}
                {offer.layovers[i].airport}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
