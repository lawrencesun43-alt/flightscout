"use client";

import type { FlightOffer, LayoverFilters, Slice } from "@/lib/types";
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

function stopsLabel(stops: number): string {
  return stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? "s" : ""}`;
}

/** Render one direction (outbound or return). */
function SliceRows({ slice, label }: { slice: Slice; label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span className="text-[11px] text-slate-400">
          {slice.origin} → {slice.destination} · {stopsLabel(slice.stops)} ·{" "}
          {fmtDuration(slice.durationMinutes)}
        </span>
      </div>
      <div className="space-y-1 text-xs text-slate-600">
        {slice.segments.map((s, i) => (
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
            {slice.layovers[i] && (
              <div className="ml-2 text-[11px] text-amber-600">
                ↳ {fmtDuration(slice.layovers[i].durationMinutes)} layover in{" "}
                {slice.layovers[i].airport}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OfferCard({ offer, filters }: Props) {
  const preferred = hasPreferredLayover(offer, filters);
  const roundTrip = offer.slices.length > 1;

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
            {roundTrip ? "Round-trip" : "One-way"} ·{" "}
            {fmtDuration(offer.totalDurationMinutes)} flying
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-indigo-700">
            {money(offer.totalAmount, offer.currency)}
          </div>
          {roundTrip && (
            <span className="text-[10px] text-slate-400">total, both ways</span>
          )}
          {preferred && (
            <div className="text-[10px] font-medium text-emerald-600">
              ★ preferred stop
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {offer.slices.map((slice, i) => (
          <SliceRows
            key={i}
            slice={slice}
            label={
              roundTrip ? (i === 0 ? "Outbound" : "Return") : "Flight"
            }
          />
        ))}
      </div>
    </div>
  );
}
