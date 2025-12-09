import mongoose from "mongoose";

export const zonesSchema = new mongoose.Schema(
  {
    zoneName: { type: String, required: true, default: null },
  },
  { timestamps: true }
);

const zonesModel = mongoose.model(
  "zones",
  zonesSchema,
  "zones"
);
export default zonesModel;
