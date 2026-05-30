const express = require("express");
const cors = require("cors");
const topLocationsRoutes = require("./routes/top-locations.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/top-locations", topLocationsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
