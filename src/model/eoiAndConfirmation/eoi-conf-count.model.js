import mongoose from "mongoose";

export const eoiConfSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["eoi", "confirmation"],
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Create the model
const eoiConfCountModel = mongoose.model(
  "eoiConfCounts",
  eoiConfSchema,
  "eoiConfCounts"
);
export default eoiConfCountModel;

//estimate id model
