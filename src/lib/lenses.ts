// ─────────────────────────────────────────────────────────────
// "Lenses" — the student + points layer.
// We do NOT ingest student/award data (legally hard, gets you
// blocked). Instead we build smart, pre-filled deep-links to the
// siloed tools so you stop opening three tabs by hand.
// ─────────────────────────────────────────────────────────────

import type { SearchParams } from "./types";

export interface LensLink {
  label: string;
  url: string;
  note: string;
}

/**
 * Routes where student fares are historically strong (Europe /
 * transatlantic, student-heavy carriers). Used only to show a
 * gentle "worth checking" nudge — not a guarantee.
 */
const STUDENT_HOTSPOTS = new Set([
  "LHR", "LGW", "MAN", "DUB", "CDG", "AMS", "FRA", "MAD", "BCN",
  "FCO", "LIS", "ATH", "JFK", "EWR", "BOS", "ORD", "SFO", "LAX",
]);

export function shouldNudgeStudent(params: SearchParams): boolean {
  return (
    STUDENT_HOTSPOTS.has(params.origin) ||
    STUDENT_HOTSPOTS.has(params.destination)
  );
}

/** Build the student-fare lens links for the exact route + date. */
export function studentLens(params: SearchParams): LensLink[] {
  const { origin, destination, date } = params;
  return [
    {
      label: "StudentUniverse",
      // StudentUniverse resolves its own search form; we deep-link
      // to the flights landing page pre-scoped by query string.
      url: `https://www.studentuniverse.com/flights?from=${origin}&to=${destination}&depart=${date}`,
      note: "Pre-negotiated student/youth fares (verify age 18–25).",
    },
    {
      label: "Flyla",
      url: `https://www.flyla.com/en/search?origin=${origin}&destination=${destination}&departureDate=${date}`,
      note: "Student-fare-focused; requires student verification.",
    },
  ];
}

/** Build the points/award lens links for the exact route + date. */
export function pointsLens(params: SearchParams): LensLink[] {
  const { origin, destination } = params;
  return [
    {
      label: "Seats.aero",
      url: `https://seats.aero/search?origin=${origin}&destination=${destination}`,
      note: "Award availability across 24+ loyalty programs.",
    },
    {
      label: "point.me",
      url: `https://www.point.me/`,
      note: "Beginner-friendly award search for specific dates.",
    },
  ];
}
