import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import Usage from "./models/Usage.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (_, res) => res.send("Time tracker backend ✅"));

/**
 * POST /api/usage/sync
 * body: { deviceId, payload: [{date, sites}], rulesVersion }
 */
app.post("/api/usage/sync", async (req, res) => {
  const { deviceId, payload } = req.body;
  if (!deviceId || !Array.isArray(payload)) {
    return res.status(400).json({ msg: "deviceId and payload required" });
  }

  for (const item of payload) {
    const { date, sites } = item;
    if (!date || !sites) continue;

    // Upsert per date (merge ms)
    const existing = await Usage.findOne({ deviceId, date });
    if (!existing) {
      await Usage.create({ deviceId, date, sites });
    } else {
      // merge
      const merged = new Map(existing.sites);
      for (const [domain, ms] of Object.entries(sites)) {
        merged.set(domain, (merged.get(domain) || 0) + ms);
      }
      existing.sites = merged;
      await existing.save();
    }
  }

  res.json({ ok: true });
});

/**
 * GET /api/usage/weekly?deviceId=xxx
 */
app.get("/api/usage/weekly", async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) return res.status(400).json({ msg: "deviceId required" });

  const rows = await Usage.find({ deviceId }).sort({ date: -1 }).limit(7);
  res.json(rows);
});

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`✅ Backend http://localhost:${PORT}`)))
  .catch((e) => {
    console.error("DB error:", e.message);
    process.exit(1);
  });
