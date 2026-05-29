# Top-Locations-Microservice

A tiny standalone Express API. Send it a GET request and it returns the 10
locations with the highest review scores. It pulls every review from Supabase,
tabulates the 5-star ratings per location, and ranks them. Runs on port `4001`
so it can live alongside the other microservices.

## Structure

```
server.js                                    # starts the HTTP server
src/
  app.js                                     # express app + routes wiring
  config/supabase.js                         # shared Supabase client
  routes/top-locations.routes.js             # URL -> controller mapping
  controllers/top-locations.controller.js    # handles req/res
  services/top-locations.service.js          # talks to Supabase + ranks
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + key
npm run dev            # or: npm start
```

## Endpoints

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/health`        | Health check                             |
| GET    | `/top-locations` | Top 10 locations by average review score |

### Example response

```json
[
  { "locationId": 42, "averageRating": 4.9, "reviewCount": 18 },
  { "locationId": 7, "averageRating": 4.75, "reviewCount": 12 }
]
```

## Schema

Reads the Arcadia Postgres schema: reviews live in `public.reviews`, linked to a
location via the `location_id` column. The client targets the `public` schema
(configurable via `SUPABASE_SCHEMA`), and the table name is set with
`REVIEWS_TABLE`.

## Scoring

A location's score is the average of all its `rating` values (the 5-star
ranking) across `public.reviews`. The service reads the whole reviews table and
aggregates in memory — not the most efficient approach, but kept deliberately
simple for this project. The number of locations returned is configurable via
`TOP_N` (default `10`).
