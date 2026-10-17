"use client";

import type { LayoverFilters } from "@/lib/types";

interface Props {
  filters: LayoverFilters;
  onChange: (f: LayoverFilters) => void;
}

/** Instant, client-side layover toggles — no API calls on change. */
export default function LayoverControls({ filters, onChange }: Props) {
  function set<K extends keyof LayoverFilters>(
    key: K,
    value: LayoverFilters[K]
  ) {
    onChange({ ...filters, [key]: value });
  }

  function parseAirports(raw: string): string[] {
    return raw
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">
        Layover controls
      </h3>

      <div className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-medium text-slate-500">
            Max stops: {filters.maxStops}
          </label>
          <input
            type="range"
            min={0}
            max={3}
            value={filters.maxStops}
            onChange={(e) => set("maxStops", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Nonstop</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Min layover (h)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={filters.minLayoverMinutes / 60}
              onChange={(e) =>
                set("minLayoverMinutes", Number(e.target.value) * 60)
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Max layover (h)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={filters.maxLayoverMinutes / 60}
              onChange={(e) =>
                set("maxLayoverMinutes", Number(e.target.value) * 60)
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">
            Avoid connecting airports
          </label>
          <input
            defaultValue={filters.avoidAirports.join(" ")}
            onBlur={(e) => set("avoidAirports", parseAirports(e.target.value))}
            placeholder="e.g. CDG LHR"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">
            Prefer connecting airports (boosts to top)
          </label>
          <input
            defaultValue={filters.preferAirports.join(" ")}
            onBlur={(e) => set("preferAirports", parseAirports(e.target.value))}
            placeholder="e.g. DUB KEF"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 uppercase"
          />
        </div>
      </div>
    </div>
  );
}
