# ✈️ FlightScout

A personal flight-deal tool that unifies three things that normally live in
separate tabs:

1. **Cash offers** — real flight search via the [Duffel API](https://duffel.com)
2. **Layover control** — instant client-side toggles (max stops, min/max
   layover, avoid/prefer connecting airports)
3. **Flexible-date grid** — cheapest price per day across a ± window
4. **Student & points lenses** — pre-filled deep-links to StudentUniverse,
   Flyla, Seats.aero and point.me for the exact route you searched

Built with Next.js (App Router) + TypeScript + Tailwind. Backend logic lives in
Next.js API routes so your Duffel token never reaches the browser.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then paste your Duffel token (see below)
npm run dev
```

Open http://localhost:3000.

---

## Dropping in your Duffel sandbox key — detailed steps

1. **Create a free Duffel account.** Go to <https://app.duffel.com/join> and
   sign up. You get instant access to the **sandbox** (test mode) — no payment
   details or approval needed.

2. **Make sure you're in Test mode.** In the Duffel dashboard there's a
   **Test / Live** toggle (usually top-left or in the environment switcher).
   Keep it on **Test**. Test mode returns fake flight data so you can build the
   whole app risk-free — no real bookings, no charges.

3. **Create an access token.** In the dashboard go to
   **Developers → Access tokens → + New token** (sometimes labelled "Create
   token"). Give it a name like `flightscout-local`, make sure the environment
   is **Test**, and create it.

4. **Copy the token immediately.** It will start with **`duffel_test_`**.
   Duffel only shows the full token once — copy it now.
   (A live token would start with `duffel_live_` — you do *not* want that yet.)

5. **Paste it into `.env.local`.** In this project:

   ```bash
   cp .env.local.example .env.local
   ```

   Open `.env.local` and replace the placeholder:

   ```
   DUFFEL_API_TOKEN=duffel_test_abc123...your real token...
   DUFFEL_API_VERSION=v2
   ```

6. **Restart the dev server.** Next.js only reads `.env.local` at startup, so
   stop (`Ctrl+C`) and re-run `npm run dev` after editing it.

7. **Test the search.** Use a route that reliably returns sandbox data, e.g.
   **LHR → JFK** or **LGW → JFK**, with a date a few weeks out.
   - Want to test the empty-state? Search **PVD → RAI** — Duffel guarantees that
     route returns zero offers.

### Security notes
- `.env.local` is gitignored — **never commit your token.**
- The token is only read inside `src/lib/duffel.ts`, which runs server-side in
  API routes. It is never sent to the browser.

### Going live later (optional)
When you want real, bookable prices, create a `duffel_live_` token in Live mode
and swap it into `.env.local`. Live access may require adding billing details in
the Duffel dashboard. Everything else in the app stays the same.

---

## Project layout

```
src/
  app/
    api/search/route.ts   # POST → offers for one date
    api/grid/route.ts     # POST → cheapest price per date (± window)
    page.tsx              # main UI, wires everything together
    layout.tsx, globals.css
  components/
    SearchForm.tsx        # origin / dest / date / flex / cabin
    DateGrid.tsx          # flexible-date heatmap
    LayoverControls.tsx   # the differentiator — instant client-side filters
    OfferCard.tsx         # one result, with per-segment layover detail
    Lenses.tsx            # student + points deep-links
  lib/
    duffel.ts             # Duffel REST client + response normalizer
    layovers.ts           # pure filter/sort engine (client-side)
    lenses.ts             # builds student/points URLs
    dates.ts              # flexible-date window helpers
    types.ts              # shared types
```

## Watchlist & price tracking (Phase 5)

Save any search to a **watchlist** and track whether its price is cheap right
now — a personalized version of Google Flights' "low / normal / high", built
from *your own* search history.

**How it works**
- Click **📌 Save to watchlist** on a results page. The route + date + flex
  window + cabin are stored in `data/watchlist.json`.
- Hit **Refresh** on a watchlist item to capture a **price snapshot**: it
  re-runs the flexible-date search, finds the single cheapest offer across the
  window, and appends a reading to `data/snapshots.json`.
- Each reading feeds a **sparkline** and a **verdict**:
  - `low` — within 5% of the cheapest you've ever recorded
  - `high` — within 5% of the most expensive
  - `normal` — in between (needs ≥2 readings; otherwise `unknown`)
- The ▲/▼ badge shows the change since your previous reading.

**Data files** (gitignored) live in `/data`:
- `watchlist.json` — saved searches
- `snapshots.json` — price history

**Automating snapshots:** the capture is a plain `POST /api/watchlist/snapshot?id=<id>`.
To build history without clicking, hit that endpoint on a schedule — e.g. a cron
job, a GitHub Action, or Vercel Cron — once a day per watch.

## Roadmap (next phases)
- **Round-trip** — add a second slice to the offer request.
- **Caching** — reuse recent grid results to stay under Duffel's rate limit
  (1 request / 100ms).
- **Price-drop alerts** — email/push when a watched route goes `low`.
