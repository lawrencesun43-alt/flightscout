"use client";

import { useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/types";

interface Props {
  label: string;
  value: string; // the selected IATA code
  onChange: (iata: string) => void;
  placeholder?: string;
}

/**
 * Airport/city autocomplete. Shows a debounced dropdown of
 * suggestions from /api/places; selecting one sets the IATA code.
 * The user can still type a raw 3-letter code directly.
 */
export default function AirportInput({
  label,
  value,
  onChange,
  placeholder,
}: Props) {
  const [text, setText] = useState(value);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep local text in sync if the value is changed from outside.
  useEffect(() => {
    setText(value);
  }, [value]);

  // Debounced fetch of suggestions.
  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setSuggestions((json.places as Place[]) ?? []);
        setHighlight(0);
      } catch {
        setSuggestions([]);
      }
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function select(p: Place) {
    onChange(p.iataCode);
    setText(p.iataCode);
    setOpen(false);
  }

  function handleInput(v: string) {
    const up = v.toUpperCase();
    setText(up);
    setOpen(true);
    // If they typed a full 3-letter code, treat it as the value too.
    if (up.length === 3) onChange(up);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <input
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => text.trim().length >= 2 && setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 uppercase"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-72 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {suggestions.map((p, i) => (
            <li key={`${p.iataCode}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(p);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="min-w-0">
                  <span className="font-medium text-slate-800">{p.cityName}</span>{" "}
                  <span className="text-xs text-slate-500">{p.name}</span>
                </span>
                <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                  {p.iataCode}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
