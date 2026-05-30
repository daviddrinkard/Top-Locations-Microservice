const topLocationsService = require("../services/top-locations.service");

// GET /api/top-locations?limit=N
async function getTopLocations(req, res) {
  // Parse the optional ?limit= override; ignore anything that isn't a
  // positive integer and let the service fall back to its configured default.
  let limit;
  if (req.query.limit !== undefined) {
    const parsed = Number(req.query.limit);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return res
        .status(400)
        .json({ error: "limit must be a positive integer" });
    }
    limit = parsed;
  }

  console.log(`fetching top locations (limit=${limit ?? "default"}) ...`);
  try {
    const topLocations = await topLocationsService.fetchTopLocations({ limit });
    res.json(topLocations);
  } catch (err) {
    console.error("getTopLocations failed:", err.message);
    res.status(500).json({ error: "Failed to fetch top locations" });
  }
}

module.exports = {
  getTopLocations,
};
