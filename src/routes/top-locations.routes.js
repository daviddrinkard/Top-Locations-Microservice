const express = require("express");
const topLocationsController = require("../controllers/top-locations.controller");

const router = express.Router();

// GET /top-locations -> the 10 locations with the highest review scores
router.get("/", topLocationsController.getTopLocations);

module.exports = router;
