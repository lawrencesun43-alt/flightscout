"use client";

import type { SearchParams } from "@/lib/types";
import { studentLens, pointsLens, shouldNudgeStudent } from "@/lib/lenses";

interface Props {
  params: SearchParams | null;
}

/** The student + points deep-link layer. */
export default function Lenses({ params }: Props) {
  if (!params) return null;

  const student = studentLens(params);
  const points = pointsLens(params);
  const nudge = shouldNudgeStudent(params);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            🎓 Student fares
          </h3>
          {nudge && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              worth checking on this route
            </span>
          )}
        </div>
        <ul className="space-y-2">
          {student.map((l) => (
            <li key={l.label}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 hover:underline"
              >
                {l.label} ↗
              </a>
              <p className="text-xs text-slate-500">{l.note}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          ✈️ Points / award
        </h3>
        <ul className="space-y-2">
          {points.map((l) => (
            <li key={l.label}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 hover:underline"
              >
                {l.label} ↗
              </a>
              <p className="text-xs text-slate-500">{l.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
