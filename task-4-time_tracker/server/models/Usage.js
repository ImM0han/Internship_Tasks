import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    deviceId: { type: String, index: true },
    date: { type: String, index: true }, // YYYY-MM-DD
    sites: { type: Map, of: Number, default: {} } // domain -> ms
  },
  { timestamps: true }
);

usageSchema.index({ deviceId: 1, date: 1 }, { unique: true });

export default mongoose.model("Usage", usageSchema);
