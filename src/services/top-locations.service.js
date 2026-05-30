const supabase = require("../config/supabase");

const REVIEWS_TABLE = process.env.REVIEWS_TABLE || "reviews";
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || "locations";
const DEFAULT_LIMIT = Number(process.env.TOP_LOCATIONS_DEFAULT_LIMIT) || 10;
const MIN_REVIEWS = Number(process.env.TOP_LOCATIONS_MIN_REVIEWS) || 5;
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

async function fetchTopLocations({ limit } = {}) {
  const effectiveLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT;

  const [reviews, names] = await Promise.all([
    fetchAllReviews(),
    fetchLocationNames(),
  ]);

  const tallyByLocation = new Map();
  for (const row of reviews) {
    const tally = tallyByLocation.get(row.location_id) || {
      total: 0,
      count: 0,
    };
    tally.total += row.rating;
    tally.count += 1;
    tallyByLocation.set(row.location_id, tally);
  }
  // filters and cleans up top locations
  const ranked = [...tallyByLocation.entries()]
    .map(([locationId, { total, count }]) => ({
      locationId,
      name: names.get(locationId) || null,
      averageRating: total / count,
      reviewCount: count,
    }))
    .filter((loc) => loc.reviewCount >= MIN_REVIEWS)
    .sort(
      (a, b) =>
        b.averageRating - a.averageRating || b.reviewCount - a.reviewCount,
    );

  return ranked.slice(0, effectiveLimit);
}

module.exports = {
  fetchTopLocations,
};
