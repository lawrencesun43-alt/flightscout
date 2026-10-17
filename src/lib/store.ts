// ─────────────────────────────────────────────────────────────
// Tiny JSON file store for the watchlist + price snapshots.
// Runs SERVER-SIDE only (used inside API routes). For a personal,
// single-user tool a flat JSON file is the simplest thing that
// works — no DB to set up. Swap for SQLite later if it grows.
//
// Files live in /data (gitignored except .gitkeep).
// ─────────────────────────────────────────────────────────────

import { promises as fs } from "fs";
import path from "path";
import type { SavedSearch, PriceSnapshot } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const WATCHLIST_FILE = path.join(DATA_DIR, "watchlist.json");
const SNAPSHOTS_FILE = path.join(DATA_DIR, "snapshots.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Write to a temp file then rename → atomic, avoids corruption if
  // two requests race.
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

function id(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Watchlist ────────────────────────────────────────────────

export async function getWatchlist(): Promise<SavedSearch[]> {
  return readJson<SavedSearch[]>(WATCHLIST_FILE, []);
}

export async function addToWatchlist(
  input: Omit<SavedSearch, "id" | "createdAt">
): Promise<SavedSearch> {
  const list = await getWatchlist();
  // De-dupe: same route+date+cabin is treated as one watch.
  const existing = list.find(
    (w) =>
      w.origin === input.origin &&
      w.destination === input.destination &&
      w.targetDate === input.targetDate &&
      w.cabinClass === input.cabinClass
  );
  if (existing) return existing;

  const saved: SavedSearch = {
    ...input,
    id: id(),
    createdAt: new Date().toISOString(),
  };
  list.push(saved);
  await writeJson(WATCHLIST_FILE, list);
  return saved;
}

export async function removeFromWatchlist(searchId: string): Promise<void> {
  const list = await getWatchlist();
  const next = list.filter((w) => w.id !== searchId);
  await writeJson(WATCHLIST_FILE, next);
  // Also drop that watch's snapshots so the file doesn't grow forever.
  const snaps = await getSnapshots();
  await writeJson(
    SNAPSHOTS_FILE,
    snaps.filter((s) => s.searchId !== searchId)
  );
}

// ── Snapshots ────────────────────────────────────────────────

export async function getSnapshots(): Promise<PriceSnapshot[]> {
  return readJson<PriceSnapshot[]>(SNAPSHOTS_FILE, []);
}

export async function getSnapshotsForSearch(
  searchId: string
): Promise<PriceSnapshot[]> {
  const all = await getSnapshots();
  return all
    .filter((s) => s.searchId === searchId)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

export async function addSnapshot(
  input: Omit<PriceSnapshot, "id" | "capturedAt">
): Promise<PriceSnapshot> {
  const all = await getSnapshots();
  const snap: PriceSnapshot = {
    ...input,
    id: id(),
    capturedAt: new Date().toISOString(),
  };
  all.push(snap);
  await writeJson(SNAPSHOTS_FILE, all);
  return snap;
}
