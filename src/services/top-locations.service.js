const supabase = require("../config/supabase");

// The Arcadia app stores reviews in public.reviews with snake_case columns
// (review_id, location_id, user_id, rating, review_text).
const TABLE = process.env.REVIEWS_TABLE || "reviews";

// How many locations to return.
const TOP_N = Number(process.env.TOP_N) || 10;

// Pull every review, tabulate the 5-star ratings per location, and return the
// TOP_N locations with the highest average score. Not the most efficient
// approach (we read the whole reviews table and aggregate in memory), but it
// keeps the service self-contained for this project.
async function fetchTopLocations() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("location_id, rating");
  if (error) throw error;

  // Sum ratings and count reviews for each location.
  const tallyByLocation = new Map();
  for (const row of data || []) {
    const tally = tallyByLocation.get(row.location_id) || {
      total: 0,
      count: 0,
    };
    tally.total += row.rating;
    tally.count += 1;
    tallyByLocation.set(row.location_id, tally);
  }

  // Turn the tallies into average scores, then rank highest-first.
  const ranked = [...tallyByLocation.entries()]
    .map(([locationId, { total, count }]) => ({
      locationId,
      averageRating: total / count,
      reviewCount: count,
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  return ranked.slice(0, TOP_N);
}

module.exports = {
  fetchTopLocations,
};
