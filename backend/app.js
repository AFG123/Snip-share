require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const snippetRoutes = require("./src/routes/snippetRoutes");
const { pool } = require("./src/services/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/snippets", snippetRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

cron.schedule("*/15 * * * *", async () => {
  try {
    await pool.query("DELETE FROM snippets WHERE expiry_at IS NOT NULL AND expiry_at < NOW()");
    console.log(`[Cron] Expired snippets cleaned at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("[Cron Error]", error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
