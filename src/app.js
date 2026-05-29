const express = require("express");
const cors = require("cors");
const topLocationsRoutes = require("./routes/top-locations.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check so the Arcadia app (or a load balancer) can confirm we're up.
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Top-locations API
app.use("/top-locations", topLocationsRoutes);

// Anything else is a 404.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
