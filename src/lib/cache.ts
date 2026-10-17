// ─────────────────────────────────────────────────────────────
// Tiny in-memory TTL cache. Server-side only.
//
// Used to make repeat grid searches (and clicking around the date
// grid) instant, and to protect against hammering Duffel's rate
// limit. It lives in the Node process, so it resets on server
// restart — which is exactly what we want for a personal tool
// (fresh prices after a restart, instant within a session).
// ─────────────────────────────────────────────────────────────

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<V> {
  private store = new Map<string, Entry<V>>();
  constructor(private ttlMs: number) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Get from cache, or run `compute` and cache the result.
   * Concurrent calls for the same key share one in-flight promise
   * (so a parallel grid never fires duplicate searches for a key).
   */
  private inflight = new Map<string, Promise<V>>();
  async getOrCompute(key: string, compute: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const p = compute()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, p);
    return p;
  }
}
