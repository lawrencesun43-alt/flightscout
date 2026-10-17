"use client";

/** Animated placeholder shown while a search is in flight, so the
 *  page never looks blank/broken during the (sometimes slow) wait. */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

/** Placeholder for the flexible-date grid row. */
export function DateGridSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <Bar className="mb-3 h-3 w-28" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[88px] flex-shrink-0 space-y-2 rounded-lg border border-slate-200 p-2"
          >
            <Bar className="mx-auto h-2.5 w-14" />
            <Bar className="mx-auto h-4 w-10" />
            <Bar className="mx-auto h-2 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder for a few offer cards. */
export function OffersSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Bar className="h-4 w-32" />
              <Bar className="h-2.5 w-24" />
            </div>
            <Bar className="h-5 w-16" />
          </div>
          <div className="mt-3 space-y-2">
            <Bar className="h-2.5 w-3/4" />
            <Bar className="h-2.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
