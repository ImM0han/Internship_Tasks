import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send("Task API running ✅"));
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB connect error:", err.message);
    process.exit(1);
  });
