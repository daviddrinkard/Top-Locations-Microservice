const express = require("express");
const topLocationsController = require("../controllers/top-locations.controller");

const router = express.Router();

// GET /api/top-locations -> top locations by average rating (highest first)
router.get("/", topLocationsController.getTopLocations);

module.exports = router;
