const topLocationsService = require("../services/top-locations.service");

// GET /top-locations
async function getTopLocations(req, res) {
  console.log("fetching the top 10 locations by review score ...");
  try {
    const topLocations = await topLocationsService.fetchTopLocations();
    res.json(topLocations);
  } catch (err) {
    console.error("getTopLocations failed:", err.message);
    res.status(500).json({ error: "Failed to fetch top locations" });
  }
}

module.exports = {
  getTopLocations,
};
