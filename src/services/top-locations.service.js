const supabase = require("../config/supabase");

// The Arcadia app stores reviews in public.reviews with snake_case columns
// (review_id, location_id, user_id, rating, review_text) and location details
// (including the human-readable name) in public.locations.
const REVIEWS_TABLE = process.env.REVIEWS_TABLE || "reviews";
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || "locations";

// How many locations to return when the caller doesn't pass ?limit=.
const DEFAULT_LIMIT = Number(process.env.TOP_LOCATIONS_DEFAULT_LIMIT) || 10;

// Locations with fewer than this many reviews are excluded from the top list,
// so a brand-new arcade with one 5-star review can't outrank an established one.
const MIN_REVIEWS = Number(process.env.TOP_LOCATIONS_MIN_REVIEWS) || 5;

// PostgREST caps a single select at 1000 rows. Page through the reviews so the
// aggregation stays correct once the table grows past that. (Plenty fast at the
// current scale; see the README for the database-aggregation path at 100k+.)
const PAGE_SIZE = 1000;

async function fetchAllReviews() {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(REVIEWS_TABLE)
      .select("location_id, rating")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

// Map of location_id -> name, so each result can carry a human-readable name.
async function fetchLocationNames() {
  const names = new Map();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(LOCATIONS_TABLE)
      .select("location_id, name")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) names.set(row.location_id, row.name);
    if (data.length < PAGE_SIZE) break;
  }
  return names;
}

// Aggregate reviews per location, drop under-reviewed locations, rank by average
// rating (highest first, breaking ties by review count), and return the top N.
async function fetchTopLocations({ limit } = {}) {
  const effectiveLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;

  const [reviews, names] = await Promise.all([
    fetchAllReviews(),
    fetchLocationNames(),
  ]);

  // Sum ratings and count reviews for each location.
  const tallyByLocation = new Map();
  for (const row of reviews) {
    const tally = tallyByLocation.get(row.location_id) || { total: 0, count: 0 };
    tally.total += row.rating;
    tally.count += 1;
    tallyByLocation.set(row.location_id, tally);
  }

  const ranked = [...tallyByLocation.entries()]
    .map(([locationId, { total, count }]) => ({
      locationId,
      name: names.get(locationId) || null,
      averageRating: total / count,
      reviewCount: count,
    }))
    // Exclude locations that don't meet the minimum-review threshold.
    .filter((loc) => loc.reviewCount >= MIN_REVIEWS)
    // Highest average first; ties broken by the higher review count.
    .sort(
      (a, b) =>
        b.averageRating - a.averageRating || b.reviewCount - a.reviewCount
    );

  return ranked.slice(0, effectiveLimit);
}

module.exports = {
  fetchTopLocations,
};
