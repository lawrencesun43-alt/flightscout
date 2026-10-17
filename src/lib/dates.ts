// ─────────────────────────────────────────────────────────────
// Flexible-date helpers.
// ─────────────────────────────────────────────────────────────

/** Return YYYY-MM-DD for `date` + `offsetDays`. */
export function shiftDate(date: string, offsetDays: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Build the ± window of dates around a target.
 * flexDays = 3 → 7 dates (target-3 ... target+3).
 */
export function buildDateWindow(target: string, flexDays: number): string[] {
  const out: string[] = [];
  for (let i = -flexDays; i <= flexDays; i++) {
    out.push(shiftDate(target, i));
  }
  return out;
}

/** Pretty "Mon 12 May" label. */
export function fmtDateLabel(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
