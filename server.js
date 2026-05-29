require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`Top-Locations-Microservice listening on port ${PORT}`);
});
