# Top-Locations-Microservice

A tiny standalone Express API. Send it a GET request and it returns a ranked list
of the highest-rated locations for the Arcadia homepage. It reads reviews from
Supabase, aggregates them per location, drops under-reviewed locations, and ranks
the rest by average rating. Runs on port `4001` so it can live alongside the other
microservices.

## Structure

```
server.js                                    # starts the HTTP server
src/
  app.js                                     # express app + routes wiring
  config/supabase.js                         # shared Supabase client
  routes/top-locations.routes.js             # URL -> controller mapping
  controllers/top-locations.controller.js    # handles req/res + ?limit= parsing
  services/top-locations.service.js          # talks to Supabase + ranks
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + key
npm run dev            # or: npm start
```

## Endpoints

| Method | Path                          | Description                                   |
| ------ | ----------------------------- | --------------------------------------------- |
| GET    | `/health`                     | Health check                                  |
| GET    | `/api/top-locations`          | Top locations by average rating (highest first) |
| GET    | `/api/top-locations?limit=5`  | Same, capped at `limit` results               |

### Ranking rules

- Locations are ordered by **average rating, descending**.
- Ties are broken by **review count, descending** (more reviews ranks higher).
- Locations with fewer than `TOP_LOCATIONS_MIN_REVIEWS` reviews are **excluded**,
  so a brand-new arcade with one 5-star review can't outrank an established one.
- `?limit=` overrides the default result count for a single request. A non-positive
  or non-integer `limit` returns `400`.

### Example response

```json
[
  { "locationId": 42, "name": "Pixel Palace", "averageRating": 4.9, "reviewCount": 18 },
  { "locationId": 7, "name": "The Replay Arcade", "averageRating": 4.75, "reviewCount": 12 }
]
```

## Configuration

All behavior is configurable via environment variables — no code change or redeploy
needed (restart the service to pick up new values).

| Variable                      | Default      | Description                                       |
| ----------------------------- | ------------ | ------------------------------------------------- |
| `PORT`                        | `4001`       | Port the service listens on                       |
| `SUPABASE_URL` / `SUPABASE_KEY` | —          | Supabase project credentials                      |
| `SUPABASE_SCHEMA`             | `public`     | Schema the Arcadia tables live in                 |
| `REVIEWS_TABLE`               | `reviews`    | Table holding reviews                             |
| `LOCATIONS_TABLE`             | `locations`  | Table holding location details (incl. `name`)     |
| `TOP_LOCATIONS_DEFAULT_LIMIT` | `10`         | Results returned when `?limit=` is omitted        |
| `TOP_LOCATIONS_MIN_REVIEWS`   | `5`          | Minimum reviews a location needs to be eligible   |

## Schema

Reads the Arcadia Postgres schema: reviews live in `public.reviews` (linked to a
location via `location_id`, with a `rating`), and location details — including the
human-readable `name` — live in `public.locations`.

## Scaling note

The service aggregates reviews in memory, paging through the reviews table in
1000-row batches (PostgREST caps a single select at 1000 rows). This is simple and
fast at current data sizes. If the dataset grows to the order of 100k+ reviews and
the <300 ms p95 target matters under sustained load, move the aggregation into the
database — a view or `top_locations(limit, min_reviews)` RPC that does the
`GROUP BY` / filter / sort / limit in Postgres — and have the service call that
instead of pulling rows into Node.
