import mongoose from "mongoose";

export const ExhibitionVideoCountSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      default: null,
    },
    previousCount: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

const ExihibitionVideoCountModel = mongoose.model(
  "exhibitionUserVCount",
  ExhibitionVideoCountSchema,
  "exhibitionUserVdCount"
);
export default ExihibitionVideoCountModel;
