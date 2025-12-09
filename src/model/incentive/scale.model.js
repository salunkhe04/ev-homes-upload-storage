import mongoose from "mongoose";

export const ScaleSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
    },

    type: {
      type: String,
      default: "scale",
    },
    amountCp: {
      type: Number,
      default: 0,
    },
    amountNonCp: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const scaleModel = mongoose.model("scale", ScaleSchema, "scales");
export default scaleModel;
